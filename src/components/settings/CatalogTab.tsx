'use client'

import { createService, toggleServiceStatus, createCategory } from '@/actions/settings/service-actions'
import { useState } from 'react'
import { Plus, Power } from 'lucide-react'

type ServiceRow = {
    id: string
    name: string
    price: number | string
    durationMinutes: number
    isActive: boolean
    categoryId: string | null
    category: { id: string; name: string } | null
}

type CategoryRow = {
    id: string
    name: string
    _count: { services: number }
}

type Props = {
    services: ServiceRow[]
    categories: CategoryRow[]
}

export function CatalogTab({ services, categories }: Props) {
    const [showForm, setShowForm] = useState(false)
    const [showCatForm, setShowCatForm] = useState(false)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">
                        Serviços ({services.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {categories.length} categorias
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowCatForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-foreground shadow-xs transition-all duration-200 hover:shadow-sm hover:border-primary/30"
                    >
                        <Plus className="h-3 w-3" />
                        Categoria
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-all duration-200 hover:shadow-sm hover:brightness-110 active:scale-[0.98]"
                    >
                        <Plus className="h-3 w-3" />
                        Novo Serviço
                    </button>
                </div>
            </div>

            {/* Category Form */}
            {showCatForm && (
                <form
                    action={async (fd) => {
                        await createCategory(fd)
                        setShowCatForm(false)
                    }}
                    className="card p-4 flex items-end gap-3 animate-scale"
                >
                    <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground">
                            Nome da Categoria
                        </label>
                        <input
                            name="name"
                            title="Nome da categoria"
                            placeholder="Ex: Cabelo, Barba, Estética..."
                            required
                            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-xs hover:brightness-110 active:scale-[0.98]"
                    >
                        Salvar
                    </button>
                </form>
            )}

            {/* Service Form */}
            {showForm && (
                <form
                    action={async (fd) => {
                        await createService(fd)
                        setShowForm(false)
                    }}
                    className="card p-5 space-y-4 animate-scale"
                >
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Novo Serviço
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Nome</label>
                            <input
                                name="name"
                                title="Nome do serviço"
                                required
                                placeholder="Corte Masculino"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Preço (R$)</label>
                            <input
                                name="price"
                                title="Preço"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="45.00"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
                            <input
                                name="durationMinutes"
                                title="Duração em minutos"
                                type="number"
                                min="5"
                                required
                                placeholder="30"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                            <select
                                name="categoryId"
                                title="Categoria do serviço"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            >
                                <option value="">Sem categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-primary text-primary-foreground font-medium px-5 py-2 rounded-lg text-sm shadow-xs hover:shadow-sm hover:brightness-110 active:scale-[0.98]"
                    >
                        Cadastrar Serviço
                    </button>
                </form>
            )}

            {/* Services Table */}
            <div className="card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Serviço
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Categoria
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                                Preço
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                Duração
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                    Nenhum serviço cadastrado.
                                </td>
                            </tr>
                        ) : (
                            services.map((svc) => (
                                <tr
                                    key={svc.id}
                                    className={`transition-colors duration-150 hover:bg-muted/20 ${!svc.isActive ? 'opacity-50' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {svc.name}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {svc.category?.name || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums text-foreground">
                                        R$ {Number(svc.price).toFixed(2).replace('.', ',')}
                                    </td>
                                    <td className="px-6 py-4 text-center text-muted-foreground">
                                        {svc.durationMinutes}min
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <form
                                            action={async () => {
                                                await toggleServiceStatus(svc.id)
                                            }}
                                        >
                                            <button
                                                type="submit"
                                                title={svc.isActive ? 'Desativar' : 'Ativar'}
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${svc.isActive
                                                        ? 'bg-success/10 text-success hover:bg-success/20'
                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                <Power className="h-3 w-3" />
                                                {svc.isActive ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
