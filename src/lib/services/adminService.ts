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
    notifyCreatorAssigned,
    notifyBrandCreatorAssigned,
    notifyScriptValidated,
    notifyVideoReady,
    notifyBriefValidated,
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

export interface BrandRequest {
    id: string
    company_name: string
    contact_name: string
    email: string
    phone: string | null
    message: string | null
    status: 'new' | 'contacted' | 'meeting_scheduled' | 'closed'
    admin_notes: string | null
    created_at: string
    updated_at: string
}

/**
 * Get all brand RDV requests
 */
export async function getAllBrandRequests(): Promise<BrandRequest[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('brand_requests')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as BrandRequest[]
}

/**
 * Update a brand request status
 */
export async function updateBrandRequestStatus(
    requestId: string,
    status: BrandRequest['status']
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('brand_requests') as ReturnType<typeof supabase.from>)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Get a single brand by ID with profile + campaign history
 */
export async function getBrandById(userId: string): Promise<{
    brand: BrandWithProfile | null
    campaigns: CampaignWithDetails[]
}> {
    const supabase = createClient()

    // Fetch the brand
    const { data: brandData } = await supabase
        .from('users')
        .select(`*, profiles_brand(*)`)
        .eq('id', userId)
        .eq('role', 'brand')
        .single()

    if (!brandData) return { brand: null, campaigns: [] }

    // Fetch all campaigns owned by this brand
    const { data: campaignData } = await supabase
        .from('campaigns')
        .select(`*, selected_creator:users!selected_creator_id(*, profiles_creator(*))`)
        .eq('brand_id', userId)
        .order('created_at', { ascending: false })

    return {
        brand: brandData as unknown as BrandWithProfile,
        campaigns: (campaignData || []) as unknown as CampaignWithDetails[],
    }
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

    // Store proposed_creator_ids and update campaign status
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            status: 'open',
            assigned_admin_id: user.id,
            proposed_creator_ids: creatorIds,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Record steps
    await completeMissionStep(campaignId, 'creators_proposed')
    await completeMissionStep(campaignId, 'brand_reviewing_profiles')

    // Notify brand that profiles are ready for review (don't notify creators yet — they'll be notified only when selected)
    const { data: campBrand } = await supabase
        .from('campaigns')
        .select('brand_id')
        .eq('id', campaignId)
        .single()
    const brandId = (campBrand as any)?.brand_id
    if (brandId) {
        await notifyProfilesReady(brandId, campaignId, campInfo?.title || 'Nouvelle mission', creatorIds.length)
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
// CREATOR WORKFLOW ACTIONS
// Methods called by admin to dispatch mission to creators
// ================================================

/**
 * Send mission to creator — generates contract + dispatches mission in one step.
 * Ensures all prerequisite pipeline steps are recorded so the creator timeline is complete.
 * Contract generation is best-effort: the mission is always sent even if contract fails.
 */
export async function sendMissionToCreator(
    campaignId: string,
    creatorAmountChf?: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, selected_creator_id, contract_mosh_status')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }
    if (!camp.selected_creator_id) return { success: false, error: 'No creator assigned' }

    // Generate contract only if no contract exists yet
    const hasContract = camp.contract_mosh_status && camp.contract_mosh_status !== 'none'
    if (!hasContract && creatorAmountChf && creatorAmountChf > 0) {
        try {
            const { createMoshContract } = await import('@/lib/services/contractService')
            const contractResult = await createMoshContract(campaignId, creatorAmountChf)
            if (!contractResult.success) {
                console.warn('[SendMission] Contract generation failed (non-blocking):', contractResult.error)
            }
        } catch (err) {
            console.warn('[SendMission] Contract generation error (non-blocking):', err)
        }
    }

    // ALWAYS record all prerequisite steps (fill gaps in the pipeline)
    const prerequisiteSteps: MissionStepType[] = [
        'brief_received',
        'creators_proposed',
        'creator_validated',
        'script_sent',
        'script_brand_review',
        'script_brand_approved',
    ]

    // Check which steps already exist to avoid re-insert RLS errors
    const { data: existingSteps } = await supabase
        .from('mission_steps')
        .select('step_type')
        .eq('campaign_id', campaignId)
    const existingTypes = new Set((existingSteps || []).map((s: any) => s.step_type))

    for (const step of prerequisiteSteps) {
        if (!existingTypes.has(step)) {
            await completeMissionStep(campaignId, step)
        }
    }

    if (!existingTypes.has('mission_sent_to_creator')) {
        await completeMissionStep(campaignId, 'mission_sent_to_creator')
    }

    // Notify the creator
    await notifyCreatorAssigned(camp.selected_creator_id, campaignId, camp.title || 'Nouvelle mission')

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
 * Fully self-contained — performs all updates inline (no delegation to admin-context functions)
 */
export async function brandSelectCreator(
    campaignId: string,
    creatorId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    // Get campaign details
    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    // Get creator name for notifications
    const { data: creatorData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', creatorId)
        .single()
    const creatorName = (creatorData as any)?.full_name || 'Un créateur'

    // Get brand name for notifications
    const { data: brandData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', camp.brand_id)
        .single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    // 1. Update campaign: set selected creator, status, and brand selection timestamp
    const { error: updateError } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            selected_creator_id: creatorId,
            status: 'in_progress',
            brand_profile_selection_at: new Date().toISOString(),
            brand_profile_rejection_reason: null,
        })
        .eq('id', campaignId)

    if (updateError) return { success: false, error: updateError.message }

    // 2. Complete creator_validated mission step
    await completeMissionStep(campaignId, 'creator_validated')

    // 5. Notify admin that brand selected a profile
    if (camp.assigned_admin_id) {
        await notifyProfileSelected(
            camp.assigned_admin_id,
            campaignId,
            brandName,
            creatorName
        )
    }

    // 6. Notify creator they've been assigned
    await notifyCreatorAssigned(creatorId, campaignId, camp.title || 'Mission')

    return { success: true }
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

// ================================================
// CREATORS DIRECTORY (CRM interne Mosh)
// ================================================

export interface DirectoryCreator {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    nationality: string | null
    video_rate_chf: number | null
    specialties: string[]
    languages: string[]
    instagram_url: string | null
    tiktok_url: string | null
    notes: string | null
    created_at: string
}

/**
 * Get all directory creators (manual CRM entries)
 */
export async function getDirectoryCreators(): Promise<DirectoryCreator[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('creators_directory')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as DirectoryCreator[]
}

/**
 * Add a creator to the directory
 */
export async function addDirectoryCreator(creator: {
    full_name: string
    email?: string
    phone?: string
    nationality?: string
    video_rate_chf?: number
    specialties?: string[]
    languages?: string[]
    instagram_url?: string
    tiktok_url?: string
    notes?: string
}): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('creators_directory') as ReturnType<typeof supabase.from>)
        .insert({
            full_name: creator.full_name,
            email: creator.email || null,
            phone: creator.phone || null,
            nationality: creator.nationality || null,
            video_rate_chf: creator.video_rate_chf || null,
            specialties: creator.specialties || [],
            languages: creator.languages || [],
            instagram_url: creator.instagram_url || null,
            tiktok_url: creator.tiktok_url || null,
            notes: creator.notes || null,
        })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Update a directory creator
 */
export async function updateDirectoryCreator(
    id: string,
    updates: Partial<Omit<DirectoryCreator, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('creators_directory') as ReturnType<typeof supabase.from>)
        .update(updates)
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Delete a directory creator
 */
export async function deleteDirectoryCreator(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('creators_directory') as ReturnType<typeof supabase.from>)
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
}
