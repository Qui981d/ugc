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

/**
 * Get all conversations for current user
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

    // Cast to proper type
    const messages = messagesData as unknown as Array<Message & { campaign: Campaign; sender: User }>

    // Group by campaign and get last message
    const conversationsMap = new Map<string, Conversation>()

    for (const msg of messages) {
        const campaign = msg.campaign
        const sender = msg.sender

        if (!conversationsMap.has(campaign.id)) {
            // Get other user (brand or creator depending on current user role)
            let otherUser: User
            if (userData.role === 'brand') {
                // Find the creator from applications
                const { data: appData } = await supabase
                    .from('applications')
                    .select('creator:users!creator_id(*)')
                    .eq('campaign_id', campaign.id)
                    .eq('status', 'accepted')
                    .single()
                const app = appData as unknown as { creator: User } | null
                otherUser = app?.creator || sender
            } else {
                // Get brand from campaign
                const { data: brandData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', campaign.brand_id)
                    .single()
                const brand = brandData as unknown as User | null
                otherUser = brand || sender
            }

            conversationsMap.set(campaign.id, {
                campaign,
                lastMessage: msg,
                unreadCount: msg.is_read ? 0 : 1,
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
            content,
        })
        .select()
        .single()

    if (error) return { message: null, error: error.message }

    // Create notification for the recipient
    if (campaign && sender) {
        let recipientId: string | null = null

        if (sender.role === 'brand') {
            // Brand sending to creator - find accepted creator for this campaign
            const { data: app } = await (supabase
                .from('applications') as ReturnType<typeof supabase.from>)
                .select('creator_id')
                .eq('campaign_id', campaignId)
                .eq('status', 'accepted')
                .limit(1)
                .single()
            recipientId = (app as any)?.creator_id
        } else {
            // Creator sending to brand
            recipientId = campaign.brand_id
        }

        if (recipientId && recipientId !== user.id) {
            await (supabase
                .from('notifications') as ReturnType<typeof supabase.from>)
                .insert({
                    user_id: recipientId,
                    type: 'message_received',
                    title: 'Nouveau message',
                    message: `${sender.full_name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    reference_id: campaignId,
                    reference_type: 'campaign',
                })
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

export async function getUnreadCount(): Promise<number> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)

    if (error) return 0

    return count || 0
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
            .eq('status', 'accepted')
            .limit(1)
            .single()

        if (appData) {
            targetCampaignId = (appData as any).campaign_id
        } else {
            // Find any campaign by this brand that the creator applied to
            const { data: anyApp } = await supabase
                .from('applications')
                .select('campaign_id, campaigns!inner(brand_id)')
                .eq('creator_id', creatorId)
                .limit(1)
                .single()

            if (anyApp) {
                targetCampaignId = (anyApp as any).campaign_id
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
