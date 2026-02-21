import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { getPublicAvailability } from '@/actions/public/booking-actions'

export async function GET(req: NextRequest) {
    const authError = validateApiKey(req)
    if (authError) return authError

    const { searchParams } = req.nextUrl
    const tenantId = searchParams.get('tenantId')
    const serviceId = searchParams.get('serviceId')
    const dateStr = searchParams.get('date')

    if (!tenantId || !serviceId || !dateStr) {
        return NextResponse.json(
            { error: 'tenantId, serviceId, and date (YYYY-MM-DD) are required' },
            { status: 400 }
        )
    }

    const date = new Date(dateStr + 'T00:00:00')

    if (isNaN(date.getTime())) {
        return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD' },
            { status: 400 }
        )
    }

    const slots = await getPublicAvailability({ tenantId, serviceId, date })

    return NextResponse.json({ success: true, data: slots })
}
