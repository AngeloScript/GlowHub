'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Menu, X, LogOut,
    LayoutDashboard, CalendarDays, CalendarRange,
    Users, Wallet, BadgePercent, UserSearch, Settings
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    CalendarDays,
    CalendarRange,
    Users,
    Wallet,
    BadgePercent,
    UserSearch,
    Settings,
}

interface NavItem {
    href: string
    label: string
    icon: string
}

interface MobileNavProps {
    navItems: NavItem[]
    settingsItem?: NavItem
    userRole: string
}

export function MobileNav({ navItems, settingsItem, userRole }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const getIcon = (iconName: string) => iconMap[iconName] || LayoutDashboard

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Side Drawer */}
            <div
                className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 md:hidden flex flex-col shadow-xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Drawer Header */}
                <div className="flex h-14 items-center justify-between px-5 border-b border-border">
                    <span className="text-lg font-bold tracking-tighter text-primary">
                        Glow<span className="text-accent">Hub</span>
                    </span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map(({ href, label, icon }) => {
                        const Icon = getIcon(icon)
                        const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href))
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setIsOpen(false)}
                                className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-primary/5 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'group-hover:text-primary'
                                    }`} />
                                {label}
                            </Link>
                        )
                    })}

                    {settingsItem && (() => {
                        const SettingsIcon = getIcon(settingsItem.icon)
                        return (
                            <>
                                <div className="my-3 border-t border-border" />
                                <Link
                                    href={settingsItem.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${pathname === settingsItem.href
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <SettingsIcon className="h-5 w-5 transition-colors duration-200 group-hover:text-primary" />
                                    {settingsItem.label}
                                </Link>
                            </>
                        )
                    })()}
                </nav>

                {/* User Info */}
                <div className="border-t border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {userRole.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                                Usuário Logado
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {userRole === 'ADMIN'
                                    ? 'Administrador'
                                    : userRole === 'RECEPCAO'
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
            </div>
        </>
    )
}
