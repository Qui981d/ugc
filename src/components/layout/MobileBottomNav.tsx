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
    { icon: Megaphone, label: "Mes briefs", href: "/brand/campaigns", notifKey: 'applications' },
    { icon: MessageSquare, label: "Messages", href: "/brand/messages", notifKey: 'messages' },
    { icon: Settings, label: "Paramètres", href: "/brand/settings" },
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
                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors ${isActive
                    ? 'text-[#6C3FA0]'
                    : 'text-gray-400 active:text-gray-600'
                    }`}
            >
                <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {notifCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
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
                        className="fixed inset-0 z-[45] bg-black/30 md:hidden"
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
                        className="fixed bottom-16 left-0 right-0 z-[46] md:hidden bg-white border-t border-gray-200 rounded-t-2xl shadow-xl"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                    >
                        <div className="p-4 space-y-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-500">Plus</p>
                                <button onClick={() => setMoreOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
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
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-center justify-around h-16">
                    {isBrand ? (
                        // Brand: 5 direct items
                        brandItems.map(renderNavItem)
                    ) : (
                        // Creator: 3 main items + "Plus" button
                        <>
                            {creatorMainItems.map(renderNavItem)}
                            <button
                                onClick={() => setMoreOpen(!moreOpen)}
                                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors ${moreOpen || isMoreItemActive
                                    ? 'text-[#6C3FA0]'
                                    : 'text-gray-400 active:text-gray-600'
                                    }`}
                            >
                                <MoreHorizontal className="h-5 w-5" />
                                <span className="text-[10px] font-medium leading-none">Plus</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </>
    )
}
