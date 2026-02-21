export const EXPENSE_CATEGORIES = [
    'Aluguel',
    'Luz/Água',
    'Produtos',
    'Impostos',
    'Salários',
    'Marketing',
    'Manutenção',
    'Outros',
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
