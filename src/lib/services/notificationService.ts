import { createClient } from '@/lib/supabase/client'

// Types
export type NotificationType =
    | 'new_application'
    | 'message_received'
    | 'deliverable_submitted'
    | 'deliverable_approved'
    | 'deliverable_revision'
    | 'deliverable_rejected'
    | 'application_accepted'
    | 'application_rejected'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    message: string | null
    reference_id: string | null
    reference_type: string | null
    is_read: boolean
    created_at: string
}

export interface NotificationCounts {
    total: number
    messages: number
    applications: number
    deliverables: number
}

/**
 * Get unread notifications for the current user
 */
export async function getNotifications(limit = 20): Promise<Notification[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching notifications:', error)
        return []
    }

    return (data || []) as Notification[]
}

/**
 * Get count of unread notifications by type
 */
export async function getUnreadCounts(): Promise<NotificationCounts> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('type')
        .eq('is_read', false)

    if (error) {
        console.error('Error fetching unread counts:', error)
        return { total: 0, messages: 0, applications: 0, deliverables: 0 }
    }

    const notifications = data || []

    return {
        total: notifications.length,
        messages: notifications.filter((n: any) => n.type === 'message_received').length,
        applications: notifications.filter((n: any) =>
            ['new_application', 'application_accepted', 'application_rejected'].includes(n.type)
        ).length,
        deliverables: notifications.filter((n: any) => n.type === 'deliverable_submitted').length,
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await (supabase
        .from('notifications') as ReturnType<typeof supabase.from>)
        .update({ is_read: true })
        .eq('id', notificationId)

    if (error) {
        console.error('Error marking notification as read:', error)
        return false
    }

    return true
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<boolean> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await (supabase
        .from('notifications') as ReturnType<typeof supabase.from>)
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

    if (error) {
        console.error('Error marking all as read:', error)
        return false
    }

    return true
}

/**
 * Create a notification
 */
export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message?: string,
    referenceId?: string,
    referenceType?: string
): Promise<boolean> {
    const supabase = createClient()

    const { error } = await (supabase
        .from('notifications') as ReturnType<typeof supabase.from>)
        .insert({
            user_id: userId,
            type,
            title,
            message,
            reference_id: referenceId,
            reference_type: referenceType,
        })

    if (error) {
        console.error('Error creating notification:', error)
        return false
    }

    return true
}

// Convenience functions for specific notification types
export async function notifyNewApplication(
    brandId: string,
    campaignId: string,
    creatorName: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'new_application',
        'Nouvelle candidature',
        `${creatorName} a postulé à votre campagne`,
        campaignId,
        'campaign'
    )
}

export async function notifyMessageReceived(
    userId: string,
    conversationId: string,
    senderName: string
): Promise<boolean> {
    return createNotification(
        userId,
        'message_received',
        'Nouveau message',
        `${senderName} vous a envoyé un message`,
        conversationId,
        'conversation'
    )
}

export async function notifyApplicationStatus(
    creatorId: string,
    campaignId: string,
    status: 'accepted' | 'rejected',
    campaignTitle: string
): Promise<boolean> {
    const type = status === 'accepted' ? 'application_accepted' : 'application_rejected'
    const title = status === 'accepted' ? 'Candidature acceptée !' : 'Candidature refusée'
    const message = status === 'accepted'
        ? `Votre candidature pour "${campaignTitle}" a été acceptée`
        : `Votre candidature pour "${campaignTitle}" a été refusée`

    return createNotification(
        creatorId,
        type,
        title,
        message,
        campaignId,
        'campaign'
    )
}

export async function notifyDeliverableSubmitted(
    brandId: string,
    campaignId: string,
    creatorName: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'deliverable_submitted',
        'Livrable reçu',
        `${creatorName} a soumis un livrable`,
        campaignId,
        'campaign'
    )
}

export async function notifyDeliverableApproved(
    creatorId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        creatorId,
        'deliverable_approved',
        'Livrable approuvé ! 🎉',
        `Votre livrable pour "${campaignTitle}" a été approuvé`,
        campaignId,
        'campaign'
    )
}

export async function notifyDeliverableRevision(
    creatorId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        creatorId,
        'deliverable_revision',
        'Révision demandée',
        `La marque a demandé des modifications pour "${campaignTitle}"`,
        campaignId,
        'campaign'
    )
}

export async function notifyDeliverableRejected(
    creatorId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        creatorId,
        'deliverable_rejected',
        'Livrable refusé',
        `Votre livrable pour "${campaignTitle}" a été refusé`,
        campaignId,
        'campaign'
    )
}

// ================================================
// ADMIN WORKFLOW NOTIFICATIONS
// These use existing enum types to avoid DB migration issues
// ================================================

/**
 * Notify a creator they've been proposed for a mission by MOSH
 */
export async function notifyCreatorProposed(
    creatorId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        creatorId,
        'new_application',
        'Nouvelle mission proposée 🎯',
        `MOSH vous a sélectionné pour la mission "${campaignTitle}"`,
        campaignId,
        'campaign'
    )
}

/**
 * Notify a creator they've been assigned to a mission
 */
export async function notifyCreatorAssigned(
    creatorId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        creatorId,
        'application_accepted',
        'Mission confirmée ! 🎉',
        `Vous êtes assigné à la mission "${campaignTitle}". Préparez-vous !`,
        campaignId,
        'campaign'
    )
}

/**
 * Notify a brand that a creator has been assigned to their campaign
 */
export async function notifyBrandCreatorAssigned(
    brandId: string,
    campaignId: string,
    creatorName: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'new_application',
        'Créateur assigné ✅',
        `${creatorName} a été assigné à votre campagne par MOSH`,
        campaignId,
        'campaign'
    )
}

/**
 * Notify a creator that the script has been validated
 */
export async function notifyScriptValidated(
    creatorId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        creatorId,
        'application_accepted',
        'Script validé ✅',
        `Le script de la mission "${campaignTitle}" a été validé. Vous pouvez commencer le tournage !`,
        campaignId,
        'campaign'
    )
}

/**
 * Notify a brand that their video is ready
 */
export async function notifyVideoReady(
    brandId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'deliverable_submitted',
        'Votre vidéo est prête ! 🎬',
        `La vidéo pour "${campaignTitle}" a été validée et est prête à être récupérée`,
        campaignId,
        'campaign'
    )
}

/**
 * Notify a brand that their brief has been validated by MOSH
 */
export async function notifyBriefValidated(
    brandId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'application_accepted',
        'Brief validé par MOSH ✅',
        `Votre brief "${campaignTitle}" a été validé. Nous recherchons le créateur idéal.`,
        campaignId,
        'campaign'
    )
}

/**
 * Subscribe to real-time notification updates
 */
export function subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
) {
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
            (payload) => {
                callback(payload.new as Notification)
            }
        )
        .subscribe()

    return () => {
        supabase.removeChannel(subscription)
    }
}
