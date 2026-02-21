'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getMonthAgenda } from '@/actions/calendario/calendar-actions'

type CalendarEvent = {
    id: string
    title: string
    professionalName: string
    startTime: Date
    endTime: Date
    type: 'APPOINTMENT' | 'BLOCKOUT'
    categoryName?: string
    colorCode?: string | null
}

export function CalendarGrid() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const loadEvents = async (date: Date) => {
        setIsLoading(true)
        const startIso = startOfWeek(startOfMonth(date)).toISOString()
        const endIso = endOfWeek(endOfMonth(date)).toISOString()

        try {
            const data = await getMonthAgenda(startIso, endIso)
            setEvents(data.events as CalendarEvent[])
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadEvents(currentDate)
    }, [currentDate])

    // Generate days of the month grid
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate))
        const end = endOfWeek(endOfMonth(currentDate))
        const d = []
        let day = start
        while (day <= end) {
            d.push(day)
            day = addDays(day, 1)
        }
        return d
    }, [currentDate])

    const getCategoryStyles = (categoryName?: string, customColor?: string | null) => {
        if (customColor) return { className: '', textClass: 'text-slate-800', style: { backgroundColor: customColor } }
        const name = (categoryName || '').toLowerCase()
        let className = 'bg-slate-50'
        let textClass = 'text-slate-700'

        if (name.includes('cabelo')) { className = 'bg-sky-100'; textClass = 'text-sky-800' }
        else if (name.includes('estética') || name.includes('estetica')) { className = 'bg-green-100'; textClass = 'text-green-800' }
        else if (name.includes('unha') || name.includes('manicure') || name.includes('podologia')) { className = 'bg-pink-100'; textClass = 'text-pink-800' }
        else if (name.includes('barba')) { className = 'bg-amber-100'; textClass = 'text-amber-800' }
        else if (name.includes('maquiagem') || name.includes('makeup')) { className = 'bg-purple-100'; textClass = 'text-purple-800' }

        return { className, textClass, style: {} }
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border border-border p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 capitalize text-foreground">
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    {isLoading && <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-muted-foreground ml-1 md:ml-2" />}
                </h2>
                <div className="flex bg-white rounded-md border border-border shadow-sm overflow-hidden">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} title="Mês anterior" aria-label="Mês anterior" className="p-2 hover:bg-muted transition-colors border-r border-border">
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors border-r border-border">
                        Hoje
                    </button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} title="Próximo mês" aria-label="Próximo mês" className="p-2 hover:bg-muted transition-colors">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-t border-l border-border rounded-tl-lg overflow-y-auto no-scrollbar min-h-[300px] md:min-h-[600px]">
                {/* Weekdays */}
                {[{ short: 'D', full: 'Dom' }, { short: 'S', full: 'Seg' }, { short: 'T', full: 'Ter' }, { short: 'Q', full: 'Qua' }, { short: 'Q', full: 'Qui' }, { short: 'S', full: 'Sex' }, { short: 'S', full: 'Sáb' }].map((day, i) => (
                    <div key={i} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-semibold text-slate-500 border-b border-r border-border bg-slate-50/80 sticky top-0 z-10">
                        <span className="hidden sm:inline">{day.full}</span>
                        <span className="sm:hidden">{day.short}</span>
                    </div>
                ))}

                {/* Days */}
                {days.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day))
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

                    return (
                        <div key={i} className={`min-h-[60px] md:min-h-[120px] p-0.5 md:p-1 border-b border-r border-border transition-colors hover:bg-slate-50/50 ${!isCurrentMonth ? 'bg-slate-50/30 text-slate-400' : 'bg-white text-slate-900'} ${isSameDay(day, new Date()) ? 'ring-inset ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                            <div className={`text-right text-[10px] md:text-xs font-medium p-0.5 md:p-1 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                                {format(day, 'd')}
                            </div>
                            <div className="flex flex-col gap-0.5 md:gap-1 mt-0.5 md:mt-1 px-0.5 md:px-1">
                                {dayEvents.map(evt => {
                                    if (evt.type === 'BLOCKOUT') {
                                        return (
                                            <div key={evt.id} title={`${evt.title} (${evt.professionalName})`} className="text-[8px] md:text-[10px] truncate px-1 md:px-1.5 py-0.5 md:py-1 rounded bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#f1f5f9_4px,#f1f5f9_8px)] bg-slate-50 border border-slate-200 text-slate-500 font-medium cursor-help transition-all hover:opacity-80">
                                                <span className="hidden sm:inline">{format(new Date(evt.startTime), 'HH:mm')} - </span>{evt.title} <span className="hidden md:inline">({evt.professionalName.split(' ')[0]})</span>
                                            </div>
                                        )
                                    }

                                    const categoryStyles = getCategoryStyles(evt.categoryName, evt.colorCode)
                                    return (
                                        <div key={evt.id} title={`${evt.title} com ${evt.professionalName}`} className={`text-[8px] md:text-[10px] truncate px-1 md:px-1.5 py-0.5 md:py-1 rounded border shadow-sm ${categoryStyles.textClass} ${categoryStyles.className} font-medium cursor-pointer transition-all hover:opacity-80`} style={{ ...categoryStyles.style, borderColor: 'rgba(0,0,0,0.05)' }}>
                                            <span className="hidden sm:inline">{format(new Date(evt.startTime), 'HH:mm')} - </span>{evt.title.split(' - ')[0]}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
