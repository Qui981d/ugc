import { createClient } from '@/lib/supabase/client'
import type {
    User,
    ProfileBrand,
    ProfileCreator,
    UserRole
} from '@/types/database'

export type FullProfile = {
    user: User
    brandProfile?: ProfileBrand
    creatorProfile?: ProfileCreator
}

// Helper function to add timeout to promises
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined
    const timeout = new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
            console.warn(`[Profile] Operation timed out after ${ms}ms`)
            resolve(fallback)
        }, ms)
    })
    try {
        const result = await Promise.race([promise, timeout])
        clearTimeout(timeoutId)
        return result
    } catch (err) {
        clearTimeout(timeoutId)
        throw err
    }
}

/**
 * Get current authenticated user with their profile
 */
export async function getCurrentUser(): Promise<FullProfile | null> {
    return withTimeout(getCurrentUserInternal(), 10000, null)
}

async function getCurrentUserInternal(): Promise<FullProfile | null> {
    const supabase = createClient()

    try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.error('[Profile] Auth error:', authError)
            return null
        }

        if (!authUser) {
            return null
        }

        // Fetch user data AND both profile types in parallel for speed
        const [userResult, brandResult, creatorResult] = await Promise.all([
            supabase.from('users').select('*').eq('id', authUser.id).single(),
            supabase.from('profiles_brand').select('*').eq('user_id', authUser.id).single(),
            supabase.from('profiles_creator').select('*').eq('user_id', authUser.id).single()
        ])

        if ((userResult as any).error || !(userResult as any).data) {
            console.error('[Profile] Error fetching user:', (userResult as any).error)
            return null
        }

        const user = (userResult as any).data as unknown as User

        // Return the appropriate profile based on role
        if (user.role === 'brand') {
            const brandProfile = (brandResult as any).data as unknown as ProfileBrand | null
            return { user, brandProfile: brandProfile || undefined }
        } else {
            const creatorProfile = (creatorResult as any).data as unknown as ProfileCreator | null
            return { user, creatorProfile: creatorProfile || undefined }
        }
    } catch (err) {
        console.error('[Profile] Unexpected error in getCurrentUser:', err)
        return null
    }
}

/**
 * Fast path: get profile by user ID, skipping redundant auth.getUser() call.
 * Used by AuthContext when we already know the user ID from the session.
 * Only fetches the relevant profile table based on role (not both).
 */
export async function getProfileByUserId(userId: string): Promise<FullProfile | null> {
    const supabase = createClient()

    try {
        // Step 1: Get user row (includes role)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (userError || !userData) {
            console.log('[Profile] No user row found for:', userId)
            return null
        }

        const user = userData as unknown as User

        // Step 2: Only fetch the relevant profile table based on role
        if (user.role === 'brand') {
            const { data: brandData } = await supabase
                .from('profiles_brand')
                .select('*')
                .eq('user_id', userId)
                .single()
            return { user, brandProfile: (brandData as unknown as ProfileBrand) || undefined }
        } else {
            const { data: creatorData } = await supabase
                .from('profiles_creator')
                .select('*')
                .eq('user_id', userId)
                .single()
            return { user, creatorProfile: (creatorData as unknown as ProfileCreator) || undefined }
        }
    } catch (err) {
        console.error('[Profile] Error in getProfileByUserId:', err)
        return null
    }
}

/**
 * Get a user profile by ID (public view)
 */
export async function getUserById(userId: string): Promise<FullProfile | null> {
    const supabase = createClient()
    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (error || !userData) return null

    const user = userData as unknown as User

    if (user.role === 'brand') {
        const { data: brandData } = await supabase
            .from('profiles_brand')
            .select('*')
            .eq('user_id', user.id)
            .single()
        const brandProfile = brandData as unknown as ProfileBrand | null
        return { user, brandProfile: brandProfile || undefined }
    } else {
        const { data: creatorData } = await supabase
            .from('profiles_creator')
            .select('*')
            .eq('user_id', user.id)
            .single()
        const creatorProfile = creatorData as unknown as ProfileCreator | null
        return { user, creatorProfile: creatorProfile || undefined }
    }
}

/**
 * Create user profile after signup
 */
export async function createUserProfile(
    userId: string,
    email: string,
    fullName: string,
    role: UserRole,
    extendedProfile: Partial<ProfileBrand> | Partial<ProfileCreator>
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    // Create base user (use upsert to handle cases where user already exists)
    const { error: userError } = await (supabase
        .from('users') as ReturnType<typeof supabase.from>)
        .upsert({
            id: userId,
            email,
            full_name: fullName,
            role,
        }, { onConflict: 'id' })

    if (userError) {
        return { success: false, error: userError.message }
    }

    // Create extended profile (use upsert to handle existing profiles)
    if (role === 'brand') {
        const { error: brandError } = await (supabase
            .from('profiles_brand') as ReturnType<typeof supabase.from>)
            .upsert({
                user_id: userId,
                company_name: (extendedProfile as Partial<ProfileBrand>).company_name || fullName,
                ...(extendedProfile as Partial<ProfileBrand>),
            }, { onConflict: 'user_id' })
        if (brandError) {
            return { success: false, error: brandError.message }
        }
    } else {
        const { error: creatorError } = await (supabase
            .from('profiles_creator') as ReturnType<typeof supabase.from>)
            .upsert({
                user_id: userId,
                ...(extendedProfile as Partial<ProfileCreator>),
            }, { onConflict: 'user_id' })
        if (creatorError) {
            return { success: false, error: creatorError.message }
        }
    }

    return { success: true }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
    userId: string,
    userData?: Partial<User>,
    extendedData?: Partial<ProfileBrand> | Partial<ProfileCreator>
): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    // Update base user if provided
    if (userData) {
        const { error } = await (supabase
            .from('users') as ReturnType<typeof supabase.from>)
            .update(userData)
            .eq('id', userId)
        if (error) return { success: false, error: error.message }
    }

    // Get user role to know which profile to update
    const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    if (!userRow) return { success: false, error: 'User not found' }

    const user = userRow as unknown as Pick<User, 'role'>

    if (extendedData) {
        if (user.role === 'brand') {
            const { error } = await (supabase
                .from('profiles_brand') as ReturnType<typeof supabase.from>)
                .update(extendedData as Partial<ProfileBrand>)
                .eq('user_id', userId)
            if (error) return { success: false, error: error.message }
        } else {
            const { error } = await (supabase
                .from('profiles_creator') as ReturnType<typeof supabase.from>)
                .update(extendedData as Partial<ProfileCreator>)
                .eq('user_id', userId)
            if (error) return { success: false, error: error.message }
        }
    }

    return { success: true }
}

/**
 * Get all creators (for marketplace)
 */
export async function getCreators(options?: {
    specialties?: string[]
    canton?: string
    isAvailable?: boolean
    limit?: number
    offset?: number
}): Promise<(User & { profile: ProfileCreator })[]> {
    const supabase = createClient()
    let query = supabase
        .from('users')
        .select(`
            *,
            profiles_creator!inner(*)
        `)
        .eq('role', 'creator')

    if (options?.isAvailable !== undefined) {
        query = query.eq('profiles_creator.is_available', options.isAvailable)
    }

    if (options?.canton) {
        query = query.eq('profiles_creator.location_canton', options.canton)
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error || !data) return []

    const creators = data as unknown as Array<User & { profiles_creator: ProfileCreator }>

    return creators.map(item => ({
        ...item,
        profile: item.profiles_creator,
    }))
}
