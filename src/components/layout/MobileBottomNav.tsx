'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Megaphone,
    MessageSquare,
    Briefcase,
    Upload,
    Settings,
    MoreHorizontal,
    X,
} from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"
import { useAuth } from "@/contexts/AuthContext"
import { AnimatePresence, motion } from "framer-motion"

interface NavItem {
    icon: typeof LayoutDashboard
    label: string
    href: string
    notifKey?: 'messages' | 'applications' | 'deliverables'
}

const brandItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/brand" },
    { icon: Megaphone, label: "Briefs", href: "/brand/campaigns", notifKey: 'applications' },
    { icon: MessageSquare, label: "Messages", href: "/brand/messages", notifKey: 'messages' },
    { icon: Settings, label: "Réglages", href: "/brand/settings" },
]

const creatorMainItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/creator" },
    { icon: Briefcase, label: "Missions", href: "/creator/missions", notifKey: 'applications' },
    { icon: MessageSquare, label: "Messages", href: "/creator/messages", notifKey: 'messages' },
]

const creatorMoreItems: NavItem[] = [
    { icon: Upload, label: "Portfolio", href: "/creator/portfolio" },
    { icon: Settings, label: "Paramètres", href: "/creator/settings" },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const { user } = useAuth()
    const [moreOpen, setMoreOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    let unreadCounts = { total: 0, messages: 0, applications: 0, deliverables: 0 }
    try {
        const notifs = useNotifications()
        unreadCounts = notifs.unreadCounts
    } catch {
        // Not in notification context
    }

    useEffect(() => {
        setMounted(true)
    }, [])

    const role = user?.role
    if (!mounted || !role) return null

    const isBrand = role === 'brand'

    // Check if any "more" item is active
    const isMoreItemActive = !isBrand && creatorMoreItems.some(
        item => pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
    )

    const renderNavItem = (item: NavItem) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
        const notifCount = item.notifKey ? (unreadCounts[item.notifKey] || 0) : 0

        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-all duration-200 ${isActive
                    ? 'text-[#C4F042]'
                    : 'text-[#6B6B70] active:text-white'
                    }`}
            >
                <div className="relative">
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                    {notifCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-[#1A1A1D]">
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
        )
    }

    return (
        <>
            {/* More Menu Overlay (creator only) */}
            <AnimatePresence>
                {moreOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[45] bg-black/40 md:hidden"
                        onClick={() => setMoreOpen(false)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {moreOpen && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-16 left-2 right-2 z-[46] md:hidden bg-[#27272A] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                    >
                        <div className="p-4 space-y-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B70]">Plus</p>
                                <button onClick={() => setMoreOpen(false)} className="p-1 text-[#6B6B70] hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {creatorMoreItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMoreOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-[#C4F042] text-[#1A1A1D]'
                                            : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" strokeWidth={1.5} />
                                        <span className="font-medium text-sm">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar - Dark theme matching sidebar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#1A1A1D]/95 backdrop-blur-xl border-t border-white/[0.06]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-center justify-around h-16">
                    {isBrand ? (
                        brandItems.map(renderNavItem)
                    ) : (
                        <>
                            {creatorMainItems.map(renderNavItem)}
                            <button
                                onClick={() => setMoreOpen(!moreOpen)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-all duration-200 ${moreOpen || isMoreItemActive
                                    ? 'text-[#C4F042]'
                                    : 'text-[#6B6B70] active:text-white'
                                    }`}
                            >
                                <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
                                <span className="text-[10px] font-medium leading-none">Plus</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </>
    )
}
