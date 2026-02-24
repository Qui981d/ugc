'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useAuth } from '@/contexts/AuthContext'

export default function CreatorDashboardLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

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
            <div className="min-h-screen bg-[#E8E6DF]">
                <Sidebar role="creator" />
                <div className="md:ml-[82px]">
                    <Header />
                    <main className="p-4 md:p-8 pt-20 pb-24 md:pb-8">
                        {children}
                    </main>
                </div>
                <MobileBottomNav />
            </div>
        </NotificationProvider>
    )
}
