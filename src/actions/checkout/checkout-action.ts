'use server'

import { db, createTenantClient } from '@/lib/db'
import { getSession } from '@/lib/auth'

type CheckoutPaymentInput = {
    method: 'CREDIT' | 'DEBIT' | 'PIX' | 'CASH' | string
    amount: number
}

/**
 * Server Action que finaliza a comanda, lança as entradas no Caixa,
 * e computa matematicamente as Frações (Comissão) devidas a cada profissional.
 */
export async function checkoutTab(tabId: string, payments: CheckoutPaymentInput[]) {
    try {
        const session = await getSession()
        if (!session || !session.tenantId) {
            return { error: 'Não autenticado' }
        }

        const tenantDb = createTenantClient(session.tenantId)

        // 1. Validar a Comanda
        const tab = await tenantDb.tab.findUnique({
            where: { id: tabId },
            include: {
                items: {
                    include: {
                        professional: true // Precisamos do professional para saber a Taxa de Comissão (commissionRate)
                    }
                }
            }
        })

        if (!tab) return { error: 'Comanda não encontrada' }
        if (tab.status === 'CLOSED') return { error: 'Esta comanda já foi fechada.' }

        // Validar se o valor pago bate com o total da comanda
        const totalPaid = payments.reduce((acc, curr) => acc + curr.amount, 0)
        // Para evitar problemas de float (0.00000001), convertemos para number fixo ou cents
        if (Math.abs(Number(tab.totalAmount) - totalPaid) > 0.05) {
            return { error: `Erro no caixa: Faltam ou Sobram valores. Total Comanda: ${tab.totalAmount}, Total Pago: ${totalPaid}` }
        }

        // 2. Executa a Operação Complexa numa Transaction Segura do Banco
        // Se o cálculo da comissão der falha, NADA é salvo (rollback total).

        // (Transação tipada na instância virtual via Extension)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await db.$transaction(async (tx: any) => {
            // Objeto tx não injeta magicamente o RLS na extensão, então precisaremos 
            // ou passar o RLS explicitamente, ou usar a instância crua com cuidado
            // Como o RLS está protegendo requisições, `tenantDb` é um wrapper.
            // O Prisma tem uma limitação nativa com Extensões Interativas em Transações.
            // Para simplificar a segurança absoluta do RLS, aplicamos o RLS via query crua.
            await tx.$executeRawUnsafe(`SET app.current_tenant_id = '${session.tenantId}'`)

            // 2.1 Mudar o Status da Comanda
            const closedTab = await tx.tab.update({
                where: { id: tabId },
                data: { status: 'CLOSED' }
            })

            // 2.2 Lançar as Entradas Financeiras (Transactions Income)
            for (const payment of payments) {
                await tx.transaction.create({
                    data: {
                        tenantId: session.tenantId,
                        tabId: tab.id,
                        type: 'INCOME',
                        amount: payment.amount,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        paymentMethod: payment.method as any,
                        status: 'COMPLETED'
                    }
                })
            }

            // 2.3 Split Lógico e Lançamento de Comissões PENDING
            const commissionsCreated = []
            for (const item of tab.items) {
                const rate = item.professional.commissionRate ? Number(item.professional.commissionRate) : 0

                if (rate > 0) {
                    // Ex: Serviço de R$ 100,00 * Rate 0.50 (50%) = R$ 50,00 de Comissão 
                    const commissionAmount = Number(item.price) * rate

                    const commissionRecord = await tx.commission.create({
                        data: {
                            tenantId: session.tenantId,
                            professionalId: item.professional.id,
                            tabItemId: item.id,
                            amount: commissionAmount,
                            status: 'PENDING'
                        }
                    })
                    commissionsCreated.push(commissionRecord)
                }
            }

            return { closedTab, commissionsCreated }
        })

        return { success: true, result }

    } catch (error) {
        console.error('Erro catastrofico no checkout:', error)
        return { error: 'Ocorreu uma falha grave de transação de caixa.' }
    }
}
