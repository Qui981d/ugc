'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, Upload, ChevronRight, Wallet, Loader2, Briefcase, Star } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { getStatusConfig } from "@/lib/constants/statusConfig"
import { CreatorOnboarding } from "@/components/onboarding/CreatorOnboarding"



interface MissionDisplay {
    id: string
    title: string
    brand: string
    status: string
    deadline: string | null
    budget: number
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
                    budget: camp.creator_amount_chf || camp.budget_chf || 0,
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

    const stats = [
        { label: "Missions actives", value: String(activeMissions.length), icon: Clock, change: "En cours" },
        { label: "Missions terminées", value: String(missions.filter(m => m.status === 'completed').length), icon: CheckCircle2, change: "Total" },
        { label: "Revenus estimés", value: formatCHF(activeMissions.reduce((sum, m) => sum + m.budget, 0)), icon: Wallet, change: "À venir" },
        { label: "Prochaine deadline", value: nextDeadline?.deadline ? new Date(nextDeadline.deadline).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' }) : '—', icon: Calendar, change: nextDeadline?.title || 'Aucune' },
    ]

    if (!mounted || (!user && isLoading) || needsOnboarding === null) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8A8D91]" />
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
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1C1E21] tracking-[-0.02em]">
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Créateur'} 👋
                    </h1>
                    <p className="text-[#65676B] mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
            </motion.div>

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
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm text-[#65676B]">{stat.label}</p>
                                <p className="text-lg md:text-2xl font-bold text-[#1C1E21] mt-1 truncate">{stat.value}</p>
                                <p className="text-xs text-[#8A8D91] mt-1">{stat.change}</p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[#E7F0FF] flex items-center justify-center flex-shrink-0">
                                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-[#1C1E21]" strokeWidth={1.5} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Missions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-[#DADDE1] overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#1C1E21]">Missions récentes</h2>
                    <Link href="/creator/missions">
                        <Button variant="ghost" className="text-[#65676B] hover:text-[#1C1E21] hover:bg-[#F0F2F5] rounded-full">
                            Voir tout
                            <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
                        </Button>
                    </Link>
                </div>
                <div className="px-6 pb-6">
                    {missions.length === 0 ? (
                        <div className="text-center py-12 text-[#8A8D91]">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune mission pour le moment</p>
                            <p className="text-sm mt-2">MOSH vous contactera dès qu&apos;une mission correspond à votre profil</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {missions.map((mission, index) => (
                                <motion.div
                                    key={mission.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                >
                                    <Link href={`/creator/missions/${mission.id}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[#F0F2F5]/60 hover:bg-[#F0F2F5] transition-all group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[#E7F0FF] flex items-center justify-center text-[#1C1E21] font-bold text-sm">
                                                    {mission.brand.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#1C1E21] group-hover:text-[#1C1E21] transition-colors">{mission.title}</p>
                                                    <p className="text-sm text-[#65676B]">{mission.brand}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={getStatusConfig(mission.status)?.badgeClass || 'bg-[#F0F2F5] text-[#65676B]'}>
                                                    {getStatusConfig(mission.status)?.label || mission.status}
                                                </Badge>
                                                <span className="text-[#1C1E21] font-semibold">{formatCHF(mission.budget)}</span>
                                                <ChevronRight className="w-4 h-4 text-[#8A8D91] group-hover:text-[#0866FF] transition-colors" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
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
                    <Link href="/creator/portfolio">
                        <div className="bg-white rounded-xl border border-[#DADDE1] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#E7F0FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-6 w-6 text-[#1C1E21]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#1C1E21]">Mettre à jour le portfolio</p>
                                <p className="text-sm text-[#65676B]">Ajoutez vos dernières créations</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/creator/missions">
                        <div className="bg-white rounded-xl border border-[#DADDE1] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#E7F0FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Briefcase className="h-6 w-6 text-[#1C1E21]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#1C1E21]">Mes missions</p>
                                <p className="text-sm text-[#65676B]">Suivre vos missions en cours</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/creator/settings">
                        <div className="bg-white rounded-xl border border-[#DADDE1] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#E7F0FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Star className="h-6 w-6 text-[#1C1E21]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#1C1E21]">Compléter le profil</p>
                                <p className="text-sm text-[#65676B]">Augmentez votre visibilité</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
