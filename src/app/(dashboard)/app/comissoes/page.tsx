import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

export default async function ComissoesPage() {
    const session = await getSession()
    if (!session) return null

    const tenantDb = createTenantClient(session.tenantId)
    const isAdminOrRecepcao = session.role === 'ADMIN' || session.role === 'RECEPCAO'

    // Busca Comissões Pendentes
    // RBAC: Se for administrador vê tudo. Se for profissional, filtra pra ele.
    const whereClause: Record<string, unknown> = { status: 'PENDING' as const }
    if (!isAdminOrRecepcao) {
        whereClause.professionalId = session.userId
    }

    type CommissionDetail = {
        id: string
        createdAt: Date
        amount: number | string
        professionalId: string
        professional: { name: string }
        tabItem: { service?: { name: string } | null }
    }

    const commissions = (await tenantDb.commission.findMany({
        where: whereClause,
        include: {
            professional: { select: { name: true } },
            tabItem: {
                include: { service: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    })) as unknown as CommissionDetail[]

    // Calcula o total pendente
    const totalPending = commissions.reduce((sum, item) => sum + Number(item.amount), 0)

    // Agrupa saldos Pendentes por Profissional (para a visão gerencial)
    const groupedByProf = commissions.reduce((acc: Record<string, { name: string, amount: number, count: number }>, curr) => {
        const profId = curr.professionalId;
        const profName = curr.professional.name;
        if (!acc[profId]) {
            acc[profId] = { name: profName, amount: 0, count: 0 }
        }
        acc[profId].amount += Number(curr.amount)
        acc[profId].count += 1
        return acc
    }, {})

    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {isAdminOrRecepcao ? 'Gestão de Comissões' : 'Meus Ganhos Pendentes'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdminOrRecepcao
                            ? 'Valores retidos aguardando repasse à equipe.'
                            : 'Seus repasses calculados aguardando pagamento pelo salão.'}
                    </p>
                </div>
            </div>

            {/* Resumo de Dívida Total PENDENTE */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-center">
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Saldo Total (Pendente)
                </p>
                <h2 className="text-3xl font-bold text-blue-600 mt-2">
                    R$ {totalPending.toFixed(2).replace('.', ',')}
                </h2>
            </div>

            {isAdminOrRecepcao && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(groupedByProf).length === 0 ? (
                        <div className="col-span-full p-4 border rounded-md text-muted-foreground bg-muted/30">Nenhum repasse pendente.</div>
                    ) : (
                        Object.values(groupedByProf).map((prof) => (
                            <div key={prof.name} className="border border-border p-4 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{prof.name}</span>
                                    <span className="text-blue-600">R$ {prof.amount.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{prof.count} serviços executados</span>
                                <form className="mt-2">
                                    {/* Num fluxo completo: server action para markAsPaid(profId) */}
                                    <button className="w-full text-sm bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90">
                                        Baixar / Marcar como Pago
                                    </button>
                                </form>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Extrato Detalhado do Split */}
            <div className="flex-1 mt-4 rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border bg-muted/10">
                    <h3 className="font-bold text-foreground">Extrato (Origem das Comissões)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted/30 uppercase text-xs font-semibold text-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                {isAdminOrRecepcao && <th className="px-6 py-4">Profissional</th>}
                                <th className="px-6 py-4">Serviço Origem</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Repasse</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissions.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center">Nenhum histórico a exibir.</td></tr>
                            ) : (
                                commissions.map(c => (
                                    <tr key={c.id} className="border-b border-border hover:bg-muted/10">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {c.createdAt.toLocaleDateString('pt-BR')} {c.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        {isAdminOrRecepcao && <td className="px-6 py-4 font-medium text-foreground">{c.professional.name}</td>}
                                        <td className="px-6 py-4">{c.tabItem.service?.name || 'Serviço Excluído'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Pendente
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                                            + R$ {Number(c.amount).toFixed(2).replace('.', ',')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}
