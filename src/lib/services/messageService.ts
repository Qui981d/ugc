import { createClient } from '@/lib/supabase/client'
import type { Message, User, Campaign } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type MessageWithSender = Message & {
    sender: User
}

export type Conversation = {
    campaign: Campaign
    lastMessage: Message
    unreadCount: number
    otherUser: User
}

// Max message length (matches DB constraint)
const MAX_MESSAGE_LENGTH = 5000

/**
 * Get all conversations for current user
 * OPTIMIZED: Pre-fetches all needed data in 3 queries instead of N+1
 */
export async function getConversations(): Promise<Conversation[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user role
    const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!userRow) return []

    const userData = userRow as unknown as Pick<User, 'role'>

    // Get campaigns with messages
    const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
            *,
            campaign:campaigns(*),
            sender:users!sender_id(*)
        `)
        .order('created_at', { ascending: false })

    if (error || !messagesData) return []

    const messages = messagesData as unknown as Array<Message & { campaign: Campaign; sender: User }>

    // Collect all unique campaign IDs first
    const campaignIds = [...new Set(messages.map(m => m.campaign?.id).filter(Boolean))]

    if (campaignIds.length === 0) return []

    // PRE-FETCH: Get all relevant users in a single batch query
    let otherUsersMap = new Map<string, User>()

    if (userData.role === 'brand') {
        // For brand: get all creators who have accepted applications on these campaigns
        const { data: appData } = await supabase
            .from('applications')
            .select('campaign_id, creator:users!creator_id(*)')
            .in('campaign_id', campaignIds)
            .in('status', ['accepted', 'completed'])

        if (appData) {
            for (const app of appData as unknown as Array<{ campaign_id: string; creator: User }>) {
                if (app.creator) {
                    otherUsersMap.set(app.campaign_id, app.creator)
                }
            }
        }
    } else {
        // For creator: get all brand owners of these campaigns
        const brandIds = [...new Set(messages.map(m => m.campaign?.brand_id).filter(Boolean))]
        if (brandIds.length > 0) {
            const { data: brandsData } = await supabase
                .from('users')
                .select('*')
                .in('id', brandIds)

            if (brandsData) {
                const brandsById = new Map<string, User>()
                for (const brand of brandsData as unknown as User[]) {
                    brandsById.set(brand.id, brand)
                }
                for (const msg of messages) {
                    if (msg.campaign && !otherUsersMap.has(msg.campaign.id)) {
                        const brand = brandsById.get(msg.campaign.brand_id)
                        if (brand) otherUsersMap.set(msg.campaign.id, brand)
                    }
                }
            }
        }
    }

    // Group by campaign and get last message
    const conversationsMap = new Map<string, Conversation>()

    for (const msg of messages) {
        const campaign = msg.campaign
        if (!campaign) continue

        if (!conversationsMap.has(campaign.id)) {
            const otherUser = otherUsersMap.get(campaign.id) || msg.sender

            conversationsMap.set(campaign.id, {
                campaign,
                lastMessage: msg,
                unreadCount: (!msg.is_read && msg.sender_id !== user.id) ? 1 : 0,
                otherUser,
            })
        } else if (!msg.is_read && msg.sender_id !== user.id) {
            const conv = conversationsMap.get(campaign.id)!
            conv.unreadCount++
        }
    }

    return Array.from(conversationsMap.values())
}

/**
 * Get messages for a campaign
 */
export async function getMessages(campaignId: string): Promise<MessageWithSender[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('messages')
        .select(`
            *,
            sender:users!sender_id(*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })

    if (error || !data) return []

    return data as unknown as MessageWithSender[]
}

/**
 * Send a message
 */
export async function sendMessage(
    campaignId: string,
    content: string
): Promise<{ message: Message | null; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: null, error: 'Not authenticated' }

    // Input validation
    if (!content || content.trim().length === 0) {
        return { message: null, error: 'Le message ne peut pas être vide' }
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
        return { message: null, error: `Le message est trop long (max ${MAX_MESSAGE_LENGTH} caractères)` }
    }

    // Get sender info and campaign details
    const [senderResult, campaignResult] = await Promise.all([
        supabase.from('users').select('full_name, role').eq('id', user.id).single(),
        supabase.from('campaigns').select('brand_id, title').eq('id', campaignId).single()
    ])

    const sender = senderResult.data as { full_name: string; role: string } | null
    const campaign = campaignResult.data as { brand_id: string; title: string } | null

    const { data, error } = await (supabase
        .from('messages') as ReturnType<typeof supabase.from>)
        .insert({
            campaign_id: campaignId,
            sender_id: user.id,
            content: content.trim(),
        })
        .select()
        .single()

    if (error) return { message: null, error: error.message }

    // Create notification for the recipient (with error logging)
    if (campaign && sender) {
        let recipientId: string | null = null

        if (sender.role === 'brand') {
            // Brand sending to creator - find accepted creator for this campaign
            const { data: app } = await (supabase
                .from('applications') as ReturnType<typeof supabase.from>)
                .select('creator_id')
                .eq('campaign_id', campaignId)
                .in('status', ['accepted', 'completed'])
                .limit(1)
                .single()
            recipientId = (app as { creator_id: string } | null)?.creator_id ?? null
        } else {
            // Creator sending to brand
            recipientId = campaign.brand_id
        }

        if (recipientId && recipientId !== user.id) {
            const { error: notifError } = await (supabase
                .from('notifications') as ReturnType<typeof supabase.from>)
                .insert({
                    user_id: recipientId,
                    type: 'message_received',
                    title: 'Nouveau message',
                    message: `${sender.full_name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    reference_id: campaignId,
                    reference_type: 'campaign',
                })

            if (notifError) {
                console.error('[Messages] Error creating notification:', notifError)
            }
        }
    }

    return { message: data as Message }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(campaignId: string): Promise<void> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await (supabase
        .from('messages') as ReturnType<typeof supabase.from>)
        .update({ is_read: true })
        .eq('campaign_id', campaignId)
        .neq('sender_id', user.id)
}

/**
 * Subscribe to new messages for a campaign (real-time)
 */
export function subscribeToMessages(
    campaignId: string,
    callback: (message: MessageWithSender) => void
): RealtimeChannel {
    const supabase = createClient()
    return supabase
        .channel(`messages:${campaignId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `campaign_id=eq.${campaignId}`,
            },
            async (payload) => {
                // Fetch the full message with sender
                const { data } = await supabase
                    .from('messages')
                    .select(`
                        *,
                        sender:users!sender_id(*)
                    `)
                    .eq('id', payload.new.id)
                    .single()

                if (data) {
                    callback(data as unknown as MessageWithSender)
                }
            }
        )
        .subscribe()
}

/**
 * Unsubscribe from messages
 */
export function unsubscribeFromMessages(channel: RealtimeChannel): void {
    const supabase = createClient()
    supabase.removeChannel(channel)
}

/**
 * Get unread message count for current user
 * FIX: Now properly filters by campaigns the user is involved in
 */
export async function getUnreadCount(): Promise<number> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Get all messages not sent by this user that are unread
    // RLS will enforce that only messages from user's campaigns are visible
    const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)

    if (error) return 0

    return (data as unknown as number) || 0
}

/**
 * Start or get conversation with a user for a campaign
 * Returns the campaign ID to use for messages
 */
export async function startConversation(
    creatorId: string,
    campaignId?: string,
    initialMessage?: string
): Promise<{ campaignId: string | null; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { campaignId: null, error: 'Not authenticated' }

    // If no campaign ID provided, find one or use a direct message campaign
    let targetCampaignId = campaignId

    if (!targetCampaignId) {
        // Find an existing accepted application between this brand and creator
        const { data: appData } = await supabase
            .from('applications')
            .select('campaign_id')
            .eq('creator_id', creatorId)
            .in('status', ['accepted', 'completed'])
            .limit(1)
            .single()

        if (appData) {
            targetCampaignId = (appData as { campaign_id: string }).campaign_id
        } else {
            // Find any campaign by this brand that the creator applied to
            const { data: anyApp } = await supabase
                .from('applications')
                .select('campaign_id, campaigns!inner(brand_id)')
                .eq('creator_id', creatorId)
                .limit(1)
                .single()

            if (anyApp) {
                targetCampaignId = (anyApp as { campaign_id: string }).campaign_id
            }
        }
    }

    if (!targetCampaignId) {
        return { campaignId: null, error: 'No campaign found for this creator' }
    }

    // Send initial message if provided
    if (initialMessage) {
        await sendMessage(targetCampaignId, initialMessage)
    }

    return { campaignId: targetCampaignId }
}
