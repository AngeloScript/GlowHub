'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PackageItemInput = {
    serviceId: string
    quantity: number
}

type CreatePackageInput = {
    name: string
    description?: string
    price: number
    validityDays: number
    items: PackageItemInput[]
}

// ---------------------------------------------------------------------------
// CRUD — Catálogo de Pacotes (Admin)
// ---------------------------------------------------------------------------

export async function getPackages() {
    const session = await getSession()
    if (!session) return []

    const tenantDb = createTenantClient(session.tenantId)

    return (await tenantDb.servicePackage.findMany({
        where: { isActive: true },
        include: {
            items: {
                include: { service: { select: { name: true, price: true, durationMinutes: true } } }
            },
            _count: { select: { sales: true } }
        },
        orderBy: { createdAt: 'desc' }
    })) as unknown as Array<{
        id: string
        name: string
        description: string | null
        price: number | string
        validityDays: number
        isActive: boolean
        items: Array<{
            id: string
            serviceId: string
            quantity: number
            service: { name: string; price: number | string; durationMinutes: number }
        }>
        _count: { sales: number }
        createdAt: Date
    }>
}

export async function createPackage(input: CreatePackageInput) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Acesso restrito ao Administrador.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    const pkg = await tenantDb.servicePackage.create({
        data: {
            tenantId: session.tenantId,
            name: input.name,
            description: input.description,
            price: input.price,
            validityDays: input.validityDays,
            items: {
                create: input.items.map(item => ({
                    tenantId: session.tenantId,
                    serviceId: item.serviceId,
                    quantity: item.quantity,
                }))
            }
        }
    })

    return { success: true, packageId: pkg.id }
}

export async function togglePackageActive(packageId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Acesso negado.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    const pkg = await tenantDb.servicePackage.findUnique({ where: { id: packageId } })
    if (!pkg) return { error: 'Pacote não encontrado.' }

    await tenantDb.servicePackage.update({
        where: { id: packageId },
        data: { isActive: !pkg.isActive }
    })

    return { success: true }
}

// ---------------------------------------------------------------------------
// VENDA — Vender pacote para um cliente
// ---------------------------------------------------------------------------

export async function sellPackage(customerId: string, packageId: string) {
    const session = await getSession()
    if (!session) return { error: 'Sessão inválida.' }

    const tenantDb = createTenantClient(session.tenantId)

    const pkg = await tenantDb.servicePackage.findUnique({ where: { id: packageId } })
    if (!pkg || !pkg.isActive) return { error: 'Pacote não encontrado ou inativo.' }

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + pkg.validityDays)

    // 1. Cria a instância do pacote para o cliente
    const customerPackage = await tenantDb.customerPackage.create({
        data: {
            tenantId: session.tenantId,
            customerId,
            packageId,
            expirationDate,
            status: 'ACTIVE',
        }
    })

    // 2. Registra a transação financeira de entrada (INCOME)
    await tenantDb.transaction.create({
        data: {
            tenantId: session.tenantId,
            type: 'INCOME',
            amount: pkg.price,
            status: 'COMPLETED',
            paymentMethod: 'PIX', // Padrão, pode ser ajustado na UI
        }
    })

    return { success: true, customerPackageId: customerPackage.id }
}

// ---------------------------------------------------------------------------
// CONSUMO — Deduzir 1 sessão do pacote
// ---------------------------------------------------------------------------

export async function consumePackageSession(
    customerPackageId: string,
    serviceId: string,
    tabId: string,
    professionalId: string,
    commissionRate: number
) {
    const session = await getSession()
    if (!session) return { error: 'Sessão inválida.' }

    const tenantDb = createTenantClient(session.tenantId)

    // 1. Buscar o pacote do cliente com itens e usos
    const cp = await tenantDb.customerPackage.findUnique({
        where: { id: customerPackageId },
        include: {
            package: {
                include: { items: true }
            },
            usages: true,
        }
    }) as unknown as {
        id: string
        status: string
        expirationDate: Date
        package: {
            price: number | string
            items: Array<{ serviceId: string; quantity: number }>
        }
        usages: Array<{ serviceId: string }>
    } | null

    if (!cp) return { error: 'Pacote não encontrado.' }
    if (cp.status !== 'ACTIVE') return { error: 'Este pacote não está ativo.' }
    if (new Date() > new Date(cp.expirationDate)) return { error: 'Este pacote expirou.' }

    // 2. Verificar se o serviço está incluso e se ainda tem sessões
    const packageItem = cp.package.items.find(i => i.serviceId === serviceId)
    if (!packageItem) return { error: 'Este serviço não faz parte do pacote.' }

    const usedCount = cp.usages.filter(u => u.serviceId === serviceId).length
    const remaining = packageItem.quantity - usedCount
    if (remaining <= 0) return { error: 'Todas as sessões deste serviço já foram utilizadas.' }

    // 3. Registrar o uso
    await tenantDb.customerPackageUsage.create({
        data: {
            tenantId: session.tenantId,
            customerPackageId,
            serviceId,
            tabId,
        }
    })

    // 4. Calcular comissão rateada (valor do pacote / total de sessões * taxa)
    const totalSessions = cp.package.items.reduce((sum, i) => sum + i.quantity, 0)
    const sessionValue = Number(cp.package.price) / totalSessions
    const commissionAmount = sessionValue * (commissionRate / 100)

    // 5. Verificar se TODAS as sessões foram consumidas
    const totalUsed = cp.usages.length + 1
    if (totalUsed >= totalSessions) {
        await tenantDb.customerPackage.update({
            where: { id: customerPackageId },
            data: { status: 'CONSUMED' }
        })
    }

    return {
        success: true,
        sessionValue: Math.round(sessionValue * 100) / 100,
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        remaining: remaining - 1,
    }
}

// ---------------------------------------------------------------------------
// EXTENSÃO — Admin override para estender validade
// ---------------------------------------------------------------------------

export async function extendPackage(customerPackageId: string, extraDays: number) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Apenas o Administrador pode estender pacotes.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    const cp = await tenantDb.customerPackage.findUnique({ where: { id: customerPackageId } })
    if (!cp) return { error: 'Pacote não encontrado.' }

    const currentExpiration = new Date(cp.expirationDate)
    const baseDate = currentExpiration > new Date() ? currentExpiration : new Date()
    baseDate.setDate(baseDate.getDate() + extraDays)

    await tenantDb.customerPackage.update({
        where: { id: customerPackageId },
        data: {
            expirationDate: baseDate,
            status: 'ACTIVE',
        }
    })

    return { success: true, newExpiration: baseDate }
}

// ---------------------------------------------------------------------------
// CONSULTA — Pacotes ativos de um cliente (com sessões restantes)
// ---------------------------------------------------------------------------

export async function getCustomerPackages(customerId: string) {
    const session = await getSession()
    if (!session) return []

    const tenantDb = createTenantClient(session.tenantId)

    const packages = await tenantDb.customerPackage.findMany({
        where: {
            customerId,
            status: 'ACTIVE',
        },
        include: {
            package: {
                include: {
                    items: {
                        include: { service: { select: { name: true } } }
                    }
                }
            },
            usages: { select: { serviceId: true } },
        },
        orderBy: { expirationDate: 'asc' }
    }) as unknown as Array<{
        id: string
        expirationDate: Date
        purchaseDate: Date
        status: string
        package: {
            name: string
            price: number | string
            items: Array<{
                serviceId: string
                quantity: number
                service: { name: string }
            }>
        }
        usages: Array<{ serviceId: string }>
    }>

    return packages.map(cp => {
        const itemsWithRemaining = cp.package.items.map(item => {
            const used = cp.usages.filter(u => u.serviceId === item.serviceId).length
            return {
                serviceName: item.service.name,
                total: item.quantity,
                used,
                remaining: item.quantity - used,
            }
        })

        const totalSessions = cp.package.items.reduce((s, i) => s + i.quantity, 0)
        const totalUsed = cp.usages.length

        return {
            id: cp.id,
            packageName: cp.package.name,
            price: cp.package.price,
            purchaseDate: cp.purchaseDate,
            expirationDate: cp.expirationDate,
            totalSessions,
            totalUsed,
            totalRemaining: totalSessions - totalUsed,
            items: itemsWithRemaining,
        }
    })
}
