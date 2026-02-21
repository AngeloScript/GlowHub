'use client'

import { useState } from 'react'
import { Building2, Scissors, Users } from 'lucide-react'
import { BusinessTab } from './BusinessTab'
import { CatalogTab } from './CatalogTab'
import { TeamTab } from './TeamTab'

type TabKey = 'business' | 'catalog' | 'team'

const tabs: { key: TabKey; label: string; icon: typeof Building2 }[] = [
    { key: 'business', label: 'Meu Negócio', icon: Building2 },
    { key: 'catalog', label: 'Catálogo', icon: Scissors },
    { key: 'team', label: 'Equipe', icon: Users },
]

type Props = {
    settings: Parameters<typeof BusinessTab>[0]['settings']
    services: Parameters<typeof CatalogTab>[0]['services']
    categories: Parameters<typeof CatalogTab>[0]['categories']
    team: Parameters<typeof TeamTab>[0]['team']
}

export function SettingsTabs({ settings, services, categories, team }: Props) {
    const [active, setActive] = useState<TabKey>('business')

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Tab Navigation */}
            <nav className="lg:w-56 flex lg:flex-col gap-1">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setActive(key)}
                        className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 text-left w-full ${active === key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {label}
                    </button>
                ))}
            </nav>

            {/* Tab Content */}
            <div className="flex-1 min-w-0 animate-fade">
                {active === 'business' && <BusinessTab settings={settings} />}
                {active === 'catalog' && (
                    <CatalogTab services={services} categories={categories} />
                )}
                {active === 'team' && <TeamTab team={team} />}
            </div>
        </div>
    )
}
