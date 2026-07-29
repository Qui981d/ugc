'use client'


import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    ClipboardList as ClipboardListIcon,
} from 'lucide-react'
import { PageHeader, Tabs, StatusPill, EmptyState } from '@/components/ui/workspace'
import { getAllCampaigns, getMissionSteps, type CampaignWithDetails } from '@/lib/services/adminService'
import type { CampaignStatus, MissionStep } from '@/types/database'
import { WORKFLOW_STEPS as CENTRAL_STEPS, isStepCompletedOrPassed } from '@/lib/constants/workflowSteps'
import { ArrowUpDown } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    draft: { label: 'Brief reçu', color: 'text-[#65676B]', bg: 'bg-[#F0F2F5]', icon: FileText },
    open: { label: 'Profils proposés', color: 'text-[#0653CC]', bg: 'bg-[#E7F0FF]', icon: Users },
    in_progress: { label: 'En production', color: 'text-white', bg: 'bg-[#1C1E21]', icon: Video },
    completed: { label: 'Terminée', color: 'text-[#1C1E21]', bg: 'bg-[#0866FF]', icon: CheckCircle2 },
    cancelled: { label: 'Annulée', color: 'text-[#8A8D91]', bg: 'bg-[#F0F2F5]', icon: XCircle },
}

const FILTER_TABS = [
    { key: 'all', label: 'Toutes' },
    { key: 'draft', label: 'Briefs reçus' },
    { key: 'open', label: 'Profils proposés' },
    { key: 'in_progress', label: 'En production' },
    { key: 'completed', label: 'Terminées' },
]

export default function AdminMissionsPage() {
    const router = useRouter()
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
                if (!next) return { label: 'Terminée', color: 'text-[#1C1E21]', bg: 'bg-[#0866FF]', icon: CheckCircle2 }
                return { label: next.label, color: next.owner === 'brand' ? 'text-amber-700' : next.owner === 'creator' ? 'text-blue-700' : 'text-[#0653CC]', bg: next.owner === 'brand' ? 'bg-amber-100' : next.owner === 'creator' ? 'bg-blue-100' : 'bg-[#E7F0FF]', icon: next.icon }
            }
        }
        return null
    }

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Missions"
                description="Toutes les missions en production sur la plateforme"
                actions={
                    <Link href="/mosh-cockpit/missions/new"
                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0866FF] text-white rounded-lg text-[13px] font-medium hover:bg-[#0653CC] transition-colors">
                        <Plus className="w-4 h-4" strokeWidth={2.2} />
                        Créer une mission
                    </Link>
                }
            >
                <Tabs
                    tabs={FILTER_TABS.map(t => ({
                        id: t.key,
                        label: t.label,
                        count: t.key === 'all' ? campaigns.length : campaigns.filter(c => c.status === t.key).length,
                    }))}
                    active={activeFilter}
                    onChange={setActiveFilter}
                />
            </PageHeader>

            {/* Toolbar — filters sit above the surface, not in their own card */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8D91]" strokeWidth={1.8} />
                    <input
                        type="text"
                        placeholder="Rechercher une mission, une marque, un créateur…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="h-9 px-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] focus:outline-none focus:border-[#0866FF] cursor-pointer"
                >
                    <option value="date_desc">Plus récentes</option>
                    <option value="date_asc">Plus anciennes</option>
                    <option value="budget">Budget décroissant</option>
                    <option value="brand">Marque A→Z</option>
                </select>
                <span className="text-[12px] text-[#8A8D91] tabular-nums ml-auto">
                    {filteredCampaigns.length} mission{filteredCampaigns.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* One dense surface — rows, not a stack of cards */}
            <div className="bg-white border border-[#DADDE1] rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="divide-y divide-[#DADDE1]">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-4 bg-[#F0F2F5] rounded w-1/4" />
                                <div className="h-4 bg-[#F0F2F5] rounded w-1/6 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <EmptyState
                        icon={ClipboardListIcon}
                        title="Aucune mission"
                        description={searchQuery ? 'Aucun résultat pour cette recherche.' : 'Créez une mission pour la voir apparaître ici.'}
                        action={
                            <Link href="/mosh-cockpit/missions/new"
                                className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0866FF] text-white rounded-lg text-[13px] font-medium hover:bg-[#0653CC] transition-colors">
                                <Plus className="w-4 h-4" strokeWidth={2.2} />
                                Créer une mission
                            </Link>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-[#DADDE1]">
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5">Mission</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden md:table-cell">Marque</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden lg:table-cell">Créateur</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5">Étape</th>
                                    <th className="text-right font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden sm:table-cell">Budget</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden xl:table-cell">Échéance</th>
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DADDE1]">
                                {filteredCampaigns.map((campaign) => {
                                    const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
                                    const wf = getWorkflowBadge(campaign.id)
                                    const brandName = campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'
                                    const tone = campaign.status === 'completed' ? 'done'
                                        : campaign.status === 'cancelled' ? 'idle'
                                            : wf ? 'progress' : 'idle'
                                    return (
                                        <tr
                                            key={campaign.id}
                                            onClick={() => router.push(`/mosh-cockpit/missions/${campaign.id}`)}
                                            className="hover:bg-[#F7F8FA] cursor-pointer transition-colors group"
                                        >
                                            <td className="px-4 py-2.5 max-w-[280px]">
                                                <span className="block font-medium text-[#1C1E21] truncate">{campaign.title}</span>
                                                <span className="block text-[12px] text-[#8A8D91] truncate md:hidden">{brandName}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden md:table-cell max-w-[180px]">
                                                <span className="block truncate">{brandName}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden lg:table-cell max-w-[160px]">
                                                <span className="block truncate">
                                                    {campaign.selected_creator?.full_name || <span className="text-[#8A8D91]">Non assigné</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <StatusPill tone={tone}>{wf ? wf.label : statusCfg.label}</StatusPill>
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#1C1E21] hidden sm:table-cell whitespace-nowrap">
                                                {campaign.budget_chf ? campaign.budget_chf.toLocaleString('fr-CH') : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden xl:table-cell whitespace-nowrap tabular-nums">
                                                {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('fr-CH') : '—'}
                                            </td>
                                            <td className="pr-3">
                                                <ArrowRight className="w-4 h-4 text-[#BCC0C4] group-hover:text-[#0866FF] transition-colors" strokeWidth={2} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
