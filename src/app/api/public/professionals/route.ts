import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { db } from '@/lib/db'

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

    const professionals = await db.user.findMany({
        where: { tenantId, role: 'PROFISSIONAL', isActive: true },
        select: {
            id: true,
            name: true,
            phone: true,
            commissionRate: true,
            workingHours: true,
        },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({
        success: true,
        data: professionals.map(p => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            workingHours: p.workingHours,
        })),
    })
}
