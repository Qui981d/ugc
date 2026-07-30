'use client'

import { Loader2 } from 'lucide-react'

interface PageLoadingProps {
    message?: string
}

/**
 * Reusable page-level loading indicator.
 * Replaces inconsistent Loader2 / "Chargement..." patterns across pages.
 */
export function PageLoading({ message = 'Chargement…' }: PageLoadingProps) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#9B9B9B]" />
                <p className="text-sm text-[#9B9B9B]">{message}</p>
            </div>
        </div>
    )
}
