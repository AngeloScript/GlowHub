import { getCustomers } from '@/actions/customers/customer-actions'
import Link from 'next/link'
import { Search, UserPlus } from 'lucide-react'

export default async function ClientesPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const search = typeof params?.q === 'string' ? params.q : ''
    const customers = await getCustomers(search || undefined)

    return (
        <div className="flex h-full flex-col space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Clientes
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {customers.length} cadastrados na base
                    </p>
                </div>
                <Link
                    href="/app/clientes/novo"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
                >
                    <UserPlus className="h-4 w-4" />
                    Novo Cliente
                </Link>
            </div>

            {/* Search */}
            <form className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    name="q"
                    placeholder="Buscar por nome ou telefone..."
                    defaultValue={search}
                    className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:shadow-md"
                />
            </form>

            {/* Table */}
            <div className="card overflow-hidden animate-in stagger-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Telefone
                                </th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    E-mail
                                </th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                    Visitas
                                </th>
                                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                                    Desde
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        {search
                                            ? 'Nenhum cliente encontrado.'
                                            : 'Nenhum cliente cadastrado.'}
                                    </td>
                                </tr>
                            ) : (
                                customers.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="group transition-colors duration-150 hover:bg-accent/[0.03]"
                                    >
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/app/clientes/${c.id}`}
                                                className="font-medium text-foreground group-hover:text-primary transition-colors duration-200"
                                            >
                                                {c.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {c.phone || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {c.email || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                                {c._count?.tabs ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                                            {c.createdAt.toLocaleDateString('pt-BR')}
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
