'use client'

import { useState, useEffect } from 'react'
import {
    CheckCircle2,
    ChevronRight,
    Briefcase,
    Loader2,
    FileText,
    Package,
    Star,
    ScrollText,
    Upload,
} from "lucide-react"
import { formatCHF } from "@/lib/validations/swiss"
import { FEE_UNKNOWN_LABEL } from "@/lib/creator/fee"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import type { MissionStepType } from '@/types/database'
import { PageHeader, MetricStrip, Panel, PanelList, PanelRow, Tabs, StatusPill, EmptyState } from '@/components/ui/workspace'

// ================================================
// PIPELINE STEPS — creator-centric view
// (starts from selection, not from brief)
// ================================================
const PIPELINE_STEPS: { type: MissionStepType; label: string; shortLabel: string; icon: typeof FileText }[] = [
    { type: 'contract_signed', label: 'Contrat à signer', shortLabel: 'Contrat', icon: ScrollText },
    { type: 'video_uploaded_by_creator', label: 'Vidéo livrée', shortLabel: 'Livré', icon: Upload },
    { type: 'video_validated', label: 'QC MOSH', shortLabel: 'QC', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Envoi à la marque', shortLabel: 'Envoyée', icon: Package },
    { type: 'brand_final_approved', label: 'Terminée ✅', shortLabel: 'Terminée', icon: Star },
]

// ================================================
// MISSION INTERFACE
// ================================================
interface Mission {
    id: string
    campaign_id: string
    title: string
    brand_name: string
    brand_avatar: string | null
    budget_chf: number
    creator_amount_chf: number | null
    deadline: string | null
    script_type: string
    status: string
    contract_mosh_status: string | null
    completedSteps: MissionStepType[]
    completedCount: number
    activeStep: { type: MissionStepType; label: string } | null
    isCreatorAction: boolean
}

const CREATOR_ACTION_STEPS: MissionStepType[] = [
    'contract_signed', 'video_uploaded_by_creator'
]

function getActiveStepInfo(completedSteps: MissionStepType[]): { type: MissionStepType; label: string } | null {
    for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
        if (completedSteps.includes(PIPELINE_STEPS[i].type)) {
            const next = PIPELINE_STEPS[i + 1]
            return next ? { type: next.type, label: next.label } : null
        }
    }
    return PIPELINE_STEPS[0] ? { type: PIPELINE_STEPS[0].type, label: PIPELINE_STEPS[0].label } : null
}

// ================================================
// MAIN COMPONENT
// ================================================
export default function CreatorMissionsPage() {
    const { user, isLoading } = useAuth()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState('active')
    const [missions, setMissions] = useState<Mission[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    const userId = user?.id

    useEffect(() => {
        if (!userId) return

        async function fetchMissions() {
            setIsDataLoading(true)
            const supabase = createClient()

            // 1) Campaigns assigned at campaign level — include brand via join
            const { data: directCampaigns } = await (supabase as any)
                .from('campaigns')
                .select('id, title, budget_chf, deadline, script_type, brand_id, status, contract_mosh_status, creator_amount_chf, brand:users!brand_id(full_name, avatar_url)')
                .eq('selected_creator_id', userId!)
                .order('created_at', { ascending: false })

            // 2) Campaigns assigned at content level (multi-content)
            const { data: contentAssignments } = await (supabase as any)
                .from('campaign_contents')
                .select('campaign_id')
                .eq('assigned_creator_id', userId!)

            const contentCampaignIds = [...new Set((contentAssignments || []).map((ca: any) => ca.campaign_id))] as string[]
            const directIds = (directCampaigns || []).map((c: any) => c.id)
            const missingIds = contentCampaignIds.filter(id => !directIds.includes(id))

            let contentCampaigns: any[] = []
            if (missingIds.length > 0) {
                const { data } = await (supabase as any)
                    .from('campaigns')
                    .select('id, title, budget_chf, deadline, script_type, brand_id, status, contract_mosh_status, creator_amount_chf, brand:users!brand_id(full_name, avatar_url)')
                    .in('id', missingIds)
                    .order('created_at', { ascending: false })
                contentCampaigns = data || []
            }

            const campaigns = [...(directCampaigns || []), ...contentCampaigns]

            if (campaigns.length === 0) {
                setMissions([])
                setIsDataLoading(false)
                return
            }

            // BATCH: Fetch all mission_steps in one query instead of N+1
            const campaignIds = campaigns.map((c: any) => c.id)
            const { data: allSteps } = await supabase
                .from('mission_steps')
                .select('campaign_id, step_type')
                .in('campaign_id', campaignIds)

            // Group steps by campaign_id
            const stepsByCampaign = new Map<string, string[]>()
            for (const step of (allSteps || []) as any[]) {
                const existing = stepsByCampaign.get(step.campaign_id) || []
                existing.push(step.step_type)
                stepsByCampaign.set(step.campaign_id, existing)
            }

            const enrichedMissions: Mission[] = []

            for (const camp of campaigns) {
                const completedSteps = stepsByCampaign.get(camp.id) || []

                // Only show mission if Mosh has explicitly sent it to the creator
                if (!completedSteps.includes('mission_sent_to_creator')) continue

                // Brand info comes from the join — no extra query needed
                const brandName = camp.brand?.full_name || 'Marque'
                const brandAvatar = camp.brand?.avatar_url || null

                const completedCount = PIPELINE_STEPS.filter(ps => completedSteps.includes(ps.type)).length
                const activeStepInfo = getActiveStepInfo(completedSteps as MissionStepType[])
                const isCreatorAction = activeStepInfo ? CREATOR_ACTION_STEPS.includes(activeStepInfo.type) : false

                enrichedMissions.push({
                    id: camp.id,
                    campaign_id: camp.id,
                    title: camp.title || 'Sans titre',
                    brand_name: brandName,
                    brand_avatar: brandAvatar,
                    budget_chf: camp.budget_chf || 0,
                    creator_amount_chf: camp.creator_amount_chf || null,
                    deadline: camp.deadline,
                    script_type: camp.script_type,
                    status: camp.status,
                    contract_mosh_status: camp.contract_mosh_status || null,
                    completedSteps: completedSteps as MissionStepType[],
                    completedCount,
                    activeStep: activeStepInfo,
                    isCreatorAction,
                })
            }

            setMissions(enrichedMissions)
            setIsDataLoading(false)
        }

        fetchMissions()
    }, [userId])

    const tabs = [
        { id: 'active', label: 'En cours', count: missions.filter(m => m.status !== 'completed').length },
        { id: 'completed', label: 'Terminées', count: missions.filter(m => m.status === 'completed').length },
    ]

    const filteredMissions = missions.filter(mission => {
        if (activeTab === 'active') return mission.status !== 'completed'
        return mission.status === 'completed'
    })

    const stats = {
        total: missions.length,
        active: missions.filter(m => m.status !== 'completed').length,
        completed: missions.filter(m => m.status === 'completed').length,
        pendingRevenue: missions
            .filter(m => m.status !== 'completed')
            .reduce((acc, m) => acc + (m.creator_amount_chf || 0), 0),
    }

    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Mes missions"
                description="Suivez l'avancement de vos collaborations"
            >
                <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </PageHeader>

            <div className="mb-3">
                <MetricStrip
                    metrics={[
                        { label: 'Total missions', value: String(stats.total) },
                        { label: 'En cours', value: String(stats.active) },
                        { label: 'Terminées', value: String(stats.completed) },
                        { label: 'Revenus en attente', value: formatCHF(stats.pendingRevenue), tone: 'accent' },
                    ]}
                />
            </div>

            <Panel>
                {isDataLoading ? (
                    <div className="divide-y divide-[#E2E2E1]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/3" />
                                <div className="h-4 bg-[#F4F4F3] rounded w-16 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : filteredMissions.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title={activeTab === 'active' ? 'Aucune mission en cours' : 'Aucune mission terminée'}
                        description={activeTab === 'active'
                            ? 'Vos missions apparaîtront ici dès que MOSH vous en assigne une.'
                            : 'Les missions livrées et approuvées apparaîtront ici.'}
                    />
                ) : (
                    <PanelList>
                        {filteredMissions.map((mission) => {
                            const progress = (mission.completedCount / PIPELINE_STEPS.length) * 100
                            const tone = !mission.activeStep || mission.status === 'completed'
                                ? 'done'
                                : mission.isCreatorAction
                                    ? 'waiting'
                                    : 'progress'
                            const label = mission.activeStep?.label ?? 'Terminée'
                            const meta = [
                                mission.brand_name,
                                mission.script_type,
                                mission.deadline ? new Date(mission.deadline).toLocaleDateString('fr-CH') : null,
                                mission.contract_mosh_status === 'pending_creator' ? 'Contrat à signer' : null,
                            ].filter(Boolean).join(' · ')

                            return (
                                <PanelRow key={mission.id} href={`/creator/missions/${mission.campaign_id}`}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{mission.title}</p>
                                        <p className="text-[12px] text-[#9B9B9B] truncate">{meta}</p>
                                        <div className="flex items-center gap-2 mt-1.5 max-w-[260px]">
                                            <div className="flex-1 h-1 rounded-full bg-[#F4F4F3] overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#1A1A1A]"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-[#9B9B9B] tabular-nums w-7 text-right">
                                                {mission.completedCount}/{PIPELINE_STEPS.length}
                                            </span>
                                        </div>
                                    </div>
                                    <StatusPill tone={tone}>{label}</StatusPill>
                                    <span className="text-[13px] font-medium text-[#1A1A1A] tabular-nums whitespace-nowrap">
                                        {mission.creator_amount_chf
                                            ? formatCHF(mission.creator_amount_chf)
                                            : FEE_UNKNOWN_LABEL}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors shrink-0" strokeWidth={2} />
                                </PanelRow>
                            )
                        })}
                    </PanelList>
                )}
            </Panel>
        </div>
    )
}
