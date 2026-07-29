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
    Plus,
} from 'lucide-react'
import { getAllCampaigns, getMissionSteps, type CampaignWithDetails } from '@/lib/services/adminService'
import type { CampaignStatus, MissionStep } from '@/types/database'
import { WORKFLOW_STEPS as CENTRAL_STEPS, isStepCompletedOrPassed } from '@/lib/constants/workflowSteps'
import { ArrowUpDown } from 'lucide-react'

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
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'budget' | 'brand'>('date_desc')
    const [campaignSteps, setCampaignSteps] = useState<Record<string, MissionStep[]>>({})

    const loadCampaigns = useCallback(async () => {
        setIsLoading(true)
        const statusFilter = activeFilter !== 'all' ? activeFilter as CampaignStatus : undefined
        const data = await getAllCampaigns({ status: statusFilter ? [statusFilter] : undefined })
        setCampaigns(data)
        // Load steps for all campaigns
        const stepsMap: Record<string, MissionStep[]> = {}
        await Promise.all(data.map(async (c) => {
            const steps = await getMissionSteps(c.id)
            stepsMap[c.id] = steps
        }))
        setCampaignSteps(stepsMap)
        setIsLoading(false)
    }, [activeFilter])

    useEffect(() => {
        loadCampaigns()
    }, [loadCampaigns])

    // A4: Enhanced search + sort
    const filteredCampaigns = campaigns
        .filter(c => {
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return c.title.toLowerCase().includes(q)
                || (c.brand?.full_name || '').toLowerCase().includes(q)
                || (c.brand?.profiles_brand?.company_name || '').toLowerCase().includes(q)
                || (c.selected_creator?.full_name || '').toLowerCase().includes(q)
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case 'budget': return (b.budget_chf || 0) - (a.budget_chf || 0)
                case 'brand': return (a.brand?.full_name || '').localeCompare(b.brand?.full_name || '')
                default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
        })

    // Dynamic workflow label for a campaign
    const getWorkflowBadge = (campaignId: string) => {
        const steps = campaignSteps[campaignId] || []
        if (steps.length === 0) return null
        const isStepDone = (type: string) => {
            const completedTypes = steps.map(s => s.step_type)
            return isStepCompletedOrPassed(type, completedTypes)
        }
        for (let i = CENTRAL_STEPS.length - 1; i >= 0; i--) {
            if (isStepDone(CENTRAL_STEPS[i].type)) {
                const next = CENTRAL_STEPS[i + 1]
                if (!next) return { label: 'Terminée', color: 'text-[#18181B]', bg: 'bg-[#C4F042]', icon: CheckCircle2 }
                return { label: next.label, color: next.owner === 'brand' ? 'text-amber-700' : next.owner === 'creator' ? 'text-blue-700' : 'text-[#3F3F00]', bg: next.owner === 'brand' ? 'bg-amber-100' : next.owner === 'creator' ? 'bg-blue-100' : 'bg-[#C4F042]/20', icon: next.icon }
            }
        }
        return null
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Missions</h1>
                    <p className="text-[#71717A] mt-1">Gérez toutes les missions de la plateforme</p>
                </div>
                <Link href="/mosh-cockpit/missions/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#18181B] text-[#C4F042] rounded-xl text-sm font-medium hover:bg-[#18181B]/90 transition-colors shrink-0">
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Créer une mission
                </Link>
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

            {/* Search + Sort */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A099]" strokeWidth={1.5} />
                    <input
                        type="text"
                        placeholder="Rechercher par mission, marque ou créateur..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#D9D7D0]/50 border border-[#C8C6BF]/40 rounded-2xl text-sm text-[#18181B] placeholder:text-[#A1A099] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/60 focus:bg-white/60 transition-all"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-4 py-3 bg-white/90 border border-black/[0.06] rounded-2xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 appearance-none cursor-pointer min-w-[160px]"
                >
                    <option value="date_desc">Plus récentes</option>
                    <option value="date_asc">Plus anciennes</option>
                    <option value="budget">Budget (décroissant)</option>
                    <option value="brand">Marque (A-Z)</option>
                </select>
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
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${(() => {
                                                    const wf = getWorkflowBadge(campaign.id)
                                                    return wf ? `${wf.bg} ${wf.color}` : `${statusCfg.bg} ${statusCfg.color}`
                                                })()}`}>
                                                    {(() => {
                                                        const wf = getWorkflowBadge(campaign.id)
                                                        if (wf) {
                                                            const WfIcon = wf.icon
                                                            return <><WfIcon className="w-3 h-3" strokeWidth={1.5} />{wf.label}</>
                                                        }
                                                        return <><StatusIcon className="w-3 h-3" strokeWidth={1.5} />{statusCfg.label}</>
                                                    })()}
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
