'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Megaphone,
    Users,
    MessageSquare,
    Settings,
    Search,
    Briefcase,
    Upload,
    Wallet,
    ChevronLeft
} from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"

interface SidebarProps {
    role: 'brand' | 'creator'
}

// Badge component for notification indicators
function NotificationBadge({ count }: { count: number }) {
    if (count === 0) return null

    return (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
        </span>
    )
}

// Small dot indicator
function NotificationDot() {
    return (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
    )
}

const brandMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/brand", notifKey: null },
    { icon: Megaphone, label: "Campagnes", href: "/brand/campaigns", notifKey: 'applications' as const },
    { icon: Users, label: "Créateurs", href: "/marketplace?tab=creators", notifKey: null },
    { icon: MessageSquare, label: "Messages", href: "/brand/messages", notifKey: 'messages' as const },
    { icon: Settings, label: "Paramètres", href: "/brand/settings", notifKey: null },
]

const creatorMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/creator", notifKey: null },
    { icon: Search, label: "Marketplace", href: "/marketplace?tab=campaigns", notifKey: null },
    { icon: Briefcase, label: "Missions", href: "/creator/missions", notifKey: 'applications' as const },
    { icon: Upload, label: "Portfolio", href: "/creator/portfolio", notifKey: null },
    { icon: Wallet, label: "Revenus", href: "/creator/earnings", notifKey: null },
    { icon: MessageSquare, label: "Messages", href: "/creator/messages", notifKey: 'messages' as const },
    { icon: Settings, label: "Paramètres", href: "/creator/settings", notifKey: null },
]

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()
    const menuItems = role === 'brand' ? brandMenuItems : creatorMenuItems

    // Try to use notifications, but handle server-side gracefully
    let unreadCounts = { total: 0, messages: 0, applications: 0, deliverables: 0 }
    try {
        const notifs = useNotifications()
        unreadCounts = notifs.unreadCounts
    } catch {
        // Not in notification context (SSR or layout without provider)
    }

    const getNotifCount = (key: 'messages' | 'applications' | 'deliverables' | null) => {
        if (!key) return 0
        return unreadCounts[key] || 0
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0A0A0A] border-r border-white/5 hidden md:flex flex-col z-40">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-1 font-bold text-lg">
                    <span className="text-white">UGC</span>
                    <span className="text-accent">Suisse</span>
                </Link>
                <Link
                    href="/"
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Link>
            </div>

            {/* Role Badge */}
            <div className="px-4 py-4">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 inline-block">
                    {role === 'brand' ? '🏢 Espace Marque' : '🎬 Espace Créateur'}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        const notifCount = getNotifCount(item.notifKey)

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon className={`h-5 w-5 ${isActive ? 'text-accent' : ''}`} />
                                    </div>
                                    {item.label}
                                    {notifCount > 0 && (
                                        <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full" />
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-white/5">
                <div className="glass-card p-4">
                    <p className="text-sm font-medium text-white mb-1">Besoin d&apos;aide?</p>
                    <p className="text-xs text-white/50 mb-3">Notre équipe est disponible 24/7</p>
                    <button className="w-full text-xs text-accent hover:underline">
                        Contacter le support →
                    </button>
                </div>
            </div>
        </aside>
    )
}
