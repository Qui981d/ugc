'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentBrand } from '@/hooks/useCurrentBrand'
import { DashboardErrorBoundary } from '@/components/ui/error-boundary'

export default function BrandDashboardLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth()
    const { isActingAsBrand, actingBrandName } = useCurrentBrand()
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

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#F2F2F1]">
                <Sidebar role="brand" userName={isActingAsBrand ? actingBrandName || undefined : user?.full_name} onExpandChange={setSidebarExpanded} />
                <div
                    className="md:transition-[margin-left] md:duration-300 md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                    data-sidebar-expanded={sidebarExpanded}
                >
                    <Header />
                    {/* No impersonation strip: the top bar already names the workspace
                        and the sidebar carries the way back, so a third notice was noise. */}
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
