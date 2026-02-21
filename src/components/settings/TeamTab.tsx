'use client'

import { inviteProfessional, toggleProfessionalStatus } from '@/actions/settings/team-actions'
import { useState } from 'react'
import { UserPlus, Power } from 'lucide-react'

type TeamMember = {
    id: string
    name: string
    email: string
    phone: string | null
    role: string
    isActive: boolean
    commissionRate: number | string | null
    workingHours: Record<string, unknown> | null
    createdAt: Date
}

type Props = {
    team: TeamMember[]
}

export function TeamTab({ team }: Props) {
    const [showInvite, setShowInvite] = useState(false)

    const professionals = team.filter((m) => m.role === 'PROFISSIONAL')
    const staff = team.filter((m) => m.role !== 'PROFISSIONAL')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">
                        Equipe ({team.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {professionals.length} profissionais · {staff.length} administrativo
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowInvite((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xs transition-all duration-200 hover:shadow-sm hover:brightness-110 active:scale-[0.98]"
                >
                    <UserPlus className="h-3.5 w-3.5" />
                    Convidar Profissional
                </button>
            </div>

            {/* Invite Form */}
            {showInvite && (
                <form
                    action={async (fd) => {
                        await inviteProfessional(fd)
                        setShowInvite(false)
                    }}
                    className="card p-5 space-y-4 animate-scale"
                >
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Novo Profissional
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Nome</label>
                            <input
                                name="name"
                                title="Nome do profissional"
                                required
                                placeholder="Maria Silva"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                            <input
                                name="email"
                                title="E-mail"
                                type="email"
                                required
                                placeholder="maria@email.com"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                            <input
                                name="phone"
                                title="Telefone"
                                placeholder="(11) 99999-0000"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Comissão (%)</label>
                            <input
                                name="commissionRate"
                                title="Taxa de comissão"
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                placeholder="40"
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-primary text-primary-foreground font-medium px-5 py-2 rounded-lg text-sm shadow-xs hover:shadow-sm hover:brightness-110 active:scale-[0.98]"
                    >
                        Enviar Convite
                    </button>
                </form>
            )}

            {/* Team List */}
            <div className="card overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Nome
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                E-mail
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Função
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                Comissão
                            </th>
                            <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {team.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                    Nenhum membro na equipe.
                                </td>
                            </tr>
                        ) : (
                            team.map((member) => (
                                <tr
                                    key={member.id}
                                    className={`transition-colors duration-150 hover:bg-muted/20 ${!member.isActive ? 'opacity-50' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-foreground">{member.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${member.role === 'ADMIN'
                                                    ? 'bg-primary/10 text-primary'
                                                    : member.role === 'PROFISSIONAL'
                                                        ? 'bg-accent/10 text-accent'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            {member.role === 'ADMIN'
                                                ? 'Admin'
                                                : member.role === 'PROFISSIONAL'
                                                    ? 'Profissional'
                                                    : 'Recepção'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center tabular-nums text-muted-foreground">
                                        {member.commissionRate
                                            ? `${Number(member.commissionRate)}%`
                                            : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {member.role === 'PROFISSIONAL' ? (
                                            <form
                                                action={async () => {
                                                    await toggleProfessionalStatus(member.id)
                                                }}
                                            >
                                                <button
                                                    type="submit"
                                                    title={member.isActive ? 'Desativar' : 'Ativar'}
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${member.isActive
                                                            ? 'bg-success/10 text-success hover:bg-success/20'
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                        }`}
                                                >
                                                    <Power className="h-3 w-3" />
                                                    {member.isActive ? 'Ativo' : 'Inativo'}
                                                </button>
                                            </form>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
