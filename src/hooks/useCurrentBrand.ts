'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useActingBrandStore } from '@/stores/useActingBrandStore'

/**
 * Resolves the "current brand" for the brand workspace.
 * - Real brand user  → their own id.
 * - MOSH admin acting as a brand → the acting brand id (Business-Manager style).
 * - MOSH admin not acting → null (they shouldn't be in /brand without acting).
 */
export function useCurrentBrand() {
    const { user } = useAuth()
    const actingBrandId = useActingBrandStore((s) => s.brandId)
    const actingBrandName = useActingBrandStore((s) => s.brandName)
    const clear = useActingBrandStore((s) => s.clear)

    const isAdmin = user?.role === 'admin'
    const isActingAsBrand = isAdmin && !!actingBrandId
    const brandId = isActingAsBrand ? actingBrandId : (user?.id ?? null)

    return { brandId, isActingAsBrand, actingBrandName, clearActing: clear }
}
