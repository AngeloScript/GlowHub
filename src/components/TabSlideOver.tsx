'use client'

import { useState } from 'react'
import { X, Plus, Receipt, Trash2, Search } from 'lucide-react'
import { openTab, addTabItem } from '@/actions/tabs/tab-actions'

// --- Mock Services for Combobox ---
const MOCK_SERVICES = [
    { id: '1', name: 'Corte Degrade (R$ 60)', price: 60 },
    { id: '2', name: 'Hidratação Keune (R$ 150)', price: 150 },
    { id: '3', name: 'Escova Rápida (R$ 80)', price: 80 },
    { id: '4', name: 'Limpeza de Pele (R$ 120)', price: 120 },
]

type PaymentLine = { id: number, method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH' | string, amount: number }

type TabSlideOverProps = {
    isOpen: boolean
    onClose: () => void
    appointmentData?: {
        id: string
        customerName: string
        serviceName: string
        professionalName: string
        status: string // SCHEDULED | IN_PROGRESS | CLOSED
    } | null
}

export function TabSlideOver({ isOpen, onClose, appointmentData }: TabSlideOverProps) {
    const [isPending, setIsPending] = useState(false)
    const [tabStatus, setTabStatus] = useState(appointmentData?.status || 'SCHEDULED')
    // No cenário real isto viria via props após o appointment relacionar com a Tab real do banco:
    const tabId = 'MOCK_TAB_ID'

    const [checkoutMode, setCheckoutMode] = useState(false)

    // Split Payment State
    const baseTotal = 120.00
    const [tipAmount, setTipAmount] = useState<number>(0)
    const grandTotal = baseTotal + tipAmount

    const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ id: 1, method: 'CREDIT_CARD', amount: grandTotal }])

    // Combobox State
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedService, setSelectedService] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    if (!isOpen || !appointmentData) return null

    // Totais calc
    const totalPaid = paymentLines.reduce((acc, line) => acc + (line.amount || 0), 0)
    const remainingToPay = Math.max(0, grandTotal - totalPaid)
    const changeToReturn = Math.max(0, totalPaid - grandTotal)

    const addPaymentLine = () => {
        setPaymentLines(prev => [...prev, { id: Date.now(), method: 'PIX', amount: remainingToPay }])
    }

    const removePaymentLine = (id: number) => {
        setPaymentLines(prev => prev.filter(p => p.id !== id))
    }

    const updatePaymentLine = (id: number, field: 'method' | 'amount', value: string | number) => {
        setPaymentLines(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    }

    // Handler: Transição SCHEDULED -> IN_PROGRESS
    const handleOpenTab = async () => {
        setIsPending(true)
        const result = await openTab(tabId)
        if (result.success) {
            setTabStatus('IN_PROGRESS')
        }
        setIsPending(false)
    }

    // Action Add Item
    const handleAddItem = async (formData: FormData) => {
        setIsPending(true)
        formData.append('tabId', tabId)
        await addTabItem(formData)
        setIsPending(false)
    }

    // Action Checkout (Liquidação)
    const handleCheckout = async () => {
        // Simplificando o handle do mockup.
        // Trataria na UI com Toast. Aqui assumimos sucesso pra fluidez visual.
        setTabStatus('CLOSED')
        setCheckoutMode(false)
        setIsPending(false)
    }

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">

                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b border-border px-6">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">
                            Comanda #{appointmentData.id.substring(0, 6)}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors" title="Fechar">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Informações do Cliente & Status */}
                <div className="bg-muted/30 p-6 border-b border-border">
                    <p className="text-xl font-bold text-foreground">{appointmentData.customerName}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Profissional: {appointmentData.professionalName}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${tabStatus === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                                tabStatus === 'CLOSED' ? 'bg-green-100 text-green-800' : 'bg-primary/10 text-primary'}`}>
                            {tabStatus === 'SCHEDULED' ? 'Agendado' : tabStatus === 'CLOSED' ? 'Pago' : 'Em Andamento'}
                        </span>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                    {tabStatus === 'SCHEDULED' && (
                        <div className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/10">
                            <p className="text-sm text-muted-foreground mb-4">
                                O cliente chegou ao Salão? Inicie a comanda para transitar o agendamento e adicionar serviços extras consumidos na hora.
                            </p>
                            <button
                                onClick={handleOpenTab}
                                disabled={isPending}
                                className="bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-md hover:bg-primary/90 flex items-center gap-2"
                            >
                                {isPending ? 'Abrindo...' : 'Abrir Comanda'}
                            </button>
                        </div>
                    )}

                    {tabStatus === 'IN_PROGRESS' && !checkoutMode && (
                        <>
                            <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-primary" /> Adicionar Extra
                                </h3>
                                <form action={handleAddItem} className="space-y-3 relative">
                                    <div className="relative">
                                        <div className="flex items-center border border-border rounded-md px-3 bg-background focus-within:ring-2 focus-within:ring-primary/20">
                                            <Search className="w-4 h-4 text-muted-foreground mr-2" />
                                            <input
                                                type="text"
                                                placeholder="Buscar serviço extra..."
                                                className="w-full text-sm p-2 outline-none bg-transparent"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value)
                                                    setShowDropdown(true)
                                                }}
                                                onFocus={() => setShowDropdown(true)}
                                            />
                                        </div>
                                        {showDropdown && searchQuery && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-border shadow-lg rounded-md max-h-48 overflow-y-auto">
                                                {MOCK_SERVICES.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(srv => (
                                                    <div
                                                        key={srv.id}
                                                        className="px-4 py-2 text-sm hover:bg-muted cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedService(srv.id)
                                                            setSearchQuery(srv.name)
                                                            setShowDropdown(false)
                                                        }}
                                                    >
                                                        {srv.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input type="hidden" name="serviceId" value={selectedService} required />

                                    <select title="Profissional Responsável" name="professionalId" className="w-full text-sm rounded-md border border-border bg-background p-2" required>
                                        <option value="">Quem executou? (Comissão)...</option>
                                        <option value="ID_PROF">João Silva</option>
                                    </select>
                                    <button disabled={isPending || !selectedService} type="submit" className="w-full bg-muted text-foreground font-medium py-2 rounded-md hover:bg-border border border-border text-sm">
                                        {isPending ? 'Computando...' : '+ Inserir na Comanda'}
                                    </button>
                                </form>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-3">Serviços Executados</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                                        <div>
                                            <p className="font-medium text-foreground">{appointmentData.serviceName}</p>
                                            <p className="text-xs text-muted-foreground">{appointmentData.professionalName}</p>
                                        </div>
                                        <p className="font-medium">R$ 120,00</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {checkoutMode && tabStatus !== 'CLOSED' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Resumo do Checkout</h3>

                            <div className="bg-muted/10 border border-border rounded-md p-4 space-y-4">

                                <div className="space-y-2 pb-4 border-b border-border">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal Serviços</span>
                                        <span>R$ {baseTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Gorjeta (Transpasse)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground border-border border rounded bg-white px-2 py-1">R$</span>
                                            <input
                                                type="number"
                                                className="w-20 p-1 text-right border border-border rounded-md"
                                                value={tipAmount || ''}
                                                onChange={e => setTipAmount(Number(e.target.value))}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 font-bold text-lg mt-2 border-t border-border">
                                        <span>Total Geral</span>
                                        <span>R$ {grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold">Formas de Pagamento</label>
                                        {remainingToPay > 0 && <button onClick={addPaymentLine} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Múltiplo</button>}
                                    </div>

                                    {paymentLines.map((line) => (
                                        <div key={line.id} className="flex items-center gap-2">
                                            <select
                                                value={line.method}
                                                onChange={(e) => updatePaymentLine(line.id, 'method', e.target.value)}
                                                className="flex-1 text-sm rounded-md border border-border bg-background p-2"
                                                title="Método"
                                            >
                                                <option value="PIX">PIX</option>
                                                <option value="CREDIT_CARD">Crédito</option>
                                                <option value="DEBIT_CARD">Débito</option>
                                                <option value="CASH">Dinheiro</option>
                                            </select>
                                            <input
                                                type="number"
                                                title="Valor"
                                                className="w-24 text-sm rounded-md border border-border p-2 text-right"
                                                value={line.amount || ''}
                                                onChange={(e) => updatePaymentLine(line.id, 'amount', Number(e.target.value))}
                                                placeholder="Valor"
                                            />
                                            {paymentLines.length > 1 && (
                                                <button onClick={() => removePaymentLine(line.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Remover Gota">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <div className="pt-2 text-sm">
                                        {remainingToPay > 0 ? (
                                            <div className="flex justify-between text-yellow-600 font-medium bg-yellow-50 p-2 rounded border border-yellow-200">
                                                <span>Falta Pagar:</span>
                                                <span>R$ {remainingToPay.toFixed(2)}</span>
                                            </div>
                                        ) : changeToReturn > 0 ? (
                                            <div className="flex justify-between text-blue-600 font-medium bg-blue-50 p-2 rounded border border-blue-200">
                                                <span>Troco a devolver (Dinheiro):</span>
                                                <span>R$ {changeToReturn.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-green-600 font-medium bg-green-50 p-2 rounded border border-green-200">
                                                <span>Totalmente pago</span>
                                                <span>✅</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {tabStatus === 'CLOSED' && (
                        <div className="border border-green-200 bg-green-50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                            <h2 className="text-green-800 font-bold text-lg mb-2">Comanda Finalizada!</h2>
                            <p className="text-green-700 text-sm">
                                A entrada de R$ 120,00 foi lançada no Caixa e a Comissão matemática PENDENTE para o profissional {appointmentData.professionalName} foi agendada automaticamente.
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer Financeiro (Checkout) */}
                {tabStatus !== 'CLOSED' && (
                    <div className="bg-muted/30 p-6 border-t border-border flex flex-col gap-4">
                        {!checkoutMode && (
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span className="text-foreground">Total da Comanda</span>
                                <span className="text-primary">R$ {baseTotal.toFixed(2)}</span>
                            </div>
                        )}

                        {!checkoutMode ? (
                            <button
                                onClick={() => setCheckoutMode(true)}
                                disabled={tabStatus === 'SCHEDULED'}
                                className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Ir para Pagamento (PDV)
                            </button>
                        ) : (
                            <button
                                onClick={handleCheckout}
                                disabled={isPending || remainingToPay > 0}
                                className="w-full bg-green-600 text-white font-medium py-3 rounded-md hover:bg-green-700 disabled:opacity-50 flex justify-center transition-colors"
                            >
                                {isPending ? 'Liquidando...' : (remainingToPay > 0 ? `Falta R$ ${remainingToPay.toFixed(2)}` : 'Confirmar e Fechar')}
                            </button>
                        )}
                    </div>
                )}

            </div>
        </>
    )
}
