'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function CreatorDashboardLayout({ children }: { children: ReactNode }) {
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
