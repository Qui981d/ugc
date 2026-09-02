'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useActingBrandStore } from '@/stores/useActingBrandStore'

interface NotificationCounts {
    total: number
    messages: number
    applications: number
    deliverables: number
}

interface NotificationContextValue {
    unreadCounts: NotificationCounts
    refreshCounts: () => Promise<void>
    markAsRead: (notificationId: string) => Promise<void>
    markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const pathname = usePathname()
    const actingBrandId = useActingBrandStore(s => s.brandId)

    /**
     * Whose notifications these are.
     *
     * A managed brand never signs in — MOSH works inside its space while still
     * authenticated as an admin. Reading auth.uid() therefore showed the
     * admin's own bell, and everything addressed to the brand (brief approved,
     * creators proposed) piled up unseen. Inside /brand, the acted-upon brand
     * is the audience.
     */
    const isActingAsBrand = user?.role === 'admin' && !!actingBrandId && pathname.startsWith('/brand')
    const userId = (isActingAsBrand ? actingBrandId : user?.id) ?? null
    const [unreadCounts, setUnreadCounts] = useState<NotificationCounts>({
        total: 0,
        messages: 0,
        applications: 0,
        deliverables: 0,
    })

    const refreshCounts = useCallback(async () => {
        if (!userId) {
            setUnreadCounts({ total: 0, messages: 0, applications: 0, deliverables: 0 })
            return
        }

        const supabase = createClient()

        const { data, error } = await supabase
            .from('notifications')
            .select('type')
            .eq('user_id', userId)
            .eq('is_read', false)

        if (error) {
            console.error('Error fetching notification counts:', error)
            return
        }

        const notifications = data || []

        setUnreadCounts({
            total: notifications.length,
            messages: notifications.filter((n: any) => n.type === 'message_received').length,
            applications: notifications.filter((n: any) =>
                ['new_application', 'application_accepted', 'application_rejected'].includes(n.type)
            ).length,
            deliverables: notifications.filter((n: any) => n.type === 'deliverable_submitted').length,
        })
    }, [userId])

    const markAsRead = useCallback(async (notificationId: string) => {
        const supabase = createClient()

        await (supabase
            .from('notifications') as ReturnType<typeof supabase.from>)
            .update({ is_read: true })
            .eq('id', notificationId)

        refreshCounts()
    }, [refreshCounts])

    const markAllAsRead = useCallback(async () => {
        if (!userId) return

        const supabase = createClient()

        await (supabase
            .from('notifications') as ReturnType<typeof supabase.from>)
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        setUnreadCounts({ total: 0, messages: 0, applications: 0, deliverables: 0 })
    }, [userId])

    // Fetch counts on mount and when user changes
    useEffect(() => {
        refreshCounts()
    }, [refreshCounts])

    // Subscribe to real-time updates
    useEffect(() => {
        if (!userId) return

        const supabase = createClient()

        const subscription = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    refreshCounts()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [userId, refreshCounts])

    return (
        <NotificationContext.Provider value={{ unreadCounts, refreshCounts, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
