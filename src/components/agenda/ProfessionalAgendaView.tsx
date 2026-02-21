'use client'

import { useState } from 'react'
import { getProfessionalAgenda, cancelProfessionalAppointment } from '@/actions/agenda/professional-agenda-actions'
import { Clock, User, Scissors, X, ChevronLeft, ChevronRight } from 'lucide-react'

type Appointment = {
    id: string
    startTime: Date
    endTime: Date
    status: string
    customer: { id: string; name: string; phone: string | null }
    service: { id: string; name: string; durationMinutes: number; price: number | string }
}

interface Props {
    initialAppointments: Appointment[]
}

export function ProfessionalAgendaView({ initialAppointments }: Props) {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(false)

    const loadDay = async (date: Date) => {
        setSelectedDate(date)
        setIsLoading(true)
        try {
            const data = await getProfessionalAgenda(date.toISOString().split('T')[0])
            setAppointments(data)
        } catch {
            setAppointments([])
        } finally {
            setIsLoading(false)
        }
    }

    const navigateDay = (direction: number) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + direction)
        loadDay(newDate)
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Deseja realmente cancelar este agendamento?')) return

        const result = await cancelProfessionalAppointment(id)
        if (result.success) {
            setAppointments(prev => prev.map(a =>
                a.id === id ? { ...a, status: 'CANCELED' } : a
            ))
        }
    }

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    const isToday = selectedDate.toDateString() === new Date().toDateString()
    const scheduledCount = appointments.filter(a => a.status === 'SCHEDULED').length

    return (
        <div className="space-y-4">
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-border/50 p-4 shadow-sm">
                <button
                    onClick={() => navigateDay(-1)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Dia anterior"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <p className="font-bold text-foreground">
                        {isToday ? 'Hoje' : selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button
                    onClick={() => navigateDay(1)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Próximo dia"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-border/50 p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-primary">{scheduledCount}</p>
                    <p className="text-xs text-muted-foreground font-medium">Agendados</p>
                </div>
                <div className="bg-white rounded-xl border border-border/50 p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total do Dia</p>
                </div>
            </div>

            {/* Timeline */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border/50 shadow-sm">
                    <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">Nenhum agendamento neste dia.</p>
                    <p className="text-xs text-muted-foreground mt-1">Dia livre para descansar! 😌</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map(appt => {
                        const isCanceled = appt.status === 'CANCELED'
                        const isCompleted = appt.status === 'COMPLETED'

                        return (
                            <div
                                key={appt.id}
                                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${isCanceled
                                        ? 'border-red-200 opacity-50'
                                        : isCompleted
                                            ? 'border-green-200'
                                            : 'border-border/50'
                                    }`}
                            >
                                {/* Time Bar */}
                                <div className={`px-4 py-2 text-xs font-bold tracking-wider uppercase ${isCanceled ? 'bg-red-50 text-red-600'
                                        : isCompleted ? 'bg-green-50 text-green-700'
                                            : 'bg-primary/5 text-primary'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(appt.startTime)} — {formatTime(appt.endTime)}
                                        </span>
                                        <span>{isCanceled ? 'Cancelado' : isCompleted ? 'Concluído' : 'Agendado'}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-semibold">{appt.customer.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Scissors className="w-4 h-4" />
                                        <span>{appt.service.name}</span>
                                        <span className="text-xs">• {appt.service.durationMinutes}min</span>
                                    </div>
                                    {appt.customer.phone && (
                                        <p className="text-xs text-muted-foreground pl-6">{appt.customer.phone}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                {appt.status === 'SCHEDULED' && (
                                    <div className="border-t border-border/30 px-4 py-2 flex justify-end">
                                        <button
                                            onClick={() => handleCancel(appt.id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
