'use server'

import { db } from '@/lib/db'


// ---------------------------------------------------------------------------
// 1. GET PUBLIC TENANT INFO
// ---------------------------------------------------------------------------

export async function getPublicTenantInfo(slug: string) {
    const settings = await db.tenantSettings.findUnique({
        where: { publicSlug: slug },
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                }
            }
        }
    })

    if (!settings || !settings.isPublicBookingEnabled) {
        return null
    }

    // Buscar as categorias e serviços ativos desse salão
    const categories = await db.serviceCategory.findMany({
        where: { tenantId: settings.tenantId },
        include: {
            services: {
                where: { isActive: true },
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    })

    // Remove categorias sem nenhum serviço e mapeia os serviços para garantir `price: number`
    const activeCategories = categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => c.services && c.services.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => ({
            id: c.id,
            name: c.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            services: c.services.map((s: any) => ({
                id: s.id,
                name: s.name,
                price: Number(s.price),
                durationMinutes: s.durationMinutes
            }))
        }))

    return {
        tenantId: settings.tenantId,
        tenantName: settings.tenant.name,
        logoUrl: settings.logoUrl,
        address: settings.address,
        phone: settings.phone,
        businessHours: settings.businessHours,
        bookingRules: settings.bookingRules,
        categories: activeCategories,
    }
}

// ---------------------------------------------------------------------------
// 2. GET PUBLIC AVAILABILITY
// ---------------------------------------------------------------------------

export async function getPublicAvailability({
    tenantId,
    serviceId,
    date,
}: {
    tenantId: string
    serviceId: string
    date: Date
}) {
    // 1. Validar e formatar data
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    // Mapeamento do dia da semana (0 = dom, 1 = seg...)
    const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
    const dayOfWeek = dayMap[targetDate.getDay()]

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // 2. Buscar serviço e tenant settings
    const [service, settings] = await Promise.all([
        db.service.findUnique({ where: { id: serviceId } }),
        db.tenantSettings.findUnique({ where: { tenantId } })
    ])

    if (!service) throw new Error("Serviço não encontrado.")
    if (!settings || !settings.businessHours) return [] // Salão não configurado

    const durationMinutes = service.durationMinutes

    // 3. Checar funcionamento do salão para o dia
    const businessHoursMap = settings.businessHours as Record<string, { enabled: boolean; open: string; close: string }>
    const bHours = businessHoursMap[dayOfWeek]
    if (!bHours || !bHours.enabled) return [] // Fechado hoje

    const [openH, openM] = bHours.open.split(':').map(Number)
    const [closeH, closeM] = bHours.close.split(':').map(Number)

    // 4. Buscar agendamentos existentes no dia no salão
    const existingAppointments = await db.appointment.findMany({
        where: {
            tenantId,
            startTime: { gte: targetDate, lte: endOfDay },
            status: { in: ['SCHEDULED'] }
        },
        select: {
            id: true,
            startTime: true,
            endTime: true,
            professionalId: true,
        }
    })

    // 5. Buscar os profissionais daquele Tenant (Comissão > 0 ou ativo)
    const professionals = await db.user.findMany({
        where: { tenantId, role: 'PROFISSIONAL', isActive: true },
        select: { id: true, workingHours: true }
    })

    if (professionals.length === 0) return []

    // 6. Gerar os slots possíveis de 30 em 30 min e cruzar disponibilidade
    const availableSlots: { time: string, professionals: string[] }[] = []

    let currentSlot = new Date(targetDate)
    currentSlot.setHours(openH, openM, 0, 0)

    const closingTime = new Date(targetDate)
    closingTime.setHours(closeH, closeM, 0, 0)

    // Impede agendamentos muito pegados ao longo do dia em tempo real (ex: pra hoje tem que ser 2 horas à frente)
    const minTimeForToday = new Date()
    minTimeForToday.setHours(minTimeForToday.getHours() + 2) // Antecedência de 2h

    while (currentSlot < closingTime) {
        // Ignorar se o slot for pra hoje muito em cima da hora
        if (targetDate.toDateString() === new Date().toDateString() && currentSlot < minTimeForToday) {
            currentSlot = new Date(currentSlot.getTime() + 30 * 60000)
            continue
        }

        const slotEnd = new Date(currentSlot)
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)

        // Se o serviço terminar depois do horário de fechamento, ignora a partir desse slot.
        if (slotEnd > closingTime) {
            break
        }

        // Descobrir quais profissionais estão livres neste bloco exato
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const availableProfs = professionals.filter((prof: any) => {
            // (Opcional) Poderia checar os workingHours individuais do profissional aqui

            // Check conflicts
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasConflict = existingAppointments.some((appt: any) => {
                if (appt.professionalId !== prof.id) return false

                // Conflito acontece se:
                // Inicio do agendamento cai dentro do nosso slot/serviço, OU
                // Fim do agendamento cai dentro do nosso slot/serviço, OU
                // O agendamento engloba totalmente o nosso slot/serviço
                const apptStart = new Date(appt.startTime)
                const apptEnd = new Date(appt.endTime)

                return (currentSlot < apptEnd && slotEnd > apptStart)
            })

            return !hasConflict
        })

        if (availableProfs.length > 0) {
            availableSlots.push({
                time: currentSlot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                professionals: availableProfs.map((p: any) => p.id)
            })
        }

        currentSlot.setMinutes(currentSlot.getMinutes() + 30)
    }

    return availableSlots
}

// ---------------------------------------------------------------------------
// 3. CREATE PUBLIC APPOINTMENT
// ---------------------------------------------------------------------------

export async function createPublicAppointment(data: {
    tenantId: string
    serviceId: string
    startTime: Date
    professionalId?: string
    customerName: string
    customerPhone: string
}) {
    // Lógica para achar/criar cliente unicamente pelo telefone
    let customer = await db.customer.findFirst({
        where: {
            tenantId: data.tenantId,
            phone: data.customerPhone
        }
    })

    if (!customer) {
        customer = await db.customer.create({
            data: {
                tenantId: data.tenantId,
                name: data.customerName,
                phone: data.customerPhone,
            }
        })
    }

    // Calcular endTime
    const service = await db.service.findUnique({
        where: { id: data.serviceId }
    })
    if (!service) throw new Error("Serviço inválido")

    const endTime = new Date(data.startTime)
    endTime.setMinutes(endTime.getMinutes() + service.durationMinutes)

    // Achar um professional aleatório se não tiver sido especificado
    let profId = data.professionalId
    if (!profId) {
        const prof = await db.user.findFirst({
            where: { tenantId: data.tenantId, role: 'PROFISSIONAL' }
        })
        if (!prof) throw new Error("Nenhum profissional cadastrado.")
        profId = prof.id
    }

    // Criar via admin/master client
    const appt = await db.appointment.create({
        data: {
            tenantId: data.tenantId,
            customerId: customer.id,
            serviceId: data.serviceId,
            professionalId: profId,
            startTime: data.startTime,
            endTime,
            status: 'SCHEDULED'
        }
    })

    return { success: true, appointmentId: appt.id }
}
