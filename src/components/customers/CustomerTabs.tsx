'use client'

import { useState } from 'react'
import { FileText, Clock, DollarSign, UserRound } from 'lucide-react'

type TabKey = 'history' | 'medical_record'

type Props = {
    customer: { id: string; name: string; phone: string | null; email: string | null; notes: string | null; _count?: { tabs: number } }
    history: { totalSpent: number; tabs: { id: string; createdAt: Date; totalAmount: number; items: { id: string; price: number; service?: { name: string }; professional: { name: string } }[] }[]; favoriteServices: { name: string; count: number }[] } | null
    record: { lastUpdate: Date; allergies: string | null; hairType: string | null; skinType: string | null; technicalNotes: string | null; photosUrl?: string[] } | null
    updateCustomerAction: (formData: FormData) => Promise<void>
    updateRecordAction: (customerId: string, formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

export function CustomerTabs({ customer, history, record, updateCustomerAction, updateRecordAction }: Props) {
    const [activeTab, setActiveTab] = useState<TabKey>('history')
    const [isSaving, setIsSaving] = useState(false)

    async function handleSaveRecord(formData: FormData) {
        setIsSaving(true)
        await updateRecordAction(customer.id, formData)
        setIsSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-border pb-px">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'history'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Histórico & Detalhes
                </button>
                <button
                    onClick={() => setActiveTab('medical_record')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === 'medical_record'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Ficha Técnica
                </button>
            </div>

            {/* TAB: HISTÓRICO & DETALHES */}
            {activeTab === 'history' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="card p-4 text-center">
                                <DollarSign className="h-4 w-4 text-accent mx-auto mb-2" />
                                <p className="text-xl font-bold text-foreground">
                                    R$ {(history?.totalSpent ?? 0).toFixed(2).replace('.', ',')}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                                    Total Gasto
                                </p>
                            </div>
                            <div className="card p-4 text-center">
                                <Clock className="h-4 w-4 text-primary mx-auto mb-2" />
                                <p className="text-xl font-bold text-foreground">
                                    {customer._count?.tabs || 0}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
                                    Visitas
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <form action={updateCustomerAction} className="card p-6 space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <UserRound className="h-3.5 w-3.5" />
                                Dados de Contato
                            </h3>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Nome</label>
                                <input
                                    name="name"
                                    title="Nome do Cliente"
                                    placeholder="Nome completo"
                                    defaultValue={customer.name}
                                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                                <input
                                    name="phone"
                                    title="Telefone"
                                    defaultValue={customer.phone || ''}
                                    placeholder="(11) 99999-9999"
                                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                                <input
                                    name="email"
                                    type="email"
                                    title="E-mail"
                                    defaultValue={customer.email || ''}
                                    placeholder="cliente@email.com"
                                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Notas Rápidas</label>
                                <textarea
                                    name="notes"
                                    title="Notas Rápidas"
                                    rows={3}
                                    defaultValue={customer.notes || ''}
                                    placeholder="Prefere manhãs..."
                                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground font-medium py-2.5 rounded-lg text-sm transition-all hover:brightness-110 active:scale-[0.98]"
                            >
                                Salvar Alterações
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {/* Timeline */}
                        <div className="card overflow-hidden">
                            <div className="px-6 py-5 border-b border-border">
                                <h3 className="font-semibold text-foreground">Histórico de Serviços</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Últimos atendimentos</p>
                            </div>
                            {!history || history.tabs.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground text-sm">
                                    Sem histórico de atendimento.
                                </div>
                            ) : (
                                <div className="relative pl-6 py-4 pr-6">
                                    {/* Linha vertical da timeline */}
                                    <div className="absolute left-9 top-8 bottom-8 w-px bg-border"></div>

                                    <div className="space-y-8">
                                        {history.tabs.map((tab) => (
                                            <div key={tab.id} className="relative z-10 pl-10 group">
                                                {/* Bolinha da timeline */}
                                                <div className="absolute left-1.5 top-1 h-3 w-3 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors shadow-sm" />

                                                <div className="bg-muted/10 border border-border rounded-lg p-4 transition-all group-hover:shadow-md">
                                                    <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                                                        <div>
                                                            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                                                                Passagem no Salão
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                {new Date(tab.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-sm text-foreground bg-primary/10 px-2 py-1 rounded">
                                                            R$ {Number(tab.totalAmount).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {tab.items.map((item) => (
                                                            <div key={item.id} className="flex justify-between text-sm items-center">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-slate-700">
                                                                        {item.service?.name || 'Serviço Removido'}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Feito por {item.professional.name}
                                                                    </span>
                                                                </div>
                                                                <span className="text-slate-600 font-medium text-xs">
                                                                    R$ {Number(item.price).toFixed(2).replace('.', ',')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: FICHA TÉCNICA */}
            {activeTab === 'medical_record' && (
                <form
                    action={handleSaveRecord}
                    className="card p-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Anamnese Estética</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Anotações de colorimetria, restrições químicas e texturas capilares/dermatológicas.
                            </p>
                        </div>
                        {record?.lastUpdate && (
                            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                                Última att: {new Date(record.lastUpdate).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Alergias e Restrições</label>
                                <textarea
                                    name="allergies"
                                    title="Alergias e Restrições"
                                    rows={4}
                                    defaultValue={record?.allergies || ''}
                                    placeholder="Ex: Alergia a amônia, pele reativa a ácidos..."
                                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-danger/20 focus:border-danger/40"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Tipo de Cabelo</label>
                                    <input
                                        name="hairType"
                                        title="Tipo de Cabelo"
                                        defaultValue={record?.hairType || ''}
                                        placeholder="Ex: 3B Poroso"
                                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Tipo de Pele</label>
                                    <input
                                        name="skinType"
                                        title="Tipo de Pele"
                                        defaultValue={record?.skinType || ''}
                                        placeholder="Ex: Mista/Oleosa"
                                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">
                                Fórmulas e Histórico Químico
                            </label>
                            <textarea
                                name="technicalNotes"
                                title="Fórmulas e Histórico Químico"
                                rows={10}
                                defaultValue={record?.technicalNotes || ''}
                                placeholder="Colorimetria:\nRaiz: 6.0 + OX 20 vol\nComprimento: 7.1 + OX 30 vol\nTempo: 40 min..."
                                className="mt-1.5 w-full h-[calc(100%-24px)] rounded-lg border border-border bg-background p-3 text-sm font-mono resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Galeria de Evolução</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">Fotos de &quot;Antes e Depois&quot; do(a) cliente.</p>
                            </div>
                            <label className="bg-secondary text-secondary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:bg-secondary/80 cursor-pointer transition-colors shadow-sm">
                                + Anexar Foto
                                <input type="file" className="hidden" accept="image/*" />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Mock Photos */}
                            <div className="group relative aspect-square bg-muted rounded-lg border border-border overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                    <span className="text-xs font-medium opacity-50 text-foreground">Foto (Antes)</span>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[10px] text-white">01/02/2026 - Antes da Limpeza</p>
                                </div>
                            </div>
                            <div className="group relative aspect-square bg-muted rounded-lg border border-border overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                    <span className="text-xs font-medium opacity-50 text-foreground">Foto (Depois)</span>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[10px] text-white">01/02/2026 - Após Tratamento</p>
                                </div>
                            </div>
                            {/* Se o array oficial existisse: record?.photosUrl?.map(url => <img src={url} className="object-cover" />) */}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-lg text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Ficha Técnica'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
