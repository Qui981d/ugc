import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"

export default function BrandDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#E8E6DF]">
            <Sidebar role="brand" />
            <div className="md:ml-64">
                <Header />
                <main className="p-4 md:p-8 pb-24 md:pb-8">
                    {children}
                </main>
            </div>
            <MobileBottomNav />
        </div>
    )
}
