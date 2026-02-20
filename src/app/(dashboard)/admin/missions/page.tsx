'use client'


import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    FileText,
    Users,
    Video,
    Send
} from 'lucide-react'
import { getAllCampaigns, type CampaignWithDetails } from '@/lib/services/adminService'
import type { CampaignStatus } from '@/types/database'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    draft: { label: 'Brief reçu', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: FileText },
    open: { label: 'Profils proposés', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Users },
    in_progress: { label: 'En production', color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Video },
    completed: { label: 'Terminée', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
    cancelled: { label: 'Annulée', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
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
                <h1 className="text-3xl font-bold text-white">Missions</h1>
                <p className="text-white/50 mt-1">Gérez toutes les missions de la plateforme</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === tab.key
                            ? 'bg-accent text-black'
                            : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    placeholder="Rechercher une mission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                />
            </div>

            {/* Missions List */}
            {isLoading ? (
                <div className="text-center py-12 text-white/40">Chargement...</div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 text-white/40">Aucune mission trouvée</div>
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
                                    href={`/admin/missions/${campaign.id}`}
                                    className="block bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.1] rounded-2xl p-5 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-semibold truncate group-hover:text-accent transition-colors">
                                                    {campaign.title}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusCfg.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-white/40">
                                                <span>🏢 {campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'}</span>
                                                <span>🎬 {campaign.selected_creator?.full_name || 'Non assigné'}</span>
                                                {campaign.deadline && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                                                    </span>
                                                )}
                                                <span>CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
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
