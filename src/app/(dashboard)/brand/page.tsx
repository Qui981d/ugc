'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Clock, CheckCircle2, XCircle, ArrowUpRight, Loader2, Settings } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import { useCurrentBrand } from "@/hooks/useCurrentBrand"
import { getMissionSteps } from "@/lib/services/adminService"
import { getStatusConfig } from "@/lib/constants/statusConfig"
import { WORKFLOW_STEPS, isStepCompletedOrPassed } from "@/lib/constants/workflowSteps"
import type { Campaign, MissionStep, MissionStepType } from "@/types/database"



export default function BrandDashboardPage() {
    const { user, isLoading } = useAuth()
    const { brandId } = useCurrentBrand()
    const userId = brandId
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [campaignSteps, setCampaignSteps] = useState<Record<string, MissionStep[]>>({})
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!userId) return
        if (!user) return

        async function loadData() {
            setIsDataLoading(true)
            const realCampaigns = await getMyCampaigns(undefined, brandId || undefined)
            setCampaigns(realCampaigns)
            // Load steps for all campaigns
            const stepsMap: Record<string, MissionStep[]> = {}
            await Promise.all(realCampaigns.map(async (c) => {
                const steps = await getMissionSteps(c.id)
                stepsMap[c.id] = steps
            }))
            setCampaignSteps(stepsMap)
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    // Determine active workflow step for a campaign
    const getActiveStepForCampaign = (campaignId: string) => {
        const steps = campaignSteps[campaignId] || []
        const isStepDone = (type: string) => {
            const completedTypes = steps.map(s => s.step_type)
            return isStepCompletedOrPassed(type, completedTypes)
        }
        for (let i = WORKFLOW_STEPS.length - 1; i >= 0; i--) {
            if (isStepDone(WORKFLOW_STEPS[i].type)) {
                return WORKFLOW_STEPS[i + 1] || null // next step
            }
        }
        return WORKFLOW_STEPS[0] // first step
    }

    // Get campaigns requiring brand action
    const brandActionCampaigns = campaigns.filter(c => {
        const active = getActiveStepForCampaign(c.id)
        return active && active.owner === 'brand'
    })

    // Smart status label based on workflow
    const getWorkflowLabel = (campaignId: string) => {
        const steps = campaignSteps[campaignId] || []
        if (steps.length === 0) return null
        const active = getActiveStepForCampaign(campaignId)
        if (!active) return { label: 'Mission terminée', color: 'text-emerald-700', bg: 'bg-emerald-100' }
        return { label: active.label, color: active.owner === 'brand' ? 'text-amber-700' : 'text-blue-700', bg: active.owner === 'brand' ? 'bg-amber-100' : 'bg-blue-100' }
    }

    const stats = [
        { label: "Campagnes actives", value: String(campaigns.filter(c => c.status === 'open' || c.status === 'in_progress' || c.status === 'draft').length), change: "En cours de traitement" },
        { label: "En production", value: String(campaigns.filter(c => c.status === 'in_progress').length), change: "Vidéos en cours" },
        { label: "Vidéos livrées", value: String(campaigns.filter(c => c.status === 'completed').length), change: "Terminées" },
        { label: "Budget total", value: formatCHF(campaigns.reduce((sum, c) => sum + c.budget_chf, 0)), change: "Toutes campagnes" },
    ]

    if (!mounted || (!user && isLoading) || isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8A8D91]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1C1E21] tracking-[-0.02em]">
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Marque'} 👋
                    </h1>
                    <p className="text-[#65676B] mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
                <Link href="/brand/campaigns/new">
                    <Button className="bg-[#0866FF] hover:bg-[#0653CC] text-white rounded-full px-6 w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        Nouvelle campagne
                    </Button>
                </Link>
            </motion.div>

            {/* Action Required Banner — only shows when brand has active work */}
            {brandActionCampaigns.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">⚡</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[#1C1E21]">
                            {brandActionCampaigns.length} campagne{brandActionCampaigns.length > 1 ? 's' : ''} nécessite{brandActionCampaigns.length > 1 ? 'nt' : ''} votre attention
                        </p>
                        <p className="text-xs text-[#65676B]">
                            {getActiveStepForCampaign(brandActionCampaigns[0].id)?.label || 'Action requise'}
                        </p>
                    </div>
                    <Link href={`/brand/campaigns/${brandActionCampaigns[0].id}`}>
                        <Button size="sm" className="bg-[#0866FF] hover:bg-[#0653CC] text-white rounded-full px-4">
                            Voir
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </Link>
                </motion.div>
            )}

            {/* Stats Grid — glassmorphism */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl border border-[#DADDE1] p-5"
                    >
                        <p className="text-sm text-[#65676B]">{stat.label}</p>
                        <p className="text-2xl font-bold text-[#1C1E21] mt-1">{stat.value}</p>
                        <p className="text-xs text-[#8A8D91] mt-1">{stat.change}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Campaigns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-[#DADDE1] overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1C1E21]">Mes campagnes récentes</h2>
                    <Link href="/brand/campaigns">
                        <Button variant="ghost" className="text-[#65676B] hover:text-[#1C1E21] hover:bg-[#F0F2F5] rounded-full">
                            Voir tout
                            <ArrowUpRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
                        </Button>
                    </Link>
                </div>
                <div className="px-6 pb-6">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12 text-[#8A8D91]">
                            <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune campagne pour le moment</p>
                            <p className="text-sm mt-2">Créez votre première campagne</p>
                            <Link href="/brand/campaigns/new">
                                <Button className="bg-[#0866FF] hover:bg-[#0653CC] text-white rounded-full px-6 mt-4">
                                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                    Créer une campagne
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {campaigns.slice(0, 5).map((campaign, index) => {
                                const status = getStatusConfig(campaign.status)
                                const StatusIcon = status.icon

                                return (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                    >
                                        <Link
                                            href={`/brand/campaigns/${campaign.id}`}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[#F0F2F5]/60 hover:bg-[#F0F2F5] transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[#E7F0FF] flex items-center justify-center">
                                                    <StatusIcon className="h-5 w-5 text-[#1C1E21]" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#1C1E21] group-hover:text-[#1C1E21]">{campaign.title}</p>
                                                    <p className="text-sm text-[#65676B]">{campaign.script_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {(() => {
                                                    const wfLabel = getWorkflowLabel(campaign.id)
                                                    if (wfLabel) {
                                                        return <Badge className={`${wfLabel.bg} ${wfLabel.color} border-0`}>{wfLabel.label}</Badge>
                                                    }
                                                    const status = getStatusConfig(campaign.status)
                                                    return <Badge className={status.badgeClass}>{status.label}</Badge>
                                                })()}
                                                <span className="text-[#1C1E21] font-semibold">{formatCHF(campaign.budget_chf)}</span>
                                                <ArrowUpRight className="w-4 h-4 text-[#8A8D91] group-hover:text-[#0866FF] transition-colors" strokeWidth={1.5} />
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-lg font-semibold text-[#1C1E21] mb-4">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/brand/campaigns/new">
                        <div className="bg-white rounded-xl border border-[#DADDE1] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#E7F0FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6 text-[#1C1E21]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#1C1E21]">Créer une campagne</p>
                                <p className="text-sm text-[#65676B]">Décrivez votre besoin en vidéo UGC</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/brand/campaigns">
                        <div className="bg-white rounded-xl border border-[#DADDE1] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Eye className="h-6 w-6 text-blue-700" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#1C1E21]">Suivre mes campagnes</p>
                                <p className="text-sm text-[#65676B]">Voyez l&apos;avancement de vos projets</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/brand/settings">
                        <div className="bg-white rounded-xl border border-[#DADDE1] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#F0F2F5] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Settings className="h-6 w-6 text-[#1C1E21]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#1C1E21]">Compléter le profil</p>
                                <p className="text-sm text-[#65676B]">Finalisez votre profil marque</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
