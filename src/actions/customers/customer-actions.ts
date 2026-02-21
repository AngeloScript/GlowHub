'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CustomerRow = {
    id: string
    name: string
    phone: string | null
    email: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    _count?: { tabs: number; appointments: number }
}

// ---------------------------------------------------------------------------
// LIST — busca com filtro por nome/telefone
// ---------------------------------------------------------------------------

export async function getCustomers(search?: string): Promise<CustomerRow[]> {
    const session = await getSession()
    if (!session) return []

    const tenantDb = createTenantClient(session.tenantId)

    const where: { OR?: Array<Record<string, unknown>> } = {}

    if (search && search.trim().length > 0) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
        ]
    }

    const customers: CustomerRow[] = await tenantDb.customer.findMany({
        where,
        include: {
            _count: { select: { tabs: true, appointments: true } },
        },
        orderBy: { name: 'asc' },
        take: 200,
    })

    return customers
}

// ---------------------------------------------------------------------------
// GET BY ID
// ---------------------------------------------------------------------------

export async function getCustomerById(customerId: string) {
    const session = await getSession()
    if (!session) return null

    const tenantDb = createTenantClient(session.tenantId)

    type CustomerDetail = {
        id: string
        name: string
        phone: string | null
        email: string | null
        notes: string | null
        createdAt: Date
        updatedAt: Date
        _count: { tabs: number; appointments: number }
    }

    const customer: CustomerDetail | null = await tenantDb.customer.findUnique({
        where: { id: customerId },
        include: {
            _count: { select: { tabs: true, appointments: true } },
        },
    })

    return customer
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function createCustomer(formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Não autenticado.' }

    const name = formData.get('name') as string
    const phone = (formData.get('phone') as string) || null
    const email = (formData.get('email') as string) || null
    const notes = (formData.get('notes') as string) || null

    if (!name || name.trim().length < 2) {
        return { error: 'Nome é obrigatório (mínimo 2 caracteres).' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    const customer = await tenantDb.customer.create({
        data: {
            tenantId: session.tenantId,
            name: name.trim(),
            phone,
            email,
            notes,
        },
    })

    revalidatePath('/app/clientes')
    return { success: true, customerId: customer.id }
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function updateCustomer(customerId: string, formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Não autenticado.' }

    const name = formData.get('name') as string
    const phone = (formData.get('phone') as string) || null
    const email = (formData.get('email') as string) || null
    const notes = (formData.get('notes') as string) || null

    if (!name || name.trim().length < 2) {
        return { error: 'Nome é obrigatório (mínimo 2 caracteres).' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    await tenantDb.customer.update({
        where: { id: customerId },
        data: { name: name.trim(), phone, email, notes },
    })

    revalidatePath('/app/clientes')
    revalidatePath(`/app/clientes/${customerId}`)
    return { success: true }
}
