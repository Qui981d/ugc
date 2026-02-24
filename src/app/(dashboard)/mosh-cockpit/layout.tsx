'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#E8E6DF]">
                <Sidebar role="admin" />
                <div className="md:ml-[82px]">
                    <Header />
                    <main className="p-8 pt-20">
                        {children}
                    </main>
                </div>
            </div>
        </NotificationProvider>
    )
}
