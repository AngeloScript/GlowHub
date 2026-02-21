'use client'

import { updateTenantSettings, type BusinessHoursMap } from '@/actions/settings/settings-actions'
import { useRef } from 'react'

const DAYS = [
    { key: 'seg', label: 'Segunda' },
    { key: 'ter', label: 'Terça' },
    { key: 'qua', label: 'Quarta' },
    { key: 'qui', label: 'Quinta' },
    { key: 'sex', label: 'Sexta' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' },
]

type Props = {
    settings: {
        id: string
        address: string | null
        phone: string | null
        businessHours: BusinessHoursMap | null
    } | null
}

export function BusinessTab({ settings }: Props) {
    const formRef = useRef<HTMLFormElement>(null)
    const hours = settings?.businessHours ?? {}

    async function handleSubmit(formData: FormData) {
        // Collect business hours from hidden field
        await updateTenantSettings(formData)
    }

    return (
        <form ref={formRef} action={handleSubmit} className="space-y-8">
            {/* Business Info */}
            <div className="card p-6 space-y-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Informações do Negócio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">
                            Telefone
                        </label>
                        <input
                            name="phone"
                            title="Telefone do salão"
                            defaultValue={settings?.phone || ''}
                            placeholder="(11) 3333-4444"
                            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground">
                            Endereço
                        </label>
                        <input
                            name="address"
                            title="Endereço do salão"
                            defaultValue={settings?.address || ''}
                            placeholder="Rua Exemplo, 123 — São Paulo/SP"
                            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                    </div>
                </div>
            </div>

            {/* Business Hours Grid */}
            <div className="card p-6 space-y-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Horário de Funcionamento
                </h3>
                <div className="space-y-3">
                    {DAYS.map(({ key, label }) => {
                        const day = hours[key] ?? {
                            open: '09:00',
                            close: '19:00',
                            enabled: key !== 'dom',
                        }
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-4 text-sm"
                            >
                                <label className="w-24 font-medium text-foreground flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name={`day_${key}_enabled`}
                                        defaultChecked={day.enabled}
                                        className="rounded border-border text-primary focus:ring-primary/20"
                                    />
                                    {label}
                                </label>
                                <input
                                    type="time"
                                    name={`day_${key}_open`}
                                    defaultValue={day.open}
                                    title={`Abertura ${label}`}
                                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                />
                                <span className="text-muted-foreground">às</span>
                                <input
                                    type="time"
                                    name={`day_${key}_close`}
                                    defaultValue={day.close}
                                    title={`Fechamento ${label}`}
                                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Hidden JSON field assembled on submit */}
                <input type="hidden" name="businessHours" id="businessHoursJson" />
            </div>

            <button
                type="submit"
                onClick={() => {
                    // Assemble business hours JSON before submit
                    const bh: BusinessHoursMap = {}
                    for (const { key } of DAYS) {
                        const form = formRef.current
                        if (!form) continue
                        const enabled = (
                            form.querySelector(`[name="day_${key}_enabled"]`) as HTMLInputElement
                        )?.checked
                        const open = (
                            form.querySelector(`[name="day_${key}_open"]`) as HTMLInputElement
                        )?.value
                        const close = (
                            form.querySelector(`[name="day_${key}_close"]`) as HTMLInputElement
                        )?.value
                        bh[key] = { open: open || '09:00', close: close || '19:00', enabled: !!enabled }
                    }
                    const hidden = formRef.current?.querySelector('#businessHoursJson') as HTMLInputElement
                    if (hidden) hidden.value = JSON.stringify(bh)
                }}
                className="bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110 active:scale-[0.98]"
            >
                Salvar Configurações
            </button>
        </form>
    )
}
