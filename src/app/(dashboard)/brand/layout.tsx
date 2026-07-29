'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentBrand } from '@/hooks/useCurrentBrand'
import { DashboardErrorBoundary } from '@/components/ui/error-boundary'

export default function BrandDashboardLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth()
    const { isActingAsBrand, actingBrandName, brandId, clearActing } = useCurrentBrand()
    const router = useRouter()
    const [sidebarExpanded, setSidebarExpanded] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (isLoading || !user) return
        // Creators never belong here
        if (user.role === 'creator') { router.replace('/creator'); return }
        // An admin must be "acting as a brand" to use the brand workspace;
        // otherwise send them back to the cockpit (avoid an empty/confusing view).
        if (user.role === 'admin' && mounted && !isActingAsBrand) {
            router.replace('/mosh-cockpit/brands')
        }
    }, [user, isLoading, router, isActingAsBrand, mounted])

    if (!isLoading && user && user.role !== 'brand' && user.role !== 'admin') {
        return null
    }

    const exitActingAs = () => {
        const target = brandId
        clearActing()
        router.push(target ? `/mosh-cockpit/brands/${target}` : '/mosh-cockpit/brands')
    }

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#EBEDF0]">
                <Sidebar role="brand" userName={isActingAsBrand ? actingBrandName || undefined : user?.full_name} onExpandChange={setSidebarExpanded} />
                <div
                    className="md:transition-[margin-left] md:duration-300 md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                    data-sidebar-expanded={sidebarExpanded}
                >
                    <Header />
                    {/* Impersonation notice: a thin, permanent strip. The sidebar carries
                        the identity, so this only needs to state the fact and offer the exit. */}
                    {isActingAsBrand && (
                        <div className="sticky top-0 z-30 bg-[#E7F0FF] border-b border-[#0866FF]/20 px-4 md:px-8 py-1.5 flex items-center gap-2 text-[12px] text-[#0653CC]">
                            <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                            <span className="min-w-0 truncate">
                                Vous agissez au nom de <strong className="font-semibold">{actingBrandName || 'cette marque'}</strong>
                            </span>
                            <button
                                onClick={exitActingAs}
                                className="ml-auto shrink-0 font-medium underline underline-offset-2 hover:text-[#0866FF]"
                            >
                                Quitter
                            </button>
                        </div>
                    )}
                    <main className="p-4 md:p-8 pt-20 pb-24 md:pb-8">
                        <DashboardErrorBoundary>
                            {children}
                        </DashboardErrorBoundary>
                    </main>
                </div>
                <MobileBottomNav />
            </div>
            <style>{`
                @media (min-width: 768px) {
                    [data-sidebar-expanded="false"] { margin-left: 60px; }
                    [data-sidebar-expanded="true"] { margin-left: 240px; }
                }
            `}</style>
        </NotificationProvider>
    )
}
