'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
    PanelLeft,
    Wallet,
    ChevronsUpDown,
    ArrowLeftRight,
    UserCog,
} from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"
import { useActingBrandStore } from "@/stores/useActingBrandStore"
import { MoshLogo } from "@/components/brand/MoshLogo"

interface SidebarProps {
    role: 'brand' | 'creator' | 'admin'
    userName?: string
    onExpandChange?: (expanded: boolean) => void
}

type NotifKey = 'messages' | 'applications' | 'deliverables' | null
interface NavItem { icon: typeof LayoutDashboard; label: string; href: string; notifKey: NotifKey }
interface NavGroup { label: string | null; items: NavItem[] }

// Nav is grouped so the sidebar reads as a structure, not a flat list of links.
const NAV: Record<SidebarProps['role'], NavGroup[]> = {
    brand: [
        { label: null, items: [{ icon: LayoutDashboard, label: "Vue d'ensemble", href: "/brand", notifKey: null }] },
        {
            label: 'Travail', items: [
                { icon: Megaphone, label: "Briefs", href: "/brand/campaigns", notifKey: null },
                { icon: MessageSquare, label: "Messages", href: "/brand/messages", notifKey: 'messages' },
            ]
        },
        { label: null, items: [{ icon: Settings, label: "Paramètres", href: "/brand/settings", notifKey: null }] },
    ],
    creator: [
        { label: null, items: [{ icon: LayoutDashboard, label: "Vue d'ensemble", href: "/creator", notifKey: null }] },
        {
            label: 'Travail', items: [
                { icon: Briefcase, label: "Missions", href: "/creator/missions", notifKey: 'applications' },
                { icon: MessageSquare, label: "Messages", href: "/creator/messages", notifKey: 'messages' },
            ]
        },
        {
            label: 'Profil', items: [
                { icon: Wallet, label: "Revenus", href: "/creator/earnings", notifKey: null },
                { icon: Upload, label: "Portfolio", href: "/creator/portfolio", notifKey: null },
                { icon: Settings, label: "Paramètres", href: "/creator/settings", notifKey: null },
            ]
        },
    ],
    admin: [
        { label: null, items: [{ icon: LayoutDashboard, label: "Vue d'ensemble", href: "/mosh-cockpit", notifKey: null }] },
        {
            label: 'Production', items: [
                { icon: ClipboardList, label: "Missions", href: "/mosh-cockpit/missions", notifKey: 'applications' },
                { icon: MessageSquare, label: "Messages", href: "/mosh-cockpit/messages", notifKey: 'messages' },
            ]
        },
        {
            label: 'Répertoire', items: [
                { icon: Building2, label: "Marques", href: "/mosh-cockpit/brands", notifKey: null },
                { icon: Users, label: "Créateurs", href: "/mosh-cockpit/creators", notifKey: null },
            ]
        },
        { label: null, items: [{ icon: UserCog, label: "Équipe", href: "/mosh-cockpit/team", notifKey: null }] },
    ],
}

const ROLE_LABEL: Record<SidebarProps['role'], string> = {
    admin: 'Espace MOSH',
    brand: 'Espace marque',
    creator: 'Espace créateur',
}

const HOME: Record<SidebarProps['role'], string> = {
    admin: '/mosh-cockpit',
    brand: '/brand',
    creator: '/creator',
}

export function Sidebar({ role, userName, onExpandChange }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [expanded, setExpanded] = useState(true)
    const groups = NAV[role]

    const actingBrandName = useActingBrandStore((s) => s.brandName)
    const clearActing = useActingBrandStore((s) => s.clear)
    const isActingAsBrand = role === 'brand' && !!actingBrandName

    const toggle = () => {
        const next = !expanded
        setExpanded(next)
        onExpandChange?.(next)
    }

    let unreadCounts = { total: 0, messages: 0, applications: 0, deliverables: 0 }
    try {
        unreadCounts = useNotifications().unreadCounts
    } catch { }

    const countFor = (key: NotifKey) => (key ? unreadCounts[key] || 0 : 0)

    // A nav item is active on exact match, or on prefix match for sub-routes
    // (but the section root must not stay active for every child page).
    const isActive = (href: string) =>
        pathname === href || (href !== HOME[role] && pathname.startsWith(`${href}/`))

    // The workspace label is the one thing that tells you *where you are*.
    const workspaceName = isActingAsBrand ? actingBrandName! : (userName || 'MOSH')
    const workspaceInitial = workspaceName.charAt(0).toUpperCase()
    const isMoshOwnSpace = role === 'admin' && !isActingAsBrand

    return (
        <aside
            className={`
                fixed left-0 top-0 bottom-0 z-40
                hidden md:flex flex-col
                bg-white border-r border-[#E2E2E1]
                transition-[width] duration-200 ease-out
                ${expanded ? 'w-[240px]' : 'w-[60px]'}
            `}
        >
            {/* ── Workspace switcher: identity + context, always first ── */}
            <div className="h-14 flex items-center border-b border-[#E2E2E1] px-2 shrink-0">
                <Link
                    href={HOME[role]}
                    title={workspaceName}
                    className={`
                        flex items-center gap-2.5 rounded-lg min-w-0
                        hover:bg-[#F4F4F3] transition-colors
                        ${expanded ? 'flex-1 px-2 py-1.5' : 'w-11 h-11 justify-center'}
                    `}
                >
                    {/* In MOSH's own space the workspace *is* the brand, so the wordmark
                        carries it — no monogram tile. Acting on a client's behalf inverts
                        the badge: reversing the fill is how a monochrome system says
                        "this isn't you". The context label lives in the top bar. */}
                    {isMoshOwnSpace ? (
                        <MoshLogo className={`shrink-0 text-[#1A1A1A] ${expanded ? 'h-[22px] w-auto' : 'h-4 w-auto'}`} />
                    ) : (
                        <>
                            <span className={`
                                w-7 h-7 rounded-md shrink-0 grid place-items-center
                                text-[11px] font-bold
                                ${isActingAsBrand
                                    ? 'bg-white text-[#1A1A1A] ring-[1.5px] ring-[#1A1A1A]'
                                    : 'bg-[#1A1A1A] text-white'}
                            `}>
                                {workspaceInitial}
                            </span>
                            {expanded && (
                                <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#1A1A1A] truncate">
                                    {workspaceName}
                                </span>
                            )}
                        </>
                    )}
                    {expanded && <ChevronsUpDown className="w-3.5 h-3.5 text-[#9B9B9B] shrink-0 ml-auto" strokeWidth={2} />}
                </Link>
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
                {groups.map((group, gi) => (
                    <div key={gi} className="flex flex-col gap-0.5">
                        {expanded && group.label && (
                            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#9B9B9B]">
                                {group.label}
                            </div>
                        )}
                        {group.items.map((item) => {
                            const active = isActive(item.href)
                            const count = countFor(item.notifKey)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={item.label}
                                    className={`
                                        group relative flex items-center gap-2.5 rounded-md h-8
                                        transition-colors
                                        ${expanded ? 'px-2' : 'w-11 justify-center mx-auto'}
                                        ${active
                                            ? 'bg-[#EDEDEC] text-[#1A1A1A]'
                                            : 'text-[#6B6B6B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A]'
                                        }
                                    `}
                                >
                                    <item.icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                                    {expanded && (
                                        <span className={`text-[13px] truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                    {count > 0 && (
                                        expanded ? (
                                            <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-semibold grid place-items-center tabular-nums">
                                                {count > 99 ? '99+' : count}
                                            </span>
                                        ) : (
                                            <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-[#1A1A1A] ring-2 ring-white" />
                                        )
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </nav>

            {/* ── Exit "acting as" — the way back is where you switched from ── */}
            {isActingAsBrand && (
                <div className="px-2 pb-2 shrink-0">
                    <button
                        onClick={() => { clearActing(); router.push('/mosh-cockpit/brands') }}
                        title="Revenir à l'espace MOSH"
                        className={`
                            flex items-center gap-2.5 rounded-md h-8 w-full
                            text-[#1A1A1A] hover:bg-[#EDEDEC] transition-colors
                            ${expanded ? 'px-2' : 'justify-center'}
                        `}
                    >
                        <ArrowLeftRight className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                        {expanded && <span className="text-[13px] font-medium truncate">Revenir à MOSH</span>}
                    </button>
                </div>
            )}

            {/* ── Footer: who you are + collapse ── */}
            <div className="border-t border-[#E2E2E1] p-2 flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2.5 min-w-0 ${expanded ? 'flex-1' : 'mx-auto'}`}>
                    <span
                        className="w-7 h-7 rounded-full bg-[#F4F4F3] border border-[#E2E2E1] grid place-items-center text-[11px] font-semibold text-[#6B6B6B] shrink-0"
                        suppressHydrationWarning
                    >
                        {userName?.charAt(0)?.toUpperCase() || role.charAt(0).toUpperCase()}
                    </span>
                    {expanded && (
                        <span className="min-w-0 text-[12px] text-[#6B6B6B] truncate" suppressHydrationWarning>
                            {userName || 'Mon compte'}
                        </span>
                    )}
                </div>
                {expanded && (
                    <button
                        onClick={toggle}
                        title="Réduire le menu"
                        className="w-7 h-7 rounded-md grid place-items-center text-[#9B9B9B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors shrink-0"
                    >
                        <PanelLeft className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                )}
            </div>

            {!expanded && (
                <button
                    onClick={toggle}
                    title="Agrandir le menu"
                    className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white border border-[#E2E2E1] grid place-items-center text-[#6B6B6B] hover:text-[#1A1A1A] shadow-sm"
                >
                    <PanelLeft className="w-3 h-3 rotate-180" strokeWidth={2} />
                </button>
            )}
        </aside>
    )
}
