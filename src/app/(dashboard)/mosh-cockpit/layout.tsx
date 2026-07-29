'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardErrorBoundary } from '@/components/ui/error-boundary'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [sidebarExpanded, setSidebarExpanded] = useState(false)

    useEffect(() => {
        if (!isLoading && user && user.role !== 'admin') {
            router.replace(user.role === 'brand' ? '/brand' : user.role === 'creator' ? '/creator' : '/login')
        }
    }, [user, isLoading, router])

    // Don't render the admin dashboard while redirecting
    if (!isLoading && user && user.role !== 'admin') {
        return null
    }

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#EBEDF0]">
                <Sidebar role="admin" onExpandChange={setSidebarExpanded} />
                <div
                    className="md:transition-[margin-left] md:duration-300 md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ marginLeft: undefined }}
                    data-sidebar-expanded={sidebarExpanded}
                >
                    <Header />
                    <main className="p-8 pt-20">
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
