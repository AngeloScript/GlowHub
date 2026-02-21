'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

export async function getMonthAgenda(startIso: string, endIso: string) {
    const session = await getSession()
    if (!session) return { professionals: [], appointments: [], blockouts: [] }

    const tenantDb = createTenantClient(session.tenantId)
    const startDate = new Date(startIso)
    const endDate = new Date(endIso)

    // Buscar profissionais
    const professionalsData = await tenantDb.user.findMany({
        where: { role: 'PROFISSIONAL', isActive: true },
        select: { id: true, name: true }
    })

    // Buscar agendamentos e blockouts do período
    const appointmentsData = await tenantDb.appointment.findMany({
        where: {
            startTime: { gte: startDate, lte: endDate },
            status: { not: 'CANCELED' }
        },
        include: {
            customer: { select: { name: true } },
            service: { select: { name: true, category: { select: { name: true } } } },
            professional: { select: { name: true } }
        }
    })

    // Bypass prisma cache type error temp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockoutsData = await (tenantDb as any).blockout.findMany({
        where: {
            startTime: { gte: startDate, lte: endDate },
        },
        include: {
            professional: { select: { name: true } }
        }
    })

    const appointments = appointmentsData.map(a => ({
        id: a.id,
        title: `${a.customer.name} - ${a.service.name}`,
        professionalName: a.professional.name,
        startTime: a.startTime,
        endTime: a.endTime,
        categoryName: a.service.category?.name || 'Geral',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colorCode: (a as any).colorCode || null,
        type: 'APPOINTMENT'
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockouts = blockoutsData.map((b: any) => ({
        id: b.id,
        title: b.reason || 'Bloqueado',
        professionalName: b.professional.name,
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'BLOCKOUT'
    }))

    return { professionals: professionalsData, events: [...appointments, ...blockouts] }
}
