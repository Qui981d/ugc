import { createClient } from '@/lib/supabase/client'

// ================================================
// DELIVERABLE SERVICE
// Upload, review, and manage video deliverables
// ================================================

export interface Deliverable {
    id: string
    campaign_id: string
    creator_id: string
    video_url: string
    video_duration_seconds: number | null
    thumbnail_url: string | null
    is_watermarked: boolean
    status: 'pending' | 'review' | 'revision_requested' | 'approved' | 'rejected'
    revision_notes: string | null
    rights_transferred_at: string | null
    created_at: string
    updated_at: string
}

/**
 * Upload a video file to Supabase Storage
 * Files are stored in: deliverables/{campaign_id}/{creator_id}/{timestamp}_{filename}
 */
export async function uploadVideo(
    file: File,
    campaignId: string,
    creatorId: string,
    onProgress?: (percent: number) => void
): Promise<string | null> {
    const supabase = createClient()

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${campaignId}/${creatorId}/${timestamp}_${sanitizedName}`

    // Upload to Supabase Storage
    const { data, error } = await (supabase as any).storage
        .from('deliverables')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        console.error('Error uploading video:', error)
        return null
    }

    // Return the file path (not public URL — bucket is private)
    return filePath
}

/**
 * Get a signed URL for video playback (private bucket)
 * Returns a temporary URL valid for 1 hour
 */
export async function getVideoSignedUrl(filePath: string): Promise<string | null> {
    const supabase = createClient()

    // If it's already a full URL (legacy), extract the path
    const bucketPrefix = '/storage/v1/object/public/deliverables/'
    const idx = filePath.indexOf(bucketPrefix)
    const cleanPath = idx !== -1 ? filePath.substring(idx + bucketPrefix.length) : filePath

    const { data, error } = await (supabase as any).storage
        .from('deliverables')
        .createSignedUrl(cleanPath, 3600) // 1 hour

    if (error) {
        console.error('Error creating signed URL:', error)
        return null
    }

    return data?.signedUrl || null
}

/**
 * Create a new deliverable record in the database
 */
export async function createDeliverable(data: {
    campaign_id: string
    creator_id: string
    video_url: string
    video_duration_seconds?: number
    thumbnail_url?: string
}): Promise<Deliverable | null> {
    const supabase = createClient()

    const { data: deliverable, error } = await (supabase as any)
        .from('deliverables')
        .insert({
            campaign_id: data.campaign_id,
            creator_id: data.creator_id,
            video_url: data.video_url,
            video_duration_seconds: data.video_duration_seconds || null,
            thumbnail_url: data.thumbnail_url || null,
            is_watermarked: true,
            status: 'review',
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating deliverable:', error)
        return null
    }

    return deliverable as Deliverable
}

/**
 * Get deliverables for a campaign (optionally filtered by creator)
 */
export async function getDeliverables(
    campaignId: string,
    creatorId?: string
): Promise<Deliverable[]> {
    const supabase = createClient()

    let query = (supabase as any)
        .from('deliverables')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

    if (creatorId) {
        query = query.eq('creator_id', creatorId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching deliverables:', error)
        return []
    }

    return (data || []) as Deliverable[]
}

/**
 * Get a single deliverable by ID
 */
export async function getDeliverable(id: string): Promise<Deliverable | null> {
    const supabase = createClient()

    const { data, error } = await (supabase as any)
        .from('deliverables')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching deliverable:', error)
        return null
    }

    return data as Deliverable
}

/**
 * Update deliverable status (brand review actions)
 */
export async function updateDeliverableStatus(
    id: string,
    status: 'approved' | 'revision_requested' | 'rejected',
    revisionNotes?: string
): Promise<boolean> {
    const supabase = createClient()

    const updateData: Record<string, any> = { status }

    if (status === 'revision_requested' && revisionNotes) {
        updateData.revision_notes = revisionNotes
    }

    if (status === 'approved') {
        updateData.is_watermarked = false
        updateData.rights_transferred_at = new Date().toISOString()
    }

    const { error } = await (supabase as any)
        .from('deliverables')
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error('Error updating deliverable status:', error)
        return false
    }

    // ========================================
    // AUTO-COMPLETION: When approved, mark
    // application + campaign as completed
    // ========================================
    if (status === 'approved') {
        // Get the deliverable to find campaign_id and creator_id
        const { data: deliv } = await (supabase as any)
            .from('deliverables')
            .select('campaign_id, creator_id')
            .eq('id', id)
            .single()

        if (deliv) {
            // 1. Mark application as completed
            await (supabase as any)
                .from('applications')
                .update({ status: 'completed' })
                .eq('campaign_id', deliv.campaign_id)
                .eq('creator_id', deliv.creator_id)

            // 2. Check if ALL accepted applications for this campaign are now completed
            const { data: pendingApps } = await (supabase as any)
                .from('applications')
                .select('id')
                .eq('campaign_id', deliv.campaign_id)
                .eq('status', 'accepted')

            // If no more pending accepted applications, mark campaign as completed
            if (!pendingApps || pendingApps.length === 0) {
                await (supabase as any)
                    .from('campaigns')
                    .update({ status: 'completed' })
                    .eq('id', deliv.campaign_id)
            }
        }
    }

    return true
}

/**
 * Generate a download URL for an approved deliverable
 * Returns a signed URL that expires after 1 hour
 */
export async function getDownloadUrl(videoUrl: string): Promise<string | null> {
    const supabase = createClient()

    // Extract the file path from the public URL
    const bucketUrl = '/storage/v1/object/public/deliverables/'
    const pathIndex = videoUrl.indexOf(bucketUrl)

    if (pathIndex === -1) {
        // If it's not a storage URL, return it directly
        return videoUrl
    }

    const filePath = videoUrl.substring(pathIndex + bucketUrl.length)

    const { data, error } = await (supabase as any).storage
        .from('deliverables')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
        console.error('Error creating signed URL:', error)
        return videoUrl // Fallback to public URL
    }

    return data?.signedUrl || videoUrl
}
