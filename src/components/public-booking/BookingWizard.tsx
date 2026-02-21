'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronRight, Clock, CalendarDays, ArrowLeft } from 'lucide-react'
import { getPublicAvailability, createPublicAppointment } from '@/actions/public/booking-actions'

type WizardStep = 'SERVICE' | 'DATETIME' | 'INFO' | 'SUCCESS'

type Props = {
    tenantData: {
        tenantId: string
        tenantName: string
        categories: {
            id: string
            name: string
            services: { id: string; name: string; price: number; durationMinutes: number }[]
        }[]
    }
}

export function BookingWizard({ tenantData }: Props) {
    const [step, setStep] = useState<WizardStep>('SERVICE')

    // Selections
    const [selectedService, setSelectedService] = useState<{ id: string; name: string; price: number; durationMinutes: number } | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ time: string, professionals: string[] } | null>(null)

    // Status
    const [availableSlots, setAvailableSlots] = useState<{ time: string, professionals: string[] }[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Date generation (next 14 days)
    const dates = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
    })

    // ---------------------------------------------------------------------------
    // Navigation / Actions
    // ---------------------------------------------------------------------------

    const handleServiceSelect = async (service: { id: string; name: string; price: number; durationMinutes: number }) => {
        setSelectedService(service)
        setStep('DATETIME')
        await fetchSlots(service.id, selectedDate)
    }

    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date)
        setSelectedTimeSlot(null) // reset time
        if (selectedService) {
            await fetchSlots(selectedService.id, date)
        }
    }

    const fetchSlots = async (serviceId: string, date: Date) => {
        setIsLoadingSlots(true)
        setErrorMsg('')
        try {
            const slots = await getPublicAvailability({
                tenantId: tenantData.tenantId,
                serviceId,
                date
            })
            setAvailableSlots(slots)
        } catch (e: unknown) {
            const error = e as Error
            setErrorMsg(error.message || 'Erro ao buscar horários.')
            setAvailableSlots([])
        } finally {
            setIsLoadingSlots(false)
        }
    }

    const handleConfirmDateTime = () => {
        if (!selectedTimeSlot) return
        setStep('INFO')
    }

    const handleFinalSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        setErrorMsg('')
        try {
            const name = formData.get('name') as string
            const phone = formData.get('phone') as string

            // Build the exact startTime combining selectedDate and selectedTimeSlot
            const [hours, minutes] = selectedTimeSlot!.time.split(':').map(Number)
            const finalStart = new Date(selectedDate)
            finalStart.setHours(hours, minutes, 0, 0)

            await createPublicAppointment({
                tenantId: tenantData.tenantId,
                serviceId: selectedService!.id,
                startTime: finalStart,
                customerName: name,
                customerPhone: phone,
                professionalId: selectedTimeSlot!.professionals[0] // pick the first available for now
            })

            setStep('SUCCESS')
        } catch (e: unknown) {
            const error = e as Error
            setErrorMsg(error.message || 'Ocorreu um erro ao agendar.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ---------------------------------------------------------------------------
    // Render Functions
    // ---------------------------------------------------------------------------

    return (
        <div className="w-full relative">

            {/* BACK BUTTON */}
            {step !== 'SERVICE' && step !== 'SUCCESS' && (
                <button
                    onClick={() => setStep(step === 'DATETIME' ? 'SERVICE' : 'DATETIME')}
                    className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
            )}

            {/* STEP 1: SERVICE */}
            {step === 'SERVICE' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold mb-4">O que vamos fazer hoje?</h2>
                    <div className="space-y-6">
                        {tenantData.categories.map(category => (
                            <div key={category.id} className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    {category.name}
                                </h3>
                                <div className="space-y-2">
                                    {category.services.map((svc: { id: string; name: string; price: number; durationMinutes: number }) => (
                                        <button
                                            key={svc.id}
                                            onClick={() => handleServiceSelect(svc)}
                                            className="w-full p-4 rounded-xl border border-border/60 bg-white hover:border-primary/50 hover:shadow-sm transition-all text-left flex justify-between items-center group"
                                        >
                                            <div>
                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {svc.name}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-medium">
                                                    <span>R$ {Number(svc.price).toFixed(2).replace('.', ',')}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {svc.durationMinutes} min
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 2: DATETIME */}
            {step === 'DATETIME' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold mb-1">Qual o melhor horário?</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Selecionado: <span className="font-medium text-primary">{selectedService?.name}</span>
                    </p>

                    {/* Date Horizontal Scroller */}
                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none snap-x mb-2">
                        {dates.map((d, i) => {
                            const isSelected = d.toDateString() === selectedDate.toDateString()
                            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
                            const dayNum = d.getDate()

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateSelect(d)}
                                    className={`flex-shrink-0 snap-center rounded-xl p-3 w-[72px] flex flex-col items-center justify-center gap-1 border transition-all ${isSelected
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-white border-border/60 text-foreground hover:border-border'
                                        }`}
                                >
                                    <span className={`text-[11px] uppercase font-bold tracking-wider ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                                        {dayName}
                                    </span>
                                    <span className="text-2xl font-bold leading-none">
                                        {dayNum}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Time Slots Area */}
                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            Horários Disponíveis
                        </h3>

                        {isLoadingSlots ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="py-8 text-center bg-muted/30 rounded-xl border border-border overflow-hidden">
                                <p className="text-sm text-foreground/70 font-medium">Nenhum horário livre.</p>
                                <p className="text-xs text-muted-foreground mt-1">Tente selecionar outro dia.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {availableSlots.map((slot, i) => {
                                    const isSelected = selectedTimeSlot?.time === slot.time
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedTimeSlot(slot)}
                                            className={`py-2.5 rounded-lg text-sm font-bold border transition-colors ${isSelected
                                                ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                                : 'bg-white border-border/60 text-foreground hover:border-primary/50 hover:text-primary'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleConfirmDateTime}
                        disabled={!selectedTimeSlot}
                        className="w-full mt-8 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                    >
                        Continuar
                    </button>
                </div>
            )}

            {/* STEP 3: INFO */}
            {step === 'INFO' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xl font-bold mb-1">Último passo!</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Precisamos de alguns dados para confirmar.
                    </p>

                    <form action={handleFinalSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Seu Nome</label>
                            <input
                                name="name"
                                required
                                placeholder="Como gostaria de ser chamado?"
                                className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3.5 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">WhatsApp</label>
                            <input
                                name="phone"
                                required
                                type="tel"
                                placeholder="(11) 99999-9999"
                                className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3.5 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm font-medium border border-danger/20">
                                {errorMsg}
                            </div>
                        )}

                        <div className="pt-4">
                            <div className="bg-muted/30 p-4 rounded-xl border border-border/60 space-y-2 mb-6 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Serviço:</span>
                                    <span className="font-semibold text-foreground">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dia:</span>
                                    <span className="font-semibold text-foreground">
                                        {selectedDate.toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Horário:</span>
                                    <span className="font-semibold text-foreground">{selectedTimeSlot?.time}</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2 mt-2">
                                    <span className="text-muted-foreground font-medium">Total:</span>
                                    <span className="font-bold text-primary">R$ {Number(selectedService?.price).toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    'Confirmar Agendamento'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 'SUCCESS' && (
                <div className="py-12 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-success/5 animate-pulse">
                        <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Tudo Certo!
                    </h2>
                    <p className="text-muted-foreground max-w-[280px]">
                        Seu horário foi agendado com sucesso para o dia <strong className="text-foreground">{selectedDate.toLocaleDateString('pt-BR')}</strong> às <strong className="text-foreground">{selectedTimeSlot?.time}</strong>.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 text-sm font-semibold text-primary hover:underline hover:underline-offset-2"
                    >
                        Fazer outro agendamento
                    </button>
                </div>
            )}

        </div>
    )
}
