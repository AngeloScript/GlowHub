import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

/**
 * Cria um Prisma Client estendido com RLS (Row Level Security).
 * O cast `as unknown as PrismaClient` garante que o TS reconheça
 * todos os model accessors (transaction, commission, tabItem, etc.)
 * mesmo após o $extends() que perde a inferência de tipo nativa.
 */
export const createTenantClient = (tenantId: string): PrismaClient => {
    const prismaDb = db

    const extended = prismaDb.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    const [, result] = await prismaDb.$transaction([
                        prismaDb.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
                        query(args)
                    ])

                    return result
                }
            }
        }
    })

    return extended as unknown as PrismaClient
}

const prismaUserGlobal = () => {
    const pool = new Pool({
        connectionString,
        max: 10,
    })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({
        adapter,
        transactionOptions: {
            maxWait: 15000,
            timeout: 15000,
        },
    })
}

declare global {
    var prismaGlobal: undefined | PrismaClient
}

export const db: PrismaClient = globalThis.prismaGlobal ?? prismaUserGlobal()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db

