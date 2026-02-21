import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'
import { FinanceiroTabs } from '@/components/financeiro/FinanceiroTabs'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage() {
    const session = await getSession()
    if (!session) return null

    // Restringe view para Admin/Recepção (RBAC Simplificado na Rota)
    if (session.role === 'PROFISSIONAL') {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Acesso Restrito. Seu painel de ganhos é em Comissões.
            </div>
        )
    }

    const tenantDb = createTenantClient(session.tenantId)

    // Busca as Transações do Dia
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    type TransactionDetail = {
        id: string
        createdAt: Date
        type: string
        status: string
        amount: number | string
        paymentMethod?: string | null
        tab?: { id: string, customer: { name: string } } | null
    }

    const rawTransactions = await tenantDb.transaction.findMany({
        where: {
            createdAt: { gte: todayStart }
        },
        include: {
            tab: {
                include: { customer: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactions: TransactionDetail[] = rawTransactions.map((t: any) => ({
        id: t.id,
        createdAt: t.createdAt,
        type: t.type,
        status: t.status,
        amount: Number(t.amount) || 0,
        paymentMethod: t.paymentMethod,
        tab: t.tab,
    }))

    // Agregações de Caixa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalIncome = transactions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((t: any) => t.type === 'INCOME' && t.status === 'COMPLETED')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    return (
        <div className="flex h-full flex-col space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Painel Financeiro</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Caixa do dia, Contas a Pagar e DRE Gerencial.
                </p>
            </div>

            {/* Caixa do Dia — Resumo rápido */}
            <div className="bg-white rounded-xl border border-border/50 p-6 shadow-sm">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    Entradas de Hoje
                </p>
                <h2 className="text-3xl font-black text-green-600 mt-1">
                    R$ {totalIncome.toFixed(2).replace('.', ',')}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                    {transactions.length} transação(ões) registrada(s)
                </p>
            </div>

            {/* Tabela de Transações do Dia */}
            <div className="rounded-xl border border-border/50 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted/30 uppercase text-xs font-semibold text-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-3">Hora</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Método</th>
                                <th className="px-6 py-3 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">Nenhuma transação hoje.</td>
                                </tr>
                            ) : (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                transactions.map((t: any) => (
                                    <tr key={t.id} className="border-b border-border/30 hover:bg-muted/10">
                                        <td className="px-6 py-3 whitespace-nowrap font-mono text-xs">
                                            {new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {t.type === 'INCOME' ? 'Receita' : 'Saída'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-foreground">
                                            {t.tab ? t.tab.customer.name : 'Avulso'}
                                        </td>
                                        <td className="px-6 py-3 text-xs">{t.paymentMethod || '—'}</td>
                                        <td className={`px-6 py-3 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {t.type === 'INCOME' ? '+' : '−'} R$ {Number(t.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Módulo 8: Abas de Contas a Pagar e DRE */}
            <FinanceiroTabs />
        </div>
    )
}
