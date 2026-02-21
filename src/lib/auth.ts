import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Chave secreta no .env do servidor
const secretKey = process.env.JWT_SECRET || 'glowhub_super_secret_development_key_only'
const encodedKey = new TextEncoder().encode(secretKey)

export type Role = 'ADMIN' | 'RECEPCAO' | 'PROFISSIONAL'

export interface SessionPayload {
    userId: string
    tenantId: string
    role: Role
    expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Sessão de 7 dias
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload as unknown as SessionPayload
    } catch {
        return null
    }
}

export async function createSession(userId: string, tenantId: string, role: Role) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const session = await encrypt({ userId, tenantId, role, expiresAt })

    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return null
    return await decrypt(session)
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}
