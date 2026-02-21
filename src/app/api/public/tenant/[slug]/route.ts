import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'
import { getPublicTenantInfo } from '@/actions/public/booking-actions'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const authError = validateApiKey(req)
    if (authError) return authError

    const { slug } = await params

    if (!slug) {
        return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const data = await getPublicTenantInfo(slug)

    if (!data) {
        return NextResponse.json(
            { error: 'Tenant not found or public booking disabled' },
            { status: 404 }
        )
    }

    return NextResponse.json({ success: true, data })
}
