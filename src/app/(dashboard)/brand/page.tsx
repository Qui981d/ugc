'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, ArrowRight, Loader2, Settings, Megaphone } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import { useCurrentBrand } from "@/hooks/useCurrentBrand"
import { getMissionSteps } from "@/lib/services/adminService"
import { getStatusConfig } from "@/lib/constants/statusConfig"
import { WORKFLOW_STEPS, isStepCompletedOrPassed } from "@/lib/constants/workflowSteps"
import { PageHeader, MetricStrip, Panel, PanelList, PanelRow, StatusPill, EmptyState } from "@/components/ui/workspace"
import type { Campaign, MissionStep } from "@/types/database"

const STATUS_TONE: Record<string, 'progress' | 'waiting' | 'done' | 'idle' | 'alert'> = {
    completed: 'done',
    in_progress: 'progress',
    open: 'progress',
    draft: 'idle',
    cancelled: 'idle',
}

export default function BrandDashboardPage() {
    const { user, isLoading } = useAuth()
    const { brandId } = useCurrentBrand()
    const router = useRouter()
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
    const getWorkflowLabel = (campaignId: string): { label: string; tone: 'progress' | 'waiting' | 'done' } | null => {
        const steps = campaignSteps[campaignId] || []
        if (steps.length === 0) return null
        const active = getActiveStepForCampaign(campaignId)
        if (!active) return { label: 'Mission terminée', tone: 'done' }
        return { label: active.label, tone: active.owner === 'brand' ? 'waiting' : 'progress' }
    }

    const metrics = [
        { label: "Campagnes actives", value: String(campaigns.filter(c => c.status === 'open' || c.status === 'in_progress' || c.status === 'draft').length), hint: "En cours de traitement" },
        { label: "En production", value: String(campaigns.filter(c => c.status === 'in_progress').length), hint: "Vidéos en cours" },
        { label: "Vidéos livrées", value: String(campaigns.filter(c => c.status === 'completed').length), hint: "Terminées" },
        { label: "Budget total", value: formatCHF(campaigns.reduce((sum, c) => sum + c.budget_chf, 0)), hint: "Toutes campagnes" },
    ]

    if (!mounted || (!user && isLoading) || isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    const recentCampaigns = campaigns.slice(0, 5)

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title={`Bienvenue, ${user?.full_name?.split(' ')[0] || 'Marque'} 👋`}
                description="Voici un aperçu de votre activité"
                actions={
                    <Link href="/brand/campaigns/new"
                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors">
                        <Plus className="w-4 h-4" strokeWidth={2.2} />
                        Nouvelle campagne
                    </Link>
                }
            />

            {/* Action required — a single bordered row, not a floating card */}
            {brandActionCampaigns.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E2E2E1] rounded-xl mb-3">
                    <StatusPill tone="waiting">Action requise</StatusPill>
                    <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#1A1A1A] truncate">
                            {brandActionCampaigns.length} campagne{brandActionCampaigns.length > 1 ? 's' : ''} nécessite{brandActionCampaigns.length > 1 ? 'nt' : ''} votre attention
                        </p>
                        <p className="text-[12px] text-[#9B9B9B] truncate">
                            {getActiveStepForCampaign(brandActionCampaigns[0].id)?.label || 'Action requise'}
                        </p>
                    </div>
                    <Link
                        href={`/brand/campaigns/${brandActionCampaigns[0].id}`}
                        className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors"
                    >
                        Voir
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </Link>
                </div>
            )}

            {/* Stats — one strip, not four cards */}
            <div className="mb-3">
                <MetricStrip metrics={metrics} />
            </div>

            {/* Recent campaigns — one dense surface */}
            <div className="mb-3">
                <Panel
                    title="Mes campagnes récentes"
                    actions={
                        <Link href="/brand/campaigns"
                            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1A1A1A] hover:text-[#333333] transition-colors">
                            Voir tout
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                        </Link>
                    }
                >
                    {recentCampaigns.length === 0 ? (
                        <EmptyState
                            icon={Megaphone}
                            title="Aucune campagne pour le moment"
                            description="Créez votre première campagne pour la voir apparaître ici."
                            action={
                                <Link href="/brand/campaigns/new"
                                    className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors">
                                    <Plus className="w-4 h-4" strokeWidth={2.2} />
                                    Créer une campagne
                                </Link>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-[#E2E2E1]">
                                        <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Campagne</th>
                                        <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden md:table-cell">Format</th>
                                        <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Étape</th>
                                        <th className="text-right font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden sm:table-cell">Budget</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E2E1]">
                                    {recentCampaigns.map((campaign) => {
                                        const wf = getWorkflowLabel(campaign.id)
                                        const status = getStatusConfig(campaign.status)
                                        const tone = wf ? wf.tone : (STATUS_TONE[campaign.status] || 'idle')
                                        return (
                                            <tr
                                                key={campaign.id}
                                                onClick={() => router.push(`/brand/campaigns/${campaign.id}`)}
                                                className="hover:bg-[#FAFAF9] cursor-pointer transition-colors group"
                                            >
                                                <td className="px-4 py-2.5 max-w-[320px]">
                                                    <span className="block font-medium text-[#1A1A1A] truncate">{campaign.title}</span>
                                                    <span className="block text-[12px] text-[#9B9B9B] truncate md:hidden">{campaign.script_type}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden md:table-cell max-w-[180px]">
                                                    <span className="block truncate">{campaign.script_type}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <StatusPill tone={tone}>{wf ? wf.label : status.label}</StatusPill>
                                                </td>
                                                <td className="px-4 py-2.5 text-right tabular-nums text-[#1A1A1A] hidden sm:table-cell whitespace-nowrap">
                                                    {formatCHF(campaign.budget_chf)}
                                                </td>
                                                <td className="pr-3">
                                                    <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors" strokeWidth={2} />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </div>

            {/* Quick actions — divided rows in one surface */}
            <Panel title="Actions rapides">
                <PanelList>
                    <PanelRow href="/brand/campaigns/new">
                        <div className="w-8 h-8 rounded-lg bg-[#EDEDEC] grid place-items-center shrink-0">
                            <Plus className="w-4 h-4 text-[#1A1A1A]" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#1A1A1A] truncate">Créer une campagne</p>
                            <p className="text-[12px] text-[#9B9B9B] truncate">Décrivez votre besoin en vidéo UGC</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors ml-auto shrink-0" strokeWidth={2} />
                    </PanelRow>
                    <PanelRow href="/brand/campaigns">
                        <div className="w-8 h-8 rounded-lg bg-[#F4F4F3] grid place-items-center shrink-0">
                            <Eye className="w-4 h-4 text-[#6B6B6B]" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#1A1A1A] truncate">Suivre mes campagnes</p>
                            <p className="text-[12px] text-[#9B9B9B] truncate">Voyez l&apos;avancement de vos projets</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors ml-auto shrink-0" strokeWidth={2} />
                    </PanelRow>
                    <PanelRow href="/brand/settings">
                        <div className="w-8 h-8 rounded-lg bg-[#F4F4F3] grid place-items-center shrink-0">
                            <Settings className="w-4 h-4 text-[#6B6B6B]" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#1A1A1A] truncate">Compléter le profil</p>
                            <p className="text-[12px] text-[#9B9B9B] truncate">Finalisez votre profil marque</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors ml-auto shrink-0" strokeWidth={2} />
                    </PanelRow>
                </PanelList>
            </Panel>
        </div>
    )
}
