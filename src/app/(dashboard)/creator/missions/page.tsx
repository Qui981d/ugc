'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from "@/components/ui/badge"
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ChevronRight,
    MessageSquare,
    Briefcase,
    Loader2,
    FileText,
    Send,
    Users,
    Pen,
    Video,
    Package,
    Star,
    Camera,
    ScrollText,
    Upload,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { getMissionSteps } from '@/lib/services/adminService'
import type { MissionStep, MissionStepType } from '@/types/database'

// ================================================
// PIPELINE STEPS — creator-centric view
// (starts from selection, not from brief)
// ================================================
const PIPELINE_STEPS: { type: MissionStepType; label: string; shortLabel: string; icon: typeof FileText }[] = [
    { type: 'creator_validated', label: 'Vous avez été sélectionné', shortLabel: 'Sélection', icon: CheckCircle2 },
    { type: 'script_brand_approved', label: 'Script prêt', shortLabel: 'Script', icon: Pen },
    { type: 'mission_sent_to_creator', label: 'Mission reçue', shortLabel: 'Reçue', icon: Send },
    { type: 'contract_signed', label: 'Contrat signé', shortLabel: 'Contrat', icon: ScrollText },
    { type: 'creator_accepted', label: 'Mission acceptée', shortLabel: 'Accepté', icon: CheckCircle2 },
    { type: 'creator_shooting', label: 'En tournage', shortLabel: 'Tournage', icon: Camera },
    { type: 'video_uploaded_by_creator', label: 'Vidéo livrée', shortLabel: 'Livré', icon: Upload },
    { type: 'video_validated', label: 'QC MOSH', shortLabel: 'QC', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Envoyée à la marque', shortLabel: 'Envoyée', icon: Package },
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
    'contract_signed', 'creator_accepted', 'creator_shooting', 'video_uploaded_by_creator'
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

            // Fetch campaigns assigned to this creator
            const { data: campaigns } = await (supabase as any)
                .from('campaigns')
                .select('id, title, budget_chf, deadline, script_type, brand_id, status, contract_mosh_status, creator_amount_chf')
                .eq('selected_creator_id', userId!)
                .order('created_at', { ascending: false })

            if (!campaigns || campaigns.length === 0) {
                setMissions([])
                setIsDataLoading(false)
                return
            }

            const enrichedMissions: Mission[] = []

            for (const camp of campaigns) {
                // Fetch brand info
                const { data: brandData } = await (supabase as any)
                    .from('users')
                    .select('full_name, avatar_url')
                    .eq('id', camp.brand_id)
                    .single()

                // Fetch pipeline steps
                const missionSteps = await getMissionSteps(camp.id)
                const completedSteps = missionSteps.map((s: MissionStep) => s.step_type)
                const completedCount = PIPELINE_STEPS.filter(ps => completedSteps.includes(ps.type)).length
                const activeStepInfo = getActiveStepInfo(completedSteps)
                const isCreatorAction = activeStepInfo ? CREATOR_ACTION_STEPS.includes(activeStepInfo.type) : false

                enrichedMissions.push({
                    id: camp.id,
                    campaign_id: camp.id,
                    title: camp.title || 'Sans titre',
                    brand_name: brandData?.full_name || 'Marque',
                    brand_avatar: brandData?.avatar_url || null,
                    budget_chf: camp.budget_chf || 0,
                    creator_amount_chf: camp.creator_amount_chf || null,
                    deadline: camp.deadline,
                    script_type: camp.script_type,
                    status: camp.status,
                    contract_mosh_status: camp.contract_mosh_status || null,
                    completedSteps,
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
            .reduce((acc, m) => acc + (m.creator_amount_chf || m.budget_chf || 0), 0),
    }

    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#A1A1AA]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#18181B] tracking-[-0.02em]">Mes Missions</h1>
                    <p className="text-[#71717A] mt-1">Suivez l&apos;avancement de vos collaborations</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total missions', value: String(stats.total), color: 'text-[#18181B]' },
                    { label: 'En cours', value: String(stats.active), color: 'text-[#18181B]' },
                    { label: 'Terminées', value: String(stats.completed), color: 'text-[#18181B]' },
                    { label: 'Revenus en attente', value: formatCHF(stats.pendingRevenue), color: 'text-[#18181B]' },
                ].map((stat, i) => (
                    <motion.div key={stat.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                    >
                        <p className="text-sm text-[#71717A] mb-1">{stat.label}</p>
                        <p className={`text-xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#18181B] text-white shadow-sm'
                            : 'bg-[#F4F3EF] text-[#71717A] hover:text-[#18181B] hover:bg-[#E8E6DF] border border-[#D9D7D0]/50'
                            }`}
                    >
                        {tab.label}
                        <span className="ml-2 text-xs opacity-70">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Missions List */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                >
                    {isDataLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-[#A1A1AA]" />
                        </div>
                    ) : filteredMissions.length === 0 ? (
                        <div className="text-center py-16 text-[#A1A1AA]">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{activeTab === 'active' ? 'Aucune mission en cours' : 'Aucune mission terminée'}</p>
                        </div>
                    ) : (
                        filteredMissions.map((mission, index) => {
                            const progress = (mission.completedCount / PIPELINE_STEPS.length) * 100
                            const ActiveIcon = mission.activeStep
                                ? (PIPELINE_STEPS.find(p => p.type === mission.activeStep?.type)?.icon || Clock)
                                : CheckCircle2

                            return (
                                <motion.div key={mission.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link href={`/creator/missions/${mission.campaign_id}`}>
                                        <div className={`bg-white/90 backdrop-blur-sm border rounded-[20px] p-6 transition-all duration-300 hover:bg-white hover:shadow-md cursor-pointer group ${mission.isCreatorAction
                                            ? 'border-[#C4F042]/30 hover:border-[#C4F042]/40'
                                            : 'border-black/[0.03]'
                                            }`}>
                                            <div className="flex items-start gap-5">
                                                {/* Brand Logo */}
                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F4F3EF] border border-[#D9D7D0] flex-shrink-0">
                                                    {mission.brand_avatar ? (
                                                        <Image src={mission.brand_avatar} alt={mission.brand_name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[#71717A] text-lg font-bold">
                                                            {mission.brand_name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-[#18181B] mb-0.5 group-hover:text-[#18181B] transition-colors">{mission.title}</h3>
                                                            <p className="text-sm text-[#71717A]">{mission.brand_name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {/* Active step badge */}
                                                            {mission.activeStep ? (
                                                                <Badge className={`border flex-shrink-0 ${mission.isCreatorAction
                                                                    ? 'bg-[#C4F042]/20 text-[#18181B] border-[#C4F042]/30'
                                                                    : 'bg-[#F4F3EF] text-[#71717A] border-[#D9D7D0]'
                                                                    }`}>
                                                                    <ActiveIcon className="w-3 h-3 mr-1" />
                                                                    {mission.isCreatorAction ? '⚡ ' : ''}
                                                                    {mission.activeStep.label}
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-[#C4F042]/20 text-[#18181B] border-[#C4F042]/30">
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Terminée
                                                                </Badge>
                                                            )}
                                                            <ChevronRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#C4F042] transition-colors" />
                                                        </div>
                                                    </div>

                                                    {/* Pipeline Progress Bar */}
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 rounded-full bg-black/[0.04] overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-700 ${mission.isCreatorAction ? 'bg-[#C4F042]' : 'bg-[#C4F042]'}`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-[#A1A1AA] font-medium w-8 text-right">
                                                            {mission.completedCount}/{PIPELINE_STEPS.length}
                                                        </span>
                                                    </div>

                                                    {/* Meta Row */}
                                                    <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-3 text-sm">
                                                        {mission.deadline && (
                                                            <span className="text-[#71717A] flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                                {new Date(mission.deadline).toLocaleDateString('fr-CH')}
                                                            </span>
                                                        )}
                                                        <span className="text-[#71717A]">{mission.script_type}</span>
                                                        <span className="text-[#18181B] font-semibold">
                                                            {mission.creator_amount_chf
                                                                ? formatCHF(mission.creator_amount_chf)
                                                                : formatCHF(mission.budget_chf)}
                                                        </span>
                                                        {mission.contract_mosh_status === 'pending_creator' && (
                                                            <span className="text-amber-600 text-xs font-medium flex items-center gap-1">
                                                                <ScrollText className="w-3 h-3" />
                                                                Contrat à signer
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
