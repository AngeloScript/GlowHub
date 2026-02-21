import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'

// GET /api/public/customers/lookup?tenantId=X&phone=Y — buscar histórico do cliente
export async function GET(req: NextRequest) {
    const authError = validateApiKey(req)
    if (authError) return authError

    const tenantId = req.nextUrl.searchParams.get('tenantId')
    const phone = req.nextUrl.searchParams.get('phone')

    if (!tenantId || !phone) {
        return NextResponse.json(
            { error: 'tenantId and phone are required' },
            { status: 400 }
        )
    }

    const customer = await db.customer.findFirst({
        where: { tenantId, phone },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            appointments: {
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    status: true,
                    service: {
                        select: { id: true, name: true, price: true }
                    },
                    professional: {
                        select: { id: true, name: true }
                    },
                },
                orderBy: { startTime: 'desc' },
                take: 20,
            },
        },
    })

    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
        success: true,
        data: {
            ...customer,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            appointments: customer.appointments.map((a: any) => ({
                ...a,
                service: { ...a.service, price: Number(a.service.price) },
            })),
        },
    })
}
