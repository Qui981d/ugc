'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardErrorBoundary } from '@/components/ui/error-boundary'

export default function CreatorDashboardLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [sidebarExpanded, setSidebarExpanded] = useState(true)

    useEffect(() => {
        if (!isLoading && user && user.role !== 'creator' && user.role !== 'admin') {
            router.replace(user.role === 'brand' ? '/brand' : '/login')
        }
    }, [user, isLoading, router])

    // Don't render the wrong dashboard while redirecting
    if (!isLoading && user && user.role !== 'creator' && user.role !== 'admin') {
        return null
    }

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#F2F2F1]">
                <Sidebar role="creator" userName={user?.full_name} onExpandChange={setSidebarExpanded} />
                <div
                    className="md:transition-[margin-left] md:duration-300 md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                    data-sidebar-expanded={sidebarExpanded}
                >
                    <Header />
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
