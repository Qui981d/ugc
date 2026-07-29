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
    const [sidebarExpanded, setSidebarExpanded] = useState(false)
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
            <div className="min-h-screen bg-[#E8E6DF]">
                <Sidebar role="brand" userName={isActingAsBrand ? actingBrandName || undefined : user?.full_name} onExpandChange={setSidebarExpanded} />
                <div
                    className="md:transition-[margin-left] md:duration-300 md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                    data-sidebar-expanded={sidebarExpanded}
                >
                    <Header />
                    <main className="p-4 md:p-8 pt-20 pb-24 md:pb-8">
                        {isActingAsBrand && (
                            <div className="sticky top-16 z-40 mb-4 -mx-1 bg-[#18181B] text-white rounded-2xl px-4 py-2.5 flex items-center gap-3 text-sm shadow-lg">
                                <Eye className="w-4 h-4 text-[#C4F042] shrink-0" />
                                <span className="min-w-0 truncate">Vous agissez en tant que <strong className="text-[#C4F042]">{actingBrandName || 'marque'}</strong></span>
                                <button onClick={exitActingAs} className="ml-auto shrink-0 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium">
                                    Revenir à l&apos;admin
                                </button>
                            </div>
                        )}
                        <DashboardErrorBoundary>
                            {children}
                        </DashboardErrorBoundary>
                    </main>
                </div>
                <MobileBottomNav />
            </div>
            <style>{`
                @media (min-width: 768px) {
                    [data-sidebar-expanded="false"] { margin-left: 82px; }
                    [data-sidebar-expanded="true"] { margin-left: 218px; }
                }
            `}</style>
        </NotificationProvider>
    )
}
