import { createClient } from '@/lib/supabase/client'
import { generateMoshContractText, MOSH_COMPANY_INFO, type ContractVariables } from '@/lib/contracts/contractTemplate'
import { completeMissionStep } from '@/lib/services/adminService'
import type { Campaign, ProfileCreator, ProfileBrand, User } from '@/types/database'

// ============================================================
// Contract Service — MOSH ↔ Creator contract lifecycle
// ============================================================

export interface MoshContractData {
    campaign: Campaign
    brand: User & { profile: ProfileBrand }
    creator: User & { profile: ProfileCreator }
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

    if (!typedCampaign.selected_creator_id) {
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
        .eq('id', typedCampaign.selected_creator_id)
        .single()

    const { data: creatorProfile } = await supabase
        .from('profiles_creator')
        .select('*')
        .eq('user_id', typedCampaign.selected_creator_id)
        .single()

    if (!brandUser || !brandProfile || !creatorUser || !creatorProfile) {
        console.error('[Contract] Missing user/profile data')
        return null
    }

    return {
        campaign: typedCampaign,
        brand: {
            ...(brandUser as unknown as User),
            profile: brandProfile as unknown as ProfileBrand,
        },
        creator: {
            ...(creatorUser as unknown as User),
            profile: creatorProfile as unknown as ProfileCreator,
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
    if (pricingPack === '3_videos') videoCount = '3'
    if (pricingPack === 'custom') videoCount = 'À définir selon le brief'

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
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_DESCRIPTION: campaign.description || 'Selon le brief transmis via la plateforme MOSH.',
        BRAND_NAME: brand.profile.company_name || brand.full_name,
        DELIVERABLES: buildDeliverablesText(campaign),
        FORMAT: FORMAT_MAP[campaign.format] || campaign.format,
        SCRIPT_TYPE: TYPE_MAP[campaign.script_type] || campaign.script_type,
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',

        AMOUNT_CHF: creatorAmountChf.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        PAYMENT_TERMS: 'Paiement à 30 jours après validation définitive des livrables par MOSH.',

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

// ── Creator Signing ─────────────────────────────────────────

/**
 * Creator signs the MOSH contract (counter-signature)
 */
export async function signMoshContract(
    campaignId: string,
    creatorIp: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const now = new Date()

    // Verify campaign exists and is pending creator signature
    const { data: campaignRaw } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('selected_creator_id', user.id)
        .single()

    if (!campaignRaw) return { success: false, error: 'Mission introuvable' }

    const campaign = campaignRaw as unknown as Campaign
    if (campaign.contract_mosh_status !== 'pending_creator') {
        return { success: false, error: 'Ce contrat n\'est pas en attente de votre signature' }
    }

    // Update contract status
    const { error } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            contract_mosh_status: 'active',
            contract_mosh_signed_at: now.toISOString(),
            status: 'in_progress',
        })
        .eq('id', campaignId)

    if (error) return { success: false, error: error.message }

    // Record contract_signed step in workflow
    await completeMissionStep(campaignId, 'contract_signed')

    // Re-generate contract with signature info
    const data = await getContractData(campaignId)
    if (data) {
        const { campaign: camp, brand, creator } = data
        const { amountHt, tvaAmount, tvaRate } = computeTva(camp.creator_amount_chf || camp.budget_chf)

        const contractId = `MOSH-${new Date(camp.contract_mosh_generated_at || now).getFullYear()}-${new Date(camp.contract_mosh_generated_at || now).getTime().toString(36).toUpperCase()}`

        const vars: ContractVariables = {
            CONTRACT_ID: contractId,
            CONTRACT_DATE: camp.contract_mosh_generated_at ? formatDateCH(camp.contract_mosh_generated_at) : formatDateCH(now),

            MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
            MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
            MOSH_UID: MOSH_COMPANY_INFO.uid,
            MOSH_EMAIL: MOSH_COMPANY_INFO.email,

            CREATOR_FULL_NAME: creator.full_name,
            CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
            CREATOR_EMAIL: creator.email,

            MISSION_TITLE: camp.title,
            MISSION_DESCRIPTION: camp.description || 'Selon le brief transmis via la plateforme MOSH.',
            BRAND_NAME: brand.profile.company_name || brand.full_name,
            DELIVERABLES: buildDeliverablesText(camp),
            FORMAT: FORMAT_MAP[camp.format] || camp.format,
            SCRIPT_TYPE: TYPE_MAP[camp.script_type] || camp.script_type,
            DEADLINE: camp.deadline ? formatDateCH(camp.deadline) : 'À convenir entre les parties',
            REVISION_COUNT: '2',

            AMOUNT_CHF: (camp.creator_amount_chf || camp.budget_chf).toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
            AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
            TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
            TVA_RATE: tvaRate.toString(),
            PAYMENT_TERMS: 'Paiement à 30 jours après validation définitive des livrables par MOSH.',

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

// ── Contract Text (for viewing) ─────────────────────────────

/**
 * Get contract text for viewing (re-generates from current data)
 */
export async function getMoshContractText(campaignId: string): Promise<string | null> {
    const data = await getContractData(campaignId)
    if (!data) return null

    const { campaign, brand, creator } = data
    const { amountHt, tvaAmount, tvaRate } = computeTva(campaign.creator_amount_chf || campaign.budget_chf)

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
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_DESCRIPTION: campaign.description || 'Selon le brief transmis via la plateforme MOSH.',
        BRAND_NAME: brand.profile.company_name || brand.full_name,
        DELIVERABLES: buildDeliverablesText(campaign),
        FORMAT: FORMAT_MAP[campaign.format] || campaign.format,
        SCRIPT_TYPE: TYPE_MAP[campaign.script_type] || campaign.script_type,
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',

        AMOUNT_CHF: (campaign.creator_amount_chf || campaign.budget_chf).toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        PAYMENT_TERMS: 'Paiement à 30 jours après validation définitive des livrables par MOSH.',

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
