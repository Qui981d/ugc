'use client'

import { useState, useEffect } from "react"
import { User, Bell, Search, LogOut, Settings, CreditCard, UserCircle, Check, CheckCheck } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import Image from "next/image"
import { getNotifications, type Notification } from "@/lib/services/notificationService"

export function Header() {
    const router = useRouter()
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

    // Get icon color based on notification type
    const getNotifIcon = (type: string) => {
        switch (type) {
            case 'new_application': return '📝'
            case 'message_received': return '💬'
            case 'deliverable_submitted': return '📦'
            case 'application_accepted': return '✅'
            case 'application_rejected': return '❌'
            default: return '🔔'
        }
    }

    // Get link based on notification type
    const getNotifLink = (notif: Notification) => {
        const basePath = user?.role === 'brand' ? '/brand' : '/creator'

        switch (notif.type) {
            case 'new_application':
                return notif.reference_id ? `/brand/campaigns/${notif.reference_id}/applicants` : '/brand/campaigns'
            case 'message_received':
                return `${basePath}/messages`
            case 'deliverable_submitted':
                return notif.reference_id ? `/brand/campaigns/${notif.reference_id}/applicants` : '/brand/campaigns'
            case 'deliverable_approved':
            case 'deliverable_revision':
            case 'deliverable_rejected':
                return '/creator/missions'
            case 'application_accepted':
            case 'application_rejected':
                return '/creator/missions'
            default:
                return basePath
        }
    }

    // Determine base path based on user role
    const basePath = user?.role === 'brand' ? '/brand' : '/creator'

    return (
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5">
            <div className="h-full flex items-center justify-between px-6">
                {/* Search */}
                <div className="flex-1 max-w-md hidden md:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-white/60 hover:text-white hover:bg-white/5"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCounts.total > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                        {unreadCounts.total > 9 ? '9+' : unreadCounts.total}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-80 bg-[#1A1A1A] border-white/10"
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                <DropdownMenuLabel className="text-white p-0">
                                    Notifications
                                </DropdownMenuLabel>
                                {unreadCounts.total > 0 && (
                                    <button
                                        onClick={() => markAllAsRead()}
                                        className="text-xs text-accent hover:underline flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Tout marquer lu
                                    </button>
                                )}
                            </div>
                            <DropdownMenuSeparator className="bg-white/10" />

                            {isLoadingNotifs ? (
                                <div className="p-4 text-center text-white/40 text-sm">
                                    Chargement...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-4 text-center text-white/40 text-sm">
                                    Aucune notification
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <DropdownMenuItem key={notif.id} asChild>
                                            <Link
                                                href={getNotifLink(notif)}
                                                onClick={() => !notif.is_read && markAsRead(notif.id)}
                                                className={`flex items-start gap-3 p-3 cursor-pointer ${!notif.is_read ? 'bg-white/5' : ''
                                                    }`}
                                            >
                                                <span className="text-lg">{getNotifIcon(notif.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${notif.is_read ? 'text-white/60' : 'text-white font-medium'}`}>
                                                        {notif.title}
                                                    </p>
                                                    {notif.message && (
                                                        <p className="text-xs text-white/40 truncate">
                                                            {notif.message}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-white/30 mt-1">
                                                        {new Date(notif.created_at).toLocaleDateString('fr-CH', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-3 px-3 hover:bg-white/5"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                    {mounted && user?.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt="Avatar"
                                            width={32}
                                            height={32}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User className="h-4 w-4 text-white/60" />
                                    )}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-white">
                                        {mounted ? (user?.full_name || 'Mon Compte') : 'Mon Compte'}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-[#1A1A1A] border-white/10"
                        >
                            <DropdownMenuLabel className="text-white/60">
                                {mounted ? (user?.email || 'Mon compte') : 'Mon compte'}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />

                            <DropdownMenuItem asChild className="text-white/80 focus:bg-white/10 focus:text-white cursor-pointer">
                                <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                                    <UserCircle className="h-4 w-4" />
                                    Profil
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="text-white/80 focus:bg-white/10 focus:text-white cursor-pointer">
                                <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Paramètres
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="text-white/80 focus:bg-white/10 focus:text-white cursor-pointer">
                                <Link href={`${basePath}/settings`} className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Facturation
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/10" />

                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="text-accent focus:bg-white/10 cursor-pointer flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Déconnexion
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
