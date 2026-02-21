'use client'

import { useState, useEffect } from 'react'
import { TabSlideOver } from '@/components/TabSlideOver'
import { DraggableAgendaBoard } from '@/components/agenda/DraggableAgendaBoard'
import { getSalonAgenda, moveAppointment } from '@/actions/agenda/salon-agenda-actions'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react'

// Adaptação do tipo para o TabSlideOver
interface AppointmentData {
    id: string
    customerName: string
    serviceName: string
    professionalName: string
    status: string
}

export default function AgendaPage() {
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isLoading, setIsLoading] = useState(true)

    const [professionals, setProfessionals] = useState<Array<{ id: string, name: string }>>([])
    const [appointments, setAppointments] = useState<Array<{
        id: string
        customerName: string
        serviceName: string
        startTime: Date
        endTime: Date
        professionalId: string
        status: string
        categoryName: string
        colorCode: string | null
    }>>([])
    const [blockouts, setBlockouts] = useState<Array<{
        id: string
        professionalId: string
        startTime: Date
        endTime: Date
        reason: string
    }>>([])

    const loadData = async (date: Date) => {
        setIsLoading(true)
        try {
            const data = await getSalonAgenda(date.toISOString().split('T')[0])
            setProfessionals(data.professionals)
            setAppointments(data.appointments)
            setBlockouts(data.blockouts || [])
        } catch (error) {
            console.error("Erro ao carregar agenda:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData(selectedDate)
    }, [selectedDate])

    const navigateDay = (direction: number) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + direction)
        setSelectedDate(newDate)
    }

    const setToday = () => {
        setSelectedDate(new Date())
    }

    const handleAppointmentDrop = async (appointmentId: string, newProfessionalId: string, newStartTime: Date) => {
        const result = await moveAppointment(appointmentId, newProfessionalId, newStartTime.toISOString())
        if (!result.success) {
            alert(result.error) // TODO: Trocar por toast
            return false
        }
        return true
    }

    const handleAppointmentClick = (appointmentId: string) => {
        // Encontra os dados completos reais
        const appt = appointments.find(a => a.id === appointmentId)
        const prof = professionals.find(p => p.id === appt?.professionalId)

        if (appt && prof) {
            setSelectedAppointment({
                id: appt.id,
                customerName: appt.customerName,
                serviceName: appt.serviceName,
                professionalName: prof.name,
                status: 'SCHEDULED' // Passado default pois a query base ignora cancelados
            })
        }
    }

    const isToday = selectedDate.toDateString() === new Date().toDateString()

    return (
        <div className="flex h-full flex-col space-y-4">

            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        Agenda Diária
                        {isLoading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />}
                    </h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-white rounded-md border border-border shadow-sm overflow-hidden">
                        <button
                            onClick={() => navigateDay(-1)}
                            className="p-2.5 sm:p-2 hover:bg-muted transition-colors border-r border-border"
                            aria-label="Dia anterior"
                        >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div className="px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-[140px] justify-center">
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            {isToday ? 'Hoje' : selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </div>
                        <button
                            onClick={() => navigateDay(1)}
                            className="p-2.5 sm:p-2 hover:bg-muted transition-colors border-l border-border"
                            aria-label="Próximo dia"
                        >
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {!isToday && (
                        <button
                            onClick={setToday}
                            className="px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground bg-white border border-border rounded-md hover:bg-muted transition-colors shadow-sm"
                        >
                            Ir para Hoje
                        </button>
                    )}

                    <button className="rounded-md bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm sm:ml-2 w-full sm:w-auto">
                        + Novo
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 w-full relative">
                {isLoading && appointments.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50 rounded-xl border border-border">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : professionals.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl border border-border shadow-sm">
                        <div className="text-center text-muted-foreground">
                            <p className="font-medium text-lg">Nenhum profissional cadastrado.</p>
                            <p className="text-sm mt-1">Cadastre profissionais e defina horários para ver a agenda.</p>
                        </div>
                    </div>
                ) : (
                    <DraggableAgendaBoard
                        date={selectedDate}
                        professionals={professionals}
                        initialAppointments={appointments}
                        initialBlockouts={blockouts}
                        onAppointmentDrop={handleAppointmentDrop}
                        onAppointmentClick={handleAppointmentClick}
                    />
                )}
            </div>

            <TabSlideOver
                isOpen={!!selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                appointmentData={selectedAppointment}
            />
        </div>
    )
}
