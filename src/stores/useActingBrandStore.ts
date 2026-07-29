import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// "Act as brand" — a MOSH admin operating a client's workspace (Business-Manager style).
// The admin stays logged in as admin (keeps admin RLS); this only scopes the brand UI.
interface ActingBrandState {
    brandId: string | null
    brandName: string | null
    setActingBrand: (brandId: string, brandName: string) => void
    clear: () => void
}

export const useActingBrandStore = create<ActingBrandState>()(
    persist(
        (set) => ({
            brandId: null,
            brandName: null,
            setActingBrand: (brandId, brandName) => set({ brandId, brandName }),
            clear: () => set({ brandId: null, brandName: null }),
        }),
        { name: 'ugc-acting-brand' }
    )
)
