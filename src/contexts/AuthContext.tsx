'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createUserProfile, getProfileByUserId, type FullProfile } from '@/lib/services/profileService'
import { useAuthStore } from '@/stores/useAuthStore'
import type { User as DbUser, UserRole } from '@/types/database'
import type { User as AuthUser } from '@supabase/supabase-js'

interface AuthContextType {
    user: DbUser | null
    authUser: AuthUser | null
    profile: FullProfile | null
    isLoading: boolean
    signUp: (email: string, password: string, fullName: string, role: UserRole, extendedProfile?: Record<string, unknown>) => Promise<{ error?: string }>
    signIn: (email: string, password: string) => Promise<{ error?: string }>
    signOut: () => Promise<void>
    isAuthenticated: boolean
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabase = createClient()

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null)
    const [user, setUser] = useState<DbUser | null>(() => {
        // Synchronous hydration from Zustand persisted state
        // This avoids the "jump" by providing data on the very first render
        return useAuthStore.getState().user
    })
    const [profile, setProfile] = useState<FullProfile | null>(() => {
        const cached = useAuthStore.getState()
        if (cached.user) {
            return {
                user: cached.user,
                brandProfile: cached.brandProfile || undefined,
                creatorProfile: cached.creatorProfile || undefined,
            }
        }
        return null
    })
    // Start as false if we have cached data (no loading needed)
    const [isLoading, setIsLoading] = useState(() => !useAuthStore.getState().user)
    const router = useRouter()

    // Guards to prevent double-loading and stale closures
    const loadingUserId = useRef<string | null>(null)
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true

        // Safety timeout — NEVER stay loading forever (covers network failures, Supabase hanging, etc.)
        const safetyTimer = setTimeout(() => {
            if (mounted.current) {
                setIsLoading(false)
            }
        }, 5000)

        // Single auth state listener — Supabase recommended pattern.
        // onAuthStateChange fires INITIAL_SESSION on mount, then SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED later.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted.current) return

                setAuthUser(session?.user ?? null)

                if (session?.user) {
                    const userId = session.user.id

                    // Dedup: skip if already loading this same userId
                    if (loadingUserId.current === userId && event !== 'SIGNED_IN') {
                        return
                    }

                    // Fire-and-forget — NOT awaited in the callback to prevent race conditions.
                    // Supabase can fire multiple events rapidly; if we await, a second event
                    // arrives mid-flight and destroys our state.
                    loadingUserId.current = userId
                    loadProfileFast(userId)
                } else {
                    // No session — clear everything immediately
                    loadingUserId.current = null
                    setUser(null)
                    setProfile(null)
                    setIsLoading(false)
                    useAuthStore.getState().reset()
                }
            }
        )

        return () => {
            mounted.current = false
            clearTimeout(safetyTimer)
            subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * Fast profile loading — uses getProfileByUserId which skips redundant auth.getUser().
     * Only fetches the relevant profile table based on role.
     */
    const loadProfileFast = async (userId: string) => {
        try {
            const fullProfile = await getProfileByUserId(userId)
            if (!mounted.current) return
            if (loadingUserId.current !== userId) return // Stale request, user changed

            if (fullProfile) {
                setUser(fullProfile.user)
                setProfile(fullProfile)
                // Persist to Zustand cache for next navigation
                const storeState = useAuthStore.getState()
                storeState.setUser(fullProfile.user)
                storeState.setBrandProfile(fullProfile.brandProfile || null)
                storeState.setCreatorProfile(fullProfile.creatorProfile || null)
            }
        } catch (error) {
            console.error('[Auth] Error loading profile:', error)
        } finally {
            if (mounted.current) {
                setIsLoading(false)
            }
        }
    }

    const refreshProfile = useCallback(async () => {
        if (authUser) {
            await loadProfileFast(authUser.id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser?.id])

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        role: UserRole,
        extendedProfile?: Record<string, unknown>
    ): Promise<{ error?: string }> => {
        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role,
                    }
                }
            })

            if (authError) {
                return { error: authError.message }
            }

            if (!data.user) {
                return { error: 'User creation failed' }
            }

            // Create user profile in database
            const { success, error: profileError } = await createUserProfile(
                data.user.id,
                email,
                fullName,
                role,
                extendedProfile || (role === 'brand' ? { company_name: fullName } : {})
            )

            if (!success) {
                return { error: profileError || 'Erreur lors de la création du profil' }
            }

            // Load the profile using fast path
            await loadProfileFast(data.user.id)

            // Redirect based on role
            router.push(role === 'brand' ? '/brand' : '/creator')

            return {}
        } catch (error) {
            console.error('[Auth] Signup unexpected error:', error)
            return { error: 'An unexpected error occurred' }
        }
    }

    const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                return { error: error.message }
            }

            if (!data.user) {
                return { error: 'Connexion échouée' }
            }

            // Load profile using fast path
            const fullProfile = await getProfileByUserId(data.user.id)
            if (fullProfile) {
                setUser(fullProfile.user)
                setProfile(fullProfile)
                const storeState = useAuthStore.getState()
                storeState.setUser(fullProfile.user)
                storeState.setBrandProfile(fullProfile.brandProfile || null)
                storeState.setCreatorProfile(fullProfile.creatorProfile || null)

                // Redirect based on role
                const redirectPath = fullProfile.user.role === 'brand'
                    ? '/brand'
                    : fullProfile.user.role === 'admin'
                        ? '/mosh-cockpit'
                        : '/creator'
                router.push(redirectPath)
            } else {
                return { error: 'Profil utilisateur introuvable. Veuillez recréer votre compte.' }
            }

            return {}
        } catch (error) {
            console.error('[Auth] Signin unexpected error:', error)
            return { error: 'An unexpected error occurred' }
        }
    }

    const signOut = async () => {
        loadingUserId.current = null
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        useAuthStore.getState().reset()
        router.push('/')
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                authUser,
                profile,
                isLoading,
                signUp,
                signIn,
                signOut,
                isAuthenticated: !!user,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
