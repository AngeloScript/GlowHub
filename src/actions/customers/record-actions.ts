'use server'

import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecordRow = {
    id: string
    tenantId: string
    customerId: string
    allergies: string | null
    technicalNotes: string | null
    skinType: string | null
    hairType: string | null
    lastUpdate: Date
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function getCustomerRecord(customerId: string): Promise<RecordRow | null> {
    const session = await getSession()
    if (!session) return null

    const record = await db.customerRecord.findUnique({
        where: { customerId },
    })

    return record
}

// ---------------------------------------------------------------------------
// UPSERT (Create / Update)
// ---------------------------------------------------------------------------

export async function updateCustomerRecord(customerId: string, formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Sem permissão.' }

    const allergies = (formData.get('allergies') as string) || null
    const technicalNotes = (formData.get('technicalNotes') as string) || null
    const skinType = (formData.get('skinType') as string) || null
    const hairType = (formData.get('hairType') as string) || null

    await db.customerRecord.upsert({
        where: { customerId },
        create: {
            tenantId: session.tenantId,
            customerId,
            allergies,
            technicalNotes,
            skinType,
            hairType,
            lastUpdate: new Date(),
        },
        update: {
            allergies,
            technicalNotes,
            skinType,
            hairType,
            lastUpdate: new Date(),
        },
    })

    revalidatePath(`/app/clientes/${customerId}`)
    return { success: true }
}
