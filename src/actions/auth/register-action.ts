'use server'

import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function registerAction(formData: FormData) {
    try {
        const tenantName = formData.get('tenantName') as string
        const ownerName = formData.get('ownerName') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const password = formData.get('password') as string

        if (!tenantName || !ownerName || !email || !password) {
            return { error: 'Preencha todos os campos obrigatórios.' }
        }

        // Verifica se já existe o e-mail (usamos a conexão base - admin)
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return { error: 'E-mail já está em uso.' }
        }

        // Hash da Senha
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash(password, salt)

        // Transação Principal: Criação do Onboarding Fricção Zero
        // Criamos o Salão (Tenant) e o Admin principal de uma só vez
        const result = await db.$transaction(async (tx) => {
            // 1. Cria a Conta Master (Tenant)
            const newTenant = await tx.tenant.create({
                data: {
                    name: tenantName,
                },
            })

            // 2. Cria o Dono/Admin do Sistema sob esse novo Tenant
            const newUser = await tx.user.create({
                data: {
                    tenantId: newTenant.id,
                    name: ownerName,
                    email,
                    phone,
                    passwordHash,
                    role: 'ADMIN',
                },
            })

            return { tenant: newTenant, user: newUser }
        })

        // Gera a Sessão e os Cookies com JWT
        // Assinando: userId, tenantId (para o row-level-security) e a role 'Admin'
        await createSession(result.user.id, result.tenant.id, result.user.role)

        return { success: true }
    } catch (error) {
        console.error('Registration Error:', error)
        return { error: 'Ocorreu um erro interno ao criar sua conta. Tente novamente.' }
    }
}
