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
        color: 'text-[#8A6100]',
        bg: 'bg-[#FBF3E2]',
        dotColor: 'bg-[#8A6100]',
        badgeClass: 'bg-[#8A6100]/15 text-[#8A6100] border border-[#F0E0BC]/25',
        icon: Clock,
    },
    open: {
        label: 'Créateur en sélection',
        color: 'text-[#1A1A1A]',
        bg: 'bg-[#F4F4F3]',
        dotColor: 'bg-[#1A1A1A]',
        badgeClass: 'bg-[#1A1A1A]/15 text-[#1A1A1A] border border-[#E2E2E1]/25',
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
        color: 'text-[#1A7F37]',
        bg: 'bg-[#E8F3EA]',
        dotColor: 'bg-[#1A7F37]',
        badgeClass: 'bg-[#1A7F37]/15 text-[#1A7F37] border border-[#C9E6D0]/25',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Annulée',
        color: 'text-[#C0392B]',
        bg: 'bg-[#FBEAE8]',
        dotColor: 'bg-[#C4C4C3]',
        badgeClass: 'bg-[#1A1A1A]/15 text-[#C0392B] border border-[#F2CFCB]/25',
        icon: XCircle,
    },
}

/** Get status def with fallback */
export const getStatusConfig = (status: string): StatusDef =>
    STATUS_CONFIG[status] || STATUS_CONFIG.draft
