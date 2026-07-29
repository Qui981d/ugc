import { createClient } from '@/lib/supabase/client'
import type {
    Campaign,
    CampaignStatus,
    User,
    ProfileBrand,
    ProfileCreator,
    MissionStep,
    MissionStepType,
    ScriptStatus,
    VideoFormat,
    ScriptType,
    RightsUsageType
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
    notifyAdminVideoDelivered,
    notifyAdminPriceCounter,
    notifyCreatorPriceAccepted,
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

    // Notify MOSH admins when a creator delivers their video (ready for QC)
    if (stepType === 'video_uploaded_by_creator') {
        const { data: campDelivered } = await supabase
            .from('campaigns')
            .select('title')
            .eq('id', campaignId)
            .single()
        const creatorName = user?.user_metadata?.full_name as string | undefined
        await notifyAdminVideoDelivered(
            campaignId,
            (campDelivered as any)?.title || 'Une mission',
            creatorName
        )
    }

    // Mirror the step to ClickUp: tick the matching subtask (best-effort, non-blocking)
    try {
        const { STEP_TO_SUBTASK } = await import('@/lib/clickup/mapping')
        const subtaskName = STEP_TO_SUBTASK[stepType]
        if (subtaskName) {
            const { data: cuCamp } = await supabase
                .from('campaigns')
                .select('clickup_subtask_map')
                .eq('id', campaignId)
                .single()
            const map = (cuCamp as any)?.clickup_subtask_map as Record<string, string> | null
            const subtaskId = map?.[subtaskName]
            if (subtaskId) {
                await fetch('/api/clickup/complete-subtask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId: subtaskId }),
                })
            }
        }
    } catch (e) {
        console.error('ClickUp subtask sync failed:', e)
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
    creatorAmountChf?: number,
    /** Per-creator amounts for multi-creator campaigns: { creatorId: amount } */
    perCreatorAmounts?: Record<string, number>
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, selected_creator_id, contract_mosh_status, creator_preference')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    // Check for creator assignment: campaign-level OR content-level
    let creatorIds: string[] = []
    if (camp.selected_creator_id) {
        creatorIds = [camp.selected_creator_id]
    } else {
        // Multi-content: get unique creator IDs from campaign_contents
        const { data: contents } = await (supabase as any)
            .from('campaign_contents')
            .select('assigned_creator_id')
            .eq('campaign_id', campaignId)
            .not('assigned_creator_id', 'is', null)
        creatorIds = [...new Set((contents || []).map((c: any) => c.assigned_creator_id))] as string[]
    }

    if (creatorIds.length === 0) return { success: false, error: 'No creator assigned' }

    const isMultiCreator = !camp.selected_creator_id && creatorIds.length >= 1 && camp.creator_preference === 'per_video'

    if (isMultiCreator && perCreatorAmounts) {
        // ── Multi-creator: generate individual contracts ──
        const { createMoshContractForCreator } = await import('@/lib/services/contractService')
        for (const cId of creatorIds) {
            const amount = perCreatorAmounts[cId]
            if (!amount || amount <= 0) {
                return { success: false, error: `Montant manquant pour un créateur` }
            }
            const contractResult = await createMoshContractForCreator(campaignId, cId, amount)
            if (!contractResult.success) {
                return { success: false, error: contractResult.error || 'Échec du contrat' }
            }
        }
        // Also update campaign-level total
        const totalAmount = Object.values(perCreatorAmounts).reduce((sum, a) => sum + a, 0)
        await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
            .update({
                creator_amount_chf: totalAmount,
                contract_mosh_status: 'pending_creator',
                contract_mosh_generated_at: new Date().toISOString(),
            })
            .eq('id', campaignId)
    } else {
        // ── Single creator: campaign-level contract (existing behavior) ──
        const hasContract = camp.contract_mosh_status && camp.contract_mosh_status !== 'none'
        if (!hasContract && creatorAmountChf && creatorAmountChf > 0) {
            const { createMoshContract } = await import('@/lib/services/contractService')
            const contractResult = await createMoshContract(campaignId, creatorAmountChf)
            if (!contractResult.success) {
                return { success: false, error: contractResult.error || 'Échec de la génération du contrat' }
            }
        }
    }

    // ── Guard: script must be approved before sending mission ──
    // Check existing steps FIRST
    const { data: existingSteps } = await supabase
        .from('mission_steps')
        .select('step_type')
        .eq('campaign_id', campaignId)
    const existingTypes = new Set((existingSteps || []).map((s: any) => s.step_type))

    if (!existingTypes.has('script_brand_approved')) {
        return { success: false, error: 'Le script doit être approuvé par la marque avant d\'envoyer la mission au créateur' }
    }

    // Record prerequisite steps (fill gaps — but NOT script_brand_approved, it must exist naturally)
    const prerequisiteSteps: MissionStepType[] = [
        'brief_received',
        'creators_proposed',
        'creator_validated',
        'script_sent',
        'script_brand_review',
    ]

    for (const step of prerequisiteSteps) {
        if (!existingTypes.has(step)) {
            await completeMissionStep(campaignId, step)
        }
    }

    if (!existingTypes.has('mission_sent_to_creator')) {
        await completeMissionStep(campaignId, 'mission_sent_to_creator')
    }

    // Notify all assigned creators
    for (const creatorId of creatorIds) {
        await notifyCreatorAssigned(creatorId, campaignId, camp.title || 'Nouvelle mission')
    }

    return { success: true }
}

/**
 * Create an INTERNAL MOSH mission (no external brand).
 * brand_id is set to the MOSH admin, `client_name` holds the client label.
 * The script is written directly by MOSH (pre-approved), and the mission is
 * immediately assigned + sent to the chosen creator (generates the contract,
 * notifies the creator). The creator can later counter the proposed price.
 */
export async function createInternalMission(input: {
    clientName: string
    title: string
    scriptContent: string
    creatorAmountChf: number
    isAds: boolean            // false = organic
    format: VideoFormat
    scriptType: ScriptType
    shootingDate?: string | null
    shootingDateFixed?: boolean
    deliveryDate?: string | null
    deliveryDateFixed?: boolean
    creatorId: string
    clickupListId?: string
    /** Real managed-brand id. Falls back to the MOSH admin (legacy internal mission). */
    brandId?: string
}): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const rightsUsage: RightsUsageType = input.isAds ? 'paid_12m' : 'organic'
    const brandId = input.brandId || user.id

    // 1. Create the campaign (brand_id = the managed brand, or MOSH admin for legacy)
    const { data: campData, error: campErr } = await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
        .insert({
            brand_id: brandId,
            title: input.title,
            product_name: input.title,
            client_name: input.clientName,
            script_content: input.scriptContent,
            script_status: 'brand_approved' as ScriptStatus,
            format: input.format,
            script_type: input.scriptType,
            rights_usage: rightsUsage,
            budget_chf: input.creatorAmountChf,
            creator_amount_chf: input.creatorAmountChf,
            creator_price_status: 'proposed',
            deadline: input.deliveryDate || null,
            delivery_date_fixed: input.deliveryDateFixed ?? false,
            shooting_date: input.shootingDate || null,
            shooting_date_fixed: input.shootingDateFixed ?? false,
            selected_creator_id: input.creatorId,
            creator_preference: 'single',
            status: 'in_progress' as CampaignStatus,
        })
        .select()
        .single()

    if (campErr || !campData) return { success: false, error: campErr?.message || 'Création de la mission échouée' }
    const campaignId = (campData as any).id as string

    // 2. Create a single content block (used by the creator studio / delivery)
    await (supabase.from('campaign_contents') as ReturnType<typeof supabase.from>)
        .insert({
            campaign_id: campaignId,
            content_type: 'video',
            format: input.format,
            script_type: input.scriptType,
            script_content: input.scriptContent,
            script_status: 'brand_approved',
            status: 'script_approved',
            assigned_creator_id: input.creatorId,
            creator_status: 'brand_approved',
            position: 0,
        })

    // 2b. Create the ClickUp card + subtasks (best-effort). Done BEFORE recording
    //     steps so the map exists when completeMissionStep mirrors them to ClickUp.
    if (input.clickupListId) {
        try {
            const res = await fetch('/api/clickup/create-mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listId: input.clickupListId,
                    title: `${input.clientName} — ${input.title}`,
                    description: input.scriptContent,
                }),
            })
            if (res.ok) {
                const data = await res.json()
                await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
                    .update({
                        clickup_list_id: input.clickupListId,
                        clickup_task_id: data.taskId,
                        clickup_subtask_map: data.subtaskMap,
                    })
                    .eq('id', campaignId)
            }
        } catch (e) {
            console.error('ClickUp card creation failed:', e)
        }
    }

    // 3. Mark the script as approved (MOSH is the brand here) so the
    //    send-mission guard passes.
    await completeMissionStep(campaignId, 'script_brand_approved')

    // 4. Assign + send the mission (generates the MOSH contract, notifies creator)
    const sendRes = await sendMissionToCreator(campaignId, input.creatorAmountChf)
    if (!sendRes.success) {
        // Mission created but sending/contract failed — surface it (campaign exists)
        return { success: false, campaignId, error: sendRes.error }
    }

    return { success: true, campaignId }
}

/**
 * CREATOR action: request a different price before signing the contract.
 * Stores the counter amount + marks the price status as 'counter' and notifies MOSH.
 */
export async function requestPriceChange(
    campaignId: string,
    requestedAmountChf: number,
    message?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }
    if (!requestedAmountChf || requestedAmountChf <= 0) return { success: false, error: 'Montant invalide' }

    const { error } = await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            creator_counter_amount_chf: requestedAmountChf,
            creator_price_status: 'counter',
            creator_price_message: message?.trim() || null,
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title')
        .eq('id', campaignId)
        .single()
    const creatorName = (user.user_metadata?.full_name as string) || 'Le créateur'
    await notifyAdminPriceCounter(
        campaignId,
        (campData as any)?.title || 'Une mission',
        creatorName,
        requestedAmountChf,
        message
    )

    return { success: true }
}

/**
 * ADMIN action: accept the creator's counter price.
 * Sets creator_amount_chf to the counter amount, regenerates the contract with
 * the new price, and notifies the creator.
 */
export async function acceptPriceCounter(
    campaignId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, selected_creator_id, creator_counter_amount_chf')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Mission introuvable' }

    const newAmount = camp.creator_counter_amount_chf
    if (!newAmount || newAmount <= 0) return { success: false, error: 'Aucune contre-proposition à accepter' }

    // Update the accepted price + status
    const { error } = await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            creator_amount_chf: newAmount,
            creator_price_status: 'accepted',
            creator_price_message: null,
        })
        .eq('id', campaignId)
    if (error) return { success: false, error: error.message }

    // Regenerate the contract with the new amount (best-effort)
    try {
        const { createMoshContract } = await import('@/lib/services/contractService')
        await createMoshContract(campaignId, newAmount)
    } catch (e) {
        console.error('Contract regeneration failed after price accept:', e)
    }

    if (camp.selected_creator_id) {
        await notifyCreatorPriceAccepted(camp.selected_creator_id, campaignId, camp.title || 'Votre mission', newAmount)
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
// CREATOR INVITATIONS (liens d'invitation Mosh)
// ================================================

export interface InvitationData {
    id: string
    code: string
    created_by: string | null
    label: string | null
    used_by: string | null
    used_at: string | null
    expires_at: string | null
    created_at: string
    // Joined data
    used_by_user?: { full_name: string; email: string } | null
}

/**
 * Generate a random 8-char invite code
 */
function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

/**
 * Create a new creator invitation
 */
export async function createInvitation(label?: string): Promise<{ success: boolean; code?: string; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const code = generateCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    const { error } = await (supabase
        .from('creator_invitations') as ReturnType<typeof supabase.from>)
        .insert({
            code,
            created_by: user.id,
            label: label || null,
            expires_at: expiresAt.toISOString(),
        })

    if (error) return { success: false, error: error.message }
    return { success: true, code }
}

/**
 * Get all invitations
 */
export async function getInvitations(): Promise<InvitationData[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('creator_invitations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !data) return []

    // Fetch used_by user info for used invitations
    const usedIds = (data as any[]).filter(d => d.used_by).map(d => d.used_by)
    let usersMap: Record<string, { full_name: string; email: string }> = {}
    if (usedIds.length > 0) {
        const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', usedIds)
        if (usersData) {
            usersMap = Object.fromEntries((usersData as any[]).map(u => [u.id, { full_name: u.full_name, email: u.email }]))
        }
    }

    return (data as any[]).map(d => ({
        ...d,
        used_by_user: d.used_by ? usersMap[d.used_by] || null : null,
    })) as InvitationData[]
}

/**
 * Delete/revoke an invitation
 */
export async function revokeInvitation(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('creator_invitations') as ReturnType<typeof supabase.from>)
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Validate an invite code (used during signup)
 */
export async function validateInviteCode(code: string): Promise<{ valid: boolean; error?: string }> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('creator_invitations')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

    if (error || !data) return { valid: false, error: 'Code d\'invitation invalide' }

    const invitation = data as any
    if (invitation.used_at) return { valid: false, error: 'Cette invitation a déjà été utilisée' }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        return { valid: false, error: 'Cette invitation a expiré' }
    }

    return { valid: true }
}

/**
 * Mark an invitation as used (called after successful signup)
 */
export async function markInvitationUsed(code: string, userId: string): Promise<{ success: boolean }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('creator_invitations') as ReturnType<typeof supabase.from>)
        .update({
            used_by: userId,
            used_at: new Date().toISOString(),
        })
        .eq('code', code.toUpperCase())

    return { success: !error }
}

/**
 * Brand responds to brief feedback from MOSH
 * Updates the campaign with the brand's response and notifies admins
 */
export async function brandRespondToBriefFeedback(
    campaignId: string,
    response: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: campData } = await supabase
        .from('campaigns')
        .select('title, brand_id, assigned_admin_id')
        .eq('id', campaignId)
        .single()
    const camp = campData as any
    if (!camp) return { success: false, error: 'Campaign not found' }

    // Store the brand's response alongside the original feedback (don't clear it)
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            brief_brand_response: response,
            status: 'draft',
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Get brand name for notification
    const { data: brandData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', camp.brand_id)
        .single()
    const brandName = (brandData as any)?.full_name || 'La marque'

    // Notify admin that brand responded
    if (camp.assigned_admin_id) {
        const { createNotification } = await import('@/lib/services/notificationService')
        await createNotification(
            camp.assigned_admin_id,
            'new_application',
            'Réponse brief reçue 📋',
            `${brandName} a répondu aux demandes de précisions sur "${camp.title}"`,
            campaignId,
            'campaign'
        )
    }

    return { success: true }
}

/**
 * Handle QC revision — migrated from inline Supabase calls in the mission detail component
 * Resets video status and notifies the creator about revisions needed
 */
export async function handleQcRevision(
    campaignId: string,
    feedback: string,
    contentId?: string,
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    if (contentId) {
        // Content-level QC revision
        const { error } = await (supabase
            .from('campaign_contents') as ReturnType<typeof supabase.from>)
            .update({
                mosh_qc_feedback: feedback,
                mosh_qc_approved_at: null,
                status: 'uploaded',
            })
            .eq('id', contentId)

        if (error) return { success: false, error: error.message }
    } else {
        // Campaign-level QC revision
        const { error } = await (supabase
            .from('campaigns') as ReturnType<typeof supabase.from>)
            .update({
                mosh_qc_feedback: feedback,
                mosh_qc_approved_at: null,
            })
            .eq('id', campaignId)

        if (error) return { success: false, error: error.message }

        // Remove video_validated step so creator can re-upload
        await (supabase
            .from('mission_steps') as ReturnType<typeof supabase.from>)
            .delete()
            .eq('campaign_id', campaignId)
            .eq('step_type', 'video_validated')
    }

    return { success: true }
}
