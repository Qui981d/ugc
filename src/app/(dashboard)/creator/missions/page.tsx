'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ChevronRight,
    MessageSquare,
    Upload,
    Eye,
    Briefcase,
    Loader2,
    RotateCcw,
    XCircle,
    FileVideo
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import MissionDetailModal from '@/components/missions/MissionDetailModal'

// Type pour les missions (applications acceptées + deliverable status)
interface Mission {
    id: string
    campaign: {
        id: string
        title: string
        budget_chf: number
        deadline: string | null
        script_type: string
        brand: {
            full_name: string
            avatar_url: string | null
        }
    }
    status: string
    created_at: string
    // Deliverable info
    deliverable_status: 'none' | 'review' | 'revision_requested' | 'approved' | 'rejected'
    deliverable_revision_notes: string | null
}

// Application status config
const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    accepted: { label: "En cours", class: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
    delivered: { label: "Livré", class: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Eye },
    completed: { label: "Terminée", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    pending: { label: "En attente", class: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: AlertCircle },
}

// Deliverable status config
const deliverableStatusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    review: { label: 'En validation', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
    revision_requested: { label: 'Révision demandée', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: RotateCcw },
    approved: { label: 'Approuvé', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    rejected: { label: 'Rejeté', class: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
}

// Progress step calculation
function getProgressStep(mission: Mission): number {
    if (mission.status === 'completed' || mission.deliverable_status === 'approved') return 3
    if (mission.deliverable_status === 'review') return 2
    if (mission.deliverable_status === 'revision_requested') return 1.5
    if (mission.deliverable_status !== 'none') return 1
    return 0
}

export default function CreatorMissionsPage() {
    const { user, isLoading } = useAuth()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState('active')
    const [missions, setMissions] = useState<Mission[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
    const router = useRouter()

    useEffect(() => { setMounted(true) }, [])

    const userId = user?.id

    useEffect(() => {
        if (!userId) return

        async function fetchMissions() {
            setIsDataLoading(true)
            const supabase = createClient()

            // Fetch accepted applications
            const { data: acceptedData, error: acceptedError } = await (supabase as any)
                .from('applications')
                .select('id, status, created_at, campaign_id')
                .eq('creator_id', userId!)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })

            // Also try to fetch completed applications (may fail if enum value doesn't exist yet)
            const { data: completedData } = await (supabase as any)
                .from('applications')
                .select('id, status, created_at, campaign_id')
                .eq('creator_id', userId!)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })

            const data = [...(acceptedData || []), ...(completedData || [])]
            const error = acceptedError

            if (error) {
                console.error('Error fetching missions:', error)
                setIsDataLoading(false)
                return
            }

            // Now fetch campaign data and deliverable status for each
            const enrichedMissions: Mission[] = []

            for (const app of (data || [])) {
                // Fetch campaign + brand
                const { data: campaignData } = await (supabase as any)
                    .from('campaigns')
                    .select('id, title, budget_chf, deadline, script_type, brand_id')
                    .eq('id', app.campaign_id)
                    .single()

                if (!campaignData) continue

                // Fetch brand name
                const { data: brandData } = await (supabase as any)
                    .from('users')
                    .select('full_name, avatar_url')
                    .eq('id', campaignData.brand_id)
                    .single()

                // Fetch latest deliverable status
                const { data: deliverables } = await (supabase as any)
                    .from('deliverables')
                    .select('status, revision_notes')
                    .eq('campaign_id', app.campaign_id)
                    .eq('creator_id', userId!)
                    .order('created_at', { ascending: false })
                    .limit(1)

                const latestDeliverable = deliverables?.[0]

                enrichedMissions.push({
                    id: app.id,
                    campaign: {
                        id: campaignData.id,
                        title: campaignData.title,
                        budget_chf: campaignData.budget_chf,
                        deadline: campaignData.deadline,
                        script_type: campaignData.script_type,
                        brand: {
                            full_name: brandData?.full_name || 'Marque',
                            avatar_url: brandData?.avatar_url || null,
                        }
                    },
                    status: app.status,
                    created_at: app.created_at,
                    deliverable_status: latestDeliverable?.status || 'none',
                    deliverable_revision_notes: latestDeliverable?.revision_notes || null,
                })
            }

            setMissions(enrichedMissions)
            setIsDataLoading(false)
        }

        fetchMissions()
    }, [userId])

    const tabs = [
        { id: 'active', label: 'En cours', count: missions.filter(m => m.status === 'accepted').length },
        { id: 'completed', label: 'Terminées', count: missions.filter(m => m.status === 'completed').length },
    ]

    const filteredMissions = missions.filter(mission => {
        if (activeTab === 'active') return mission.status === 'accepted'
        if (activeTab === 'completed') return mission.status === 'completed'
        return true
    })

    const stats = {
        total: missions.length,
        active: missions.filter(m => m.status === 'accepted').length,
        completed: missions.filter(m => m.status === 'completed').length,
        pendingRevenue: missions
            .filter(m => m.status !== 'completed')
            .reduce((acc, m) => acc + (m.campaign?.budget_chf || 0), 0),
    }

    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mes Missions</h1>
                    <p className="text-white/60 mt-1">Gérez vos collaborations en cours</p>
                </div>
                <Link href="/creator/marketplace">
                    <Button className="btn-primary">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Trouver des missions
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Total missions</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <p className="text-sm text-white/50 mb-1">En cours</p>
                    <p className="text-3xl font-bold text-blue-400">{stats.active}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Terminées</p>
                    <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <p className="text-sm text-white/50 mb-1">Revenus en attente</p>
                    <p className="text-3xl font-bold text-white">{formatCHF(stats.pendingRevenue)}</p>
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

            {/* Missions List */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                >
                    {isDataLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                        </div>
                    ) : filteredMissions.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{activeTab === 'active' ? 'Aucune mission en cours' : 'Aucune mission terminée'}</p>
                            {activeTab === 'active' && (
                                <Link href="/creator/marketplace">
                                    <Button className="btn-primary mt-4">
                                        Explorer les campagnes
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        filteredMissions.map((mission, index) => {
                            const appStatus = statusConfig[mission.status] || statusConfig.pending
                            const delivStatus = mission.deliverable_status !== 'none'
                                ? deliverableStatusConfig[mission.deliverable_status]
                                : null
                            const DelivIcon = delivStatus?.icon || FileVideo
                            const progressStep = getProgressStep(mission)

                            return (
                                <motion.div
                                    key={mission.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group"
                                >
                                    <div className={`bg-white/[0.08] backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.10] ${mission.deliverable_status === 'revision_requested'
                                        ? 'border-orange-500/30 hover:border-orange-500/50'
                                        : mission.deliverable_status === 'approved'
                                            ? 'border-emerald-500/30 hover:border-emerald-500/50'
                                            : 'border-white/[0.15] hover:border-white/25'
                                        }`}>
                                        <div className="flex items-start gap-5">
                                            {/* Brand Logo */}
                                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                                                {mission.campaign?.brand?.avatar_url ? (
                                                    <Image
                                                        src={mission.campaign.brand.avatar_url}
                                                        alt={mission.campaign.brand.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white/30 text-lg font-bold">
                                                        {mission.campaign?.brand?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-white/90">
                                                            {mission.campaign?.title || 'Mission sans nom'}
                                                        </h3>
                                                        <p className="text-sm text-white/50">{mission.campaign?.brand?.full_name}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        {/* Deliverable status badge — primary */}
                                                        {delivStatus ? (
                                                            <Badge className={`${delivStatus.class} border flex-shrink-0`}>
                                                                <DelivIcon className="w-3 h-3 mr-1" />
                                                                {delivStatus.label}
                                                            </Badge>
                                                        ) : (
                                                            <Badge className={`${appStatus.class} border flex-shrink-0`}>
                                                                {appStatus.label}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Revision notes preview */}
                                                {mission.deliverable_status === 'revision_requested' && mission.deliverable_revision_notes && (
                                                    <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                                        <p className="text-xs text-orange-400 font-medium mb-1">📝 Notes de révision</p>
                                                        <p className="text-sm text-white/70 line-clamp-2">{mission.deliverable_revision_notes}</p>
                                                    </div>
                                                )}

                                                {/* Progress Steps */}
                                                {mission.status !== 'completed' && (
                                                    <div className="mt-4 flex items-center gap-1">
                                                        {['Accepté', 'Livré', 'En validation', 'Approuvé'].map((step, i) => (
                                                            <div key={step} className="flex items-center gap-1 flex-1">
                                                                <div className={`h-1.5 flex-1 rounded-full transition-colors ${i < progressStep
                                                                    ? mission.deliverable_status === 'revision_requested' && i >= 1
                                                                        ? 'bg-orange-500/60'
                                                                        : 'bg-accent/60'
                                                                    : 'bg-white/10'
                                                                    }`} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {mission.status !== 'completed' && (
                                                    <div className="flex justify-between mt-1">
                                                        {['Accepté', 'Livré', 'Validé', 'Terminé'].map((step, i) => (
                                                            <span key={step} className={`text-[10px] ${i < progressStep ? 'text-white/50' : 'text-white/20'
                                                                }`}>
                                                                {step}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Meta Row */}
                                                <div className="flex items-center gap-6 mt-3 text-sm">
                                                    {mission.campaign?.deadline && (
                                                        <span className="text-white/50 flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(mission.campaign.deadline).toLocaleDateString('fr-CH')}
                                                        </span>
                                                    )}
                                                    <span className="text-white/50">
                                                        {mission.campaign?.script_type}
                                                    </span>
                                                    <span className="text-white font-semibold">
                                                        {formatCHF(mission.campaign?.budget_chf || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {mission.status === 'accepted' && (
                                                    <Button
                                                        size="sm"
                                                        className={
                                                            mission.deliverable_status === 'revision_requested'
                                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                                : mission.deliverable_status === 'none'
                                                                    ? 'btn-primary'
                                                                    : 'bg-white/10 hover:bg-white/15 text-white'
                                                        }
                                                        onClick={() => router.push(`/shared/mission/${mission.id}`)}
                                                    >
                                                        {mission.deliverable_status === 'none' ? (
                                                            <>
                                                                <Upload className="w-4 h-4 mr-1" />
                                                                Livrer
                                                            </>
                                                        ) : mission.deliverable_status === 'revision_requested' ? (
                                                            <>
                                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                                Re-soumettre
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Voir le livrable
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                {mission.status === 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                                        onClick={() => router.push(`/shared/mission/${mission.id}`)}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Voir
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-white/60 hover:text-white hover:bg-white/10"
                                                    onClick={() => router.push(`/creator/messages?campaign=${mission.campaign?.id}`)}
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-1" />
                                                    Message
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Mission Detail Modal */}
            <MissionDetailModal
                isOpen={!!selectedMission}
                onClose={() => setSelectedMission(null)}
                missionId={selectedMission?.id || ''}
                campaignId={selectedMission?.campaign?.id || ''}
                applicationStatus={selectedMission?.status || 'pending'}
                userRole="creator"
            />
        </div>
    )
}
