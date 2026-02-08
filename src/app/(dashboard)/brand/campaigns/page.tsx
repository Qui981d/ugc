'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Clock,
    CheckCircle2,
    Users,
    Calendar,
    Eye,
    Edit,
    Target,
    Loader2,
    Megaphone,
    FileVideo,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import { createClient } from "@/lib/supabase/client"
import type { Campaign } from "@/types/database"

interface CampaignApplication {
    id: string
    creator_id: string
    campaign_id: string
    status: string
    creator_name: string
    deliverable_count: number
    has_pending_review: boolean
}

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    open: { label: "Active", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    draft: { label: "Brouillon", class: "bg-white/10 text-white/60 border-white/20", icon: Clock },
    in_progress: { label: "En cours", class: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
    completed: { label: "Terminée", class: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle2 },
    cancelled: { label: "Annulée", class: "bg-red-500/20 text-red-400 border-red-500/30", icon: Clock },
}

export default function BrandCampaignsPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [campaignApps, setCampaignApps] = useState<Record<string, CampaignApplication[]>>({})
    const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('active')
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!userId) return
        if (!user) return

        async function loadData() {
            setIsDataLoading(true)
            const realCampaigns = await getMyCampaigns()
            setCampaigns(realCampaigns)

            // Fetch accepted applications with deliverable info for each campaign
            const supabase = createClient()
            const appsMap: Record<string, CampaignApplication[]> = {}

            for (const campaign of realCampaigns) {
                const { data: apps } = await (supabase as any)
                    .from('applications')
                    .select(`
                        id,
                        creator_id,
                        campaign_id,
                        status,
                        users!applications_creator_id_fkey (full_name)
                    `)
                    .eq('campaign_id', campaign.id)
                    .eq('status', 'accepted')

                if (apps && apps.length > 0) {
                    // For each accepted application, check deliverables
                    const enrichedApps: CampaignApplication[] = []
                    for (const app of apps) {
                        const { data: deliverables } = await (supabase as any)
                            .from('deliverables')
                            .select('id, status')
                            .eq('campaign_id', campaign.id)
                            .eq('creator_id', app.creator_id)

                        enrichedApps.push({
                            id: app.id,
                            creator_id: app.creator_id,
                            campaign_id: app.campaign_id,
                            status: app.status,
                            creator_name: app.users?.full_name || 'Créateur',
                            deliverable_count: deliverables?.length || 0,
                            has_pending_review: deliverables?.some((d: any) => d.status === 'review') || false,
                        })
                    }
                    appsMap[campaign.id] = enrichedApps
                }
            }

            setCampaignApps(appsMap)
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    const tabs = [
        { id: 'active', label: 'Actives', count: campaigns.filter(c => c.status === 'open' || c.status === 'in_progress').length },
        { id: 'draft', label: 'Brouillons', count: campaigns.filter(c => c.status === 'draft').length },
        { id: 'completed', label: 'Terminées', count: campaigns.filter(c => c.status === 'completed').length },
    ]

    const filteredCampaigns = campaigns.filter(campaign => {
        if (activeTab === 'active') return campaign.status === 'open' || campaign.status === 'in_progress'
        if (activeTab === 'draft') return campaign.status === 'draft'
        if (activeTab === 'completed') return campaign.status === 'completed'
        return true
    })

    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget_chf, 0)

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Mes Campagnes</h1>
                    <p className="text-white/60 mt-1">Gérez vos campagnes UGC</p>
                </div>
                <Link href="/brand/campaigns/new">
                    <Button className="btn-primary w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle campagne
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-3 md:p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Total campagnes</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">{campaigns.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-3 md:p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Actives</p>
                    <p className="text-2xl md:text-3xl font-bold text-emerald-400">{campaigns.filter(c => c.status === 'open').length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-3 md:p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Terminées</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">{campaigns.filter(c => c.status === 'completed').length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-3 md:p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Budget total</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">{formatCHF(totalBudget)}</p>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white/10 text-white'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Campaigns List */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                >
                    {filteredCampaigns.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{activeTab === 'active' ? 'Aucune campagne active' : activeTab === 'draft' ? 'Aucun brouillon' : 'Aucune campagne terminée'}</p>
                            <Link href="/brand/campaigns/new">
                                <Button className="btn-primary mt-4">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Créer une campagne
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        filteredCampaigns.map((campaign, index) => {
                            const status = statusConfig[campaign.status] || statusConfig.draft
                            const StatusIcon = status.icon

                            return (
                                <motion.div
                                    key={campaign.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group"
                                >
                                    <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] hover:border-white/25 rounded-2xl p-4 md:p-6 transition-all duration-300">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">{campaign.title}</h3>
                                                    <Badge className={`${status.class} border`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {status.label}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm text-white/50 mb-4 line-clamp-2">
                                                    {campaign.description || 'Aucune description'}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-white/50">
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-4 h-4" />
                                                        {campaign.script_type}
                                                    </span>
                                                    {campaign.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {(campaign as any).creator_count || 1} créateur(s) recherché(s)
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <span className="text-xl font-bold text-white">
                                                    {formatCHF(campaign.budget_chf)}
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Livrables button — shows if any accepted creators exist */}
                                                    {campaignApps[campaign.id]?.length > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={`text-white/60 hover:text-white hover:bg-white/10 relative ${campaignApps[campaign.id]?.some(a => a.has_pending_review)
                                                                ? 'text-amber-400 hover:text-amber-300'
                                                                : ''
                                                                }`}
                                                            onClick={() => setExpandedCampaign(
                                                                expandedCampaign === campaign.id ? null : campaign.id
                                                            )}
                                                        >
                                                            <FileVideo className="w-4 h-4 mr-1" />
                                                            Livrables
                                                            {campaignApps[campaign.id]?.some(a => a.has_pending_review) && (
                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                                                            )}
                                                            {expandedCampaign === campaign.id
                                                                ? <ChevronUp className="w-4 h-4 ml-1" />
                                                                : <ChevronDown className="w-4 h-4 ml-1" />
                                                            }
                                                        </Button>
                                                    )}
                                                    <Link href={`/brand/campaigns/${campaign.id}/applicants`}>
                                                        <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                                                            <Users className="w-4 h-4 mr-1" />
                                                            Candidatures
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Modifier
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded: show accepted creators with deliverables */}
                                        {expandedCampaign === campaign.id && campaignApps[campaign.id] && (
                                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Créateurs acceptés</p>
                                                {campaignApps[campaign.id].map(app => (
                                                    <Link
                                                        key={app.id}
                                                        href={`/shared/mission/${app.id}`}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm text-white/60 font-medium">
                                                                {app.creator_name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm text-white">{app.creator_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {app.deliverable_count > 0 ? (
                                                                <Badge className={`${app.has_pending_review
                                                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                                    } border text-xs`}>
                                                                    {app.has_pending_review ? 'À valider' : `${app.deliverable_count} livrable(s)`}
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-white/10 text-white/40 border-white/20 border text-xs">
                                                                    En attente
                                                                </Badge>
                                                            )}
                                                            <Eye className="w-4 h-4 text-white/30" />
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>
            </AnimatePresence>
        </div >
    )
}
