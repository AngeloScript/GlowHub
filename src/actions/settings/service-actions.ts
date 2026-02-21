'use server'

import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceRow = {
    id: string
    name: string
    price: number | string
    durationMinutes: number
    isActive: boolean
    categoryId: string | null
    category: { id: string; name: string } | null
}

type CategoryRow = {
    id: string
    name: string
    _count: { services: number }
}

// ---------------------------------------------------------------------------
// SERVICES — List
// ---------------------------------------------------------------------------

export async function getServices(tenantId?: string): Promise<ServiceRow[]> {
    const session = await getSession()
    if (!session) return []

    const tid = tenantId || session.tenantId

    const services = (await db.service.findMany({
        where: { tenantId: tid },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
    })) as unknown as ServiceRow[]

    return services
}

// ---------------------------------------------------------------------------
// SERVICES — Create
// ---------------------------------------------------------------------------

export async function createService(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)
    const durationMinutes = parseInt(formData.get('durationMinutes') as string)
    const categoryId = (formData.get('categoryId') as string) || null

    if (!name || isNaN(price) || isNaN(durationMinutes)) {
        return { error: 'Campos obrigatórios: nome, preço e duração.' }
    }

    await db.service.create({
        data: {
            tenantId: session.tenantId,
            name: name.trim(),
            price,
            durationMinutes,
            categoryId,
        },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}

// ---------------------------------------------------------------------------
// SERVICES — Update
// ---------------------------------------------------------------------------

export async function updateService(serviceId: string, formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)
    const durationMinutes = parseInt(formData.get('durationMinutes') as string)
    const categoryId = (formData.get('categoryId') as string) || null

    if (!name || isNaN(price) || isNaN(durationMinutes)) {
        return { error: 'Campos obrigatórios: nome, preço e duração.' }
    }

    await db.service.update({
        where: { id: serviceId },
        data: { name: name.trim(), price, durationMinutes, categoryId },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}

// ---------------------------------------------------------------------------
// SERVICES — Toggle Active (Soft Delete)
// ---------------------------------------------------------------------------

export async function toggleServiceStatus(serviceId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const service = await db.service.findUnique({ where: { id: serviceId } })
    if (!service) return { error: 'Serviço não encontrado.' }

    await db.service.update({
        where: { id: serviceId },
        data: { isActive: !(service as Record<string, unknown>).isActive },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}

// ---------------------------------------------------------------------------
// CATEGORIES — List
// ---------------------------------------------------------------------------

export async function getCategories(tenantId?: string): Promise<CategoryRow[]> {
    const session = await getSession()
    if (!session) return []

    const tid = tenantId || session.tenantId

    const categories = (await db.serviceCategory.findMany({
        where: { tenantId: tid },
        include: { _count: { select: { services: true } } },
        orderBy: { name: 'asc' },
    })) as unknown as CategoryRow[]

    return categories
}

// ---------------------------------------------------------------------------
// CATEGORIES — Create
// ---------------------------------------------------------------------------

export async function createCategory(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const name = formData.get('name') as string
    if (!name || name.trim().length < 2) {
        return { error: 'Nome da categoria é obrigatório.' }
    }

    await db.serviceCategory.create({
        data: { tenantId: session.tenantId, name: name.trim() },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}
