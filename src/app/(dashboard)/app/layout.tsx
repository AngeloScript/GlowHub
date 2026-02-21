import { ReactNode } from 'react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Wallet,
    BadgePercent,
    UserSearch,
    Settings,
    LogOut,
    CalendarRange,
} from 'lucide-react'
import { MobileNav } from '@/components/layout/MobileNav'

const navItems = [
    { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/agenda', label: 'Agenda Diária', icon: CalendarDays },
    { href: '/app/calendario', label: 'Calendário Geral', icon: CalendarRange },
    { href: '/app/clientes', label: 'Clientes', icon: Users },
    { href: '/app/financeiro', label: 'Financeiro', icon: Wallet },
    { href: '/app/comissoes', label: 'Comissões', icon: BadgePercent },
    { href: '/app/retencao', label: 'Retenção', icon: UserSearch },
]

export default async function AppLayout({ children }: { children: ReactNode }) {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-[260px] border-r border-border bg-white flex flex-col hidden md:flex">
                {/* Logo */}
                <div className="flex h-16 items-center px-6 border-b border-border">
                    <span className="text-xl font-bold tracking-tighter text-primary">
                        Glow<span className="text-accent">Hub</span>
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                        >
                            <Icon className="h-[18px] w-[18px] transition-colors duration-200 group-hover:text-primary" />
                            {label}
                        </Link>
                    ))}

                    {session.role === 'ADMIN' && (
                        <>
                            <div className="my-3 border-t border-border" />
                            <Link
                                href="/app/configuracoes"
                                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                            >
                                <Settings className="h-[18px] w-[18px] transition-colors duration-200 group-hover:text-primary" />
                                Configurações
                            </Link>
                        </>
                    )}
                </nav>

                {/* User Profile */}
                <div className="border-t border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {session.role.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                                Usuário Logado
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {session.role === 'ADMIN'
                                    ? 'Administrador'
                                    : session.role === 'RECEPCAO'
                                        ? 'Recepção'
                                        : 'Profissional'}
                            </p>
                        </div>
                        <form action="/api/auth/logout" method="POST">
                            <button
                                type="button"
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                title="Sair"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="flex h-14 items-center justify-between border-b border-border bg-white px-6">
                    <div className="flex items-center gap-3 md:hidden">
                        <MobileNav
                            navItems={[
                                { href: '/app', label: 'Dashboard', icon: 'LayoutDashboard' },
                                { href: '/app/agenda', label: 'Agenda Diária', icon: 'CalendarDays' },
                                { href: '/app/calendario', label: 'Calendário Geral', icon: 'CalendarRange' },
                                { href: '/app/clientes', label: 'Clientes', icon: 'Users' },
                                { href: '/app/financeiro', label: 'Financeiro', icon: 'Wallet' },
                                { href: '/app/comissoes', label: 'Comissões', icon: 'BadgePercent' },
                                { href: '/app/retencao', label: 'Retenção', icon: 'UserSearch' },
                            ]}
                            settingsItem={session.role === 'ADMIN'
                                ? { href: '/app/configuracoes', label: 'Configurações', icon: 'Settings' }
                                : undefined
                            }
                            userRole={session.role}
                        />
                        <span className="text-lg font-bold tracking-tighter text-primary">
                            Glow<span className="text-accent">Hub</span>
                        </span>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-4">
                        <span className="text-xs text-muted-foreground font-medium">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                                {session.tenantId.substring(0, 8)}...
                            </code>
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
