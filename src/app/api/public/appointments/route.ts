import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { createPublicAppointment } from '@/actions/public/booking-actions'

export async function POST(req: NextRequest) {
    const authError = validateApiKey(req)
    if (authError) return authError

    let body: Record<string, unknown>

    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        )
    }

    const { tenantId, serviceId, startTime, professionalId, customerName, customerPhone } = body as {
        tenantId?: string
        serviceId?: string
        startTime?: string
        professionalId?: string
        customerName?: string
        customerPhone?: string
    }

    if (!tenantId || !serviceId || !startTime || !customerName || !customerPhone) {
        return NextResponse.json(
            { error: 'tenantId, serviceId, startTime, customerName, and customerPhone are required' },
            { status: 400 }
        )
    }

    const parsedStartTime = new Date(startTime)

    if (isNaN(parsedStartTime.getTime())) {
        return NextResponse.json(
            { error: 'Invalid startTime format. Use ISO 8601 (e.g. 2026-02-22T10:00:00)' },
            { status: 400 }
        )
    }

    try {
        const result = await createPublicAppointment({
            tenantId,
            serviceId,
            startTime: parsedStartTime,
            professionalId,
            customerName,
            customerPhone,
        })

        return NextResponse.json({ success: true, data: result }, { status: 201 })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json({ error: message }, { status: 422 })
    }
}
