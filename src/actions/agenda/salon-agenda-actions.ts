'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

// ---------------------------------------------------------------------------
// LEITURA — Agenda completa do Salão (Todos os profissionais)
// ---------------------------------------------------------------------------

export async function getSalonAgenda(date: string) {
    const session = await getSession()
    if (!session) return { professionals: [], appointments: [] }

    const targetDate = new Date(date)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const tenantDb = createTenantClient(session.tenantId)

    // Buscar profissionais, agendamentos e bloqueios em paralelo
    const [professionalsData, appointmentsData, blockoutsData] = await Promise.all([
        tenantDb.user.findMany({
            where: { role: 'PROFISSIONAL', isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        }),
        tenantDb.appointment.findMany({
            where: {
                startTime: { gte: dayStart, lte: dayEnd },
                status: { not: 'CANCELED' }
            },
            include: {
                customer: { select: { id: true, name: true } },
                service: {
                    select: { id: true, name: true, durationMinutes: true, category: { select: { name: true } } }
                },
            }
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tenantDb as any).blockout.findMany({
            where: {
                startTime: { gte: dayStart, lte: dayEnd },
            }
        }) as Promise<Array<{
            id: string
            professionalId: string
            startTime: Date
            endTime: Date
            reason: string
        }>>
    ])

    const appointments = appointmentsData.map((a: typeof appointmentsData[number]) => ({
        id: a.id,
        professionalId: a.professionalId,
        startTime: a.startTime,
        endTime: a.endTime,
        customerName: a.customer.name,
        serviceName: a.service.name,
        categoryName: a.service.category?.name || 'Geral',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colorCode: (a as any).colorCode || null
    })) as Array<{
        id: string
        customerName: string
        serviceName: string
        startTime: Date
        endTime: Date
        professionalId: string
        status: string
        categoryName: string
        colorCode: string | null
    }>

    const blockouts = blockoutsData.map((b: typeof blockoutsData[number]) => ({
        id: b.id,
        professionalId: b.professionalId,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason
    }))

    return { professionals: professionalsData, appointments, blockouts }
}

// ---------------------------------------------------------------------------
// ATUALIZAÇÃO — Mover Agendamento (Drag and Drop)
// ---------------------------------------------------------------------------

export async function moveAppointment(appointmentId: string, newProfessionalId: string, newStartTimeIso: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Sessão inválida' }

    const tenantDb = createTenantClient(session.tenantId)

    const existing = await tenantDb.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: true }
    })

    if (!existing) return { success: false, error: 'Agendamento não encontrado' }

    const startTime = new Date(newStartTimeIso)
    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + existing.service.durationMinutes)

    // Validar conflitos
    const conflicting = await tenantDb.appointment.findFirst({
        where: {
            professionalId: newProfessionalId,
            id: { not: appointmentId },
            status: 'SCHEDULED',
            OR: [
                { startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
        }
    })

    // Como concordamos no Socratic: Validar estrito para evitar overbooking
    if (conflicting) {
        return { success: false, error: 'Já existe um agendamento neste horário para este profissional.' }
    }

    try {
        await tenantDb.appointment.update({
            where: { id: appointmentId },
            data: {
                professionalId: newProfessionalId,
                startTime,
                endTime
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Move appointment error:", error)
        return { success: false, error: 'Erro ao mover agendamento.' }
    }
}

// ---------------------------------------------------------------------------
// CRIAÇÃO — Bloqueio Manual
// ---------------------------------------------------------------------------

export async function createBlockout(professionalId: string, startTimeIso: string, endTimeIso: string, reason: string) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Sessão inválida' }

    const tenantDb = createTenantClient(session.tenantId)
    const startTime = new Date(startTimeIso)
    const endTime = new Date(endTimeIso)

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tenantDb as any).blockout.create({
            data: {
                tenantId: session.tenantId,
                professionalId,
                startTime,
                endTime,
                reason
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Create blockout error:", error)
        return { success: false, error: 'Erro ao criar bloqueio.' }
    }
}
