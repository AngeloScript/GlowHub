import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPackages } from '@/actions/packages/package-actions'
import { PackagesDashboard } from '@/components/packages/PackagesDashboard'

export const dynamic = 'force-dynamic'

export default async function PacotesPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    if (session.role === 'PROFISSIONAL') {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Acesso restrito ao Administrador e Recepção.
            </div>
        )
    }

    const packages = await getPackages()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Pacotes e Assinaturas</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Crie combos de serviços e controle as vendas para seus clientes.
                </p>
            </div>

            <PackagesDashboard initialPackages={packages} isAdmin={session.role === 'ADMIN'} />
        </div>
    )
}
