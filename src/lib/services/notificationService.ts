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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { total: 0, messages: 0, applications: 0, deliverables: 0 }

    const { data, error } = await supabase
        .from('notifications')
        .select('type')
        .eq('user_id', user.id)
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
        'Nouveau créateur proposé',
        `${creatorName} a été proposé pour votre mission`,
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

// ================================================
// BRAND WORKFLOW FEEDBACK NOTIFICATIONS
// Bidirectional feedback loops: Brand ↔ MOSH ↔ Creator
// ================================================

/**
 * Phase 1: MOSH asks the brand to clarify/complete their brief
 */
export async function notifyBriefFeedback(
    brandId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'deliverable_revision',
        'Précisions requises sur votre brief 📋',
        `MOSH a besoin de précisions sur "${campaignTitle}". Consultez les notes et mettez à jour votre brief.`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 2: MOSH tells the brand that creator profiles are ready for review
 */
export async function notifyProfilesReady(
    brandId: string,
    campaignId: string,
    campaignTitle: string,
    count: number
): Promise<boolean> {
    return createNotification(
        brandId,
        'new_application',
        `${count} profils proposés pour votre mission 👥`,
        `Nous avons sélectionné ${count} créateurs pour "${campaignTitle}". Consultez leurs profils et choisissez votre favori.`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 2: Brand selects a creator profile → notify MOSH admin
 */
export async function notifyProfileSelected(
    adminId: string,
    campaignId: string,
    brandName: string,
    creatorName: string
): Promise<boolean> {
    return createNotification(
        adminId,
        'application_accepted',
        'Profil sélectionné par la marque ✅',
        `${brandName} a sélectionné ${creatorName} pour la mission`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 2: Brand rejects all proposed profiles → notify MOSH admin
 */
export async function notifyProfilesRejected(
    adminId: string,
    campaignId: string,
    brandName: string,
    reason: string | null
): Promise<boolean> {
    return createNotification(
        adminId,
        'application_rejected',
        'Profils refusés par la marque ⚠️',
        `${brandName} n'a retenu aucun profil${reason ? `: "${reason}"` : ''}. Proposez de nouveaux créateurs.`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 3: Script is ready for brand review
 */
export async function notifyScriptReadyForBrand(
    brandId: string,
    campaignId: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        brandId,
        'deliverable_submitted',
        'Script prêt pour validation ✍️',
        `Le script de "${campaignTitle}" est prêt. Relisez-le et validez pour lancer la production.`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 3: Brand approves the script → notify MOSH admin
 */
export async function notifyScriptApprovedByBrand(
    adminId: string,
    campaignId: string,
    brandName: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        adminId,
        'application_accepted',
        'Script validé par la marque ✅',
        `${brandName} a validé le script de "${campaignTitle}". Production autorisée.`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 3: Brand requests script changes → notify MOSH admin
 */
export async function notifyScriptFeedback(
    adminId: string,
    campaignId: string,
    brandName: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        adminId,
        'deliverable_revision',
        'Modifications script demandées ✏️',
        `${brandName} souhaite des modifications sur le script de "${campaignTitle}"`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 5: Brand approves the final video → notify MOSH admin
 */
export async function notifyBrandFinalApproval(
    adminId: string,
    campaignId: string,
    brandName: string,
    campaignTitle: string
): Promise<boolean> {
    return createNotification(
        adminId,
        'deliverable_approved',
        'Vidéo validée par la marque 🎉',
        `${brandName} a approuvé la vidéo finale de "${campaignTitle}". Mission terminée !`,
        campaignId,
        'campaign'
    )
}

/**
 * Phase 5: Brand requests revision on final video → notify MOSH admin (max 2 rounds)
 */
export async function notifyBrandRevisionRequest(
    adminId: string,
    campaignId: string,
    brandName: string,
    campaignTitle: string,
    revisionNumber: number
): Promise<boolean> {
    return createNotification(
        adminId,
        'deliverable_revision',
        `Révision demandée (${revisionNumber}/2) 🔄`,
        `${brandName} demande une révision sur la vidéo de "${campaignTitle}"`,
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

/**
 * Notify all admin users when a creator delivers a video (ready for QC)
 */
export async function notifyAdminVideoDelivered(
    campaignId: string,
    campaignTitle: string,
    creatorName?: string
): Promise<boolean> {
    const supabase = createClient()
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

    if (!admins || admins.length === 0) return false

    for (const admin of admins) {
        await createNotification(
            (admin as any).id,
            'deliverable_submitted',
            'Vidéo livrée — QC à faire 🎬',
            `${creatorName ? `${creatorName} a livré` : 'Une vidéo a été livrée'} pour "${campaignTitle}". À vérifier (QC).`,
            campaignId,
            'campaign'
        )
    }
    return true
}

/**
 * Notify all admin users when a new brief is submitted by a brand
 */
export async function notifyAdminNewBrief(
    campaignId: string,
    campaignTitle: string,
    brandName: string
): Promise<boolean> {
    const supabase = createClient()
    // Find all admin users
    const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

    if (!admins || admins.length === 0) return false

    for (const admin of admins) {
        await createNotification(
            (admin as any).id,
            'new_application',
            `Nouveau brief reçu`,
            `${brandName} a soumis un nouveau brief : "${campaignTitle}"`,
            campaignId,
            'campaign'
        )
    }
    return true
}
