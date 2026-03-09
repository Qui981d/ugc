// Force all dashboard pages to be dynamically rendered (no static prerendering)
// This prevents build errors when pages use authentication/browser-only APIs
export const dynamic = 'force-dynamic'

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
    return children
}
