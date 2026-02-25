'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
    LayoutDashboard,
    Megaphone,
    Users,
    MessageSquare,
    Settings,
    Briefcase,
    Upload,
    Building2,
    ClipboardList,
    PanelLeftClose,
    PanelLeft,
    MoreHorizontal
} from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"

interface SidebarProps {
    role: 'brand' | 'creator' | 'admin'
}

const brandMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/brand", notifKey: null },
    { icon: Megaphone, label: "Mes briefs", href: "/brand/campaigns", notifKey: 'applications' as const },
    { icon: MessageSquare, label: "Messages", href: "/brand/messages", notifKey: 'messages' as const },
    { icon: Settings, label: "Paramètres", href: "/brand/settings", notifKey: null },
]

const creatorMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/creator", notifKey: null },
    { icon: Briefcase, label: "Missions", href: "/creator/missions", notifKey: 'applications' as const },
    { icon: Upload, label: "Portfolio", href: "/creator/portfolio", notifKey: null },
    { icon: MessageSquare, label: "Messages", href: "/creator/messages", notifKey: 'messages' as const },
    { icon: Settings, label: "Paramètres", href: "/creator/settings", notifKey: null },
]

const adminMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/mosh-cockpit", notifKey: null },
    { icon: ClipboardList, label: "Pipeline", href: "/mosh-cockpit/missions", notifKey: 'applications' as const },
    { icon: MessageSquare, label: "Messages", href: "/mosh-cockpit/messages", notifKey: 'messages' as const },
    { icon: Users, label: "Créateurs", href: "/mosh-cockpit/creators", notifKey: null },
    { icon: Building2, label: "Marques", href: "/mosh-cockpit/brands", notifKey: null },
]

const roleConfig = {
    admin: { logoText: 'Mosh', logoHref: '/mosh-cockpit', badge: 'Admin' },
    brand: { logoText: 'Mosh', logoHref: '/brand', badge: 'Marque' },
    creator: { logoText: 'Mosh', logoHref: '/creator', badge: 'Créateur' },
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()
    const [expanded, setExpanded] = useState(false)
    const menuItems = role === 'brand' ? brandMenuItems : role === 'admin' ? adminMenuItems : creatorMenuItems
    const config = roleConfig[role]

    let unreadCounts = { total: 0, messages: 0, applications: 0, deliverables: 0 }
    try {
        const notifs = useNotifications()
        unreadCounts = notifs.unreadCounts
    } catch { }

    const getNotifCount = (key: 'messages' | 'applications' | 'deliverables' | null) => {
        if (!key) return 0
        return unreadCounts[key] || 0
    }

    return (
        <>
            {/* Backdrop for expanded sidebar on mobile */}
            {expanded && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setExpanded(false)}
                />
            )}

            <aside
                className={`
                    fixed left-3 top-3 bottom-3 z-40
                    hidden md:flex flex-col items-center
                    bg-[#1A1A1D] rounded-2xl
                    py-4 gap-1
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    shadow-xl shadow-black/10
                    ${expanded ? 'w-[200px]' : 'w-[64px]'}
                `}
            >
                {/* Logo */}
                <Link
                    href={config.logoHref}
                    className={`
                        flex items-center gap-2.5 rounded-xl
                        bg-white/[0.07] hover:bg-white/[0.12]
                        border border-white/[0.08]
                        transition-all duration-200
                        ${expanded ? 'w-[calc(100%-24px)] px-3 py-2.5 mb-3' : 'w-11 h-11 justify-center mb-4'}
                    `}
                >
                    <span className="text-white font-black text-sm flex-shrink-0">M</span>
                    {expanded && (
                        <span className="text-white/70 text-sm font-medium truncate">
                            {config.logoText}
                        </span>
                    )}
                </Link>

                {/* Role badge */}
                {expanded && (
                    <div className="w-[calc(100%-24px)] px-1 mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B70]">
                            {config.badge}
                        </span>
                    </div>
                )}

                {/* Nav items */}
                <nav className={`flex-1 flex flex-col gap-1.5 w-full ${expanded ? 'px-3' : 'px-2'}`}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && item.href !== '/brand' && item.href !== '/creator' && item.href !== '/mosh-cockpit'
                                && pathname.startsWith(item.href))
                        const notifCount = getNotifCount(item.notifKey)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.label}
                                className={`
                                    relative flex items-center gap-3 rounded-xl
                                    transition-all duration-200
                                    ${expanded ? 'px-3 py-2.5' : 'w-[44px] h-[44px] justify-center mx-auto'}
                                    ${isActive
                                        ? 'bg-[#C4F042] text-[#1A1A1D] shadow-md shadow-[#C4F042]/20'
                                        : 'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]'
                                    }
                                `}
                            >
                                <item.icon
                                    className="w-[19px] h-[19px] flex-shrink-0"
                                    strokeWidth={1.5}
                                />
                                {expanded && (
                                    <span className={`text-sm font-medium truncate ${isActive ? 'text-[#1A1A1D]' : ''}`}>
                                        {item.label}
                                    </span>
                                )}
                                {notifCount > 0 && (
                                    <span className={`
                                        absolute w-2 h-2 bg-red-500 rounded-full
                                        ${expanded ? 'right-2 top-1/2 -translate-y-1/2' : '-top-0.5 -right-0.5'}
                                        border-2 border-[#1A1A1D]
                                    `} />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Separator */}
                <div className={`flex items-center justify-center my-1 ${expanded ? 'px-3' : ''}`}>
                    <MoreHorizontal className="w-[18px] h-[18px] text-[#4A4A4E]" strokeWidth={1.5} />
                </div>

                {/* Collapse / Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`
                        flex items-center gap-2 rounded-xl
                        text-[#6B6B70] hover:text-white hover:bg-white/[0.06]
                        transition-all duration-200 mb-2
                        ${expanded ? 'w-[calc(100%-24px)] px-3 py-2.5' : 'w-[44px] h-[44px] justify-center'}
                    `}
                    title={expanded ? 'Réduire' : 'Agrandir'}
                >
                    {expanded ? (
                        <>
                            <PanelLeftClose className="w-[19px] h-[19px] flex-shrink-0" strokeWidth={1.5} />
                            <span className="text-sm font-medium">Réduire</span>
                        </>
                    ) : (
                        <PanelLeft className="w-[19px] h-[19px]" strokeWidth={1.5} />
                    )}
                </button>

                {/* Bottom avatar */}
                <div className={`${expanded ? 'w-[calc(100%-24px)] px-3' : ''}`}>
                    <div className={`
                        rounded-full bg-gradient-to-br from-[#C4F042] to-[#8AB800]
                        flex items-center justify-center
                        ${expanded ? 'w-8 h-8' : 'w-9 h-9'}
                    `}>
                        <span className="text-[#1A1A1D] text-xs font-bold">
                            {role === 'admin' ? 'A' : role === 'brand' ? 'B' : 'C'}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    )
}
