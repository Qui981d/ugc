'use client'

import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { useAuth } from "@/contexts/AuthContext"

export default function SharedDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = useAuth()
    const userRole = user?.role === 'admin' ? 'admin' : user?.role === 'brand' ? 'brand' : 'creator'

    return (
        <div className="min-h-screen bg-[#E8E6DF]">
            <Sidebar role={userRole} />
            <div className="md:ml-[82px]">
                <Header />
                <main className="p-4 md:p-6 pb-24 md:pb-6">
                    {children}
                </main>
            </div>
            <MobileBottomNav />
        </div>
    )
}
