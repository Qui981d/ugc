'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Megaphone, ArrowRight, Search } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import { getStatusConfig } from "@/lib/constants/statusConfig"
import { useCurrentBrand } from "@/hooks/useCurrentBrand"
import { PageHeader, Tabs, StatusPill, EmptyState } from "@/components/ui/workspace"
import type { Campaign } from "@/types/database"

const STATUS_TONE: Record<string, 'progress' | 'waiting' | 'done' | 'idle' | 'alert'> = {
    completed: 'done',
    in_progress: 'progress',
    open: 'progress',
    draft: 'idle',
    cancelled: 'idle',
}

export default function BrandCampaignsPage() {
    const { user, isLoading } = useAuth()
    const { brandId } = useCurrentBrand()
    const router = useRouter()
    const userId = brandId
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [mounted, setMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!userId) return
        if (!user) return

        async function loadData() {
            setIsDataLoading(true)
            const realCampaigns = await getMyCampaigns(undefined, brandId || undefined)
            setCampaigns(realCampaigns)
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    const tabs = [
        { id: 'all', label: 'Tous', count: campaigns.length },
        { id: 'active', label: 'En cours', count: campaigns.filter(c => c.status === 'draft' || c.status === 'open' || c.status === 'in_progress').length },
        { id: 'completed', label: 'Terminés', count: campaigns.filter(c => c.status === 'completed').length },
    ]

    const filteredCampaigns = campaigns.filter(campaign => {
        if (activeTab === 'all') return true
        if (activeTab === 'active') return campaign.status === 'draft' || campaign.status === 'open' || campaign.status === 'in_progress'
        if (activeTab === 'completed') return campaign.status === 'completed'
        return true
    }).filter(campaign =>
        !searchQuery.trim() || campaign.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!mounted || (!user && isLoading) || isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8A8D91]" />
            </div>
        )
    }

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Mes campagnes"
                description="Suivez l'avancement de vos projets vidéo"
                actions={
                    <Link href="/brand/campaigns/new"
                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0866FF] text-white rounded-lg text-[13px] font-medium hover:bg-[#0653CC] transition-colors">
                        <Plus className="w-4 h-4" strokeWidth={2.2} />
                        Nouvelle campagne
                    </Link>
                }
            >
                <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </PageHeader>

            {/* Toolbar — bare controls above the surface */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8D91]" strokeWidth={1.8} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une campagne…"
                        className="w-full h-9 pl-9 pr-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors"
                    />
                </div>
                <span className="text-[12px] text-[#8A8D91] tabular-nums ml-auto">
                    {filteredCampaigns.length} campagne{filteredCampaigns.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* One dense surface */}
            <div className="bg-white border border-[#DADDE1] rounded-xl overflow-hidden">
                {filteredCampaigns.length === 0 ? (
                    <EmptyState
                        icon={Megaphone}
                        title="Aucune campagne"
                        description={searchQuery ? 'Aucun résultat pour cette recherche.' : 'Créez votre première campagne pour la voir apparaître ici.'}
                        action={
                            <Link href="/brand/campaigns/new"
                                className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0866FF] text-white rounded-lg text-[13px] font-medium hover:bg-[#0653CC] transition-colors">
                                <Plus className="w-4 h-4" strokeWidth={2.2} />
                                Créer une campagne
                            </Link>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-[#DADDE1]">
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5">Campagne</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden md:table-cell">Format</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5">Statut</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden lg:table-cell">Échéance</th>
                                    <th className="text-right font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5 hidden sm:table-cell">Budget</th>
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DADDE1]">
                                {filteredCampaigns.map((campaign) => {
                                    const status = getStatusConfig(campaign.status)
                                    return (
                                        <tr
                                            key={campaign.id}
                                            onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
                                            className="hover:bg-[#F7F8FA] cursor-pointer transition-colors group"
                                        >
                                            <td className="px-4 py-2.5 max-w-[320px]">
                                                <span className="block font-medium text-[#1C1E21] truncate">{campaign.title}</span>
                                                {campaign.description && (
                                                    <span className="block text-[12px] text-[#8A8D91] truncate">{campaign.description}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden md:table-cell max-w-[180px]">
                                                <span className="block truncate">{campaign.script_type}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <StatusPill tone={STATUS_TONE[campaign.status] || 'idle'}>{status.label}</StatusPill>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden lg:table-cell whitespace-nowrap tabular-nums">
                                                {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('fr-CH') : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#1C1E21] hidden sm:table-cell whitespace-nowrap">
                                                {formatCHF(campaign.budget_chf)}
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
