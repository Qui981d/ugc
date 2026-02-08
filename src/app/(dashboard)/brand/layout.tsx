import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function BrandDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar role="brand" />
            <div className="ml-64">
                <Header />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
