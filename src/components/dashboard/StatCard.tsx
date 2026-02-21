import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: ReactNode
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
    return (
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="p-2 bg-muted/50 rounded-md">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
            </div>

            <div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
                {description && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        {description}
                    </div>
                )}
            </div>
        </div>
    )
}
