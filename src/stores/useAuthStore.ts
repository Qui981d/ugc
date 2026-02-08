import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, ProfileBrand, ProfileCreator } from '@/types/database'

interface AuthState {
    user: User | null
    brandProfile: ProfileBrand | null
    creatorProfile: ProfileCreator | null
    isLoading: boolean

    // Actions
    setUser: (user: User | null) => void
    setBrandProfile: (profile: ProfileBrand | null) => void
    setCreatorProfile: (profile: ProfileCreator | null) => void
    setLoading: (loading: boolean) => void
    reset: () => void
}

const initialState = {
    user: null,
    brandProfile: null,
    creatorProfile: null,
    isLoading: true,
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            ...initialState,

            setUser: (user) => set({ user }),
            setBrandProfile: (profile) => set({ brandProfile: profile }),
            setCreatorProfile: (profile) => set({ creatorProfile: profile }),
            setLoading: (loading) => set({ isLoading: loading }),
            reset: () => set(initialState),
        }),
        {
            name: 'ugc-auth-storage',
            partialize: (state) => ({
                user: state.user,
                brandProfile: state.brandProfile,
                creatorProfile: state.creatorProfile,
            }),
        }
    )
)
