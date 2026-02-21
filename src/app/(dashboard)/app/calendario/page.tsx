import { CalendarGrid } from '@/components/calendario/CalendarGrid'

export default function CalendarPage() {
    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendário Geral</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Visão geral mensal de todos os agendamentos e bloqueios da equipe.</p>
                </div>
            </div>
            <div className="flex-1 min-h-0 mt-2">
                <CalendarGrid />
            </div>
        </div>
    )
}
