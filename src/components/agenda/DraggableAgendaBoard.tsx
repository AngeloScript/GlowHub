'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { format, addMinutes } from 'date-fns'

// Mock Data Types
type Appointment = {
    id: string
    professionalId: string
    startTime: Date
    endTime: Date
    customerName: string
    serviceName: string
    categoryName?: string
    colorCode?: string | null
}

type Professional = {
    id: string
    name: string
}

type Blockout = {
    id: string
    professionalId: string
    startTime: Date
    endTime: Date
    reason?: string | null
}

interface DraggableAgendaBoardProps {
    date: Date
    professionals: Professional[]
    initialAppointments: Appointment[]
    initialBlockouts?: Blockout[]
    onAppointmentDrop: (appointmentId: string, newProfessionalId: string, newStartTime: Date) => Promise<boolean>
    onAppointmentClick: (appointmentId: string) => void
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8 // Começa as 8h
    const minute = i % 2 === 0 ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
})

export function DraggableAgendaBoard({
    date,
    professionals,
    initialAppointments,
    initialBlockouts = [],
    onAppointmentDrop,
    onAppointmentClick
}: DraggableAgendaBoardProps) {
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
    const [blockouts, setBlockouts] = useState<Blockout[]>(initialBlockouts)
    const [selectedProfIndex, setSelectedProfIndex] = useState(0)

    // Atualiza state se props mudarem
    useEffect(() => {
        setAppointments(initialAppointments)
        setBlockouts(initialBlockouts)
    }, [initialAppointments, initialBlockouts])

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const { source, destination, draggableId } = result

        // Se não mudou de lugar, ignora
        if (source.droppableId === destination.droppableId && source.index === destination.index) return

        // O droppableId é formato: "profId-timeSlot" (ex: "prof-1-08:00")
        const [profId, ...timeParts] = destination.droppableId.split('-')
        const timeSlot = timeParts.join('-') // "08:00"

        const [hour, minute] = timeSlot.split(':').map(Number)

        const newStartTime = new Date(date)
        newStartTime.setHours(hour, minute, 0, 0)

        // Encontra o agendamento sendo arrastado
        const draggedAppt = appointments.find(a => a.id === draggableId)
        if (!draggedAppt) return

        // Calcula a duração original
        const durationMn = (new Date(draggedAppt.endTime).getTime() - new Date(draggedAppt.startTime).getTime()) / 60000
        const newEndTime = addMinutes(newStartTime, durationMn)

        // Optimistic UI Update
        const previousAppointments = [...appointments]
        setAppointments(prev => prev.map(a =>
            a.id === draggableId
                ? { ...a, professionalId: profId, startTime: newStartTime, endTime: newEndTime }
                : a
        ))

        // Chama a Action do Servidor
        const success = await onAppointmentDrop(draggableId, profId, newStartTime)

        // Reverte se falhou
        if (!success) {
            setAppointments(previousAppointments)
        }
    }

    const getAppointmentsForSlot = (profId: string, timeSlot: string) => {
        return appointments.filter(a => {
            const apptTime = format(new Date(a.startTime), 'HH:mm')
            return a.professionalId === profId && apptTime === timeSlot
        })
    }

    const getBlockoutsForSlot = (profId: string, timeSlot: string) => {
        return blockouts.filter(b => {
            const bTime = format(new Date(b.startTime), 'HH:mm')
            return b.professionalId === profId && bTime === timeSlot
        })
    }

    // Calcula a altura da div baseada na duração
    const getApptStyle = (item: { startTime: Date | string, endTime: Date | string }) => {
        const durationMn = (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000
        const slotsCovered = durationMn / 30
        // Cada slot tem aprox 64px (h-16) + gap
        const height = `${Math.max(1, slotsCovered) * 4 - 0.25}rem`
        return { height }
    }

    // Helper para cores por categoria (usando classes do Tailwind para reduzir inline styles)
    const getCategoryStyles = (categoryName?: string, customColor?: string | null) => {
        if (customColor) return { className: '', style: { backgroundColor: customColor, borderColor: 'rgba(0,0,0,0.1)' } }

        const name = (categoryName || '').toLowerCase()
        let className = 'bg-slate-50 border-slate-200'

        if (name.includes('cabelo')) className = 'bg-sky-100 border-sky-200'
        else if (name.includes('estética') || name.includes('estetica')) className = 'bg-green-100 border-green-200'
        else if (name.includes('unha') || name.includes('manicure') || name.includes('podologia')) className = 'bg-pink-100 border-pink-200'
        else if (name.includes('barba')) className = 'bg-amber-100 border-amber-200'
        else if (name.includes('maquiagem') || name.includes('makeup')) className = 'bg-purple-100 border-purple-200'
        else if (name.includes('sobrancelha')) className = 'bg-orange-100 border-orange-200'

        return { className, style: {} }
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            {/* Mobile professional selector tabs */}
            <div className="flex md:hidden gap-1 mb-2 overflow-x-auto no-scrollbar touch-pan-x pb-1">
                {professionals.map((prof, idx) => (
                    <button
                        key={prof.id}
                        onClick={() => setSelectedProfIndex(idx)}
                        className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${idx === selectedProfIndex
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white text-muted-foreground border-border hover:bg-muted'
                            }`}
                    >
                        {prof.name.split(' ')[0]}
                    </button>
                ))}
            </div>

            <div className="flex bg-white rounded-xl border border-border shadow-sm overflow-hidden h-[calc(100vh-16rem)] md:h-[calc(100vh-12rem)]">

                {/* Fixed Time Column */}
                <div className="w-12 md:w-20 flex-shrink-0 border-r border-border bg-muted/20">
                    <div className="h-10 md:h-14 border-b border-border flex items-center justify-center font-semibold text-[10px] md:text-sm text-muted-foreground bg-muted/40 sticky top-0 z-20">
                        <span className="hidden md:inline">Horário</span>
                        <span className="md:hidden">Hr</span>
                    </div>
                    <div className="overflow-y-auto">
                        {TIME_SLOTS.map((time) => (
                            <div key={time} className="h-12 md:h-16 border-b border-border/50 flex items-start justify-center pt-1.5 md:pt-2 text-[10px] md:text-xs font-medium text-muted-foreground">
                                {time}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Professionals Columns Container */}
                <div className="flex-1 flex overflow-x-auto relative touch-pan-x">
                    {professionals.map((prof, profIdx) => (
                        <div
                            key={prof.id}
                            className={`min-w-[200px] md:min-w-[280px] flex-1 border-r border-border/50 flex flex-col ${profIdx !== selectedProfIndex ? 'hidden md:flex' : ''
                                }`}
                        >

                            {/* Professional Header */}
                            <div className="h-10 md:h-14 border-b border-border bg-white flex items-center justify-center font-semibold text-xs md:text-sm sticky top-0 z-10 shadow-sm">
                                {prof.name}
                            </div>

                            {/* Time Slots Area (Droppable) */}
                            <div className="flex-1 relative">
                                {TIME_SLOTS.map((time) => {
                                    const dropId = `${prof.id}-${time}`
                                    const slotAppointments = getAppointmentsForSlot(prof.id, time)
                                    const slotBlockouts = getBlockoutsForSlot(prof.id, time)

                                    return (
                                        <Droppable droppableId={dropId} key={dropId}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`h-12 md:h-16 border-b border-border/30 relative p-0.5 md:p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''
                                                        }`}
                                                >
                                                    {slotBlockouts.map(b => (
                                                        <div
                                                            key={b.id}
                                                            className="absolute left-0.5 right-0.5 md:left-1 md:right-1 top-0.5 md:top-1 z-0 rounded-md p-1.5 md:p-2 shadow-sm border bg-striped-pattern bg-white border-slate-200 opacity-90"
                                                            style={getApptStyle(b)}
                                                        >
                                                            <div className="text-[10px] md:text-xs font-semibold text-slate-500 truncate mb-0.5">Bloqueado</div>
                                                            {b.reason && <div className="text-[9px] md:text-[10px] text-slate-400 truncate">{b.reason}</div>}
                                                        </div>
                                                    ))}

                                                    {slotAppointments.map((appt, index) => {
                                                        const categoryStyles = getCategoryStyles(appt.categoryName, appt.colorCode)
                                                        return (
                                                            <Draggable key={appt.id} draggableId={appt.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        onClick={() => onAppointmentClick(appt.id)}
                                                                        className={`absolute left-0.5 right-0.5 md:left-1 md:right-1 top-0.5 md:top-1 z-10 rounded-md p-1.5 md:p-2 shadow-sm border cursor-grab active:cursor-grabbing hover:ring-2 ring-primary/20 transition-all min-h-[44px] ${categoryStyles.className} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary scale-[1.02] z-50' : ''
                                                                            }`}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            ...getApptStyle(appt),
                                                                            ...categoryStyles.style
                                                                        }}
                                                                    >
                                                                        <div className="text-[10px] md:text-xs font-semibold text-slate-800 truncate mb-0.5">
                                                                            {appt.customerName}
                                                                        </div>
                                                                        <div className="text-[9px] md:text-[10px] text-slate-600 truncate flex items-center gap-1">
                                                                            {appt.serviceName}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        )
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DragDropContext>
    )
}
