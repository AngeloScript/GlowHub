'use server'

import { createTenantClient } from '@/lib/db'
import { getSession } from '@/lib/auth'

// 1. Abrir a Comanda no Check-in do Cliente (SCHEDULED -> IN_PROGRESS)
export async function openTab(tabId: string) {
    try {
        const session = await getSession()
        if (!session || !session.tenantId) return { error: 'Não autenticado.' }
        const tenantDb = createTenantClient(session.tenantId)

        const tab = await tenantDb.tab.update({
            where: { id: tabId },
            data: { status: 'IN_PROGRESS' }
        })

        // Se estiver lincada a um appointment, tbm atualiza o Appointment logicamente
        if (tab.appointmentId) {
            await tenantDb.appointment.update({
                where: { id: tab.appointmentId },
                data: { status: 'COMPLETED' } // Libera a agenda virtualmente pois cliente já está na maca
            })
        }

        return { success: true, tab }
    } catch (error) {
        console.error('Erro ao abrir comanda:', error)
        return { error: 'Ocorreu um erro ao transitar o status da comanda.' }
    }
}

// 2. Adicionar itens rápidos (Serviços/Produtos) de forma atômica à Comanda Real-Time
export async function addTabItem(formData: FormData) {
    try {
        const session = await getSession()
        if (!session || !session.tenantId) return { error: 'Não autenticado.' }
        const tenantDb = createTenantClient(session.tenantId)

        const tabId = formData.get('tabId') as string
        const serviceId = formData.get('serviceId') as string
        const professionalId = formData.get('professionalId') as string

        // 2.1 Verifica a vida do Serviço sendo vendido (recupera valor exato na hora da compra)
        const service = await tenantDb.service.findUnique({ where: { id: serviceId } })
        if (!service) return { error: 'Serviço inexistente.' }

        // 2.2 Garante a inserção atômica re-somando a Guia Principal na mesma Transaction RLS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await tenantDb.$transaction(async (tx: any) => {

            // Insere o Item
            const newItem = await tx.tabItem.create({
                data: {
                    tenantId: session.tenantId,
                    tabId,
                    serviceId,
                    professionalId,
                    price: service.price // Snapshot financeiro protegido de inflação do catálogo
                }
            })

            // Recalcula Base e Sobe Valor da Comanda Principal
            const aggregations = await tx.tabItem.aggregate({
                where: { tabId },
                _sum: {
                    price: true
                }
            })

            const newTotal = aggregations._sum.price || 0

            // Atualiza Master Tab
            await tx.tab.update({
                where: { id: tabId },
                data: { totalAmount: newTotal }
            })

            return newItem
        })

        return { success: true, item: result }
    } catch (error) {
        console.error('Erro ao adicionar TabItem:', error)
        return { error: 'Erro inesperado na Comanda. Tente novamente.' }
    }
}
