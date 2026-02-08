import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function SharedDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // TODO: Get actual user role from auth context
    const userRole = 'brand' as const

    return (
        <div className="min-h-screen bg-background">
            <Sidebar role={userRole} />
            <div className="ml-64">
                <Header />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
