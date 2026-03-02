'use client'

import { ReactNode, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NotificationProvider } from '@/contexts/NotificationContext'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
    const [sidebarExpanded, setSidebarExpanded] = useState(false)

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-[#E8E6DF]">
                <Sidebar role="admin" onExpandChange={setSidebarExpanded} />
                <div
                    className="md:transition-[margin-left] md:duration-300 md:ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ marginLeft: undefined }}
                    data-sidebar-expanded={sidebarExpanded}
                >
                    <Header />
                    <main className="p-8 pt-20">
                        {children}
                    </main>
                </div>
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
