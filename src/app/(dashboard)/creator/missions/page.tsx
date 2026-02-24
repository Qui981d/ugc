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
    FileVideo,
    FileText
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { getMoshContractText, signMoshContract } from '@/lib/services/contractService'
import { getInvoiceText } from '@/lib/services/invoiceService'
import ContractViewer from '@/components/contracts/ContractViewer'
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
    // Contract info (MOSH model)
    contract_status: 'pending_creator' | 'active' | null
    contract_url: string | null
    creator_amount_chf: number | null
    // Invoice info
    invoice_url: string | null
    invoice_number: string | null
    // Deliverable info
    deliverable_status: 'none' | 'review' | 'revision_requested' | 'approved' | 'rejected'
    deliverable_revision_notes: string | null
}

// Application status config
const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    accepted: { label: "En cours", class: "bg-blue-500/20 text-blue-700 border-blue-500/30", icon: Clock },
    delivered: { label: "Livré", class: "bg-amber-500/20 text-amber-700 border-amber-500/30", icon: Eye },
    completed: { label: "Terminée", class: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 },
    pending: { label: "En attente", class: "bg-[#F4F3EF] text-[#71717A] border-[#D9D7D0]", icon: AlertCircle },
}

// Deliverable status config
const deliverableStatusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    review: { label: 'En validation', class: 'bg-blue-500/20 text-blue-700 border-blue-500/30', icon: Clock },
    revision_requested: { label: 'Révision demandée', class: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: RotateCcw },
    approved: { label: 'Approuvé', class: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30', icon: CheckCircle2 },
    rejected: { label: 'Rejeté', class: 'bg-red-500/20 text-red-700 border-red-500/30', icon: XCircle },
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

    // Contract viewer state
    const [viewerOpen, setViewerOpen] = useState(false)
    const [viewerMission, setViewerMission] = useState<Mission | null>(null)
    const [viewerText, setViewerText] = useState<string | null>(null)
    const [signLoading, setSignLoading] = useState(false)

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
                .select('id, status, created_at, campaign_id, contract_status, contract_url')
                .eq('creator_id', userId!)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })

            // Also try to fetch completed applications (may fail if enum value doesn't exist yet)
            const { data: completedData } = await (supabase as any)
                .from('applications')
                .select('id, status, created_at, campaign_id, contract_status, contract_url')
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
                    .select('id, title, budget_chf, deadline, script_type, brand_id, contract_mosh_status, contract_mosh_url, creator_amount_chf, invoice_url, invoice_number')
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
                    contract_status: campaignData.contract_mosh_status || null,
                    contract_url: campaignData.contract_mosh_url || null,
                    creator_amount_chf: campaignData.creator_amount_chf || null,
                    invoice_url: campaignData.invoice_url || null,
                    invoice_number: campaignData.invoice_number || null,
                    deliverable_status: latestDeliverable?.status || 'none',
                    deliverable_revision_notes: latestDeliverable?.revision_notes || null,
                })
            }

            setMissions(enrichedMissions)
            setIsDataLoading(false)
        }

        fetchMissions()
    }, [userId])

    // Contract viewing
    const handleViewContract = async (mission: Mission) => {
        setViewerMission(mission)
        setViewerText(null)
        setViewerOpen(true)
        const text = await getMoshContractText(mission.campaign.id)
        setViewerText(text)
    }

    // Creator signs contract
    const handleSignContract = async () => {
        if (!viewerMission) return
        setSignLoading(true)

        let clientIp = 'unknown'
        try {
            const res = await fetch('https://api.ipify.org?format=json')
            const data = await res.json()
            clientIp = data.ip
        } catch { /* fallback */ }

        const result = await signMoshContract(viewerMission.campaign.id, clientIp)
        if (result.success) {
            setMissions(prev =>
                prev.map(m =>
                    m.id === viewerMission.id
                        ? { ...m, contract_status: 'active' }
                        : m
                )
            )
            setViewerOpen(false)
            setViewerMission(null)
        } else {
            alert('Erreur: ' + result.error)
        }
        setSignLoading(false)
    }

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
                    <p className="text-[#71717A] mt-1">Gérez vos collaborations en cours</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">Total missions</p>
                    <p className="text-xl md:text-3xl font-bold text-[#18181B]">{stats.total}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">En cours</p>
                    <p className="text-xl md:text-3xl font-bold text-blue-700">{stats.active}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">Terminées</p>
                    <p className="text-xl md:text-3xl font-bold text-emerald-700">{stats.completed}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">Revenus en attente</p>
                    <p className="text-xl md:text-3xl font-bold text-[#18181B] truncate">{formatCHF(stats.pendingRevenue)}</p>
                </motion.div>
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
                        <span className="ml-2 text-xs opacity-70">
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
                            <Loader2 className="w-8 h-8 animate-spin text-[#A1A1AA]" />
                        </div>
                    ) : filteredMissions.length === 0 ? (
                        <div className="text-center py-16 text-[#A1A1AA]">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{activeTab === 'active' ? 'Aucune mission en cours' : 'Aucune mission terminée'}</p>
                            {activeTab === 'active' && (
                                <p className="text-sm mt-2">MOSH vous contactera dès qu&apos;une mission correspond à votre profil</p>
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
                                    <div className={`bg-white/90 backdrop-blur-sm border rounded-[20px] p-6 transition-all duration-300 hover:bg-white ${mission.deliverable_status === 'revision_requested'
                                        ? 'border-orange-500/30 hover:border-orange-500/50'
                                        : mission.deliverable_status === 'approved'
                                            ? 'border-emerald-500/30 hover:border-emerald-500/50'
                                            : 'border-black/[0.03] hover:shadow-sm'
                                        }`}>
                                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                                            {/* Brand Logo */}
                                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F4F3EF] border border-[#D9D7D0] flex-shrink-0">
                                                {mission.campaign?.brand?.avatar_url ? (
                                                    <Image
                                                        src={mission.campaign.brand.avatar_url}
                                                        alt={mission.campaign.brand.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[#71717A] text-lg font-bold">
                                                        {mission.campaign?.brand?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-[#18181B] mb-1">
                                                            {mission.campaign?.title || 'Mission sans nom'}
                                                        </h3>
                                                        <p className="text-sm text-[#71717A]">{mission.campaign?.brand?.full_name}</p>
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
                                                        <p className="text-sm text-[#52525B] line-clamp-2">{mission.deliverable_revision_notes}</p>
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
                                                                        : 'bg-[#C4F042]'
                                                                    : 'bg-[#F4F3EF]'
                                                                    }`} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {mission.status !== 'completed' && (
                                                    <div className="flex justify-between mt-1">
                                                        {['Accepté', 'Livré', 'Validé', 'Terminé'].map((step, i) => (
                                                            <span key={step} className={`text-[10px] ${i < progressStep ? 'text-[#71717A]' : 'text-[#A1A1AA]'
                                                                }`}>
                                                                {step}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Meta Row */}
                                                <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-3 text-sm">
                                                    {mission.campaign?.deadline && (
                                                        <span className="text-[#71717A] flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4" strokeWidth={1.5} />
                                                            {new Date(mission.campaign.deadline).toLocaleDateString('fr-CH')}
                                                        </span>
                                                    )}
                                                    <span className="text-[#71717A]">
                                                        {mission.campaign?.script_type}
                                                    </span>
                                                    <span className="text-[#18181B] font-semibold">
                                                        {formatCHF(mission.campaign?.budget_chf || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                                                {mission.status === 'accepted' && (
                                                    <Button
                                                        size="sm"
                                                        className={
                                                            mission.deliverable_status === 'revision_requested'
                                                                ? 'bg-orange-500 hover:bg-orange-600 text-white rounded-full'
                                                                : mission.deliverable_status === 'none'
                                                                    ? 'bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full'
                                                                    : 'bg-[#F4F3EF] hover:bg-[#E8E6DF] text-[#18181B] rounded-full'
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
                                                {/* Contract button */}
                                                {mission.contract_status && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={mission.contract_status === 'pending_creator'
                                                            ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 rounded-full'
                                                            : 'text-[#18181B] hover:text-[#18181B] hover:bg-[#F4F3EF] rounded-full'
                                                        }
                                                        onClick={() => handleViewContract(mission)}
                                                    >
                                                        <FileText className="w-4 h-4 mr-1" />
                                                        {mission.contract_status === 'pending_creator' ? 'Signer le contrat' : 'Contrat'}
                                                    </Button>
                                                )}
                                                {mission.status === 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                                                        onClick={() => router.push(`/shared/mission/${mission.id}`)}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Voir
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F3EF] rounded-full"
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

            {/* Contract Viewer — creator signing */}
            {viewerMission && (
                <ContractViewer
                    isOpen={viewerOpen}
                    onClose={() => {
                        setViewerOpen(false)
                        setViewerMission(null)
                        setViewerText(null)
                    }}
                    contractText={viewerText}
                    contractStatus={viewerMission.contract_status as any}
                    contractUrl={viewerMission.contract_url}
                    mode="creator"
                    onSign={handleSignContract}
                    isSignLoading={signLoading}
                />
            )}
        </div>
    )
}
