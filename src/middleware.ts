import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

const protectedRoutes = ['/app']
const publicRoutes = ['/login', '/register', '/']

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname

    // Verifica se é uma rota protegida (tudo que começa com /app e as APIs internas)
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) || path.startsWith('/api')
    const isPublicRoute = publicRoutes.includes(path)

    // Descriptografa token nos Cookies
    const cookieSession = req.cookies.get('session')?.value
    const session = await decrypt(cookieSession)

    // Lógica de Redirecionamento 1: Usuário NÃO logado
    if (isProtectedRoute && !session?.userId) {
        return NextResponse.redirect(new URL('/login', req.nextUrl))
    }

    // Lógica de Redirecionamento 2: Usuário já está logado, tenta ver página pública de login
    if (isPublicRoute && session?.userId && path !== '/') {
        return NextResponse.redirect(new URL('/app', req.nextUrl))
    }

    // Se for sucesso e proteger, repassa os metadados sensíveis do payload nos Headings
    if (isProtectedRoute && session?.tenantId) {
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-tenant-id', session.tenantId)
        requestHeaders.set('x-user-id', session.userId)
        requestHeaders.set('x-user-role', session.role)

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    }

    return NextResponse.next()
}

// Configura em quais rotas o Next.js deve executar o middleware
export const config = {
    matcher: ['/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
