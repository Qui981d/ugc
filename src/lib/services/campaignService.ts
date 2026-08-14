import { createClient } from '@/lib/supabase/client'
import type {
    Campaign,
    CampaignStatus,
    CampaignContent,
    User,
    ProfileBrand,
    ScriptType,
    VideoFormat,
    RightsUsageType,
    PricingPack
} from '@/types/database'

export type CampaignWithBrand = Campaign & {
    brand: User & {
        profiles_brand: ProfileBrand | null
    }
}

/**
 * Get campaigns with optional filters
 */
export async function getCampaigns(options?: {
    status?: CampaignStatus | CampaignStatus[]
    brandId?: string
    scriptType?: ScriptType
    limit?: number
    offset?: number
}): Promise<CampaignWithBrand[]> {
    const supabase = createClient()
    let query = supabase
        .from('campaigns')
        .select(`
            *,
            brand:users!brand_id(
                *,
                profiles_brand(*)
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

    if (options?.brandId) {
        query = query.eq('brand_id', options.brandId)
    }

    if (options?.scriptType) {
        query = query.eq('script_type', options.scriptType)
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data as unknown as CampaignWithBrand[]
}

/**
 * Get campaigns for the current brand user
 */
export async function getMyCampaigns(
    status?: CampaignStatus | CampaignStatus[],
    /** When a MOSH admin acts as a brand, scope to that brand instead of the auth user. */
    brandId?: string
): Promise<Campaign[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const effectiveBrandId = brandId || user?.id
    if (!effectiveBrandId) return []

    let query = supabase
        .from('campaigns')
        .select('*')
        .eq('brand_id', effectiveBrandId)
        .order('created_at', { ascending: false })

    if (status) {
        if (Array.isArray(status)) {
            query = query.in('status', status)
        } else {
            query = query.eq('status', status)
        }
    }

    const { data, error } = await query
    if (error || !data) return []

    return data as Campaign[]
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignById(id: string): Promise<CampaignWithBrand | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('campaigns')
        .select(`
            *,
            brand:users!brand_id(
                *,
                profiles_brand(*)
            )
        `)
        .eq('id', id)
        .single()

    if (error || !data) return null

    return data as unknown as CampaignWithBrand
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaignData: {
    title: string
    description?: string
    product_name: string
    product_description?: string
    product_requires_shipping?: boolean
    format?: VideoFormat
    script_type: ScriptType
    script_notes?: string
    rights_usage?: RightsUsageType
    budget_chf: number
    deadline?: string
    /** Whether the delivery date is imposed rather than indicative. */
    delivery_date_fixed?: boolean
    /** Shooting schedule — MOSH sets this when briefing on a client's behalf. */
    shooting_date?: string
    shooting_date_fixed?: boolean
    status?: CampaignStatus
    pricing_pack?: PricingPack
    brief_image_urls?: string[]
    creator_preference?: 'single' | 'per_video'
}, /** MOSH admin acting as a brand: attribute the campaign to that brand. */ brandId?: string): Promise<{ campaign: Campaign | null; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { campaign: null, error: 'Not authenticated' }

    const { data, error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .insert({
            ...campaignData,
            brand_id: brandId || user.id,
        })
        .select()
        .single()

    if (error) return { campaign: null, error: error.message }

    const campaign = data as Campaign

    // Which client filed this brief is not guesswork: the campaign carries
    // brand_id, and the brand's profile carries its ClickUp list.
    const { data: brandProfile } = await supabase
        .from('profiles_brand')
        .select('company_name, clickup_list_id')
        .eq('user_id', brandId || user.id)
        .single()
    const profile = brandProfile as { company_name?: string; clickup_list_id?: string | null } | null
    const brandLabel = profile?.company_name || user.user_metadata?.full_name || user.email || 'Une marque'

    // Notify all admin users about the new brief
    try {
        const { notifyAdminNewBrief } = await import('@/lib/services/notificationService')
        await notifyAdminNewBrief(campaign.id, campaign.title, brandLabel)
    } catch {
        // Non-blocking — don't fail campaign creation if notification fails
    }

    // Mirror the brief into the client's ClickUp space. Best-effort: a brief must
    // never fail to reach MOSH because ClickUp is down or unconfigured.
    if (profile?.clickup_list_id) {
        try {
            const res = await fetch('/api/clickup/create-mission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listId: profile.clickup_list_id,
                    title: `${brandLabel} — ${campaign.title}`,
                    description: campaign.description || '',
                }),
            })
            if (res.ok) {
                const cu = await res.json()
                await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
                    .update({
                        clickup_list_id: profile.clickup_list_id,
                        clickup_task_id: cu.taskId,
                        clickup_subtask_map: cu.subtaskMap,
                    })
                    .eq('id', campaign.id)
                // Fill the freshly created card with the full brief. Runs after
                // the task id is persisted, or the sync would find nothing.
                const { syncClickUpMission } = await import('@/lib/services/adminService')
                await syncClickUpMission(campaign.id)
            }
        } catch (e) {
            console.error('ClickUp card creation failed for brief:', e)
        }
    }

    return { campaign }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
    id: string,
    updates: Partial<Omit<Campaign, 'id' | 'brand_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update(updates)
        .eq('id', id)

    if (error) return { success: false, error: error.message }

    return { success: true }
}

/**
 * Delete a campaign (only drafts)
 */
export async function deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('status', 'draft')

    if (error) return { success: false, error: error.message }

    return { success: true }
}

/**
 * Get campaigns assigned to the current creator
 */
export async function getAssignedCampaigns(): Promise<CampaignWithBrand[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('campaigns')
        .select(`
            *,
            brand:users!brand_id(
                *,
                profiles_brand(*)
            )
        `)
        .eq('selected_creator_id', user.id)
        .order('created_at', { ascending: false })

    if (error || !data) return []

    return data as unknown as CampaignWithBrand[]
}

/**
 * Create content blocks for a campaign
 */
export async function createCampaignContents(campaignId: string, contents: {
    content_type: 'video' | 'photo'
    format: string
    script_type: string
    description?: string
    position: number
}[]): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const rows = contents.map(c => ({
        campaign_id: campaignId,
        content_type: c.content_type,
        format: c.format,
        script_type: c.script_type,
        description: c.description || null,
        position: c.position,
    }))

    const { error } = await (supabase
        .from('campaign_contents') as ReturnType<typeof supabase.from>)
        .insert(rows)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

/**
 * Get all content blocks for a campaign
 */
export async function getCampaignContents(campaignId: string): Promise<CampaignContent[]> {
    const supabase = createClient()
    const { data, error } = await (supabase
        .from('campaign_contents') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('position', { ascending: true })

    if (error || !data) return []
    return data as unknown as CampaignContent[]
}

/**
 * Get a single content block by ID
 */
export async function getContentById(contentId: string): Promise<CampaignContent | null> {
    const supabase = createClient()
    const { data, error } = await (supabase
        .from('campaign_contents') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('id', contentId)
        .single()

    if (error || !data) return null
    return data as unknown as CampaignContent
}

/**
 * Update a content block field
 */
export async function updateContentField(
    contentId: string,
    updates: Partial<Pick<CampaignContent, 'status' | 'script_content' | 'script_status' | 'video_url' | 'video_uploaded_at' | 'mosh_qc_feedback' | 'mosh_qc_approved_at' | 'brand_final_feedback' | 'brand_final_approved_at' | 'brand_revision_count' | 'assigned_creator_id' | 'creator_status'>>
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { error } = await (supabase
        .from('campaign_contents') as ReturnType<typeof supabase.from>)
        .update(updates)
        .eq('id', contentId)

    if (error) return { success: false, error: error.message }

    // A per-video script is the material the writing subtask exists to carry, so
    // it is mirrored the moment it is written — best-effort, never blocking.
    if ('script_content' in updates || 'script_status' in updates) {
        try {
            const { data: row } = await (supabase
                .from('campaign_contents') as ReturnType<typeof supabase.from>)
                .select('campaign_id')
                .eq('id', contentId)
                .single()
            const campaignId = (row as { campaign_id?: string } | null)?.campaign_id
            if (campaignId) {
                const { syncClickUpMission } = await import('@/lib/services/adminService')
                await syncClickUpMission(campaignId)
            }
        } catch (e) {
            console.error('ClickUp sync failed after content update:', e)
        }
    }

    return { success: true }
}

/**
 * Update content status
 */
export async function updateContentStatus(
    contentId: string,
    status: CampaignContent['status']
): Promise<{ success: boolean; error?: string }> {
    return updateContentField(contentId, { status })
}
