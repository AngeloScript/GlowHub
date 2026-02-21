import { getPublicTenantInfo } from '@/actions/public/booking-actions'
import { BookingWizard } from '@/components/public-booking/BookingWizard'
import { notFound } from 'next/navigation'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function PublicBookingPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const tenantData = await getPublicTenantInfo(slug)

    if (!tenantData) {
        return notFound()
    }

    return (
        <main className="min-h-screen bg-background flex flex-col items-center">
            {/* Minimalist Header */}
            <header className="w-full max-w-md bg-white border-b border-border/50 px-6 py-5 sticky top-0 z-10 shadow-sm flex items-center gap-4">
                {tenantData.logoUrl ? (
                    <Image
                        src={tenantData.logoUrl}
                        alt={tenantData.tenantName}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-12 h-12 rounded-full object-cover border border-border/50 shadow-sm"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                        {tenantData.tenantName.substring(0, 2).toUpperCase()}
                    </div>
                )}
                <div>
                    <h1 className="font-bold text-foreground text-lg leading-tight">
                        {tenantData.tenantName}
                    </h1>
                    {tenantData.address && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {tenantData.address}
                        </p>
                    )}
                </div>
            </header>

            {/* Wizard Area */}
            <div className="w-full max-w-md flex-1 px-4 py-6 md:px-0">
                <BookingWizard tenantData={tenantData} />
            </div>

            <footer className="w-full max-w-md py-6 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 opacity-50">
                    Powered by
                    <span className="text-primary font-bold">GlowHub</span>
                </p>
            </footer>
        </main>
    )
}
