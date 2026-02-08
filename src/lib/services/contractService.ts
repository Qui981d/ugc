import { createClient } from '@/lib/supabase/client'
import { generateContractText, type ContractVariables } from '@/lib/contracts/contractTemplate'
import type { Application, Campaign, ProfileBrand, ProfileCreator, User } from '@/types/database'

// ============================================================
// Contract Service — Orchestrates generation, storage, signing
// ============================================================

export interface ContractData {
    application: Application
    campaign: Campaign
    brand: User & { profile: ProfileBrand }
    creator: User & { profile: ProfileCreator }
}

/**
 * Fetch all data needed to generate a contract
 */
export async function getContractData(applicationId: string): Promise<ContractData | null> {
    const supabase = createClient()

    // Get application with campaign
    const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
            *,
            campaign:campaigns(*)
        `)
        .eq('id', applicationId)
        .single()

    if (appError || !appData) {
        console.error('[Contract] Failed to fetch application:', appError)
        return null
    }

    const application = appData as unknown as Application & { campaign: Campaign }
    const campaign = application.campaign

    // Get brand user + profile
    const { data: brandUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', campaign.brand_id)
        .single()

    const { data: brandProfile } = await supabase
        .from('profiles_brand')
        .select('*')
        .eq('user_id', campaign.brand_id)
        .single()

    // Get creator user + profile
    const { data: creatorUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', application.creator_id)
        .single()

    const { data: creatorProfile } = await supabase
        .from('profiles_creator')
        .select('*')
        .eq('user_id', application.creator_id)
        .single()

    if (!brandUser || !brandProfile || !creatorUser || !creatorProfile) {
        console.error('[Contract] Missing user/profile data')
        return null
    }

    return {
        application,
        campaign,
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

/**
 * Build deliverables description from campaign data
 */
function buildDeliverablesText(campaign: Campaign): string {
    const formatMap: Record<string, string> = {
        '9_16': 'Vertical 9:16 (TikTok/Reels/Shorts)',
        '16_9': 'Horizontal 16:9 (YouTube)',
        '1_1': 'Carré 1:1 (Instagram)',
        '4_5': 'Portrait 4:5 (Instagram/Facebook)',
    }
    const typeMap: Record<string, string> = {
        testimonial: 'Témoignage',
        unboxing: 'Unboxing',
        asmr: 'ASMR',
        tutorial: 'Tutoriel',
        lifestyle: 'Lifestyle',
        review: 'Review produit',
    }

    return `• Type de contenu : ${typeMap[campaign.script_type] || campaign.script_type}
• Format : ${formatMap[campaign.format] || campaign.format}
• Produit : ${campaign.product_name}${campaign.script_notes ? `\n• Notes créatives : ${campaign.script_notes}` : ''}`
}

/**
 * Format date in Swiss format DD.MM.YYYY
 */
function formatDateCH(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('fr-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

/**
 * Format timestamp for contract signature
 */
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
 * Generate contract and save to Supabase Storage
 * Called when a brand accepts an application
 */
export async function createContract(
    applicationId: string,
    brandIp: string
): Promise<{ success: boolean; contractUrl?: string; error?: string }> {
    const supabase = createClient()

    // 1. Fetch all needed data
    const data = await getContractData(applicationId)
    if (!data) return { success: false, error: 'Données du contrat introuvables' }

    const { application, campaign, brand, creator } = data
    const contractId = `UGC-${Date.now()}-${applicationId.slice(0, 8).toUpperCase()}`
    const now = new Date()

    // 2. Build contract variables
    const vars: ContractVariables = {
        CONTRACT_ID: contractId,
        CONTRACT_DATE: formatDateCH(now),

        BRAND_COMPANY_NAME: brand.profile.company_name,
        BRAND_CONTACT_NAME: brand.full_name,
        BRAND_ADDRESS: brand.profile.address || 'Non renseignée',
        BRAND_EMAIL: brand.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        CAMPAIGN_TITLE: campaign.title,
        CAMPAIGN_DESCRIPTION: campaign.description || 'Voir le brief sur la plateforme UGC Suisse.',
        DELIVERABLES: buildDeliverablesText(campaign),
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',

        AMOUNT_CHF: campaign.budget_chf.toLocaleString('fr-CH'),
        PAYMENT_TERMS: 'Paiement dû dans les 30 jours suivant la validation définitive des livrables.',

        BRAND_ACCEPTANCE_TIMESTAMP: formatTimestamp(now),
        BRAND_IP_ADDRESS: brandIp,
        CREATOR_ACCEPTANCE_TIMESTAMP: 'En attente de signature',
        CREATOR_IP_ADDRESS: 'En attente de signature',
    }

    // 3. Generate contract text
    const contractText = generateContractText(vars)

    // 4. Upload as text file to Supabase Storage
    const fileName = `contracts/${contractId}.txt`
    const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' })

    const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, blob, {
            contentType: 'text/plain',
            upsert: true,
        })

    if (uploadError) {
        console.error('[Contract] Upload error:', uploadError)
        // If the bucket doesn't exist yet, still save in DB without URL
        // The contract text can be regenerated
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName)

    const contractUrl = urlData?.publicUrl || null

    // 5. Update application with contract data
    const { error: updateError } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({
            status: 'accepted',
            contract_status: 'pending_creator',
            contract_url: contractUrl,
            contract_generated_at: now.toISOString(),
            brand_signed_at: now.toISOString(),
            brand_sign_ip: brandIp,
        })
        .eq('id', applicationId)

    if (updateError) {
        console.error('[Contract] Update error:', updateError)
        return { success: false, error: updateError.message }
    }

    // 6. Send notification to creator
    await (supabase
        .from('notifications') as ReturnType<typeof supabase.from>)
        .insert({
            user_id: creator.id,
            type: 'application_accepted',
            title: 'Candidature acceptée — Contrat à signer',
            message: `Votre candidature pour "${campaign.title}" a été acceptée ! Consultez et signez le contrat pour commencer.`,
            reference_id: campaign.id,
            reference_type: 'campaign',
        })

    return { success: true, contractUrl: contractUrl || undefined }
}

/**
 * Creator signs the contract (counter-signature)
 */
export async function signContractAsCreator(
    applicationId: string,
    creatorIp: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non authentifié' }

    const now = new Date()

    // Verify this application belongs to the creator and is pending their signature
    const { data: app } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .eq('creator_id', user.id)
        .single()

    if (!app) return { success: false, error: 'Candidature introuvable' }

    const application = app as unknown as Application
    if (application.contract_status !== 'pending_creator') {
        return { success: false, error: 'Ce contrat n\'est pas en attente de votre signature' }
    }

    // Update contract with creator signature  
    const { error } = await (supabase
        .from('applications') as ReturnType<typeof supabase.from>)
        .update({
            contract_status: 'active',
            creator_signed_at: now.toISOString(),
            creator_sign_ip: creatorIp,
        })
        .eq('id', applicationId)

    if (error) return { success: false, error: error.message }

    // Re-generate the contract text with creator signature info
    // and update the file in storage
    const data = await getContractData(applicationId)
    if (data) {
        const { campaign, brand, creator: creatorData } = data
        const contractId = `UGC-${application.contract_generated_at ? new Date(application.contract_generated_at).getTime() : Date.now()}-${applicationId.slice(0, 8).toUpperCase()}`

        const vars: ContractVariables = {
            CONTRACT_ID: contractId,
            CONTRACT_DATE: application.contract_generated_at ? formatDateCH(application.contract_generated_at) : formatDateCH(now),

            BRAND_COMPANY_NAME: brand.profile.company_name,
            BRAND_CONTACT_NAME: brand.full_name,
            BRAND_ADDRESS: brand.profile.address || 'Non renseignée',
            BRAND_EMAIL: brand.email,

            CREATOR_FULL_NAME: creatorData.full_name,
            CREATOR_ADDRESS: creatorData.profile.address || 'Non renseignée',
            CREATOR_EMAIL: creatorData.email,

            CAMPAIGN_TITLE: campaign.title,
            CAMPAIGN_DESCRIPTION: campaign.description || 'Voir le brief sur la plateforme UGC Suisse.',
            DELIVERABLES: buildDeliverablesText(campaign),
            DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
            REVISION_COUNT: '2',

            AMOUNT_CHF: campaign.budget_chf.toLocaleString('fr-CH'),
            PAYMENT_TERMS: 'Paiement dû dans les 30 jours suivant la validation définitive des livrables.',

            BRAND_ACCEPTANCE_TIMESTAMP: application.brand_signed_at
                ? formatTimestamp(new Date(application.brand_signed_at))
                : 'N/A',
            BRAND_IP_ADDRESS: application.brand_sign_ip || 'N/A',
            CREATOR_ACCEPTANCE_TIMESTAMP: formatTimestamp(now),
            CREATOR_IP_ADDRESS: creatorIp,
        }

        const contractText = generateContractText(vars)
        const fileName = `contracts/${contractId}.txt`
        const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' })

        await supabase.storage
            .from('contracts')
            .upload(fileName, blob, {
                contentType: 'text/plain',
                upsert: true,
            })
    }

    return { success: true }
}

/**
 * Get contract text for viewing (re-generates from current data)
 */
export async function getContractText(applicationId: string): Promise<string | null> {
    const data = await getContractData(applicationId)
    if (!data) return null

    const { application, campaign, brand, creator } = data
    const contractId = `UGC-${application.contract_generated_at ? new Date(application.contract_generated_at).getTime() : Date.now()}-${applicationId.slice(0, 8).toUpperCase()}`

    const vars: ContractVariables = {
        CONTRACT_ID: contractId,
        CONTRACT_DATE: application.contract_generated_at ? formatDateCH(application.contract_generated_at) : formatDateCH(new Date()),

        BRAND_COMPANY_NAME: brand.profile.company_name,
        BRAND_CONTACT_NAME: brand.full_name,
        BRAND_ADDRESS: brand.profile.address || 'Non renseignée',
        BRAND_EMAIL: brand.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        CAMPAIGN_TITLE: campaign.title,
        CAMPAIGN_DESCRIPTION: campaign.description || 'Voir le brief sur la plateforme UGC Suisse.',
        DELIVERABLES: buildDeliverablesText(campaign),
        DEADLINE: campaign.deadline ? formatDateCH(campaign.deadline) : 'À convenir entre les parties',
        REVISION_COUNT: '2',

        AMOUNT_CHF: campaign.budget_chf.toLocaleString('fr-CH'),
        PAYMENT_TERMS: 'Paiement dû dans les 30 jours suivant la validation définitive des livrables.',

        BRAND_ACCEPTANCE_TIMESTAMP: application.brand_signed_at
            ? formatTimestamp(new Date(application.brand_signed_at))
            : 'En attente',
        BRAND_IP_ADDRESS: application.brand_sign_ip || 'En attente',
        CREATOR_ACCEPTANCE_TIMESTAMP: application.creator_signed_at
            ? formatTimestamp(new Date(application.creator_signed_at))
            : 'En attente de signature',
        CREATOR_IP_ADDRESS: application.creator_sign_ip || 'En attente de signature',
    }

    return generateContractText(vars)
}
