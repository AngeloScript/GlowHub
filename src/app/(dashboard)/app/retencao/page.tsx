import {
    getInactiveCustomers,
    getTopCustomers,
} from '@/actions/customers/customer-intelligence'
import Link from 'next/link'
import { UserSearch, Trophy, Phone, ExternalLink } from 'lucide-react'

export default async function RetencaoPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const daysParam =
        typeof params?.dias === 'string' ? parseInt(params.dias) : 60

    const [inactives, topCustomers] = await Promise.all([
        getInactiveCustomers(daysParam),
        getTopCustomers(5),
    ])

    return (
        <div className="flex h-full flex-col space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Retenção de Clientes
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Identifique e recupere clientes inativos
                    </p>
                </div>
            </div>

            {/* Period Filter — pill buttons */}
            <div className="flex gap-2 animate-in stagger-1">
                {[30, 60, 90].map((days) => (
                    <Link
                        key={days}
                        href={`/app/retencao?dias=${days}`}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${daysParam === days
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-white border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:shadow-sm'
                            }`}
                    >
                        {days} dias
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inactive Customers */}
                <div className="lg:col-span-2 animate-in stagger-2">
                    <div className="card overflow-hidden">
                        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                            <UserSearch className="h-5 w-5 text-danger" />
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Ausentes há mais de {daysParam} dias
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {inactives.length} cliente{inactives.length !== 1 && 's'}
                                </p>
                            </div>
                        </div>

                        {inactives.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-3xl mb-3">🎉</p>
                                <p className="text-sm text-muted-foreground">
                                    Nenhum cliente inativo neste período!
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {inactives.map((c) => (
                                    <div
                                        key={c.id}
                                        className="px-6 py-4 flex items-center justify-between gap-4 transition-colors duration-150 hover:bg-muted/30"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/app/clientes/${c.id}`}
                                                className="font-medium text-foreground hover:text-primary transition-colors duration-200"
                                            >
                                                {c.name}
                                            </Link>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span>
                                                    Última:{' '}
                                                    {c.lastVisitDate?.toLocaleDateString('pt-BR') ?? '—'}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[11px] font-semibold">
                                                    {c.daysSinceLastVisit}d ausente
                                                </span>
                                                <span>
                                                    R$ {c.totalSpent.toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {c.phone && (
                                                <a
                                                    href={`tel:${c.phone}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-foreground shadow-xs transition-all duration-200 hover:shadow-sm hover:border-primary/30"
                                                    title={`Ligar para ${c.phone}`}
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    {c.phone}
                                                </a>
                                            )}
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-all duration-200 hover:shadow-sm hover:brightness-110 active:scale-[0.98]"
                                                title="Copiar link de agendamento"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Link
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Customers Sidebar */}
                <div className="lg:col-span-1 animate-in stagger-3">
                    <div className="card overflow-hidden">
                        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-warning" />
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Top Clientes (LTV)
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Maior valor vitalício
                                </p>
                            </div>
                        </div>

                        {topCustomers.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                Nenhum dado disponível.
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {topCustomers.map((c, i) => (
                                    <div
                                        key={c.id}
                                        className="px-6 py-4 flex items-center gap-4 transition-colors duration-150 hover:bg-muted/30"
                                    >
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0
                                                    ? 'bg-warning/15 text-warning'
                                                    : i === 1
                                                        ? 'bg-muted text-muted-foreground'
                                                        : i === 2
                                                            ? 'bg-amber-900/10 text-amber-800'
                                                            : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {i + 1}º
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/app/clientes/${c.id}`}
                                                className="font-medium text-sm text-foreground hover:text-primary transition-colors duration-200 truncate block"
                                            >
                                                {c.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {c.tabsCount} visita{c.tabsCount !== 1 && 's'}
                                            </p>
                                        </div>
                                        <span className="font-bold text-sm text-primary flex-shrink-0">
                                            R$ {c.totalSpent.toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
