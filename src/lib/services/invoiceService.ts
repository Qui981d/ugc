import { createClient } from '@/lib/supabase/client'
import { generateInvoiceText, type InvoiceVariables } from '@/lib/invoices/invoiceTemplate'
import { MOSH_COMPANY_INFO } from '@/lib/contracts/contractTemplate'
import type { Campaign, ProfileCreator, ProfileBrand, User } from '@/types/database'

// ============================================================
// Invoice Service — MOSH ↔ Creator invoice lifecycle
// ============================================================

// ── Helpers ──────────────────────────────────────────────────

function formatDateCH(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('fr-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function computeTva(amountTtc: number, tvaRate: number = MOSH_COMPANY_INFO.tvaRate) {
    const amountHt = amountTtc / (1 + tvaRate / 100)
    const tvaAmount = amountTtc - amountHt
    return {
        amountHt: Math.round(amountHt * 100) / 100,
        tvaAmount: Math.round(tvaAmount * 100) / 100,
        tvaRate,
    }
}

const TYPE_MAP: Record<string, string> = {
    testimonial: 'Témoignage',
    unboxing: 'Unboxing',
    asmr: 'ASMR',
    tutorial: 'Tutoriel',
    lifestyle: 'Lifestyle',
    review: 'Review produit',
}

const FORMAT_MAP: Record<string, string> = {
    '9_16': 'Vertical 9:16',
    '16_9': 'Horizontal 16:9',
    '1_1': 'Carré 1:1',
    '4_5': 'Portrait 4:5',
}

// ── Invoice Number Generation ───────────────────────────────

/**
 * Generate next invoice number: MOSH-YYYY-NNNN
 */
async function getNextInvoiceNumber(): Promise<string> {
    const supabase = createClient()
    const year = new Date().getFullYear()
    const prefix = `MOSH-${year}-`

    // Count existing invoices for this year
    const { count } = await supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .not('invoice_number', 'is', null)
        .like('invoice_number', `${prefix}%`)

    const nextNum = (count || 0) + 1
    return `${prefix}${nextNum.toString().padStart(4, '0')}`
}

// ── Invoice Generation ──────────────────────────────────────

/**
 * Generate an invoice for a completed mission.
 * Called when the mission reaches the final step (video_sent_to_brand).
 */
export async function generateInvoice(
    campaignId: string
): Promise<{ success: boolean; invoiceUrl?: string; invoiceNumber?: string; error?: string }> {
    const supabase = createClient()

    // Get campaign
    const { data: campaignRaw } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (!campaignRaw) return { success: false, error: 'Mission introuvable' }

    const campaign = campaignRaw as unknown as Campaign

    // Don't re-generate if already exists
    if (campaign.invoice_number) {
        return {
            success: true,
            invoiceUrl: campaign.invoice_url || undefined,
            invoiceNumber: campaign.invoice_number,
        }
    }

    // Find the creator — either from campaign level or content level
    let creatorId = campaign.selected_creator_id

    if (!creatorId) {
        // Fallback: check campaign_contents for an assigned creator
        const { data: contentWithCreator } = await supabase
            .from('campaign_contents')
            .select('assigned_creator_id')
            .eq('campaign_id', campaignId)
            .not('assigned_creator_id', 'is', null)
            .limit(1)

        creatorId = (contentWithCreator as any)?.[0]?.assigned_creator_id || null
    }

    if (!creatorId) {
        return { success: false, error: 'Aucun créateur assigné' }
    }

    // Get brand info
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

    // Get creator info
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

    if (!brandUser || !creatorUser) {
        return { success: false, error: 'Données utilisateur manquantes' }
    }

    const brand = { ...(brandUser as unknown as User), profile: (brandProfile || {}) as ProfileBrand }
    const creator = { ...(creatorUser as unknown as User), profile: (creatorProfile || {}) as ProfileCreator }

    const now = new Date()
    const invoiceNumber = await getNextInvoiceNumber()
    const creatorAmount = campaign.creator_amount_chf || campaign.budget_chf
    const { amountHt, tvaAmount, tvaRate } = computeTva(creatorAmount)

    // Payment due date: 30 days from now
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + 30)

    // Build deliverables summary
    const pricingPack = campaign.pricing_pack
    let videoCount = 'Vidéo(s) UGC'
    if (pricingPack === 'essentiel') videoCount = 'Pack Essentiel'
    if (pricingPack === 'premium') videoCount = 'Pack Premium'
    if (pricingPack === 'platinum') videoCount = 'Pack Platinum'

    const deliverablesSummary = `Prestation : ${videoCount} UGC
Type : ${TYPE_MAP[campaign.script_type] || campaign.script_type}
Format : ${FORMAT_MAP[campaign.format] || campaign.format}
Produit : ${campaign.product_name}`

    const vars: InvoiceVariables = {
        INVOICE_NUMBER: invoiceNumber,
        INVOICE_DATE: formatDateCH(now),

        MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
        MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
        MOSH_UID: MOSH_COMPANY_INFO.uid,
        MOSH_EMAIL: MOSH_COMPANY_INFO.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_REF: campaignId.slice(0, 8).toUpperCase(),
        BRAND_NAME: brand.profile.company_name || brand.full_name,
        DELIVERABLES_SUMMARY: deliverablesSummary,
        COMPLETION_DATE: formatDateCH(now),

        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_TTC: creatorAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),

        PAYMENT_TERMS: 'Paiement par virement bancaire dans les 30 jours.',
        PAYMENT_DUE_DATE: formatDateCH(dueDate),
    }

    // Generate invoice text
    const invoiceText = generateInvoiceText(vars)

    // Upload to Supabase Storage
    const fileName = `invoices/${invoiceNumber}.txt`
    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' })

    const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, blob, {
            contentType: 'text/plain',
            upsert: true,
        })

    if (uploadError) {
        console.error('[Invoice] Upload error:', uploadError)
    }

    const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName)

    const invoiceUrl = urlData?.publicUrl || null

    // Update campaign
    const { error: updateError } = await (supabase
        .from('campaigns') as ReturnType<typeof supabase.from>)
        .update({
            invoice_url: invoiceUrl,
            invoice_number: invoiceNumber,
            invoice_generated_at: now.toISOString(),
        })
        .eq('id', campaignId)

    if (updateError) {
        console.error('[Invoice] Update error:', updateError)
        return { success: false, error: updateError.message }
    }

    return {
        success: true,
        invoiceUrl: invoiceUrl || undefined,
        invoiceNumber,
    }
}

/**
 * Get structured invoice variables for a campaign
 */
export async function getInvoiceVars(campaignId: string): Promise<InvoiceVariables | null> {
    const supabase = createClient()

    const { data: campaignRaw } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (!campaignRaw) return null

    const campaign = campaignRaw as unknown as Campaign
    if (!campaign.invoice_number) return null

    // Find creator — campaign level or content level
    let creatorId = campaign.selected_creator_id
    if (!creatorId) {
        const { data: contentWithCreator } = await supabase
            .from('campaign_contents')
            .select('assigned_creator_id')
            .eq('campaign_id', campaignId)
            .not('assigned_creator_id', 'is', null)
            .limit(1)
        creatorId = (contentWithCreator as any)?.[0]?.assigned_creator_id || null
    }
    if (!creatorId) return null

    // Get creator info
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

    // Get brand info
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

    if (!creatorUser || !brandUser) return null

    const creator = { ...(creatorUser as unknown as User), profile: (creatorProfile || {}) as ProfileCreator }
    const brand = { ...(brandUser as unknown as User), profile: (brandProfile || {}) as ProfileBrand }

    const creatorAmount = campaign.creator_amount_chf || campaign.budget_chf
    const { amountHt, tvaAmount, tvaRate } = computeTva(creatorAmount)

    const dueDate = new Date(campaign.invoice_generated_at || new Date())
    dueDate.setDate(dueDate.getDate() + 30)

    const pricingPack = campaign.pricing_pack
    let videoCount = 'Vidéo(s) UGC'
    if (pricingPack === 'essentiel') videoCount = 'Pack Essentiel'
    if (pricingPack === 'premium') videoCount = 'Pack Premium'
    if (pricingPack === 'platinum') videoCount = 'Pack Platinum'

    const deliverablesSummary = `Prestation : ${videoCount} UGC
Type : ${TYPE_MAP[campaign.script_type] || campaign.script_type}
Format : ${FORMAT_MAP[campaign.format] || campaign.format}
Produit : ${campaign.product_name}`

    return {
        INVOICE_NUMBER: campaign.invoice_number,
        INVOICE_DATE: campaign.invoice_generated_at ? formatDateCH(campaign.invoice_generated_at) : formatDateCH(new Date()),

        MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
        MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
        MOSH_UID: MOSH_COMPANY_INFO.uid,
        MOSH_EMAIL: MOSH_COMPANY_INFO.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_REF: campaignId.slice(0, 8).toUpperCase(),
        BRAND_NAME: brand.profile.company_name || brand.full_name,
        DELIVERABLES_SUMMARY: deliverablesSummary,
        COMPLETION_DATE: campaign.invoice_generated_at ? formatDateCH(campaign.invoice_generated_at) : formatDateCH(new Date()),

        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_TTC: creatorAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),

        PAYMENT_TERMS: 'Paiement par virement bancaire dans les 30 jours.',
        PAYMENT_DUE_DATE: formatDateCH(dueDate),
    }
}

/**
 * Get invoice text for viewing (re-generates from current data)
 */
export async function getInvoiceText(campaignId: string): Promise<string | null> {
    const vars = await getInvoiceVars(campaignId)
    if (!vars) return null
    return generateInvoiceText(vars)
}

// ── Multi-Creator Invoice Support ──────────────────────────────

/**
 * Generate an invoice for a SPECIFIC creator in a multi-creator campaign.
 * Uses the amount from campaign_contents for that creator.
 */
export async function generateInvoiceForCreator(
    campaignId: string,
    creatorId: string,
): Promise<{ success: boolean; invoiceUrl?: string; invoiceNumber?: string; error?: string }> {
    const supabase = createClient()

    // Get campaign
    const { data: campaignRaw } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
    if (!campaignRaw) return { success: false, error: 'Mission introuvable' }
    const campaign = campaignRaw as unknown as Campaign

    // Get creator's content rows
    const { data: creatorContents } = await (supabase as any)
        .from('campaign_contents')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('assigned_creator_id', creatorId)

    if (!creatorContents || creatorContents.length === 0) {
        return { success: false, error: 'Aucun contenu assigné à ce créateur' }
    }

    // Check if this creator already has an invoice (stored on content level)
    const existingInvoice = (creatorContents as any[]).find(c => c.invoice_number)
    if (existingInvoice) {
        return {
            success: true,
            invoiceNumber: existingInvoice.invoice_number,
            invoiceUrl: existingInvoice.invoice_url || undefined,
        }
    }

    // Get brand info
    const { data: brandUser } = await supabase.from('users').select('*').eq('id', campaign.brand_id).single()
    const { data: brandProfile } = await supabase.from('profiles_brand').select('*').eq('user_id', campaign.brand_id).single()

    // Get creator info
    const { data: creatorUser } = await supabase.from('users').select('*').eq('id', creatorId).single()
    const { data: creatorProfile } = await supabase.from('profiles_creator').select('*').eq('user_id', creatorId).single()

    if (!brandUser || !creatorUser) {
        return { success: false, error: 'Données utilisateur manquantes' }
    }

    const brand = { ...(brandUser as unknown as User), profile: (brandProfile || {}) as ProfileBrand }
    const creator = { ...(creatorUser as unknown as User), profile: (creatorProfile || {}) as ProfileCreator }

    const now = new Date()
    const invoiceNumber = await getNextInvoiceNumber()
    // Per-creator amount from campaign_contents
    const creatorAmount = (creatorContents as any[])[0]?.creator_amount_chf || campaign.budget_chf
    const { amountHt, tvaAmount, tvaRate } = computeTva(creatorAmount)

    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + 30)

    // Build deliverables summary specific to this creator's contents
    const deliverablesSummary = (creatorContents as any[]).map((c: any, i: number) =>
        `Contenu ${i + 1}: ${TYPE_MAP[c.script_type] || c.script_type} — ${FORMAT_MAP[c.format] || c.format}`
    ).join('\n')

    const vars: InvoiceVariables = {
        INVOICE_NUMBER: invoiceNumber,
        INVOICE_DATE: formatDateCH(now),

        MOSH_COMPANY_NAME: MOSH_COMPANY_INFO.name,
        MOSH_ADDRESS: MOSH_COMPANY_INFO.address,
        MOSH_UID: MOSH_COMPANY_INFO.uid,
        MOSH_EMAIL: MOSH_COMPANY_INFO.email,

        CREATOR_FULL_NAME: creator.full_name,
        CREATOR_ADDRESS: creator.profile.address || 'Non renseignée',
        CREATOR_EMAIL: creator.email,

        MISSION_TITLE: campaign.title,
        MISSION_REF: campaignId.slice(0, 8).toUpperCase(),
        BRAND_NAME: brand.profile.company_name || brand.full_name,
        DELIVERABLES_SUMMARY: `Prestation : ${deliverablesSummary}\nProduit : ${campaign.product_name}`,
        COMPLETION_DATE: formatDateCH(now),

        AMOUNT_HT: amountHt.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        TVA_RATE: tvaRate.toString(),
        TVA_AMOUNT: tvaAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),
        AMOUNT_TTC: creatorAmount.toLocaleString('fr-CH', { minimumFractionDigits: 2 }),

        PAYMENT_TERMS: 'Paiement par virement bancaire dans les 30 jours.',
        PAYMENT_DUE_DATE: formatDateCH(dueDate),
    }

    const invoiceText = generateInvoiceText(vars)
    const fileName = `invoices/${invoiceNumber}.txt`
    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' })

    await supabase.storage.from('contracts').upload(fileName, blob, { contentType: 'text/plain', upsert: true })

    const { data: urlData } = supabase.storage.from('contracts').getPublicUrl(fileName)
    const invoiceUrl = urlData?.publicUrl || null

    // Store invoice data on the creator's content rows
    await (supabase as any)
        .from('campaign_contents')
        .update({
            invoice_number: invoiceNumber,
            invoice_url: invoiceUrl,
            invoice_generated_at: now.toISOString(),
        })
        .eq('campaign_id', campaignId)
        .eq('assigned_creator_id', creatorId)

    return { success: true, invoiceUrl: invoiceUrl || undefined, invoiceNumber }
}

/**
 * Generate invoices for ALL creators in a multi-creator campaign.
 * Calls generateInvoiceForCreator for each unique assigned creator.
 * Falls back to the standard generateInvoice for single-creator campaigns.
 */
export async function generateInvoicesForAllCreators(
    campaignId: string,
): Promise<{ success: boolean; results: { creatorId: string; invoiceNumber?: string; error?: string }[]; error?: string }> {
    const supabase = createClient()

    // Get campaign to check mode
    const { data: campaignRaw } = await supabase.from('campaigns').select('selected_creator_id, creator_preference').eq('id', campaignId).single()
    const camp = campaignRaw as any

    if (camp?.selected_creator_id || camp?.creator_preference !== 'per_video') {
        // Single-creator: use standard invoice
        const result = await generateInvoice(campaignId)
        return {
            success: result.success,
            results: [{ creatorId: camp?.selected_creator_id || '', invoiceNumber: result.invoiceNumber, error: result.error }],
            error: result.error,
        }
    }

    // Multi-creator: get unique creator IDs from contents
    const { data: contents } = await (supabase as any)
        .from('campaign_contents')
        .select('assigned_creator_id')
        .eq('campaign_id', campaignId)
        .not('assigned_creator_id', 'is', null)

    const creatorIds = [...new Set((contents || []).map((c: any) => c.assigned_creator_id))] as string[]

    if (creatorIds.length === 0) {
        return { success: false, results: [], error: 'Aucun créateur assigné' }
    }

    const results = []
    for (const creatorId of creatorIds) {
        const result = await generateInvoiceForCreator(campaignId, creatorId)
        results.push({ creatorId, invoiceNumber: result.invoiceNumber, error: result.error })
    }

    const allSuccess = results.every(r => !r.error)
    return { success: allSuccess, results }
}
