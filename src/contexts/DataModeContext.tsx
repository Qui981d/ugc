'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User, ProfileBrand, ProfileCreator } from '@/types/database'
import {
    DEMO_BRAND_USER,
    DEMO_BRAND_PROFILE,
    DEMO_CREATOR_USER,
    DEMO_CREATOR_PROFILE,
} from '@/lib/demo/demoData'

export type DemoRole = 'brand' | 'creator' | null

interface DataModeContextType {
    isDemo: boolean
    demoRole: DemoRole
    demoUser: User | null
    demoBrandProfile: ProfileBrand | null
    demoCreatorProfile: ProfileCreator | null
    enterDemoMode: (role: 'brand' | 'creator') => void
    exitDemoMode: () => void
}

const DataModeContext = createContext<DataModeContextType | undefined>(undefined)

export function DataModeProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const [demoRole, setDemoRole] = useState<DemoRole>(null)

    // Persist demo mode in sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('ugc-demo-mode') as DemoRole
        if (stored) {
            setDemoRole(stored)
        }
    }, [])

    const enterDemoMode = (role: 'brand' | 'creator') => {
        setDemoRole(role)
        sessionStorage.setItem('ugc-demo-mode', role)
        router.push(`/${role}`)
    }

    const exitDemoMode = () => {
        setDemoRole(null)
        sessionStorage.removeItem('ugc-demo-mode')
        // Juste rafraîchir la page actuelle au lieu de rediriger vers login
        router.refresh()
    }

    const isDemo = demoRole !== null

    const demoUser = demoRole === 'brand'
        ? DEMO_BRAND_USER
        : demoRole === 'creator'
            ? DEMO_CREATOR_USER
            : null

    const demoBrandProfile = demoRole === 'brand' ? DEMO_BRAND_PROFILE : null
    const demoCreatorProfile = demoRole === 'creator' ? DEMO_CREATOR_PROFILE : null

    return (
        <DataModeContext.Provider value={{
            isDemo,
            demoRole,
            demoUser,
            demoBrandProfile,
            demoCreatorProfile,
            enterDemoMode,
            exitDemoMode,
        }}>
            {children}
        </DataModeContext.Provider>
    )
}

export function useDataMode() {
    const context = useContext(DataModeContext)
    if (context === undefined) {
        throw new Error('useDataMode must be used within a DataModeProvider')
    }
    return context
}
