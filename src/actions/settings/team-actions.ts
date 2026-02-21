'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TeamMember = {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
    isActive: boolean
    commissionRate: number | string | null
    workingHours: Record<string, unknown> | null
    createdAt: Date
}

// ---------------------------------------------------------------------------
// LIST
// ---------------------------------------------------------------------------

export async function getTeam(): Promise<TeamMember[]> {
    const session = await getSession()
    if (!session) return []

    const tenantDb = createTenantClient(session.tenantId)

    const team = (await tenantDb.user.findMany({
        where: { tenantId: session.tenantId },
        orderBy: { name: 'asc' },
    })) as unknown as TeamMember[]

    return team
}

// ---------------------------------------------------------------------------
// INVITE PROFESSIONAL
// ---------------------------------------------------------------------------

export async function inviteProfessional(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = (formData.get('phone') as string) || null
    const commissionRate = parseFloat(formData.get('commissionRate') as string)

    if (!name || !email) {
        return { error: 'Nome e e-mail são obrigatórios.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    // Hash temporário — num fluxo real seria um link de convite
    const tempHash = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`

    await tenantDb.user.create({
        data: {
            tenantId: session.tenantId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone,
            passwordHash: tempHash,
            role: 'PROFISSIONAL',
            commissionRate: isNaN(commissionRate) ? null : commissionRate,
        },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}

// ---------------------------------------------------------------------------
// UPDATE PROFESSIONAL
// ---------------------------------------------------------------------------

export async function updateProfessional(userId: string, formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const name = formData.get('name') as string
    const phone = (formData.get('phone') as string) || null
    const commissionRate = parseFloat(formData.get('commissionRate') as string)

    const tenantDb = createTenantClient(session.tenantId)

    if (!name) return { error: 'Nome é obrigatório.' }

    await tenantDb.user.update({
        where: { id: userId },
        data: {
            name: name.trim(),
            phone,
            commissionRate: isNaN(commissionRate) ? null : commissionRate,
        },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}

// ---------------------------------------------------------------------------
// TOGGLE ACTIVE
// ---------------------------------------------------------------------------

export async function toggleProfessionalStatus(userId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Sem permissão.' }

    const tenantDb = createTenantClient(session.tenantId)

    const user = await tenantDb.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'Profissional não encontrado.' }

    await tenantDb.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}
