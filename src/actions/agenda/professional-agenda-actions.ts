'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateAppointmentInput = {
    customerId: string
    serviceId: string
    startTime: string // ISO string
    endTime: string
}

type UpdateAppointmentInput = {
    appointmentId: string
    startTime: string
    endTime: string
}

// ---------------------------------------------------------------------------
// LEITURA — Agenda do profissional logado
// ---------------------------------------------------------------------------

export async function getProfessionalAgenda(date: string) {
    const session = await getSession()
    if (!session) return []

    // Calcula o range do dia
    const targetDate = new Date(date)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const tenantDb = createTenantClient(session.tenantId)

    // RLS: filtra apenas pelo profissional logado (session.userId)
    const appointments = await tenantDb.appointment.findMany({
        where: {
            professionalId: session.userId,
            startTime: { gte: dayStart, lte: dayEnd },
        },
        include: {
            customer: { select: { id: true, name: true, phone: true } },
            service: { select: { id: true, name: true, durationMinutes: true, price: true } },
        },
        orderBy: { startTime: 'asc' }
    })

    return appointments as unknown as Array<{
        id: string
        startTime: Date
        endTime: Date
        status: string
        customer: { id: string; name: string; phone: string | null }
        service: { id: string; name: string; durationMinutes: number; price: number | string }
    }>
}

// ---------------------------------------------------------------------------
// CRIAÇÃO — Profissional cria um agendamento na própria agenda
// ---------------------------------------------------------------------------

export async function createProfessionalAppointment(input: CreateAppointmentInput) {
    const session = await getSession()
    if (!session) return { error: 'Sessão inválida.' }

    const tenantDb = createTenantClient(session.tenantId)

    const startTime = new Date(input.startTime)
    const endTime = new Date(input.endTime)

    // Validar conflitos de horário exclusivamente para o profissional logado
    const conflicting = await tenantDb.appointment.findFirst({
        where: {
            professionalId: session.userId,
            status: 'SCHEDULED',
            OR: [
                { startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
        }
    })

    if (conflicting) {
        return { error: 'Conflito de horário: já existe um agendamento nesse intervalo.' }
    }

    const appointment = await tenantDb.appointment.create({
        data: {
            tenantId: session.tenantId,
            customerId: input.customerId,
            professionalId: session.userId,
            serviceId: input.serviceId,
            startTime,
            endTime,
            status: 'SCHEDULED',
        }
    })

    return { success: true, appointmentId: appointment.id }
}

// ---------------------------------------------------------------------------
// ATUALIZAÇÃO — Remarcar um agendamento (próprio apenas)
// ---------------------------------------------------------------------------

export async function updateProfessionalAppointment(input: UpdateAppointmentInput) {
    const session = await getSession()
    if (!session) return { error: 'Sessão inválida.' }

    const tenantDb = createTenantClient(session.tenantId)

    // Validar ownership: somente seus agendamentos
    const existing = await tenantDb.appointment.findUnique({
        where: { id: input.appointmentId }
    })

    if (!existing || existing.professionalId !== session.userId) {
        return { error: 'Agendamento não encontrado ou sem permissão.' }
    }

    if (existing.status !== 'SCHEDULED') {
        return { error: 'Apenas agendamentos ativos podem ser remarcados.' }
    }

    const startTime = new Date(input.startTime)
    const endTime = new Date(input.endTime)

    // Verificar conflito com outros agendamentos no novo horário
    const conflicting = await tenantDb.appointment.findFirst({
        where: {
            professionalId: session.userId,
            id: { not: input.appointmentId },
            status: 'SCHEDULED',
            OR: [
                { startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
        }
    })

    if (conflicting) {
        return { error: 'Conflito de horário no novo intervalo.' }
    }

    await tenantDb.appointment.update({
        where: { id: input.appointmentId },
        data: { startTime, endTime }
    })

    return { success: true }
}

// ---------------------------------------------------------------------------
// CANCELAMENTO — Cancelar um agendamento (próprio apenas)
// ---------------------------------------------------------------------------

export async function cancelProfessionalAppointment(appointmentId: string) {
    const session = await getSession()
    if (!session) return { error: 'Sessão inválida.' }

    const tenantDb = createTenantClient(session.tenantId)

    const existing = await tenantDb.appointment.findUnique({
        where: { id: appointmentId }
    })

    if (!existing || existing.professionalId !== session.userId) {
        return { error: 'Agendamento não encontrado ou sem permissão.' }
    }

    if (existing.status !== 'SCHEDULED') {
        return { error: 'Este agendamento não pode ser cancelado.' }
    }

    await tenantDb.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELED' }
    })

    return { success: true }
}
