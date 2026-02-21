import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'

// GET /api/public/appointments/[id] — buscar status do agendamento
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = validateApiKey(req)
    if (authError) return authError

    const { id } = await params

    if (!id) {
        return NextResponse.json({ error: 'Appointment id is required' }, { status: 400 })
    }

    const appointment = await db.appointment.findUnique({
        where: { id },
        select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            createdAt: true,
            service: {
                select: { id: true, name: true, durationMinutes: true, price: true }
            },
            professional: {
                select: { id: true, name: true }
            },
            customer: {
                select: { id: true, name: true, phone: true }
            },
        },
    })

    if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({
        success: true,
        data: {
            ...appointment,
            service: {
                ...appointment.service,
                price: Number(appointment.service.price),
            },
        },
    })
}

// PATCH /api/public/appointments/[id] — cancelar agendamento
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = validateApiKey(req)
    if (authError) return authError

    const { id } = await params

    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { status } = body as { status?: string }

    if (!status || !['CANCELED'].includes(status)) {
        return NextResponse.json(
            { error: 'Only status "CANCELED" is allowed via public API' },
            { status: 400 }
        )
    }

    const existing = await db.appointment.findUnique({ where: { id } })

    if (!existing) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (existing.status !== 'SCHEDULED') {
        return NextResponse.json(
            { error: `Cannot cancel appointment with status "${existing.status}"` },
            { status: 422 }
        )
    }

    const updated = await db.appointment.update({
        where: { id },
        data: { status: 'CANCELED' },
        select: { id: true, status: true },
    })

    return NextResponse.json({ success: true, data: updated })
}
