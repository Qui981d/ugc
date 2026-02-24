'use client'


import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    FileText,
    Users,
    Video,
} from 'lucide-react'
import { getAllCampaigns, type CampaignWithDetails } from '@/lib/services/adminService'
import type { CampaignStatus } from '@/types/database'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    draft: { label: 'Brief reçu', color: 'text-[#71717A]', bg: 'bg-[#F4F3EF]', icon: FileText },
    open: { label: 'Profils proposés', color: 'text-[#3F3F00]', bg: 'bg-[#C4F042]/20', icon: Users },
    in_progress: { label: 'En production', color: 'text-white', bg: 'bg-[#18181B]', icon: Video },
    completed: { label: 'Terminée', color: 'text-[#18181B]', bg: 'bg-[#C4F042]', icon: CheckCircle2 },
    cancelled: { label: 'Annulée', color: 'text-[#A1A1AA]', bg: 'bg-[#F4F3EF]', icon: XCircle },
}

const FILTER_TABS = [
    { key: 'all', label: 'Toutes' },
    { key: 'draft', label: 'Briefs reçus' },
    { key: 'open', label: 'Profils proposés' },
    { key: 'in_progress', label: 'En production' },
    { key: 'completed', label: 'Terminées' },
]

export default function AdminMissionsPage() {
    const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const loadCampaigns = useCallback(async () => {
        setIsLoading(true)
        const statusFilter = activeFilter !== 'all' ? activeFilter as CampaignStatus : undefined
        const data = await getAllCampaigns({ status: statusFilter ? [statusFilter] : undefined })
        setCampaigns(data)
        setIsLoading(false)
    }, [activeFilter])

    useEffect(() => {
        loadCampaigns()
    }, [loadCampaigns])

    const filteredCampaigns = campaigns.filter(c =>
        !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Missions</h1>
                <p className="text-[#71717A] mt-1">Gérez toutes les missions de la plateforme</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === tab.key
                            ? 'bg-[#18181B] text-white shadow-sm'
                            : 'bg-white/90 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F3EF] border border-black/[0.03]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A099]" strokeWidth={1.5} />
                <input
                    type="text"
                    placeholder="Rechercher une mission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#D9D7D0]/50 border border-[#C8C6BF]/40 rounded-2xl text-sm text-[#18181B] placeholder:text-[#A1A099] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/60 focus:bg-white/60 transition-all"
                />
            </div>

            {/* Missions List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-5 animate-pulse">
                            <div className="h-5 bg-[#F4F3EF] rounded w-1/3 mb-2" />
                            <div className="h-3 bg-[#F4F3EF] rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                    <p className="text-[#71717A] font-medium">Aucune mission trouvée</p>
                    <p className="text-[#A1A1AA] text-sm mt-1">Essayez un autre filtre ou terme de recherche</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredCampaigns.map((campaign, i) => {
                        const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
                        const StatusIcon = statusCfg.icon

                        return (
                            <motion.div
                                key={campaign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Link
                                    href={`/mosh-cockpit/missions/${campaign.id}`}
                                    className="block bg-white/90 backdrop-blur-sm hover:shadow-md border border-black/[0.03] hover:border-[#C4F042]/30 rounded-[24px] p-5 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-[#18181B] font-semibold truncate group-hover:text-[#18181B] transition-colors">
                                                    {campaign.title}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3 h-3" strokeWidth={1.5} />
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                                                <span>🏢 {campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'}</span>
                                                <span>🎬 {campaign.selected_creator?.full_name || 'Non assigné'}</span>
                                                {campaign.deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                                                        {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                                                    </span>
                                                )}
                                                <span>CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[#D4D4D8] group-hover:text-[#C4F042] group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                                    </div>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
