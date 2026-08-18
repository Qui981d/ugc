'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Loader2, Briefcase, Star, Upload, ClipboardList } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { getStatusConfig } from "@/lib/constants/statusConfig"
import { CreatorOnboarding } from "@/components/onboarding/CreatorOnboarding"
import { PageHeader, MetricStrip, Panel, PanelList, PanelRow, StatusPill, EmptyState } from '@/components/ui/workspace'

const QUICK_ACTION_CLS = 'inline-flex items-center gap-1.5 h-9 px-3 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] hover:bg-[#F4F4F3] transition-colors'

interface MissionDisplay {
    id: string
    title: string
    brand: string
    status: string
    deadline: string | null
    budget: number
}

function statusTone(status: string): 'progress' | 'waiting' | 'done' | 'idle' | 'alert' {
    if (status === 'completed') return 'done'
    if (status === 'in_progress' || status === 'open') return 'progress'
    return 'idle'
}

export default function CreatorDashboardPage() {
    const { user, isLoading } = useAuth()
    const [missions, setMissions] = useState<MissionDisplay[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

    useEffect(() => { setMounted(true) }, [])

    const userId = user?.id

    // Check if profile is complete (onboarding needed?)
    useEffect(() => {
        if (!userId) return
        async function checkProfile() {
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles_creator')
                .select('bio, specialties')
                .eq('user_id', userId!)
                .single()
            const profile = data as any
            setNeedsOnboarding(!profile?.bio || !profile?.specialties || profile.specialties.length === 0)
        }
        checkProfile()
    }, [userId])

    useEffect(() => {
        if (!userId) return

        async function loadData() {
            setIsDataLoading(true)
            const supabase = createClient()

            // 1) Campaigns assigned at campaign level — include brand name via join
            const { data: directCampaigns } = await (supabase as any)
                .from('campaigns')
                .select('id, title, budget_chf, creator_amount_chf, deadline, status, brand_id, brand:users!brand_id(full_name)')
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
                    .select('id, title, budget_chf, creator_amount_chf, deadline, status, brand_id, brand:users!brand_id(full_name)')
                    .in('id', missingIds)
                    .order('created_at', { ascending: false })
                contentCampaigns = data || []
            }

            const allCampaigns = [...(directCampaigns || []), ...contentCampaigns]

            if (allCampaigns.length === 0) {
                setMissions([])
                setIsDataLoading(false)
                return
            }

            // BATCH: Fetch all mission_steps in one query instead of N+1
            const campaignIds = allCampaigns.map((c: any) => c.id)
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

            // Filter: only show missions that Mosh has sent to the creator
            const displayMissions: MissionDisplay[] = []
            for (const camp of allCampaigns) {
                const completedSteps = stepsByCampaign.get(camp.id) || []
                if (!completedSteps.includes('mission_sent_to_creator')) continue

                // Brand name comes from the join — no extra query needed
                const brandName = camp.brand?.full_name || 'Marque'

                displayMissions.push({
                    id: camp.id,
                    title: camp.title || 'Sans titre',
                    brand: brandName,
                    status: camp.status,
                    deadline: camp.deadline,
                    // The creator's fee only; budget_chf is the client price.
                    budget: camp.creator_amount_chf || 0,
                })
            }

            setMissions(displayMissions)
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    // "Active" = anything not finished/cancelled — mirror the /creator/missions page,
    // which counts by (status !== 'completed'). Campaign.status often stays 'draft'
    // while progress is tracked via mission_steps, so filtering on 'in_progress'/'open'
    // wrongly showed 0 here even when a mission was live.
    const activeMissions = missions.filter(m => m.status !== 'completed' && m.status !== 'cancelled')

    const nextDeadline = activeMissions
        .filter(m => m.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

    const metrics = [
        { label: "Missions actives", value: String(activeMissions.length), hint: "En cours" },
        { label: "Missions terminées", value: String(missions.filter(m => m.status === 'completed').length), hint: "Total" },
        { label: "Revenus estimés", value: formatCHF(activeMissions.reduce((sum, m) => sum + m.budget, 0)), hint: "À venir", tone: 'accent' as const },
        { label: "Prochaine deadline", value: nextDeadline?.deadline ? new Date(nextDeadline.deadline).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' }) : '—', hint: nextDeadline?.title || 'Aucune' },
    ]

    if (!mounted || (!user && isLoading) || needsOnboarding === null) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    if (needsOnboarding) {
        return (
            <CreatorOnboarding
                userId={userId!}
                userName={user?.full_name || 'Créateur'}
                onComplete={() => setNeedsOnboarding(false)}
            />
        )
    }

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Vue d'ensemble"
                description={`Bienvenue, ${user?.full_name?.split(' ')[0] || 'Créateur'} — voici un aperçu de votre activité`}
                actions={
                    <>
                        <Link href="/creator/missions" className={QUICK_ACTION_CLS}>
                            <Briefcase className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.8} />
                            Mes missions
                        </Link>
                        <Link href="/creator/portfolio" className={QUICK_ACTION_CLS}>
                            <Upload className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.8} />
                            Portfolio
                        </Link>
                        <Link href="/creator/settings" className={QUICK_ACTION_CLS}>
                            <Star className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.8} />
                            Profil
                        </Link>
                    </>
                }
            />

            <div className="mb-3">
                <MetricStrip metrics={metrics} />
            </div>

            <Panel
                title="Missions récentes"
                actions={
                    <Link
                        href="/creator/missions"
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1A1A1A] hover:text-[#333333] transition-colors"
                    >
                        Voir tout
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                    </Link>
                }
            >
                {isDataLoading ? (
                    <div className="divide-y divide-[#E2E2E1]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/3" />
                                <div className="h-4 bg-[#F4F4F3] rounded w-16 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : missions.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="Aucune mission pour le moment"
                        description="MOSH vous contactera dès qu'une mission correspond à votre profil."
                    />
                ) : (
                    <PanelList>
                        {missions.map((mission) => (
                            <PanelRow key={mission.id} href={`/creator/missions/${mission.id}`}>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{mission.title}</p>
                                    <p className="text-[12px] text-[#9B9B9B] truncate">{mission.brand}</p>
                                </div>
                                <StatusPill tone={statusTone(mission.status)}>
                                    {getStatusConfig(mission.status)?.label || mission.status}
                                </StatusPill>
                                <span className="text-[13px] font-medium text-[#1A1A1A] tabular-nums whitespace-nowrap">
                                    {formatCHF(mission.budget)}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors shrink-0" strokeWidth={2} />
                            </PanelRow>
                        ))}
                    </PanelList>
                )}
            </Panel>
        </div>
    )
}
