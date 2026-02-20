'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#050505]">
                <Sidebar role="admin" />
                <div className="md:ml-64">
                    <Header />
                    <main className="p-6 pt-20">
                        {children}
                    </main>
                </div>
            </div>
        </NotificationProvider>
    )
}
