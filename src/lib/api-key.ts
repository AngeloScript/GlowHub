import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.PUBLIC_API_KEY

export function validateApiKey(req: NextRequest): NextResponse | null {
    if (!API_KEY) {
        return NextResponse.json(
            { error: 'API key not configured on server' },
            { status: 500 }
        )
    }

    const provided = req.headers.get('x-api-key')

    if (!provided || provided !== API_KEY) {
        return NextResponse.json(
            { error: 'Unauthorized — invalid or missing x-api-key header' },
            { status: 401 }
        )
    }

    return null
}
