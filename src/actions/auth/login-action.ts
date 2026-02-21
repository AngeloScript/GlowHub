'use server'

import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function loginAction(formData: FormData) {
    try {
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        if (!email || !password) {
            return { error: 'Preencha o e-mail e a senha.' }
        }

        // Busca o usuário. Neste ponto usamos o acesso base (sem tenant filter)
        // porque o usuário ainda não está logado para injetar o tenantId.
        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user) {
            return { error: 'Credenciais inválidas.' }
        }

        // Validação da Criptografia Hash
        const passwordMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatch) {
            return { error: 'Credenciais inválidas.' }
        }

        // Gera a Sessão e os Cookies com JWT (Injetando Contexto RLS/RBAC)
        await createSession(user.id, user.tenantId, user.role)

        return { success: true }
    } catch (error) {
        console.error('Login Error:', error)
        return { error: 'Ocorreu um erro interno. Tente novamente mais tarde.' }
    }
}
