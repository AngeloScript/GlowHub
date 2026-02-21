'use server'

import { getSession } from '@/lib/auth'
import { createTenantClient } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateExpenseInput = {
    description: string
    amount: number
    category: string
    dueDate: string // ISO string
    notes?: string
}

// ---------------------------------------------------------------------------
// CRUD — Despesas (Contas a Pagar)
// ---------------------------------------------------------------------------

export async function getExpenses(filters?: {
    status?: string
    month?: number
    year?: number
}) {
    const session = await getSession()
    if (!session || session.role === 'PROFISSIONAL') return []

    const tenantDb = createTenantClient(session.tenantId)

    const where: Record<string, unknown> = {}

    if (filters?.status) {
        where.status = filters.status
    }

    if (filters?.month !== undefined && filters?.year !== undefined) {
        const startDate = new Date(filters.year, filters.month, 1)
        const endDate = new Date(filters.year, filters.month + 1, 0, 23, 59, 59)
        where.dueDate = { gte: startDate, lte: endDate }
    }

    const rawExpenses = await tenantDb.expense.findMany({
        where,
        orderBy: { dueDate: 'asc' }
    })

    // Converter Decimal para Number para serialização Server→Client
    return rawExpenses.map((e: typeof rawExpenses[number]) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        category: e.category,
        dueDate: e.dueDate,
        paidDate: e.paidDate,
        status: e.status,
        notes: e.notes,
        createdAt: e.createdAt,
    }))
}

export async function createExpense(input: CreateExpenseInput) {
    const session = await getSession()
    if (!session || session.role === 'PROFISSIONAL') {
        return { error: 'Acesso restrito.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    await tenantDb.expense.create({
        data: {
            tenantId: session.tenantId,
            description: input.description,
            amount: input.amount,
            category: input.category,
            dueDate: new Date(input.dueDate),
            notes: input.notes,
            status: 'PENDING',
        }
    })

    return { success: true }
}

export async function markExpenseAsPaid(expenseId: string) {
    const session = await getSession()
    if (!session || session.role === 'PROFISSIONAL') {
        return { error: 'Acesso restrito.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    await tenantDb.expense.update({
        where: { id: expenseId },
        data: {
            status: 'PAID',
            paidDate: new Date(),
        }
    })

    return { success: true }
}

export async function deleteExpense(expenseId: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { error: 'Apenas o Administrador pode excluir despesas.' }
    }

    const tenantDb = createTenantClient(session.tenantId)

    await tenantDb.expense.delete({ where: { id: expenseId } })

    return { success: true }
}

// ---------------------------------------------------------------------------
// RESUMO — Agrupamento por status para o painel
// ---------------------------------------------------------------------------

export async function getExpensesSummary(month: number, year: number) {
    const session = await getSession()
    if (!session || session.role === 'PROFISSIONAL') return null

    const tenantDb = createTenantClient(session.tenantId)

    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)
    const now = new Date()

    const rawExpenses = await tenantDb.expense.findMany({
        where: { dueDate: { gte: startDate, lte: endDate } },
        orderBy: { dueDate: 'asc' }
    })

    // Converter Decimal para Number
    const expenses = rawExpenses.map((e: typeof rawExpenses[number]) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        category: e.category,
        dueDate: e.dueDate,
        paidDate: e.paidDate,
        status: e.status,
    }))

    const pending = expenses.filter(e => e.status === 'PENDING' && new Date(e.dueDate) >= now)
    const overdue = expenses.filter(e => e.status === 'PENDING' && new Date(e.dueDate) < now)
    const paid = expenses.filter(e => e.status === 'PAID')

    const totalPending = pending.reduce((s, e) => s + e.amount, 0)
    const totalOverdue = overdue.reduce((s, e) => s + e.amount, 0)
    const totalPaid = paid.reduce((s, e) => s + e.amount, 0)

    return {
        pending: { items: pending, total: totalPending },
        overdue: { items: overdue, total: totalOverdue },
        paid: { items: paid, total: totalPaid },
        grandTotal: totalPending + totalOverdue + totalPaid,
    }
}

// ---------------------------------------------------------------------------
// DRE — Lucro Líquido Real (Regime de Caixa)
// ---------------------------------------------------------------------------

export async function getNetProfit(startDate: string, endDate: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return null

    const tenantDb = createTenantClient(session.tenantId)

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // 1. RECEITAS — Transações do tipo INCOME com status COMPLETED no período
    const incomeTransactions = (await tenantDb.transaction.findMany({
        where: {
            type: 'INCOME',
            status: 'COMPLETED',
            createdAt: { gte: start, lte: end },
        }
    })) as unknown as Array<{ amount: number | string }>

    const totalIncome = incomeTransactions.reduce((s, t) => s + Number(t.amount), 0)

    // 2. DESPESAS — Contas pagas (status PAID, paidDate no período)
    const paidExpenses = (await tenantDb.expense.findMany({
        where: {
            status: 'PAID',
            paidDate: { gte: start, lte: end },
        }
    })) as unknown as Array<{ amount: number | string; category: string }>

    const totalExpenses = paidExpenses.reduce((s, e) => s + Number(e.amount), 0)

    // Breakdown por categoria
    const expensesByCategory: Record<string, number> = {}
    for (const exp of paidExpenses) {
        const cat = exp.category || 'Outros'
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(exp.amount)
    }

    // 3. COMISSÕES — Comissões pagas no período
    const paidCommissions = (await tenantDb.commission.findMany({
        where: {
            status: 'PAID',
            createdAt: { gte: start, lte: end },
        }
    })) as unknown as Array<{ amount: number | string }>

    const totalCommissions = paidCommissions.reduce((s, c) => s + Number(c.amount), 0)

    // 4. LUCRO LÍQUIDO
    const netProfit = totalIncome - totalExpenses - totalCommissions

    return {
        period: { start, end },
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        expensesByCategory,
    }
}

// ---------------------------------------------------------------------------
// EXPORTAÇÃO
// ---------------------------------------------------------------------------

export async function exportFinancialDataCsv(startIso: string, endIso: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, data: null, error: 'Unauthorized' }
    }

    const tenantDb = createTenantClient(session.tenantId)
    const startDate = new Date(startIso)
    const endDate = new Date(endIso)
    endDate.setHours(23, 59, 59, 999)

    try {
        const transactions = (await tenantDb.transaction.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
            },
            include: { tab: { include: { customer: true } } },
            orderBy: { createdAt: 'desc' }
        })) as unknown as Array<{ createdAt: Date, type: string, amount: number | string, paymentMethod: string, tab?: { customer: { name: string } } }>

        const expenses = (await tenantDb.expense.findMany({
            where: {
                paidDate: { gte: startDate, lte: endDate },
                status: 'PAID'
            },
            orderBy: { paidDate: 'desc' }
        })) as unknown as Array<{ paidDate: Date, dueDate: Date, description: string, category: string, amount: number | string }>

        let csvString = "DataHora,Tipo,Descrição/Cliente,Categoria,Método,Valor\n"

        transactions.forEach(t => {
            const dateStr = t.createdAt.toISOString()
            const tipo = t.type === 'INCOME' ? 'Receita' : 'Despesa/Comissão'
            const desc = t.tab?.customer ? t.tab.customer.name : 'Avulso'
            const cat = 'Serviços'
            const method = t.paymentMethod || 'Sistema'
            const val = t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount)
            csvString += `${dateStr},${tipo},"${desc}","${cat}","${method}",${val}\n`
        })

        expenses.forEach(e => {
            const dateStr = e.paidDate?.toISOString() || e.dueDate.toISOString()
            const tipo = 'Despesa Operacional'
            const desc = e.description
            const cat = e.category
            const method = 'N/A'
            const val = -Number(e.amount)
            csvString += `${dateStr},${tipo},"${desc}","${cat}","${method}",${val}\n`
        })

        return { success: true, data: csvString }

    } catch (e) {
        console.error(e)
        return { success: false, data: null, error: 'Erro ao exportar' }
    }
}
