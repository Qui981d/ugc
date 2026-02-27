// ================================================
// UGC SUISSE - Database Type Definitions
// Generated from Supabase Schema
// ================================================

export type UserRole = 'brand' | 'creator' | 'admin'
export type CampaignStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed'
export type DeliverableStatus = 'pending' | 'review' | 'revision_requested' | 'approved' | 'rejected'
export type RightsUsageType = 'organic' | 'paid_3m' | 'paid_6m' | 'paid_12m' | 'perpetual'
export type VideoFormat = '9_16' | '16_9' | '1_1' | '4_5'
export type ScriptType = 'testimonial' | 'unboxing' | 'asmr' | 'tutorial' | 'lifestyle' | 'review'
export type ScriptStatus = 'draft' | 'pending_validation' | 'validated' | 'brand_review' | 'brand_approved'
export type MissionStepType =
    | 'brief_received'
    | 'brief_feedback'           // MOSH asks brand to clarify the brief
    | 'creators_proposed'
    | 'brand_reviewing_profiles'  // Brand is reviewing proposed creators
    | 'creator_validated'
    | 'script_sent'
    | 'script_brand_review'      // Brand is reviewing the script
    | 'script_brand_approved'    // Brand approved the script
    | 'mission_sent_to_creator'  // Mission + script sent to the creator
    | 'contract_signed'          // Creator signed the MOSH contract
    | 'creator_accepted'         // Creator acknowledged and accepted the mission
    | 'creator_shooting'         // Creator is filming/producing the content
    | 'video_uploaded_by_creator' // Creator uploaded the video draft
    | 'video_delivered'
    | 'video_validated'
    | 'video_sent_to_brand'
    | 'brand_final_review'       // Brand is reviewing final video
    | 'brand_final_approved'     // Brand approved final video = mission done
export type PricingPack = '1_video' | '3_videos' | 'custom'
export type NotificationType =
    | 'new_application'
    | 'message_received'
    | 'deliverable_submitted'
    | 'application_accepted'
    | 'application_rejected'
    | 'deliverable_approved'
    | 'deliverable_revision'
    | 'deliverable_rejected'

export type ContractStatus = 'pending_creator' | 'active' | 'cancelled'
export type BrandRequestStatus = 'new' | 'contacted' | 'meeting_scheduled' | 'closed'

export interface BrandRequest {
    id: string
    company_name: string
    contact_name: string
    email: string
    phone: string | null
    message: string | null
    status: BrandRequestStatus
    admin_notes: string | null
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    full_name: string
    role: UserRole
    avatar_url: string | null
    created_at: string
    updated_at: string
}

export interface ProfileBrand {
    id: string
    user_id: string
    company_name: string
    uid_number: string | null
    website: string | null
    industry: string | null
    description: string | null
    logo_url: string | null
    address: string | null
    created_at: string
    updated_at: string
}

export interface ProfileCreator {
    id: string
    user_id: string
    bio: string | null
    portfolio_video_urls: string[]
    location_canton: string | null
    languages: string[]
    specialties: ScriptType[]
    rating_avg: number
    rating_count: number
    hourly_rate_chf: number | null
    is_available: boolean
    address: string | null
    created_at: string
    updated_at: string
}

export interface Campaign {
    id: string
    brand_id: string
    title: string
    description: string | null
    product_name: string
    product_description: string | null
    product_requires_shipping: boolean
    format: VideoFormat
    script_type: ScriptType
    script_notes: string | null
    rights_usage: RightsUsageType
    budget_chf: number
    status: CampaignStatus
    deadline: string | null
    // Agency model fields
    assigned_admin_id: string | null
    selected_creator_id: string | null
    script_content: string | null
    script_status: ScriptStatus | null
    pricing_pack: PricingPack | null
    // Brief feedback (MOSH → Brand)
    brief_feedback_notes: string | null
    brief_feedback_at: string | null
    // Profile selection (Brand reviews proposed creators)
    proposed_creator_ids: string[] | null
    brand_profile_selection_at: string | null
    brand_profile_rejection_reason: string | null
    // Script brand review
    script_brand_feedback: string | null
    script_brand_approved_at: string | null
    // Brand final video review (max 2 revisions)
    brand_final_feedback: string | null
    brand_final_approved_at: string | null
    brand_revision_count: number
    // Contract fields (MOSH ↔ Creator)
    contract_mosh_url: string | null
    contract_mosh_status: 'pending_creator' | 'active' | null
    contract_mosh_generated_at: string | null
    contract_mosh_signed_at: string | null
    // Invoice fields
    invoice_url: string | null
    invoice_number: string | null
    invoice_generated_at: string | null
    creator_amount_chf: number | null
    // Video production
    video_url: string | null
    video_uploaded_at: string | null
    mosh_qc_feedback: string | null
    mosh_qc_approved_at: string | null
    // Creator studio
    creator_notes: string | null
    creator_checklist: string[] | null
    created_at: string
    updated_at: string
}

export interface Application {
    id: string
    campaign_id: string
    creator_id: string
    pitch_message: string | null
    proposed_rate_chf: number | null
    status: ApplicationStatus
    contract_status: ContractStatus | null
    contract_url: string | null
    contract_generated_at: string | null
    brand_signed_at: string | null
    creator_signed_at: string | null
    brand_sign_ip: string | null
    creator_sign_ip: string | null
    created_at: string
    updated_at: string
}

export interface Deliverable {
    id: string
    campaign_id: string
    creator_id: string
    video_url: string
    video_duration_seconds: number | null
    thumbnail_url: string | null
    is_watermarked: boolean
    status: DeliverableStatus
    revision_notes: string | null
    rights_transferred_at: string | null
    created_at: string
    updated_at: string
}

export interface Message {
    id: string
    campaign_id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
}

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    message: string | null
    reference_id: string | null
    reference_type: string | null
    is_read: boolean
    created_at: string
}

export interface MissionStep {
    id: string
    campaign_id: string
    step_type: MissionStepType
    completed_by: string | null
    completed_at: string | null
    notes: string | null
    metadata: Record<string, unknown>
    created_at: string
}

export interface Conversation {
    id: string
    campaign_id: string
    creator_id: string
    brand_id: string
    last_message_at: string | null
    created_at: string
}

export interface NotificationPreferences {
    id: string
    user_id: string
    email_new_application: boolean
    email_message_received: boolean
    email_deliverable: boolean
    email_application_status: boolean
    push_new_mission: boolean
    push_messages: boolean
    push_payments: boolean
    created_at: string
    updated_at: string
}

// ================================================
// Supabase Database Type
// ================================================

export interface Database {
    public: {
        Tables: {
            users: {
                Row: User
                Insert: Omit<User, 'created_at' | 'updated_at'>
                Update: Partial<Omit<User, 'id' | 'created_at'>>
            }
            profiles_brand: {
                Row: ProfileBrand
                Insert: Omit<ProfileBrand, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<ProfileBrand, 'id' | 'user_id' | 'created_at'>>
            }
            profiles_creator: {
                Row: ProfileCreator
                Insert: Omit<ProfileCreator, 'id' | 'created_at' | 'updated_at' | 'rating_avg' | 'rating_count'>
                Update: Partial<Omit<ProfileCreator, 'id' | 'user_id' | 'created_at'>>
            }
            campaigns: {
                Row: Campaign
                Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: CampaignStatus }
                Update: Partial<Omit<Campaign, 'id' | 'brand_id' | 'created_at'>>
            }
            applications: {
                Row: Application
                Insert: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: ApplicationStatus }
                Update: Partial<Omit<Application, 'id' | 'campaign_id' | 'creator_id' | 'created_at'>>
            }
            deliverables: {
                Row: Deliverable
                Insert: Omit<Deliverable, 'id' | 'created_at' | 'updated_at' | 'is_watermarked' | 'status'> & { status?: DeliverableStatus }
                Update: Partial<Omit<Deliverable, 'id' | 'campaign_id' | 'creator_id' | 'created_at'>>
            }
            messages: {
                Row: Message
                Insert: Omit<Message, 'id' | 'created_at' | 'is_read'>
                Update: Partial<Pick<Message, 'is_read'>>
            }
            notifications: {
                Row: Notification
                Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'>
                Update: Partial<Pick<Notification, 'is_read'>>
            }
            conversations: {
                Row: Conversation
                Insert: Omit<Conversation, 'id' | 'created_at'>
                Update: Partial<Pick<Conversation, 'last_message_at'>>
            }
            notification_preferences: {
                Row: NotificationPreferences
                Insert: Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'>
                Update: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at'>>
            }
            mission_steps: {
                Row: MissionStep
                Insert: Omit<MissionStep, 'id' | 'created_at'>
                Update: Partial<Omit<MissionStep, 'id' | 'campaign_id' | 'created_at'>>
            }
            brand_requests: {
                Row: BrandRequest
                Insert: Omit<BrandRequest, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: BrandRequestStatus }
                Update: Partial<Omit<BrandRequest, 'id' | 'created_at'>>
            }
        }
        Enums: {
            user_role: UserRole
            campaign_status: CampaignStatus
            application_status: ApplicationStatus
            deliverable_status: DeliverableStatus
            rights_usage_type: RightsUsageType
            video_format: VideoFormat
            script_type: ScriptType
            script_status: ScriptStatus
            mission_step_type: MissionStepType
            notification_type: NotificationType
            contract_status: ContractStatus
        }
    }
}
