'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Sao_Paulo' // Default timezone para cortes de caixa

export type DashboardMetricsDTO =
    | {
        role: 'ADMIN' | 'RECEPCAO'
        dailyRevenue: number
        monthlyRevenue: number
        pendingCommissionsTotal: number
        monthlyAppointmentsCount: number
        newCustomersCount: number
        topProfessionals: Array<{
            id: string
            name: string
            totalGenerated: number
            servicesCount: number
        }>
    }
    | {
        role: 'PROFISSIONAL'
        myGeneratedToday: number
        pendingCommissionsTotal: number
        paidCommissionsTotal: number
        myServicesToday: number
    }

export async function getDashboardMetrics(): Promise<DashboardMetricsDTO> {
    const session = await getSession()
    if (!session || !session.tenantId) throw new Error('Unauthorized')

    const db = createTenantClient(session.tenantId)
    const now = new Date()
    const zonedNow = toZonedTime(now, TIMEZONE)

    // Bounds do dia e mes baseados no Timezone do SP/Brasil
    const todayStart = startOfDay(zonedNow)
    const todayEnd = endOfDay(zonedNow)
    const monthStart = startOfMonth(zonedNow)
    const monthEnd = endOfMonth(zonedNow)

    try {
        // Se for PROFISSIONAL, redireciona para a Query de Painel Reduzido Individual
        if (session.role === 'PROFISSIONAL') {
            return getProfessionalMetrics(session.userId, session.tenantId, todayStart, todayEnd, monthStart, monthEnd)
        }

        // --- DASHBOARD ADMIN/GESTOR ---

        // 1. Faturamento Hoje (Sum de Transações INCOME concluídas no dia)
        const dailyRevenueResult = await db.transaction.aggregate({
            where: {
                type: 'INCOME',
                status: 'COMPLETED',
                createdAt: { gte: todayStart, lte: todayEnd }
            },
            _sum: { amount: true }
        })

        // 2. Faturamento Mês (Sum de Transações INCOME no Mês atual)
        const monthlyRevenueResult = await db.transaction.aggregate({
            where: {
                type: 'INCOME',
                status: 'COMPLETED',
                createdAt: { gte: monthStart, lte: monthEnd }
            },
            _sum: { amount: true }
        })

        // 3. Comissões Pendentes Totais (Passivo em aberto da Clínica para a equipe inteira)
        const pendingCommissionsResult = await db.commission.aggregate({
            where: { status: 'PENDING' },
            _sum: { amount: true }
        })

        // 4. Agendamentos Feitos Neste Mês (Para conversão)
        const monthlyAppointmentsCount = await db.appointment.count({
            where: {
                startTime: { gte: monthStart, lte: monthEnd }
            }
        })

        // 5. Quantidade de Clientes Cadastrados do Mês
        const newCustomersCount = await db.customer.count({
            where: {
                createdAt: { gte: monthStart, lte: monthEnd }
            }
        })

        // 6. Top Profissionais (Listagem da Equipe baseada no Faturamento que geraram)
        const topProfessionalsRaw = await db.tabItem.groupBy({
            by: ['professionalId'],
            where: {
                tab: { status: 'CLOSED' }, // Só conta serviço que virou dinheiro
                createdAt: { gte: monthStart, lte: monthEnd }
            },
            _sum: { price: true },
            _count: { _all: true },
            orderBy: { _sum: { price: 'desc' } },
            take: 5
        })

        // Puxa o nome cru dos profissionais pra mesclar na UI do ranking
        const profIds = topProfessionalsRaw.map(p => p.professionalId)
        const users = await db.user.findMany({
            where: { id: { in: profIds } },
            select: { id: true, name: true }
        })

        const topProfessionals = topProfessionalsRaw.map((agg) => {
            const user = users.find(u => u.id === agg.professionalId)
            return {
                id: agg.professionalId,
                name: user?.name || 'Desconhecido',
                totalGenerated: Number(agg._sum.price) || 0,
                servicesCount: agg._count._all
            }
        })

        return {
            role: session.role as 'ADMIN' | 'RECEPCAO',
            dailyRevenue: Number(dailyRevenueResult._sum.amount) || 0,
            monthlyRevenue: Number(monthlyRevenueResult._sum.amount) || 0,
            pendingCommissionsTotal: Number(pendingCommissionsResult._sum.amount) || 0,
            monthlyAppointmentsCount: monthlyAppointmentsCount,
            newCustomersCount: newCustomersCount,
            topProfessionals
        }

    } catch (e: unknown) {
        console.error("Dashboard Server Action error:", e)
        throw new Error("Failed to fetch dashboard metrics")
    }
}

// Sub-Query focada nas estatísticas protegidas pro PROFISSIONAL logado
async function getProfessionalMetrics(userId: string, tenantId: string, todayStart: Date, todayEnd: Date, monthStart: Date, monthEnd: Date) {
    const db = createTenantClient(tenantId)

    const myCommissionsMonth = await db.commission.groupBy({
        by: ['status'],
        where: {
            professionalId: userId,
            createdAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
    })

    const pendingCommissionsTotal = Number(myCommissionsMonth.find((c) => c.status === 'PENDING')?._sum.amount) || 0
    const paidCommissionsTotal = Number(myCommissionsMonth.find((c) => c.status === 'PAID')?._sum.amount) || 0

    const myServicesToday = await db.tabItem.count({
        where: {
            professionalId: userId,
            createdAt: { gte: todayStart, lte: todayEnd }
        }
    })

    const myGeneratedToday = await db.tabItem.aggregate({
        where: {
            professionalId: userId,
            createdAt: { gte: todayStart, lte: todayEnd }
        },
        _sum: { price: true }
    })

    return {
        role: 'PROFISSIONAL' as const,
        myGeneratedToday: Number(myGeneratedToday._sum.price) || 0,
        pendingCommissionsTotal,
        paidCommissionsTotal,
        myServicesToday
    }
}

// Sidebar/Bottom Action - Exibe apenas a fila de hoje
export async function getUpcomingAppointments() {
    const session = await getSession()
    if (!session || !session.tenantId) return []

    const db = createTenantClient(session.tenantId)
    const zonedNow = toZonedTime(new Date(), TIMEZONE)
    const todayEnd = endOfDay(zonedNow)

    try {
        const appointments = await db.appointment.findMany({
            where: {
                startTime: { gte: zonedNow, lte: todayEnd },
                status: 'SCHEDULED'
            },
            include: {
                customer: { select: { name: true, phone: true } },
                service: { select: { name: true, durationMinutes: true } },
                professional: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' },
            take: 5
        })

        return appointments
    } catch (e) {
        console.error('Failed to get Upcoming Appointments:', e)
        return []
    }
}
