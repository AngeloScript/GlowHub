import { getSession } from '@/lib/auth'
import { getDashboardMetrics } from '@/actions/dashboard/dashboard-actions'
import { StatCard } from '@/components/dashboard/StatCard'
import { UpcomingAppointmentsWidget } from '@/components/dashboard/UpcomingAppointments'
import {
    Banknote,
    TrendingUp,
    CalendarCheck2,
    Users,
    Wallet,
    Scissors
} from 'lucide-react'

// Formatação Monetária BR
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function DashboardPage() {
    const session = await getSession()

    // Server Action segura com RLS embutido
    const metrics = await getDashboardMetrics()

    return (
        <div className="space-y-6 pb-12 animate-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Bem-vindo.
                    {session?.role === 'PROFISSIONAL'
                        ? ' Aqui está o resumo do seu dia.'
                        : ' Visão geral do desempenho do Salão.'}
                </p>
            </div>

            {/* Renderização Condicional Baseado na Role do Backend */}
            {metrics.role === 'PROFISSIONAL' ? (
                // --- VISÃO DO PROFISSIONAL ---
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Produzido Hoje"
                        value={formatCurrency(metrics.myGeneratedToday || 0)}
                        icon={Scissors}
                        description="Valor total dos seus serviços hoje"
                    />
                    <StatCard
                        title="Atendimentos Hoje"
                        value={metrics.myServicesToday || 0}
                        icon={CalendarCheck2}
                        description="Comandas finalizadas"
                    />
                    <StatCard
                        title="Comissões Pendentes"
                        value={formatCurrency(metrics.pendingCommissionsTotal || 0)}
                        icon={Wallet}
                        description="Valor a receber da gerência"
                    />
                    <StatCard
                        title="Comissões Pagas (Mês)"
                        value={formatCurrency(metrics.paidCommissionsTotal || 0)}
                        icon={Banknote}
                        description="Valor já sacado este mês"
                    />
                </div>
            ) : (
                // --- VISÃO DO GESTOR/ADMIN ---
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Faturamento Hoje"
                        value={formatCurrency(metrics.dailyRevenue || 0)}
                        icon={Banknote}
                    />
                    <StatCard
                        title="Faturamento do Mês"
                        value={formatCurrency(metrics.monthlyRevenue || 0)}
                        icon={TrendingUp}
                    />
                    <StatCard
                        title="Agendamentos (Mês)"
                        value={metrics.monthlyAppointmentsCount || 0}
                        icon={CalendarCheck2}
                    />
                    <StatCard
                        title="Novos Clientes (Mês)"
                        value={metrics.newCustomersCount || 0}
                        icon={Users}
                    />
                </div>
            )}

            {/* Grid Dividido (Lado a Lado no Desktop) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">

                {/* Ranking de Profissionais ou Espaço Livre */}
                <div className="md:col-span-2 lg:col-span-4 space-y-4">
                    {'topProfessionals' in metrics && metrics.topProfessionals ? (
                        <div className="card p-6 flex flex-col h-full">
                            <h2 className="text-base font-bold text-foreground mb-4">Top Profissionais (Mês)</h2>
                            {metrics.topProfessionals.length === 0 ? (
                                <p className="text-muted-foreground text-sm flex-1 flex items-center justify-center">Nenhum serviço faturado ainda.</p>
                            ) : (
                                <div className="space-y-4 flex-1">
                                    {metrics.topProfessionals.map((prof, index) => (
                                        <div key={prof.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{prof.name}</p>
                                                    <p className="text-xs text-muted-foreground">{prof.servicesCount} serviços encerrados</p>
                                                </div>
                                            </div>
                                            <div className="font-semibold text-foreground">
                                                {formatCurrency(prof.totalGenerated)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card p-6 flex flex-col h-full justify-center items-center text-center opacity-70">
                            <h2 className="text-lg font-bold text-foreground mb-2">Sua Agenda</h2>
                            <p className="text-muted-foreground text-sm">Tenha um ótimo dia de trabalho!</p>
                        </div>
                    )}
                </div>

                {/* Lateral Menor: Widgets de Ação Rápida */}
                <div className="md:col-span-2 lg:col-span-3">
                    <UpcomingAppointmentsWidget />
                </div>
            </div>

            {/* Badge de Segurança (Para Debug de RLS) */}
            <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity flex justify-center">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span>
                    Tenant Isolation Active (RLS ID: {session?.tenantId})
                </p>
            </div>

        </div>
    )
}
