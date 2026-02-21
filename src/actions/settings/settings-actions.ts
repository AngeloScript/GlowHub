'use server'

import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DayHours = {
    open: string
    close: string
    enabled: boolean
}

export type BusinessHoursMap = {
    [key: string]: DayHours
}

type SettingsRow = {
    id: string
    tenantId: string
    businessHours: BusinessHoursMap | null
    address: string | null
    phone: string | null
    logoUrl: string | null
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function getTenantSettings(): Promise<SettingsRow | null> {
    const session = await getSession()
    if (!session) return null

    let settings = await db.tenantSettings.findUnique({
        where: { tenantId: session.tenantId },
    })

    // Auto-create if not exists
    if (!settings) {
        const defaultHours: BusinessHoursMap = {
            seg: { open: '09:00', close: '19:00', enabled: true },
            ter: { open: '09:00', close: '19:00', enabled: true },
            qua: { open: '09:00', close: '19:00', enabled: true },
            qui: { open: '09:00', close: '19:00', enabled: true },
            sex: { open: '09:00', close: '19:00', enabled: true },
            sab: { open: '09:00', close: '14:00', enabled: true },
            dom: { open: '00:00', close: '00:00', enabled: false },
        }

        settings = await db.tenantSettings.create({
            data: {
                tenantId: session.tenantId,
                businessHours: defaultHours,
            },
        })
    }

    return settings as unknown as SettingsRow
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function updateTenantSettings(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Sem permissão.' }
    }

    const address = (formData.get('address') as string) || null
    const phone = (formData.get('phone') as string) || null
    const businessHoursRaw = formData.get('businessHours') as string

    const data: Record<string, unknown> = { address, phone }

    if (businessHoursRaw) {
        try {
            data.businessHours = JSON.parse(businessHoursRaw)
        } catch {
            return { error: 'Formato de horários inválido.' }
        }
    }

    await db.tenantSettings.upsert({
        where: { tenantId: session.tenantId },
        create: { tenantId: session.tenantId, ...data },
        update: data,
    })

    revalidatePath('/app/configuracoes')
    return { success: true }
}
