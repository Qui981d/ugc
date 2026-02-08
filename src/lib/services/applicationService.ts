import { createClient } from '@/lib/supabase/client'
import type {
    Application,
    ApplicationStatus,
    User,
    ProfileCreator,
    Campaign
} from '@/types/database'

export type ApplicationWithCreator = Application & {
    creator: User & {
        profiles_creator: ProfileCreator | null
    }
}

export type ApplicationWithCampaign = Application & {
    campaign: Campaign
}

/**
 * Apply to a campaign as a creator
 */
export async function applyToCampaign(
    campaignId: string,
    data: {
        pitch_message?: string
        proposed_rate_chf?: number
    }
): Promise<{ application: Application | null; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { application: null, error: 'Not authenticated' }

    // Get campaign info for brand_id and title
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('brand_id, title')
        .eq('id', campaignId)
        .single()

    if (!campaign) return { application: null, error: 'Campaign not found' }

    // Get creator name for notification
    const { data: creatorData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const creatorName = (creatorData as any)?.full_name || 'Un créateur'

    const { data: application, error } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .insert({
            campaign_id: campaignId,
            creator_id: user.id,
            pitch_message: data.pitch_message || null,
            proposed_rate_chf: data.proposed_rate_chf || null,
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return { application: null, error: 'Vous avez déjà postulé à cette campagne' }
        }
        return { application: null, error: error.message }
    }

    // Create conversation automatically
    await (supabase
        .from('conversations') as ReturnType<typeof supabase.from>)
        .insert({
            campaign_id: campaignId,
            creator_id: user.id,
            brand_id: (campaign as any).brand_id,
        })
        .select()
        .single()

    // Create notification for the brand
    await (supabase
        .from('notifications') as ReturnType<typeof supabase.from>)
        .insert({
            user_id: (campaign as any).brand_id,
            type: 'new_application',
            title: 'Nouvelle candidature',
            message: `${creatorName} a postulé à "${(campaign as any).title}"`,
            reference_id: campaignId,
            reference_type: 'campaign',
        })

    return { application: application as Application }
}

/**
 * Get applications for a campaign (brand view)
 */
export async function getCampaignApplications(
    campaignId: string,
    status?: ApplicationStatus
): Promise<ApplicationWithCreator[]> {
    const supabase = createClient()

    console.log('[Applications] Fetching applications for campaign:', campaignId)

    const query = supabase
        .from('applications')
        .select(`
            *,
            creator:users!creator_id(
                *,
                profiles_creator(*)
            )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

    const { data, error } = status
        ? await query.eq('status', status)
        : await query

    console.log('[Applications] Query result:', { data, error, count: data?.length })

    if (error || !data) {
        console.error('[Applications] Error fetching applications:', error)
        return []
    }

    return data as unknown as ApplicationWithCreator[]
}

/**
 * Get my applications (creator view)
 */
export async function getMyApplications(
    status?: ApplicationStatus
): Promise<ApplicationWithCampaign[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const query = supabase
        .from('applications')
        .select(`
            *,
            campaign:campaigns(*)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

    const { data, error } = status
        ? await query.eq('status', status)
        : await query

    if (error || !data) return []

    return data as unknown as ApplicationWithCampaign[]
}

/**
 * Update application status (brand accepts/rejects)
 */
export async function updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({ status })
        .eq('id', applicationId)

    if (error) return { success: false, error: error.message }

    return { success: true }
}

/**
 * Withdraw application (creator)
 */
export async function withdrawApplication(
    applicationId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { error } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({ status: 'withdrawn' })
        .eq('id', applicationId)
        .eq('creator_id', user.id)

    if (error) return { success: false, error: error.message }

    return { success: true }
}

/**
 * Check if user has already applied to a campaign
 */
export async function hasApplied(campaignId: string): Promise<boolean> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('creator_id', user.id)
        .single()

    return !!data && !error
}

/**
 * Get application count for a campaign
 */
export async function getApplicationCount(campaignId: string): Promise<number> {
    const supabase = createClient()
    const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)

    if (error) return 0

    return count || 0
}
