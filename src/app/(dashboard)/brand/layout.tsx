import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default function BrandDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar role="brand" />
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
