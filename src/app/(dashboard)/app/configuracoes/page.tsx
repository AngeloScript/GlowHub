import { getTenantSettings } from '@/actions/settings/settings-actions'
import { getServices, getCategories } from '@/actions/settings/service-actions'
import { getTeam } from '@/actions/settings/team-actions'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings/SettingsTabs'

export default async function ConfiguracoesPage() {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') redirect('/app')

    const [settings, rawServices, categories, team] = await Promise.all([
        getTenantSettings(),
        getServices(),
        getCategories(),
        getTeam(),
    ])

    // Prisma Decimal não é serializável para Client Components — converter para number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const services = rawServices.map((s: any) => ({
        ...s,
        price: Number(s.price),
    }))

    return (
        <div className="flex h-full flex-col space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Configurações
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seu negócio, catálogo de serviços e equipe.
                </p>
            </div>

            <SettingsTabs
                settings={settings}
                services={services}
                categories={categories}
                team={team}
            />
        </div>
    )
}
