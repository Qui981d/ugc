import { createClient } from '@/lib/supabase/client'
import { generateMoshContractText, MOSH_COMPANY_INFO, type ContractVariables } from '@/lib/contracts/contractTemplate'
import { moshPaymentTerms } from '@/lib/constants/legalEntity'
import { completeMissionStep } from '@/lib/services/adminService'
import type { Campaign, ProfileCreator, ProfileBrand, User } from '@/types/database'

// ============================================================
// Contract Service — MOSH ↔ Creator contract lifecycle
// ============================================================

export interface MoshContractData {
    campaign: Campaign
    // Profiles are optional: internal MOSH missions have brand_id = MOSH admin
    // (no profiles_brand row), and a creator may not have completed onboarding.
    brand: User & { profile: ProfileBrand | null }
    creator: User & { profile: ProfileCreator | null }
}

/**
 * Fetch all data needed to generate a MOSH contract from a campaign
 */
export async function getContractData(campaignId: string): Promise<MoshContractData | null> {
    const supabase = createClient()

    // Get campaign
    const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campError || !campaign) {
        console.error('[Contract] Failed to fetch campaign:', campError)
        return null
    }

    const typedCampaign = campaign as unknown as Campaign

    // Resolve creator ID: campaign-level OR first content-level assignment
    let creatorId = typedCampaign.selected_creator_id
    if (!creatorId) {
        const { data: contents } = await (supabase as any)
            .from('campaign_contents')
            .select('assigned_creator_id')
            .eq('campaign_id', campaignId)
            .not('assigned_creator_id', 'is', null)
            .limit(1)
        creatorId = contents?.[0]?.assigned_creator_id || null
    }

    if (!creatorId) {
        console.error('[Contract] No creator assigned to campaign')
        return null
    }

    // Get brand user + profile
    const { data: brandUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', typedCampaign.brand_id)
        .single()

    const { data: brandProfile } = await supabase
        .from('profiles_brand')
        .select('*')
        .eq('user_id', typedCampaign.brand_id)
        .single()

    // Get creator user + profile
    const { data: creatorUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', creatorId)
        .single()

    const { data: creatorProfile } = await supabase
        .from('profiles_creator')
        .select('*')
        .eq('user_id', creatorId)
        .single()

    // Only the user records are strictly required. Profiles are optional
    // (internal missions: MOSH admin has no brand profile; creator may be
    // pre-onboarding). Names/address fall back to sensible defaults below.
    if (!brandUser || !creatorUser) {
        console.error('[Contract] Missing user data')
        return null
    }

    return {
        campaign: typedCampaign,
        brand: {
            ...(brandUser as unknown as User),
            profile: (brandProfile as unknown as ProfileBrand) ?? null,
        },
        creator: {
            ...(creatorUser as unknown as User),
            profile: (creatorProfile as unknown as ProfileCreator) ?? null,
        },
    }
}

// ── Helpers ──────────────────────────────────────────────────

const FORMAT_MAP: Record<string, string> = {
    '9_16': 'Vertical 9:16 (TikTok/Reels/Shorts)',
    '16_9': 'Horizontal 16:9 (YouTube)',
    '1_1': 'Carré 1:1 (Instagram)',
    '4_5': 'Portrait 4:5 (Instagram/Facebook)',
}

const TYPE_MAP: Record<string, string> = {
    testimonial: 'Témoignage',
    unboxing: 'Unboxing',
    asmr: 'ASMR',
    tutorial: 'Tutoriel',
    lifestyle: 'Lifestyle',
    review: 'Review produit',
}

function buildDeliverablesText(campaign: Campaign): string {
    const pricingPack = campaign.pricing_pack
    let videoCount = '1'
    if (pricingPack === 'premium') videoCount = 'Pack Premium'
    if (pricingPack === 'platinum') videoCount = 'Pack Platinum'

    return `• ${videoCount} vidéo(s) ${TYPE_MAP[campaign.script_type] || campaign.script_type}
• Format : ${FORMAT_MAP[campaign.format] || campaign.format}
• Produit : ${campaign.product_name}${campaign.script_notes ? `\n• Notes créatives : ${campaign.script_notes}` : ''}`
}

function formatDateCH(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('fr-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function formatTimestamp(date: Date): string {
    return date.toLocaleString('fr-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

/**
 * Compute TVA breakdown from a TTC amount
 */
function computeTva(amountTtc: number, tvaRate: number = MOSH_COMPANY_INFO.tvaRate) {
    const amountHt = amountTtc / (1 + tvaRate / 100)
    const tvaAmount = amountTtc - amountHt
    return {
        amountHt: Math.round(amountHt * 100) / 100,
        tvaAmount: Math.round(tvaAmount * 100) / 100,
        tvaRate,
    }
}

// ── Contract Generation ─────────────────────────────────────

/**
 * Generate a MOSH ↔ Creator contract for a campaign.
 * Called by admin when assigning a creator.
 */
export async function createMoshContract(
    campaignId: string,
    creatorAmountChf: number
): Promise<{ success: boolean; contractUrl?: string; error?: string }> {
    const supabase = createClient()

    const data = await getContractData(campaignId)
    if (!data) return { success: false, error: 'Données du contrat introuvables' }

    const { campaign, brand, creator } = data
    const contractId = `MOSH-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
    const now = new Date()

    // TVA calculation
    const { amountHt, tvaAmount, tvaRate } = computeTva(creatorAmountChf)

    const vars: ContractVariables = {
        CONTRACT_ID: contractId,
        CONTRACT_DATE: formatDateCH(now),

        MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
        MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
        MOSH_UID: MOSH_COMPANY_INFO.uid,
        MOSH_EMAIL: MOSH_COMPANY_INFO.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile?.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_DESCRIPTION: campaign.description || 'Selon le brief transmis via la plateforme MOSH.',
        BRAND_NAME: campaign.client_name || brand.profile?.company_name || brand.full_name,
        DELIVERABLES: buildDeliverablesText(campaign),
        FORMAT: FORMAT_MAP[campaign.format] || campaign.format,
        SCRIPT_TYPE: TYPE_MAP[campaign.script_type] || campaign.script_type,
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',

        AMOUNT_CHF: creatorAmountChf.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        PAYMENT_TERMS: moshPaymentTerms(),

        MOSH_ACCEPTANCE_TIMESTAMP: formatTimestamp(now),
        CREATOR_ACCEPTANCE_TIMESTAMP: 'En attente de signature',
        CREATOR_IP_ADDRESS: 'En attente de signature',
    }

    // Generate contract text
    const contractText = generateMoshContractText(vars)

    // Upload to Supabase Storage (best-effort — contract is regenerated dynamically)
    const fileName = `mosh/${contractId}.txt`
    const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' })

    let contractUrl: string | null = null
    const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, blob, {
            contentType: 'text/plain',
            upsert: true,
        })

    if (uploadError) {
        console.warn('[Contract] Storage upload skipped (RLS or bucket not configured):', uploadError.message)
        // Contract text will be generated dynamically via getMoshContractText — not blocking
    } else {
        const { data: urlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(fileName)
        contractUrl = urlData?.publicUrl || null
    }

    // Update campaign with contract data
    const { error: updateError } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            contract_mosh_url: contractUrl,
            contract_mosh_status: 'pending_creator',
            contract_mosh_generated_at: now.toISOString(),
            creator_amount_chf: creatorAmountChf,
        })
        .eq('id', campaignId)

    if (updateError) {
        console.error('[Contract] Update error:', updateError)
        return { success: false, error: updateError.message }
    }

    return { success: true, contractUrl: contractUrl || undefined }
}

/**
 * Generate a MOSH ↔ Creator contract for a SPECIFIC creator in a multi-creator campaign.
 * Stores contract data on campaign_contents rows assigned to that creator.
 */
export async function createMoshContractForCreator(
    campaignId: string,
    creatorId: string,
    creatorAmountChf: number
): Promise<{ success: boolean; contractUrl?: string; error?: string }> {
    const supabase = createClient()

    // Get campaign
    const { data: campaignRaw } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
    if (!campaignRaw) return { success: false, error: 'Campaign not found' }
    const campaign = campaignRaw as unknown as Campaign

    // Get brand data
    const { data: brandUser } = await supabase.from('users').select('*').eq('id', campaign.brand_id).single()
    const { data: brandProfile } = await supabase.from('profiles_brand').select('*').eq('user_id', campaign.brand_id).single()

    // Get creator data
    const { data: creatorUser } = await supabase.from('users').select('*').eq('id', creatorId).single()
    const { data: creatorProfile } = await supabase.from('profiles_creator').select('*').eq('user_id', creatorId).single()

    if (!brandUser || !creatorUser) {
        return { success: false, error: 'Données du contrat introuvables' }
    }

    const creator = { ...(creatorUser as unknown as User), profile: (creatorProfile as unknown as ProfileCreator) ?? null }
    const brand = { ...(brandUser as unknown as User), profile: (brandProfile as unknown as ProfileBrand) ?? null }

    // Get contents assigned to this creator for description
    const { data: contents } = await (supabase as any)
        .from('campaign_contents')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('assigned_creator_id', creatorId)
    const contentList = (contents || []) as any[]

    const contractId = `MOSH-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
    const now = new Date()
    const { amountHt, tvaAmount, tvaRate } = computeTva(creatorAmountChf)

    // Build deliverables text specific to this creator's contents
    const deliverablesText = contentList.map((c: any, i: number) =>
        `• Contenu ${i + 1}: ${TYPE_MAP[c.script_type] || c.script_type} — ${FORMAT_MAP[c.format] || c.format}`
    ).join('\n')

    const vars: ContractVariables = {
        CONTRACT_ID: contractId,
        CONTRACT_DATE: formatDateCH(now),
        MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
        MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
        MOSH_UID: MOSH_COMPANY_INFO.uid,
        MOSH_EMAIL: MOSH_COMPANY_INFO.email,
        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile?.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,
        MISSION_TITLE: campaign.title,
        MISSION_DESCRIPTION: campaign.description || 'Selon le brief transmis via la plateforme MOSH.',
        BRAND_NAME: campaign.client_name || brand.profile?.company_name || brand.full_name,
        DELIVERABLES: deliverablesText || buildDeliverablesText(campaign),
        FORMAT: contentList[0]?.format ? FORMAT_MAP[contentList[0].format] || contentList[0].format : FORMAT_MAP[campaign.format] || campaign.format,
        SCRIPT_TYPE: contentList[0]?.script_type ? TYPE_MAP[contentList[0].script_type] || contentList[0].script_type : TYPE_MAP[campaign.script_type] || campaign.script_type,
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',
        AMOUNT_CHF: creatorAmountChf.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        PAYMENT_TERMS: moshPaymentTerms(),
        MOSH_ACCEPTANCE_TIMESTAMP: formatTimestamp(now),
        CREATOR_ACCEPTANCE_TIMESTAMP: 'En attente de signature',
        CREATOR_IP_ADDRESS: 'En attente de signature',
    }

    const contractText = generateMoshContractText(vars)
    const fileName = `mosh/${contractId}.txt`
    const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' })

    let contractUrl: string | null = null
    const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, blob, { contentType: 'text/plain', upsert: true })

    if (!uploadError) {
        const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(fileName)
        contractUrl = urlData?.publicUrl || null
    }

    // Update campaign_contents rows for this creator
    const { error: updateError } = await (supabase as any)
        .from('campaign_contents')
        .update({
            creator_amount_chf: creatorAmountChf,
            contract_status: 'pending_creator',
            contract_generated_at: now.toISOString(),
            contract_url: contractUrl,
        })
        .eq('campaign_id', campaignId)
        .eq('assigned_creator_id', creatorId)

    if (updateError) {
        console.error('[Contract] Content update error:', updateError)
        return { success: false, error: updateError.message }
    }

    return { success: true, contractUrl: contractUrl || undefined }
}

// ── Creator Signing ─────────────────────────────────────────

/**
 * Creator signs the MOSH contract (counter-signature)
 * Supports both single-creator (campaign-level) and multi-creator (content-level) contracts.
 */
export async function signMoshContract(
    campaignId: string,
    creatorIp: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const now = new Date()

    // Verify campaign exists
    const { data: campaignRaw } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (!campaignRaw) return { success: false, error: 'Mission introuvable' }

    const campaign = campaignRaw as unknown as Campaign

    // Detect multi-creator mode: creator assigned via content, not at campaign level
    const isDirectAssignment = campaign.selected_creator_id === user.id
    let isContentAssignment = false

    if (!isDirectAssignment) {
        const { data: contentMatch } = await (supabase as any)
            .from('campaign_contents')
            .select('id, contract_status')
            .eq('campaign_id', campaignId)
            .eq('assigned_creator_id', user.id)
        if (!contentMatch || contentMatch.length === 0) {
            return { success: false, error: 'Mission introuvable' }
        }
        isContentAssignment = true

        // In multi-creator mode, check the content-level contract status
        const hasPendingContent = (contentMatch as any[]).some(c => c.contract_status === 'pending_creator')
        if (!hasPendingContent) {
            return { success: false, error: 'Ce contrat n\'est pas en attente de votre signature' }
        }
    } else {
        // Single-creator: check campaign-level status
        if (campaign.contract_mosh_status !== 'pending_creator') {
            return { success: false, error: 'Ce contrat n\'est pas en attente de votre signature' }
        }
    }

    if (isContentAssignment) {
        // ── Multi-creator: update only THIS creator's content rows ──
        await (supabase as any)
            .from('campaign_contents')
            .update({
                contract_status: 'active',
                contract_signed_at: now.toISOString(),
            })
            .eq('campaign_id', campaignId)
            .eq('assigned_creator_id', user.id)
            .eq('contract_status', 'pending_creator')

        // Check if ALL creators have now signed
        const { data: allContents } = await (supabase as any)
            .from('campaign_contents')
            .select('contract_status')
            .eq('campaign_id', campaignId)
            .not('assigned_creator_id', 'is', null)

        const allSigned = (allContents || []).every((c: any) => c.contract_status === 'active')

        if (allSigned) {
            // All creators signed → update campaign-level status
            await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
                .update({
                    contract_mosh_status: 'active',
                    contract_mosh_signed_at: now.toISOString(),
                    status: 'in_progress',
                })
                .eq('id', campaignId)
        }
    } else {
        // ── Single-creator: existing behavior ──
        const { error } = await (supabase
            .from('campaigns') as ReturnType<typeof supabase.from>)
            .update({
                contract_mosh_status: 'active',
                contract_mosh_signed_at: now.toISOString(),
                status: 'in_progress',
            })
            .eq('id', campaignId)

        if (error) return { success: false, error: error.message }

        // Also update content-level contracts if any
        await (supabase as any)
            .from('campaign_contents')
            .update({
                contract_status: 'active',
                contract_signed_at: now.toISOString(),
            })
            .eq('campaign_id', campaignId)
            .eq('assigned_creator_id', user.id)
            .eq('contract_status', 'pending_creator')
    }

    // Record contract_signed + auto-complete acceptance & shooting start
    await completeMissionStep(campaignId, 'contract_signed')
    await completeMissionStep(campaignId, 'creator_accepted')
    await completeMissionStep(campaignId, 'creator_shooting')

    // Re-generate contract with signature info using creator-specific data
    const creatorId = user.id
    const data = isContentAssignment
        ? await getContractDataForCreator(campaignId, creatorId)
        : await getContractData(campaignId)

    if (data) {
        const { campaign: camp, brand, creator } = data
        const amount = isContentAssignment
            ? await getCreatorAmountFromContents(campaignId, creatorId) || camp.budget_chf
            : camp.creator_amount_chf || camp.budget_chf
        const { amountHt, tvaAmount, tvaRate } = computeTva(amount)

        const contractId = `MOSH-${new Date(camp.contract_mosh_generated_at || now).getFullYear()}-${new Date(camp.contract_mosh_generated_at || now).getTime().toString(36).toUpperCase()}`

        const vars: ContractVariables = {
            CONTRACT_ID: contractId,
            CONTRACT_DATE: camp.contract_mosh_generated_at ? formatDateCH(camp.contract_mosh_generated_at) : formatDateCH(now),

            MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
            MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
            MOSH_UID: MOSH_COMPANY_INFO.uid,
            MOSH_EMAIL: MOSH_COMPANY_INFO.email,

            CREATOR_FULL_NAME: creator.full_name,
            CREATOR_ADDRESS: creator.profile?.address || 'Non renseignée',
            CREATOR_EMAIL: creator.email,

            MISSION_TITLE: camp.title,
            MISSION_DESCRIPTION: camp.description || 'Selon le brief transmis via la plateforme MOSH.',
            BRAND_NAME: camp.client_name || brand.profile?.company_name || brand.full_name,
            DELIVERABLES: buildDeliverablesText(camp),
            FORMAT: FORMAT_MAP[camp.format] || camp.format,
            SCRIPT_TYPE: TYPE_MAP[camp.script_type] || camp.script_type,
            DEADLINE: camp.deadline ? formatDateCH(camp.deadline) : 'À convenir entre les parties',
            REVISION_COUNT: '2',

            AMOUNT_CHF: amount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
            AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
            TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
            TVA_RATE: tvaRate.toString(),
            PAYMENT_TERMS: moshPaymentTerms(),

            MOSH_ACCEPTANCE_TIMESTAMP: camp.contract_mosh_generated_at
                ? formatTimestamp(new Date(camp.contract_mosh_generated_at))
                : 'N/A',
            CREATOR_ACCEPTANCE_TIMESTAMP: formatTimestamp(now),
            CREATOR_IP_ADDRESS: creatorIp,
        }

        const contractText = generateMoshContractText(vars)
        const fileName = `mosh/${contractId}.txt`
        const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' })

        await supabase.storage
            .from('contracts')
            .upload(fileName, blob, { contentType: 'text/plain', upsert: true })
    }

    return { success: true }
}

// ── Helpers for multi-creator ────────────────────────────────

/**
 * Fetch contract data for a SPECIFIC creator (content-level assignment)
 */
async function getContractDataForCreator(campaignId: string, creatorId: string): Promise<MoshContractData | null> {
    const supabase = createClient()

    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
    if (!campaign) return null
    const typedCampaign = campaign as unknown as Campaign

    const { data: brandUser } = await supabase.from('users').select('*').eq('id', typedCampaign.brand_id).single()
    const { data: brandProfile } = await supabase.from('profiles_brand').select('*').eq('user_id', typedCampaign.brand_id).single()
    const { data: creatorUser } = await supabase.from('users').select('*').eq('id', creatorId).single()
    const { data: creatorProfile } = await supabase.from('profiles_creator').select('*').eq('user_id', creatorId).single()

    if (!brandUser || !creatorUser) return null

    return {
        campaign: typedCampaign,
        brand: { ...(brandUser as unknown as User), profile: (brandProfile as unknown as ProfileBrand) ?? null },
        creator: { ...(creatorUser as unknown as User), profile: (creatorProfile as unknown as ProfileCreator) ?? null },
    }
}

/**
 * Get the per-creator amount from campaign_contents
 */
async function getCreatorAmountFromContents(campaignId: string, creatorId: string): Promise<number | null> {
    const supabase = createClient()
    const { data } = await (supabase as any)
        .from('campaign_contents')
        .select('creator_amount_chf')
        .eq('campaign_id', campaignId)
        .eq('assigned_creator_id', creatorId)
        .limit(1)
    return (data as any)?.[0]?.creator_amount_chf || null
}

// ── Contract Text (for viewing) ─────────────────────────────

/**
 * Get contract text for viewing (re-generates from current data).
 * Pass optional creatorId for multi-creator campaigns to get the correct per-creator contract.
 */
export async function getMoshContractText(campaignId: string, creatorId?: string): Promise<string | null> {
    const data = creatorId
        ? await getContractDataForCreator(campaignId, creatorId)
        : await getContractData(campaignId)
    if (!data) return null

    const { campaign, brand, creator } = data

    // Resolve the correct amount: content-level for multi-creator, campaign-level otherwise
    let creatorAmount = campaign.creator_amount_chf || campaign.budget_chf
    if (creatorId) {
        const contentAmount = await getCreatorAmountFromContents(campaignId, creatorId)
        if (contentAmount) creatorAmount = contentAmount
    }

    const { amountHt, tvaAmount, tvaRate } = computeTva(creatorAmount)

    const now = new Date()
    const contractId = campaign.contract_mosh_generated_at
        ? `MOSH-${new Date(campaign.contract_mosh_generated_at).getFullYear()}-${new Date(campaign.contract_mosh_generated_at).getTime().toString(36).toUpperCase()}`
        : `MOSH-PREVIEW`

    const vars: ContractVariables = {
        CONTRACT_ID: contractId,
        CONTRACT_DATE: campaign.contract_mosh_generated_at
            ? formatDateCH(campaign.contract_mosh_generated_at)
            : formatDateCH(now),

        MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
        MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
        MOSH_UID: MOSH_COMPANY_INFO.uid,
        MOSH_EMAIL: MOSH_COMPANY_INFO.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile?.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_DESCRIPTION: campaign.description || 'Selon le brief transmis via la plateforme MOSH.',
        BRAND_NAME: campaign.client_name || brand.profile?.company_name || brand.full_name,
        DELIVERABLES: buildDeliverablesText(campaign),
        FORMAT: FORMAT_MAP[campaign.format] || campaign.format,
        SCRIPT_TYPE: TYPE_MAP[campaign.script_type] || campaign.script_type,
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',

        AMOUNT_CHF: creatorAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        PAYMENT_TERMS: moshPaymentTerms(),

        MOSH_ACCEPTANCE_TIMESTAMP: campaign.contract_mosh_generated_at
            ? formatTimestamp(new Date(campaign.contract_mosh_generated_at))
            : 'En attente',
        CREATOR_ACCEPTANCE_TIMESTAMP: campaign.contract_mosh_signed_at
            ? formatTimestamp(new Date(campaign.contract_mosh_signed_at))
            : 'En attente de signature',
        CREATOR_IP_ADDRESS: campaign.contract_mosh_signed_at ? '(enregistrée)' : 'En attente de signature',
    }

    return generateMoshContractText(vars)
}
