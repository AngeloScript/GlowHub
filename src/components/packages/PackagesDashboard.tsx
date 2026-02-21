'use client'

import { useState } from 'react'
import { createPackage, togglePackageActive } from '@/actions/packages/package-actions'
import { Package, Plus, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Users } from 'lucide-react'

type ServicePackageItem = {
    id: string
    serviceId: string
    quantity: number
    service: { name: string; price: number | string; durationMinutes: number }
}

type ServicePackage = {
    id: string
    name: string
    description: string | null
    price: number | string
    validityDays: number
    isActive: boolean
    items: ServicePackageItem[]
    _count: { sales: number }
    createdAt: Date
}

interface Props {
    initialPackages: ServicePackage[]
    isAdmin: boolean
}

export function PackagesDashboard({ initialPackages, isAdmin }: Props) {
    const [packages, setPackages] = useState<ServicePackage[]>(initialPackages)
    const [showForm, setShowForm] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Form State
    const [formName, setFormName] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formPrice, setFormPrice] = useState('')
    const [formValidity, setFormValidity] = useState('90')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleCreate = async () => {
        if (!formName || !formPrice) return
        setIsSubmitting(true)

        const result = await createPackage({
            name: formName,
            description: formDescription || undefined,
            price: parseFloat(formPrice),
            validityDays: parseInt(formValidity),
            items: [], // Items podem ser adicionados depois via UI dedicada
        })

        if (result.success) {
            setShowForm(false)
            setFormName('')
            setFormDescription('')
            setFormPrice('')
            setFormValidity('90')
            // Reload page to get updated data
            window.location.reload()
        }

        setIsSubmitting(false)
    }

    const handleToggle = async (pkgId: string) => {
        const result = await togglePackageActive(pkgId)
        if (result.success) {
            setPackages(prev => prev.map(p =>
                p.id === pkgId ? { ...p, isActive: !p.isActive } : p
            ))
        }
    }

    return (
        <div className="space-y-4">
            {/* New Package Button */}
            {isAdmin && (
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Criar Novo Pacote
                </button>
            )}

            {/* Create Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-border/50 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-foreground">Novo Pacote</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Nome do Pacote (ex: Clube Drenagem 10x)"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <textarea
                            placeholder="Descrição (opcional)"
                            value={formDescription}
                            onChange={e => setFormDescription(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground font-medium mb-1 block">Preço (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="500.00"
                                    value={formPrice}
                                    onChange={e => setFormPrice(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground font-medium mb-1 block">Validade (dias)</label>
                                <input
                                    type="number"
                                    placeholder="90"
                                    value={formValidity}
                                    onChange={e => setFormValidity(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting || !formName || !formPrice}
                            className="flex-1 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Criar Pacote'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-6 py-3 rounded-lg border border-border/50 text-sm hover:bg-muted transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Package List */}
            {packages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border/50 shadow-sm">
                    <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">Nenhum pacote cadastrado.</p>
                    <p className="text-xs text-muted-foreground mt-1">Crie o primeiro combo para seus clientes.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {packages.map(pkg => (
                        <div
                            key={pkg.id}
                            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${pkg.isActive ? 'border-border/50' : 'border-red-200 opacity-60'
                                }`}
                        >
                            {/* Header */}
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedId(expandedId === pkg.id ? null : pkg.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-primary" />
                                            <h3 className="font-bold text-foreground">{pkg.name}</h3>
                                        </div>
                                        {pkg.description && (
                                            <p className="text-xs text-muted-foreground mt-1 pl-6">{pkg.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-primary">
                                            R$ {Number(pkg.price).toFixed(2)}
                                        </span>
                                        {expandedId === pkg.id
                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        }
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 pl-6 text-xs text-muted-foreground">
                                    <span>{pkg.validityDays} dias de validade</span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {pkg._count.sales} vendidos
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === pkg.id && (
                                <div className="border-t border-border/30 px-4 py-3 space-y-3">
                                    {pkg.items.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Serviços Inclusos</p>
                                            {pkg.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center py-1.5 text-sm">
                                                    <span>{item.service.name}</span>
                                                    <span className="text-muted-foreground font-mono">{item.quantity}x</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <div className="border-t border-border/30 pt-3 flex justify-end">
                                            <button
                                                onClick={() => handleToggle(pkg.id)}
                                                className={`flex items-center gap-2 text-xs font-medium transition-colors ${pkg.isActive ? 'text-red-500' : 'text-green-500'}`}
                                            >
                                                {pkg.isActive
                                                    ? <><ToggleRight className="w-4 h-4" /> Desativar</>
                                                    : <><ToggleLeft className="w-4 h-4" /> Reativar</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
