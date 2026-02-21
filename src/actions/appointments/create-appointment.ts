'use server'

import { createTenantClient } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function createAppointment(formData: FormData) {
    try {
        const session = await getSession()
        if (!session || !session.tenantId) {
            return { error: 'Não autenticado ou sessão inválida.' }
        }

        // Usando o client do tenant (com RLS injetado)
        const tenantDb = createTenantClient(session.tenantId)

        const customerId = formData.get('customerId') as string
        const professionalId = formData.get('professionalId') as string
        const serviceId = formData.get('serviceId') as string
        const startTimeStr = formData.get('startTime') as string // Formato esperado "YYYY-MM-DDTHH:mm:ss.sssZ"

        if (!customerId || !professionalId || !serviceId || !startTimeStr) {
            return { error: 'Preencha todos os campos do agendamento.' }
        }

        const startTime = new Date(startTimeStr)

        // Busca duração do serviço
        const service = await tenantDb.service.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return { error: 'Serviço não encontrado.' }
        }

        // Calcula endTime com precisão
        const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000)

        // ==============================================================
        // VALIDAÇÃO RIGOROSA ANTI-OVERBOOKING
        // Verifica se o profissional já tem agendamento que conflita neste horário
        // Regra: (Novo Início < Existente Fim) E (Novo Fim > Existente Início)
        // ==============================================================
        const conflictingAppointment = await tenantDb.appointment.findFirst({
            where: {
                professionalId,
                status: {
                    not: 'CANCELED'
                },
                AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gt: startTime } }
                ]
            }
        })

        if (conflictingAppointment) {
            return {
                error: 'Conflito de horário! O profissional já possui um atendimento neste período.'
            }
        }

        // Cria o Agendamento (Isolado no RLS pelo tenantDb)
        const appointment = await tenantDb.appointment.create({
            data: {
                tenantId: session.tenantId,
                customerId,
                professionalId,
                serviceId,
                startTime,
                endTime,
                status: 'SCHEDULED'
            }
        })

        return { success: true, appointment }

    } catch (error) {
        console.error('Erro ao criar agendamento:', error)
        return { error: 'Ocorreu um erro interno. Tente novamente mais tarde.' }
    }
}
