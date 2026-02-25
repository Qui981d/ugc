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
import {
    notifyCreatorProposed,
    notifyCreatorAssigned,
    notifyBrandCreatorAssigned,
    notifyScriptValidated,
    notifyVideoReady,
    notifyBriefValidated,
    notifyApplicationStatus,
    notifyBriefFeedback,
    notifyProfilesReady,
    notifyProfileSelected,
    notifyProfilesRejected,
    notifyScriptReadyForBrand,
    notifyScriptApprovedByBrand,
    notifyScriptFeedback,
    notifyBrandFinalApproval,
    notifyBrandRevisionRequest,
} from '@/lib/services/notificationService'

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

    function applyFilters(q: any) {
        if (options?.status) {
            q = Array.isArray(options.status) ? q.in('status', options.status) : q.eq('status', options.status)
        }
        if (options?.limit) q = q.limit(options.limit)
        return q
    }

    // Try full query with selected_creator join
    let { data, error } = await applyFilters(
        supabase.from('campaigns').select(`
            *,
            brand:users!brand_id(*, profiles_brand(*)),
            selected_creator:users!selected_creator_id(*, profiles_creator(*))
        `).order('created_at', { ascending: false })
    )

    // Fallback: if FK relationship fails, query without selected_creator
    if (error) {
        console.warn('[Admin] Full query failed, retrying without creator join:', error.message)
        const fallback = await applyFilters(
            supabase.from('campaigns').select(`
                *,
                brand:users!brand_id(*, profiles_brand(*))
            `).order('created_at', { ascending: false })
        )
        data = fallback.data
        error = fallback.error
    }

    if (error) {
        console.error('[Admin] getAllCampaigns error:', error.message, error.details)
        return []
    }
    if (!data) return []
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
 * Get a single creator by ID with profile + mission history
 */
export async function getCreatorById(userId: string): Promise<{
    creator: CreatorWithProfile | null
    missions: CampaignWithDetails[]
}> {
    const supabase = createClient()

    // Fetch the creator
    const { data: creatorData } = await supabase
        .from('users')
        .select(`*, profiles_creator(*)`)
        .eq('id', userId)
        .eq('role', 'creator')
        .single()

    if (!creatorData) return { creator: null, missions: [] }

    // Fetch campaigns where this creator was assigned
    const { data: campaignData } = await supabase
        .from('campaigns')
        .select(`*, brand:users!brand_id(*, profiles_brand(*))`)
        .eq('selected_creator_id', userId)
        .order('created_at', { ascending: false })

    return {
        creator: creatorData as unknown as CreatorWithProfile,
        missions: (campaignData || []) as unknown as CampaignWithDetails[],
    }
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
 * Validate a brief (draft → open) and mark brief_received step
 */
export async function validateBrief(
    campaignId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Get campaign details for notification
    const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*, brand:users!brand_id(*)')
        .eq('id', campaignId)
        .single()

    const campaign = campaignData as any
    if (!campaign) return { success: false, error: 'Campaign not found' }

    // Update status to open
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({ status: 'open', assigned_admin_id: user.id })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Record brief_received step
    await completeMissionStep(campaignId, 'brief_received')

    // Notify brand that brief was validated
    await notifyBriefValidated(
        campaign.brand_id,
        campaignId,
        campaign.title
    )

    return { success: true }
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

    // Get campaign details for notification
    const { data: campData } = await supabase
        .from('campaigns')
        .select('title')
        .eq('id', campaignId)
        .single()
    const campInfo = campData as any

    // Create applications for each proposed creator
    const insertData = creatorIds.map(creatorId => ({
        campaign_id: campaignId,
        creator_id: creatorId,
        pitch_message: 'Proposé par MOSH',
        status: 'pending' as const,
    }))

    const { error } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .upsert(insertData, { onConflict: 'campaign_id,creator_id' })

    if (error) return { success: false, error: error.message }

    // Store proposed_creator_ids and update campaign status
    await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            status: 'open',
            assigned_admin_id: user.id,
            proposed_creator_ids: creatorIds,
        })
        .eq('id', campaignId)

    // Record steps
    await completeMissionStep(campaignId, 'creators_proposed')
    await completeMissionStep(campaignId, 'brand_reviewing_profiles')

    // Notify each proposed creator
    const campaignTitle = campInfo?.title || 'Nouvelle mission'
    for (const creatorId of creatorIds) {
        await notifyCreatorProposed(creatorId, campaignId, campaignTitle)
    }

    // Notify brand that profiles are ready for review
    const { data: campBrand } = await supabase
        .from('campaigns')
        .select('brand_id')
        .eq('id', campaignId)
        .single()
    const brandId = (campBrand as any)?.brand_id
    if (brandId) {
        await notifyProfilesReady(brandId, campaignId, campaignTitle, creatorIds.length)
    }

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

    // Get campaign + creator details for notifications
    const [{ data: campData2 }, { data: creatorData }] = await Promise.all([
        supabase.from('campaigns').select('title, brand_id').eq('id', campaignId).single(),
        supabase.from('users').select('full_name').eq('id', creatorId).single(),
    ])
    const campaignInfo = campData2 as any
    const creatorInfo = creatorData as any

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            selected_creator_id: creatorId,
            status: 'in_progress',
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Upsert application — create if it doesn't exist (agency model: MOSH assigns directly)
    await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .upsert({
            campaign_id: campaignId,
            creator_id: creatorId,
            status: 'accepted',
            pitch_message: 'Assigné par MOSH',
        }, { onConflict: 'campaign_id,creator_id' })

    // Reject other applications
    await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({ status: 'rejected' })
        .eq('campaign_id', campaignId)
        .neq('creator_id', creatorId)

    // Record step
    await completeMissionStep(campaignId, 'creator_validated')

    // Notify creator of assignment
    const campaignTitle = campaignInfo?.title || 'Mission'
    await notifyCreatorAssigned(creatorId, campaignId, campaignTitle)

    // Notify brand that a creator was assigned
    if (campaignInfo?.brand_id) {
        await notifyBrandCreatorAssigned(
            campaignInfo.brand_id,
            campaignId,
            creatorInfo?.full_name || 'Un créateur'
        )
    }

    // Notify rejected creators
    const { data: rejectedApps } = await supabase
        .from('applications')
        .select('creator_id')
        .eq('campaign_id', campaignId)
        .eq('status', 'rejected')

    if (rejectedApps) {
        for (const app of rejectedApps) {
            await notifyApplicationStatus(
                (app as any).creator_id,
                campaignId,
                'rejected',
                campaignTitle
            )
        }
    }

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

        // Notify creator that script is validated
        const { data: campDataScript } = await supabase
            .from('campaigns')
            .select('title, selected_creator_id')
            .eq('id', campaignId)
            .single()
        const campScript = campDataScript as any

        if (campScript?.selected_creator_id) {
            await notifyScriptValidated(
                campScript.selected_creator_id,
                campaignId,
                campScript.title || 'Mission'
            )
        }
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

    if (error) {
        console.error(`Error completing step ${stepType}:`, error)
        return { success: false, error: error.message }
    }

    // Send specific notifications based on step type
    if (stepType === 'video_sent_to_brand') {
        const { data: campDataStep } = await supabase
            .from('campaigns')
            .select('title, brand_id')
            .eq('id', campaignId)
            .single()
        const campStep = campDataStep as any

        if (campStep?.brand_id) {
            await notifyVideoReady(
                campStep.brand_id,
                campaignId,
                campStep.title || 'Votre campagne'
            )
        }

        // Mark brand_final_review step (brand must validate before completion)
        await (supabase
            .from('mission_steps') as ReturnType<typeof supabase.from>)
            .upsert({
                campaign_id: campaignId,
                step_type: 'brand_final_review',
                completed_by: user?.id || null,
                completed_at: new Date().toISOString(),
            }, { onConflict: 'campaign_id,step_type' })
    }

    return { success: true }
}

// ================================================
// BRAND WORKFLOW ACTIONS
// Methods called by brands to provide feedback
// ================================================

/**
 * MOSH admin requests brief clarifications from the brand
 */
export async function requestBriefFeedback(
    campaignId: string,
    notes: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    // Store feedback notes and revert to draft
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            brief_feedback_notes: notes,
            brief_feedback_at: new Date().toISOString(),
            status: 'draft',
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    await completeMissionStep(campaignId, 'brief_feedback', notes)
    await notifyBriefFeedback(camp.brand_id, campaignId, camp.title || 'Votre campagne')

    return { success: true }
}

/**
 * Send script to brand for review (MOSH → Brand)
 */
export async function sendScriptToBrand(
    campaignId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, script_content')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }
    if (!camp.script_content) return { success: false, error: 'No script content' }

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({ script_status: 'brand_review' })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    await completeMissionStep(campaignId, 'script_brand_review')
    await notifyScriptReadyForBrand(camp.brand_id, campaignId, camp.title)

    return { success: true }
}

/**
 * Brand selects a creator from the proposed profiles
 * This delegates to assignCreatorToCampaign which handles:
 * - Setting selected_creator_id
 * - Updating campaign status to in_progress
 * - Accepting/rejecting applications
 * - Completing creator_validated step
 * - Sending all notifications
 */
export async function brandSelectCreator(
    campaignId: string,
    creatorId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    // Record brand selection timestamp
    await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            brand_profile_selection_at: new Date().toISOString(),
            brand_profile_rejection_reason: null,
        })
        .eq('id', campaignId)

    // Delegate to the full assignment flow
    return assignCreatorToCampaign(campaignId, creatorId)
}

/**
 * Brand rejects all proposed profiles
 */
export async function brandRejectProfiles(
    campaignId: string,
    reason: string | null
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    // Clear proposed creators and store rejection reason
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            proposed_creator_ids: null,
            brand_profile_rejection_reason: reason,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Get brand name
    const { data: brandData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', camp.brand_id)
        .single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    // Notify admin
    if (camp.assigned_admin_id) {
        await notifyProfilesRejected(camp.assigned_admin_id, campaignId, brandName, reason)
    }

    return { success: true }
}

/**
 * Brand approves the script
 */
export async function brandApproveScript(
    campaignId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            script_status: 'brand_approved',
            script_brand_approved_at: new Date().toISOString(),
            script_brand_feedback: null,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    await completeMissionStep(campaignId, 'script_brand_approved')

    // Get brand name
    const { data: brandData } = await supabase
        .from('users').select('full_name').eq('id', camp.brand_id).single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    if (camp.assigned_admin_id) {
        await notifyScriptApprovedByBrand(camp.assigned_admin_id, campaignId, brandName, camp.title)
    }

    return { success: true }
}

/**
 * Brand provides feedback on the script (requests changes)
 */
export async function brandFeedbackScript(
    campaignId: string,
    feedback: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            script_status: 'draft',
            script_brand_feedback: feedback,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    const { data: brandData } = await supabase
        .from('users').select('full_name').eq('id', camp.brand_id).single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    if (camp.assigned_admin_id) {
        await notifyScriptFeedback(camp.assigned_admin_id, campaignId, brandName, camp.title)
    }

    return { success: true }
}

/**
 * Brand approves the final video (mission complete)
 */
export async function brandApproveVideo(
    campaignId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    // Mark campaign as completed
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            status: 'completed',
            brand_final_approved_at: new Date().toISOString(),
            brand_final_feedback: null,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    await completeMissionStep(campaignId, 'brand_final_approved')

    const { data: brandData } = await supabase
        .from('users').select('full_name').eq('id', camp.brand_id).single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    if (camp.assigned_admin_id) {
        await notifyBrandFinalApproval(camp.assigned_admin_id, campaignId, brandName, camp.title)
    }

    return { success: true }
}

/**
 * Brand requests revision on the final video (max 2)
 */
export async function brandRequestRevision(
    campaignId: string,
    feedback: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id, brand_revision_count')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    const currentCount = camp.brand_revision_count || 0
    if (currentCount >= 2) {
        return { success: false, error: 'Nombre maximum de révisions atteint (2/2)' }
    }

    const newCount = currentCount + 1

    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            brand_final_feedback: feedback,
            brand_revision_count: newCount,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    const { data: brandData } = await supabase
        .from('users').select('full_name').eq('id', camp.brand_id).single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    if (camp.assigned_admin_id) {
        await notifyBrandRevisionRequest(camp.assigned_admin_id, campaignId, brandName, camp.title, newCount)
    }

    return { success: true }
}
