import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default function SharedDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // TODO: Get actual user role from auth context
    const userRole = 'brand' as const

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar role={userRole} />
            <div className="md:ml-64">
                <Header />
                <main className="p-4 md:p-6 pb-24 md:pb-6">
                    {children}
                </main>
            </div>
            <MobileBottomNav />
        </div>
    )
}
