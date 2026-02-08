// ================================================
// UGC SUISSE - Database Type Definitions
// Generated from Supabase Schema
// ================================================

export type UserRole = 'brand' | 'creator'
export type CampaignStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed'
export type DeliverableStatus = 'pending' | 'review' | 'revision_requested' | 'approved' | 'rejected'
export type RightsUsageType = 'organic' | 'paid_3m' | 'paid_6m' | 'paid_12m' | 'perpetual'
export type VideoFormat = '9_16' | '16_9' | '1_1' | '4_5'
export type ScriptType = 'testimonial' | 'unboxing' | 'asmr' | 'tutorial' | 'lifestyle' | 'review'
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
        }
        Enums: {
            user_role: UserRole
            campaign_status: CampaignStatus
            application_status: ApplicationStatus
            deliverable_status: DeliverableStatus
            rights_usage_type: RightsUsageType
            video_format: VideoFormat
            script_type: ScriptType
            notification_type: NotificationType
            contract_status: ContractStatus
        }
    }
}
