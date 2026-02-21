import { getCustomerById } from '@/actions/customers/customer-actions'
import { getCustomerHistory } from '@/actions/customers/customer-intelligence'
import { updateCustomer } from '@/actions/customers/customer-actions'
import { getCustomerRecord, updateCustomerRecord } from '@/actions/customers/record-actions'
import { CustomerTabs } from '@/components/customers/CustomerTabs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default async function CustomerProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [customer, history] = await Promise.all([
        getCustomerById(id),
        getCustomerHistory(id),
    ])

    const record = await getCustomerRecord(id)

    if (!customer) notFound()

    const updateAction = async (formData: FormData) => {
        'use server'
        await updateCustomer(id, formData)
    }

    return (
        <div className="flex h-full flex-col space-y-6 animate-in">
            {/* Header */}
            <div>
                <Link
                    href="/app/clientes"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-3"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {customer.name}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Cliente desde{' '}
                            {customer.createdAt.toLocaleDateString('pt-BR', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>

            <CustomerTabs
                customer={customer}
                history={history}
                record={record}
                updateCustomerAction={updateAction}
                updateRecordAction={updateCustomerRecord}
            />
        </div>
    )
}
