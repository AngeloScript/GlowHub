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
        .filter(c => c.services.length > 0)
        .map(c => ({
            id: c.id,
            name: c.name,
            services: c.services.map(s => ({
                ...s,
                price: Number(s.price),
            })),
        }))

    return NextResponse.json({ success: true, data })
}
