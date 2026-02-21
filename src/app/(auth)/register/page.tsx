'use client'

import { useActionState, useEffect } from 'react'
import { registerAction } from '@/actions/auth/register-action'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const initialState = {
    error: null as string | null,
    success: false,
}

export default function RegisterPage() {
    const router = useRouter()
    // Utilizando a Action Server-side atrelada ao formulário (React 19 pattern)
    const [state, formAction, isPending] = useActionState(
        async (prevState: typeof initialState, formData: FormData) => {
            const result = await registerAction(formData)
            if (result.error) return { error: result.error, success: false }
            return { error: null, success: true }
        },
        initialState
    )

    useEffect(() => {
        if (state.success) {
            router.push('/app')
        }
    }, [state.success, router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">GlowHub</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sua jornada de alto desempenho começa aqui.
                    </p>
                </div>

                <form action={formAction} className="space-y-4">
                    {state.error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="tenantName" className="block text-sm font-medium text-foreground">
                            Nome do Salão ou Clínica
                        </label>
                        <input
                            id="tenantName"
                            name="tenantName"
                            type="text"
                            required
                            placeholder="Ex: Studio Beauty Glow"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="ownerName" className="block text-sm font-medium text-foreground">
                            Seu Nome Completo (Gestor)
                        </label>
                        <input
                            id="ownerName"
                            name="ownerName"
                            type="text"
                            required
                            placeholder="Ex: Maria da Silva"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">
                            E-mail Comercial
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="maria@studioglow.com"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                            WhatsApp / Telefone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            placeholder="(11) 99999-9999"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-foreground">
                            Senha Segura
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="mt-6 flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando Plataforma...
                            </>
                        ) : (
                            'Criar Minha Conta Grátis'
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Já tem uma conta no GlowHub?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Faça login aqui
                    </Link>
                </p>
            </div>
        </div>
    )
}
