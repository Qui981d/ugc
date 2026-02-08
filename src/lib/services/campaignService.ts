import { createClient } from '@/lib/supabase/client'
import type {
    Campaign,
    CampaignStatus,
    User,
    ProfileBrand,
    ScriptType,
    VideoFormat,
    RightsUsageType
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
export async function getMyCampaigns(status?: CampaignStatus | CampaignStatus[]): Promise<Campaign[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
        .from('campaigns')
        .select('*')
        .eq('brand_id', user.id)
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
    status?: CampaignStatus
}): Promise<{ campaign: Campaign | null; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { campaign: null, error: 'Not authenticated' }

    const { data, error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .insert({
            ...campaignData,
            brand_id: user.id,
        })
        .select()
        .single()

    if (error) return { campaign: null, error: error.message }

    return { campaign: data as Campaign }
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
 * Get open campaigns for creators (marketplace)
 */
export async function getOpenCampaigns(options?: {
    scriptType?: ScriptType
    minBudget?: number
    maxBudget?: number
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
        .eq('status', 'open')
        .order('created_at', { ascending: false })

    if (options?.scriptType) {
        query = query.eq('script_type', options.scriptType)
    }

    if (options?.minBudget) {
        query = query.gte('budget_chf', options.minBudget)
    }

    if (options?.maxBudget) {
        query = query.lte('budget_chf', options.maxBudget)
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
