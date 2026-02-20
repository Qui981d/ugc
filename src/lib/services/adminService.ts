import { createClient } from '@/lib/supabase/client'
import type {
    Campaign,
    CampaignStatus,
    User,
    ProfileBrand,
    ProfileCreator,
    MissionStep,
    MissionStepType,
    ScriptStatus
} from '@/types/database'

// ================================================
// ADMIN SERVICE
// Central orchestration for the MOSH agency workflow
// ================================================

export type CampaignWithDetails = Campaign & {
    brand: User & { profiles_brand: ProfileBrand | null }
    selected_creator?: User & { profiles_creator: ProfileCreator | null } | null
}

export type CreatorWithProfile = User & {
    profiles_creator: ProfileCreator | null
}

export type BrandWithProfile = User & {
    profiles_brand: ProfileBrand | null
}

/**
 * Get admin dashboard stats
 */
export async function getAdminStats() {
    const supabase = createClient()

    const [briefs, inProgress, pendingVideos, creators] = await Promise.all([
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('deliverables').select('*', { count: 'exact', head: true }).eq('status', 'review'),
        supabase.from('profiles_creator').select('*', { count: 'exact', head: true }),
    ])

    return {
        pendingBriefs: briefs.count || 0,
        activeMissions: inProgress.count || 0,
        pendingVideos: pendingVideos.count || 0,
        totalCreators: creators.count || 0,
    }
}

/**
 * Get all campaigns for admin view with brand and creator details
 */
export async function getAllCampaigns(options?: {
    status?: CampaignStatus | CampaignStatus[]
    limit?: number
}): Promise<CampaignWithDetails[]> {
    const supabase = createClient()
    let query = supabase
        .from('campaigns')
        .select(`
            *,
            brand:users!brand_id(
                *,
                profiles_brand(*)
            ),
            selected_creator:users!selected_creator_id(
                *,
                profiles_creator(*)
            )
        `)
        .order('created_at', { ascending: false })

    if (options?.status) {
        if (Array.isArray(options.status)) {
            query = query.in('status', options.status)
        } else {
            query = query.eq('status', options.status)
        }
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const { data, error } = await query
    if (error || !data) return []
    return data as unknown as CampaignWithDetails[]
}

/**
 * Get all creators with their profiles
 */
export async function getAllCreators(): Promise<CreatorWithProfile[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            profiles_creator(*)
        `)
        .eq('role', 'creator')
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as CreatorWithProfile[]
}

/**
 * Get all brands with their profiles
 */
export async function getAllBrands(): Promise<BrandWithProfile[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            profiles_brand(*)
        `)
        .eq('role', 'brand')
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as BrandWithProfile[]
}

/**
 * Propose creators for a campaign (admin selects 2-3 creators)
 */
export async function proposeCreatorsForCampaign(
    campaignId: string,
    creatorIds: string[]
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Create applications for each proposed creator
    const insertData = creatorIds.map(creatorId => ({
        campaign_id: campaignId,
        creator_id: creatorId,
        pitch_message: 'Proposé par MOSH',
        status: 'pending' as const,
    }))

    const { error } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .insert(insertData)

    if (error) return { success: false, error: error.message }

    // Update campaign status
    await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({ status: 'open', assigned_admin_id: user.id })
        .eq('id', campaignId)

    // Record step
    await completeMissionStep(campaignId, 'creators_proposed')

    return { success: true }
}

/**
 * Assign a selected creator to a campaign
 */
export async function assignCreatorToCampaign(
    campaignId: string,
    creatorId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            selected_creator_id: creatorId,
            status: 'in_progress',
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Update application status
    await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({ status: 'accepted' })
        .eq('campaign_id', campaignId)
        .eq('creator_id', creatorId)

    // Reject other applications
    await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({ status: 'rejected' })
        .eq('campaign_id', campaignId)
        .neq('creator_id', creatorId)

    // Record step
    await completeMissionStep(campaignId, 'creator_validated')

    return { success: true }
}

/**
 * Update script content and status
 */
export async function updateCampaignScript(
    campaignId: string,
    scriptContent: string,
    scriptStatus: ScriptStatus
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            script_content: scriptContent,
            script_status: scriptStatus,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    if (scriptStatus === 'validated') {
        await completeMissionStep(campaignId, 'script_sent')
    }

    return { success: true }
}

/**
 * Get mission steps for a campaign
 */
export async function getMissionSteps(campaignId: string): Promise<MissionStep[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('mission_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })

    if (error || !data) return []
    return data as MissionStep[]
}

/**
 * Complete a mission step
 */
export async function completeMissionStep(
    campaignId: string,
    stepType: MissionStepType,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await (supabase
        .from('mission_steps') as ReturnType<typeof supabase.from>)
        .upsert({
            campaign_id: campaignId,
            step_type: stepType,
            completed_by: user?.id || null,
            completed_at: new Date().toISOString(),
            notes: notes || null,
        }, { onConflict: 'campaign_id,step_type' })

    if (error) return { success: false, error: error.message }
    return { success: true }
}
