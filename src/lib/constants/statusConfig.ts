import { Clock, Eye, CheckCircle2, XCircle } from 'lucide-react'

/**
 * Centralized campaign status configuration.
 * Single source of truth for labels, colors, and icons per status.
 */

export interface StatusDef {
    label: string
    color: string
    bg: string
    dotColor: string
    badgeClass: string
    icon: typeof Clock
}

export const STATUS_CONFIG: Record<string, StatusDef> = {
    draft: {
        label: 'Brief envoyé',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        dotColor: 'bg-amber-500',
        badgeClass: 'bg-amber-500/15 text-amber-700 border border-amber-500/25',
        icon: Clock,
    },
    open: {
        label: 'Créateur en sélection',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        dotColor: 'bg-blue-500',
        badgeClass: 'bg-blue-500/15 text-blue-700 border border-blue-500/25',
        icon: Eye,
    },
    in_progress: {
        label: 'En production',
        color: 'text-[#1A1A1A]',
        bg: 'bg-[#EDEDEC]',
        dotColor: 'bg-[#1A1A1A]',
        badgeClass: 'bg-[#EDEDEC] text-[#1A1A1A] border border-[#1A1A1A]/30',
        icon: Clock,
    },
    completed: {
        label: 'Terminée',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        dotColor: 'bg-emerald-500',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/25',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Annulée',
        color: 'text-red-700',
        bg: 'bg-red-50',
        dotColor: 'bg-gray-400',
        badgeClass: 'bg-[#1A1A1A]/15 text-red-700 border border-red-500/25',
        icon: XCircle,
    },
}

/** Get status def with fallback */
export const getStatusConfig = (status: string): StatusDef =>
    STATUS_CONFIG[status] || STATUS_CONFIG.draft
