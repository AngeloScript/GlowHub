import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'

// GET /api/public/services?tenantId=X — listar serviços ativos com categorias
export async function GET(req: NextRequest) {
    const authError = validateApiKey(req)
    if (authError) return authError

    const tenantId = req.nextUrl.searchParams.get('tenantId')

    if (!tenantId) {
        return NextResponse.json(
            { error: 'tenantId is required' },
            { status: 400 }
        )
    }

    const categories = await db.serviceCategory.findMany({
        where: { tenantId },
        include: {
            services: {
                where: { isActive: true },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    durationMinutes: true,
                },
            },
        },
        orderBy: { name: 'asc' },
    })

    const data = categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => c.services.length > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => ({
            id: c.id,
            name: c.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            services: c.services.map((s: any) => ({
                ...s,
                price: Number(s.price),
            })),
        }))

    return NextResponse.json({ success: true, data })
}
