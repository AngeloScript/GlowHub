import { getUpcomingAppointments } from '@/actions/dashboard/dashboard-actions'
import { CalendarClock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export async function UpcomingAppointmentsWidget() {
    const appointments = await getUpcomingAppointments()

    return (
        <div className="bg-white rounded-xl border border-border shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-muted-foreground" />
                    Próximos Clientes
                </h2>
                <Link href="/app/agenda" className="text-sm text-primary hover:underline font-medium">
                    Ver Agenda
                </Link>
            </div>

            <div className="p-0 flex-1 overflow-auto">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
                        <CalendarClock className="w-8 h-8 mb-3 opacity-20" />
                        <p>A fila de hoje está vazia.</p>
                        <p className="text-sm">Nenhum cliente previsto nas próximas horas.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="font-semibold text-foreground">{apt.customer.name}</p>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="font-medium text-foreground">
                                            {new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span>&bull;</span>
                                        <span>{apt.service.name} ({apt.service.durationMinutes}m)</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Com {apt.professional.name}</p>
                                </div>
                                <Link
                                    href={`/app/agenda?newTab=${apt.id}`}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                                >
                                    Abrir Comanda
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
