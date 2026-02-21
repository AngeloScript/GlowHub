import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfessionalAgenda } from '@/actions/agenda/professional-agenda-actions'
import { ProfessionalAgendaView } from '@/components/agenda/ProfessionalAgendaView'

export const dynamic = 'force-dynamic'

export default async function MinhaAgendaPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    // RBAC: Apenas profissionais acessam esta rota
    if (session.role !== 'PROFISSIONAL') {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg font-semibold">Acesso Restrito</p>
                <p className="text-sm mt-2">Esta página é exclusiva para profissionais.</p>
            </div>
        )
    }

    const today = new Date().toISOString().split('T')[0]
    const appointments = await getProfessionalAgenda(today)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seus agendamentos do dia.
                </p>
            </div>

            <ProfessionalAgendaView initialAppointments={appointments} />
        </div>
    )
}
