'use client'

import { useState, useEffect } from "react"
import { User, Bell, LogOut, Settings, Check, CheckCheck, X, FileText, MessageSquare, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { useActingBrandStore } from "@/stores/useActingBrandStore"
import Image from "next/image"
import { getNotifications, type Notification } from "@/lib/services/notificationService"

export function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, profile, signOut } = useAuth()
    const { unreadCounts, markAsRead, markAllAsRead } = useNotifications()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    // Load notifications when dropdown opens
    const loadNotifications = async () => {
        setIsLoadingNotifs(true)
        const notifs = await getNotifications(10)
        setNotifications(notifs)
        setIsLoadingNotifs(false)
    }

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    // Notification glyph + tint, by type
    const getNotifIcon = (type: string) => {
        switch (type) {
            case 'new_application': return { Icon: FileText, tint: 'bg-[#EDEDEC] text-[#1A1A1A]' }
            case 'message_received': return { Icon: MessageSquare, tint: 'bg-[#EDEDEC] text-[#1A1A1A]' }
            case 'deliverable_submitted': return { Icon: Package, tint: 'bg-[#FBF3E2] text-[#8A6100]' }
            case 'application_accepted':
            case 'deliverable_approved': return { Icon: Check, tint: 'bg-[#E8F3EA] text-[#1A7F37]' }
            case 'application_rejected':
            case 'deliverable_rejected': return { Icon: X, tint: 'bg-[#FBEAE8] text-[#C0392B]' }
            default: return { Icon: Bell, tint: 'bg-[#F4F4F3] text-[#6B6B6B]' }
        }
    }

    // Get link based on notification type and user role
    const getNotifLink = (notif: Notification) => {
        const isBrand = user?.role === 'brand'
        const isAdmin = user?.role === 'admin'

        switch (notif.type) {
            case 'new_application':
                if (isAdmin) {
                    return notif.reference_id ? `/mosh-cockpit/missions/${notif.reference_id}` : '/mosh-cockpit/missions'
                }
                if (isBrand) {
                    return notif.reference_id ? `/brand/campaigns/${notif.reference_id}` : '/brand/campaigns'
                }
                return '/creator/missions'
            case 'message_received':
                if (isAdmin) return '/mosh-cockpit/messages'
                if (isBrand) return '/brand/messages'
                return '/creator/messages'
            case 'deliverable_submitted':
                if (isAdmin) {
                    return notif.reference_id ? `/mosh-cockpit/missions/${notif.reference_id}` : '/mosh-cockpit/missions'
                }
                if (isBrand) {
                    return notif.reference_id ? `/brand/campaigns/${notif.reference_id}` : '/brand/campaigns'
                }
                return '/creator/missions'
            case 'deliverable_approved':
            case 'deliverable_revision':
            case 'deliverable_rejected':
                if (isAdmin) return notif.reference_id ? `/mosh-cockpit/missions/${notif.reference_id}` : '/mosh-cockpit/missions'
                return '/creator/missions'
            case 'application_accepted':
            case 'application_rejected':
                if (isAdmin) return notif.reference_id ? `/mosh-cockpit/missions/${notif.reference_id}` : '/mosh-cockpit/missions'
                return '/creator/missions'
            default:
                return isAdmin ? '/mosh-cockpit' : isBrand ? '/brand' : '/creator'
        }
    }

    // Workspace context. An admin only counts as "acting" while they are actually
    // inside the brand workspace — the stored brand alone would mislabel the cockpit.
    const actingBrandName = useActingBrandStore((s) => s.brandName)
    const isActingAsBrand = user?.role === 'admin' && !!actingBrandName && pathname.startsWith('/brand')
    const contextLabel =
        user?.role === 'admin' ? 'Espace MOSH'
            : user?.role === 'brand' ? 'Espace marque'
                : 'Espace créateur'

    // Determine base path based on user role
    const basePath = user?.role === 'brand' ? '/brand' : user?.role === 'admin' ? '/mosh-cockpit' : '/creator'

    return (
        // Slim, opaque utility bar: workspace context on the left, alerts and the
        // account menu on the right. The page title belongs to PageHeader.
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E2E2E1]">
            <div className="h-full flex items-center justify-between gap-4 px-4 md:px-6">
                {/* Which workspace you are in. It sits here rather than in the sidebar
                    switcher so the wordmark can carry the brand on its own. */}
                <span className="min-w-0 flex items-center gap-2 text-[13px] text-[#6B6B6B] truncate">
                    {isActingAsBrand ? (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] shrink-0" />
                            <span className="truncate">
                                Espace de <strong className="font-semibold text-[#1A1A1A]">{actingBrandName}</strong>
                            </span>
                        </>
                    ) : (
                        <span className="truncate">{contextLabel}</span>
                    )}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                    {/* Notifications */}
                    {mounted ? (
                    <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-[#6B6B6B] hover:text-[#6B6B6B] hover:bg-[#F4F4F3] rounded-lg"
                            >
                                <Bell className="h-5 w-5" strokeWidth={1.5} />
                                {unreadCounts.total > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#1A1A1A] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                        {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-80 bg-white border-[#E2E2E1] shadow-xl rounded-xl"
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                <DropdownMenuLabel className="text-[#1A1A1A] p-0">
                                    Notifications
                                </DropdownMenuLabel>
                                {unreadCounts.total > 0 && (
                                    <button
                                        onClick={() => markAllAsRead()}
                                        className="text-xs text-[#1A1A1A] hover:underline flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Tout marquer lu
                                    </button>
                                )}
                            </div>
                            <DropdownMenuSeparator className="bg-[#E2E2E1]" />

                            {isLoadingNotifs ? (
                                <div className="p-4 text-center text-[#9B9B9B] text-sm">
                                    Chargement...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-4 text-center text-[#9B9B9B] text-sm">
                                    Aucune notification
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {notifications.map((notif) => {
                                        const { Icon, tint } = getNotifIcon(notif.type)
                                        return (
                                            <DropdownMenuItem key={notif.id} asChild>
                                                <Link
                                                    href={getNotifLink(notif)}
                                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer ${!notif.is_read ? 'bg-[#FAFAF9]' : ''}`}
                                                >
                                                    <span className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${tint}`}>
                                                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] leading-snug ${notif.is_read ? 'text-[#6B6B6B]' : 'text-[#1A1A1A] font-semibold'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {notif.message && (
                                                            <p className="text-[12px] text-[#6B6B6B] truncate">{notif.message}</p>
                                                        )}
                                                        <p className="text-[11px] text-[#9B9B9B] mt-0.5 tabular-nums">
                                                            {new Date(notif.created_at).toLocaleDateString('fr-CH', {
                                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    {!notif.is_read && (
                                                        <span className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full shrink-0 mt-2" />
                                                    )}
                                                </Link>
                                            </DropdownMenuItem>
                                        )
                                    })}
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    ) : (
                        <div className="w-10 h-10 flex items-center justify-center text-[#6B6B6B]">
                            <Bell className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                    )}

                    {/* User Menu */}
                    {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-3 px-3 hover:bg-[#F4F4F3] rounded-lg"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#F4F4F3] flex items-center justify-center overflow-hidden">
                                    {user?.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt="Avatar"
                                            width={32}
                                            height={32}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User className="h-4 w-4 text-[#6B6B6B]" />
                                    )}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-[#6B6B6B]">
                                        {user?.role === 'admin' ? 'Mosh' : user?.full_name || 'Mon Compte'}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-white border-[#E2E2E1] shadow-xl rounded-xl"
                        >
                            <div className="px-2 py-2">
                                <p className="text-sm font-medium text-[#1A1A1A]">
                                    {user?.role === 'admin' ? 'Mosh' : user?.full_name || 'Mon compte'}
                                </p>
                                <p className="text-xs text-[#6B6B6B] mt-0.5">
                                    {user?.email || ''}
                                </p>
                                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#1A1A1A]/5 text-[#6B6B6B]">
                                    {user?.role === 'admin' ? 'Admin' : user?.role === 'brand' ? 'Marque' : 'Créateur'}
                                </span>
                            </div>
                            <DropdownMenuSeparator className="bg-[#E2E2E1]" />

                            <DropdownMenuItem asChild className="text-[#1A1A1A] focus:bg-[#F4F4F3] focus:text-[#1A1A1A] cursor-pointer">
                                <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Paramètres
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-[#E2E2E1]" />

                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="text-[#C0392B] focus:bg-[#F4F4F3] cursor-pointer flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Déconnexion
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-[#F4F4F3] flex items-center justify-center">
                            <User className="h-4 w-4 text-[#6B6B6B]" />
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
