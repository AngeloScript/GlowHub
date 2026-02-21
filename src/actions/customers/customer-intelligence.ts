'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabHistoryItem = {
    id: string
    totalAmount: number
    status: string
    createdAt: Date
    items: Array<{
        id: string
        price: number
        service: { name: string } | undefined
        professional: { name: string }
    }>
}

type InactiveCustomer = {
    id: string
    name: string
    phone: string | null
    email: string | null
    lastVisitDate: Date | null
    daysSinceLastVisit: number
    totalSpent: number
}

type TopCustomer = {
    id: string
    name: string
    phone: string | null
    totalSpent: number
    tabsCount: number
}

// ---------------------------------------------------------------------------
// CUSTOMER HISTORY — últimas comandas + serviços favoritos
// ---------------------------------------------------------------------------

export async function getCustomerHistory(customerId: string) {
    const session = await getSession()
    if (!session) return null

    const tenantDb = createTenantClient(session.tenantId)

    type RawTab = {
        id: string
        status: string
        createdAt: Date
        totalAmount: number | string
        items: Array<{
            id: string
            price: number | string
            service: { name: string } | null
            professional: { name: string }
        }>
    }

    const rawTabs = (await tenantDb.tab.findMany({
        where: {
            customerId,
            status: 'CLOSED',
        },
        include: {
            items: {
                include: {
                    service: { select: { name: true } },
                    professional: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    })) as unknown as RawTab[]

    const tabs: TabHistoryItem[] = rawTabs.map((t) => ({
        id: t.id,
        status: t.status,
        createdAt: t.createdAt,
        totalAmount: Number(t.totalAmount) || 0,
        items: t.items.map((i) => ({
            id: i.id,
            price: Number(i.price) || 0,
            service: i.service ? { name: i.service.name } : undefined,
            professional: { name: i.professional.name }
        }))
    }))

    // Calcula serviço mais frequente
    const serviceCount: Record<string, { name: string; count: number }> = {}
    for (const tab of tabs) {
        for (const item of tab.items) {
            const svcName = item.service?.name || 'Serviço Removido'
            if (!serviceCount[svcName]) {
                serviceCount[svcName] = { name: svcName, count: 0 }
            }
            serviceCount[svcName].count += 1
        }
    }

    const favoriteServices = Object.values(serviceCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    const totalSpent = tabs.reduce(
        (sum, tab) => sum + Number(tab.totalAmount),
        0
    )

    const lastVisit = tabs.length > 0 ? tabs[0].createdAt : null

    return {
        tabs,
        favoriteServices,
        totalSpent,
        lastVisit,
    }
}

// ---------------------------------------------------------------------------
// INACTIVE CUSTOMERS — clientes sem atividade nos últimos X dias
// ---------------------------------------------------------------------------

export async function getInactiveCustomers(
    daysAgo = 60
): Promise<InactiveCustomer[]> {
    const session = await getSession()
    if (!session) return []

    const tenantDb = createTenantClient(session.tenantId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    // 1. Busca todos os clientes que já tiveram ao menos 1 Tab fechada
    type CustomerWithTabs = {
        id: string
        name: string
        phone: string | null
        email: string | null
        tabs: Array<{ createdAt: Date; totalAmount: number | string; status: string }>
        appointments: Array<{ startTime: Date; status: string }>
    }

    const allCustomers = (await tenantDb.customer.findMany({
        include: {
            tabs: {
                where: { status: 'CLOSED' },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true, totalAmount: true, status: true },
            },
            appointments: {
                where: {
                    status: 'SCHEDULED',
                    startTime: { gte: new Date() },
                },
                select: { startTime: true, status: true },
            },
        },
    })) as unknown as CustomerWithTabs[]

    // 2. Filtra: última Tab fechada ANTES da cutoff E sem appointments futuros
    const inactives: InactiveCustomer[] = []
    const now = new Date()

    for (const customer of allCustomers) {
        if (customer.tabs.length === 0) continue
        if (customer.appointments.length > 0) continue

        const lastTab = customer.tabs[0]
        if (lastTab.createdAt > cutoffDate) continue

        const diffMs = now.getTime() - lastTab.createdAt.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        const totalSpent = customer.tabs.reduce(
            (s, t) => s + Number(t.totalAmount),
            0
        )

        inactives.push({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            lastVisitDate: lastTab.createdAt,
            daysSinceLastVisit: diffDays,
            totalSpent,
        })
    }

    // Ordena por quanto mais antigo (mais urgente)
    inactives.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit)

    return inactives
}

// ---------------------------------------------------------------------------
// TOP CUSTOMERS — ranking por LTV (Lifetime Value)
// ---------------------------------------------------------------------------

export async function getTopCustomers(limit = 10): Promise<TopCustomer[]> {
    const session = await getSession()
    if (!session) return []

    const tenantDb = createTenantClient(session.tenantId)

    type CustomerWithClosedTabs = {
        id: string
        name: string
        phone: string | null
        tabs: Array<{ totalAmount: number | string }>
    }

    const customers = (await tenantDb.customer.findMany({
        include: {
            tabs: {
                where: { status: 'CLOSED' },
                select: { totalAmount: true },
            },
        },
    })) as unknown as CustomerWithClosedTabs[]

    const ranked: TopCustomer[] = customers
        .filter((c) => c.tabs.length > 0)
        .map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            totalSpent: c.tabs.reduce(
                (sum, t) => sum + Number(t.totalAmount),
                0
            ),
            tabsCount: c.tabs.length,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit)

    return ranked
}
