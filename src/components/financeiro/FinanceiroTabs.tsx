'use client'

import { useState, useEffect } from 'react'
import {
    createExpense,
    markExpenseAsPaid,
    getExpensesSummary,
    getNetProfit,
    exportFinancialDataCsv
} from '@/actions/expenses/expense-actions'
import { EXPENSE_CATEGORIES } from '@/constants/expenses'

import {
    TrendingUp,
    TrendingDown,
    Plus,
    Check,
    AlertTriangle,
    Clock,
    DollarSign,
    Receipt,
    Download
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Expense = {
    id: string
    description: string
    amount: number | string
    category: string
    dueDate: Date
    paidDate: Date | null
    status: string
}

type DREData = {
    period: { start: Date; end: Date }
    totalIncome: number
    totalExpenses: number
    totalCommissions: number
    netProfit: number
    expensesByCategory: Record<string, number>
} | null

type ExpenseSummary = {
    pending: { items: Expense[]; total: number }
    overdue: { items: Expense[]; total: number }
    paid: { items: Expense[]; total: number }
    grandTotal: number
} | null

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FinanceiroTabs() {
    const [activeTab, setActiveTab] = useState<'contas' | 'dre'>('contas')

    const tabs = [
        { id: 'contas' as const, label: 'Contas a Pagar', icon: Receipt },
        { id: 'dre' as const, label: 'DRE (Lucro)', icon: TrendingUp },
    ]

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                            ? 'bg-white text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'contas' && <ContasAPagarTab />}
            {activeTab === 'dre' && <DRETab />}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Contas a Pagar Tab
// ---------------------------------------------------------------------------

function ContasAPagarTab() {
    const [summary, setSummary] = useState<ExpenseSummary>(null)
    const [showForm, setShowForm] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [formDesc, setFormDesc] = useState('')
    const [formAmount, setFormAmount] = useState('')
    const [formCategory, setFormCategory] = useState('Outros')
    const [formDueDate, setFormDueDate] = useState('')
    const [formNotes, setFormNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const now = new Date()

    const loadSummary = async () => {
        setIsLoading(true)
        const data = await getExpensesSummary(now.getMonth(), now.getFullYear())
        setSummary(data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadSummary()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCreate = async () => {
        if (!formDesc || !formAmount || !formDueDate) return
        setIsSubmitting(true)
        const result = await createExpense({
            description: formDesc,
            amount: parseFloat(formAmount),
            category: formCategory,
            dueDate: formDueDate,
            notes: formNotes || undefined,
        })
        if (result.success) {
            setShowForm(false)
            setFormDesc('')
            setFormAmount('')
            setFormDueDate('')
            setFormNotes('')
            await loadSummary()
        }
        setIsSubmitting(false)
    }

    const handleMarkPaid = async (id: string) => {
        await markExpenseAsPaid(id)
        await loadSummary()
    }

    if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <SummaryCard
                        label="A Vencer"
                        value={summary.pending.total}
                        count={summary.pending.items.length}
                        color="text-amber-600"
                        bg="bg-amber-50"
                        icon={Clock}
                    />
                    <SummaryCard
                        label="Vencidas"
                        value={summary.overdue.total}
                        count={summary.overdue.items.length}
                        color="text-red-600"
                        bg="bg-red-50"
                        icon={AlertTriangle}
                    />
                    <SummaryCard
                        label="Pagas"
                        value={summary.paid.total}
                        count={summary.paid.items.length}
                        color="text-green-600"
                        bg="bg-green-50"
                        icon={Check}
                    />
                </div>
            )}

            {/* New Expense Button */}
            <button
                onClick={() => setShowForm(!showForm)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-md"
            >
                <Plus className="w-5 h-5" />
                Nova Despesa
            </button>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-border/50 p-6 shadow-sm space-y-3">
                    <h3 className="font-bold text-foreground">Nova Despesa</h3>
                    <input
                        type="text"
                        placeholder="Descrição (ex: Aluguel Janeiro)"
                        value={formDesc}
                        onChange={e => setFormDesc(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground font-medium mb-1 block">Valor (R$)</label>
                            <input
                                title="Valor da Despesa"
                                type="number"
                                step="0.01"
                                placeholder="1500.00"
                                value={formAmount}
                                onChange={e => setFormAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground font-medium mb-1 block">Vencimento</label>
                            <input
                                title="Data de Vencimento"
                                type="date"
                                value={formDueDate}
                                onChange={e => setFormDueDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>
                    <select
                        title="Categoria da Despesa"
                        value={formCategory}
                        onChange={e => setFormCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <textarea
                        title="Observações da despesa"
                        placeholder="Observações (opcional)"
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting || !formDesc || !formAmount || !formDueDate}
                            className="flex-1 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Registrar Despesa'}
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

            {/* Expense Lists */}
            {summary && (
                <>
                    {summary.overdue.items.length > 0 && (
                        <ExpenseSection
                            title="🔴 Vencidas"
                            expenses={summary.overdue.items}
                            onMarkPaid={handleMarkPaid}
                            showPayButton
                        />
                    )}
                    {summary.pending.items.length > 0 && (
                        <ExpenseSection
                            title="🟡 A Vencer"
                            expenses={summary.pending.items}
                            onMarkPaid={handleMarkPaid}
                            showPayButton
                        />
                    )}
                    {summary.paid.items.length > 0 && (
                        <ExpenseSection
                            title="🟢 Pagas"
                            expenses={summary.paid.items}
                            onMarkPaid={handleMarkPaid}
                            showPayButton={false}
                        />
                    )}
                </>
            )}
        </div>
    )
}

function SummaryCard({ label, value, count, color, bg, icon: Icon }: {
    label: string; value: number; count: number; color: string; bg: string; icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <div className={`${bg} rounded-xl p-4 text-center`}>
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className={`text-lg font-bold ${color}`}>R$ {value.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label} ({count})</p>
        </div>
    )
}

function ExpenseSection({ title, expenses, onMarkPaid, showPayButton }: {
    title: string; expenses: Expense[]; onMarkPaid: (id: string) => void; showPayButton: boolean
}) {
    return (
        <div>
            <h4 className="text-sm font-bold text-foreground mb-2">{title}</h4>
            <div className="space-y-2">
                {expenses.map(exp => (
                    <div key={exp.id} className="bg-white rounded-xl border border-border/50 px-4 py-3 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-foreground">{exp.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{exp.category}</span>
                                <span>•</span>
                                <span>Venc: {new Date(exp.dueDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground">R$ {Number(exp.amount).toFixed(2)}</span>
                            {showPayButton && (
                                <button
                                    onClick={() => onMarkPaid(exp.id)}
                                    className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                    title="Marcar como paga"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// DRE (Lucro Líquido) Tab
// ---------------------------------------------------------------------------

function DRETab() {
    const [dreData, setDreData] = useState<DREData>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)

    // Filtros de Data
    const [activeFilter, setActiveFilter] = useState<'hoje' | 'semana' | 'mes' | 'mes_passado' | 'custom'>('mes')
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(1)
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        const d = new Date()
        d.setMonth(d.getMonth() + 1, 0)
        return d.toISOString().split('T')[0]
    })

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter as 'hoje' | 'semana' | 'mes' | 'mes_passado' | 'custom')
        const now = new Date()
        const start = new Date(now)
        const end = new Date(now)

        switch (filter) {
            case 'hoje':
                // start e end já são hoje
                break;
            case 'semana':
                const day = now.getDay()
                start.setDate(now.getDate() - day)
                end.setDate(start.getDate() + 6)
                break;
            case 'mes':
                start.setDate(1)
                end.setMonth(end.getMonth() + 1, 0)
                break;
            case 'mes_passado':
                start.setMonth(start.getMonth() - 1, 1)
                end.setDate(0)
                break;
        }

        if (filter !== 'custom') {
            setStartDate(start.toISOString().split('T')[0])
            setEndDate(end.toISOString().split('T')[0])
        }
    }

    const loadDRE = async () => {
        setIsLoading(true)
        const data = await getNetProfit(startDate + 'T00:00:00.000Z', endDate + 'T23:59:59.999Z')
        setDreData(data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadDRE()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate])

    const handleExportCSV = async () => {
        setIsExporting(true)
        const result = await exportFinancialDataCsv(startDate + 'T00:00:00.000Z', endDate + 'T23:59:59.999Z')
        setIsExporting(false)

        if (result.success && result.data) {
            const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `DRE_${startDate}_a_${endDate}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            alert('Falha ao exportar')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">Filtros de Período</h3>
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting || isLoading}
                        className="flex items-center gap-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exportando...' : 'Exportar CSV'}
                    </button>
                </div>

                {/* Filtros rápidos */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'hoje', label: 'Hoje' },
                        { id: 'semana', label: 'Esta Semana' },
                        { id: 'mes', label: 'Este Mês' },
                        { id: 'mes_passado', label: 'Mês Passado' },
                        { id: 'custom', label: 'Período Específico' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => handleFilterChange(f.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${activeFilter === f.id
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-border/60 text-muted-foreground hover:border-primary/50 hover:bg-slate-50'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Inputs de Data (apenas se custom ou visivel para referencia) */}
                <div className="flex gap-3 bg-white p-3 rounded-lg border border-border/50">
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Data Inicial</label>
                        <input
                            title="Data Inicial"
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value)
                                setActiveFilter('custom')
                            }}
                            className="w-full text-sm font-medium focus:outline-none bg-transparent"
                        />
                    </div>
                    <div className="w-px bg-border/50"></div>
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Data Final</label>
                        <input
                            title="Data Final"
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value)
                                setActiveFilter('custom')
                            }}
                            className="w-full text-sm font-medium focus:outline-none bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Calculando DRE...</div>
            ) : dreData ? (
                <div className="space-y-6">
                    {/* Net Profit Hero */}
                    <div className={`rounded-2xl p-6 text-center shadow-lg transition-colors duration-500 relative overflow-hidden ${dreData.netProfit >= 0
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-red-500 to-rose-600'
                        }`}>
                        <div className="relative z-10">
                            <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Resultado (Lucro Líquido)</p>
                            <p className="text-4xl font-black text-white mt-1">
                                R$ {dreData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-white/80 text-xs mt-2 font-medium bg-black/10 inline-block px-2 py-0.5 rounded-full">
                                {new Date(startDate).toLocaleDateString()} a {new Date(endDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                        <DRERow
                            label="Receita Bruta"
                            value={dreData.totalIncome}
                            icon={TrendingUp}
                            color="text-green-600"
                            bg="bg-green-50"
                        />
                        <DRERow
                            label="Comissões Pagas"
                            value={-dreData.totalCommissions}
                            icon={DollarSign}
                            color="text-amber-600"
                            bg="bg-amber-50"
                        />
                        <DRERow
                            label="Despesas Pagas"
                            value={-dreData.totalExpenses}
                            icon={TrendingDown}
                            color="text-red-600"
                            bg="bg-red-50"
                        />
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(dreData.expensesByCategory).length > 0 && (
                        <div className="bg-white rounded-xl border border-border/50 p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Despesas por Categoria
                            </h4>
                            <div className="space-y-0.5">
                                {Object.entries(dreData.expensesByCategory)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([cat, value]) => (
                                        <div key={cat} className="flex justify-between items-center py-2.5 px-3 rounded hover:bg-slate-50 group">
                                            <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">{cat}</span>
                                            <span className="text-sm font-mono font-semibold text-red-600">
                                                - R$ {value.toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}

function DRERow({ label, value, icon: Icon, color, bg }: {
    label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; bg: string
}) {
    return (
        <div className={`${bg} rounded-xl px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
            <span className={`text-lg font-bold ${color}`}>
                R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
        </div>
    )
}
