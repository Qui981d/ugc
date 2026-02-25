'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    FileText,
    Users,
    CheckCircle2,
    Video,
    Clock,
    ChevronRight,
    Target,
    Calendar,
    Package,
    AlertCircle,
    Play,
    Download,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Pen,
    Send,
    Eye,
    Star,
    X,
} from 'lucide-react'
import { getCampaignById } from '@/lib/services/campaignService'
import { getMissionSteps } from '@/lib/services/adminService'
import {
    brandSelectCreator,
    brandRejectProfiles,
    brandApproveScript,
    brandFeedbackScript,
    brandApproveVideo,
    brandRequestRevision,
} from '@/lib/services/adminService'
import { formatCHF } from '@/lib/validations/swiss'
import type { Campaign, MissionStep, MissionStepType, ProfileCreator } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

// ================================================
// TIMELINE CONFIGURATION — Visible steps for the brand
// ================================================
const TIMELINE_STEPS: { type: MissionStepType; label: string; description: string; icon: typeof FileText; actionRequired?: boolean }[] = [
    { type: 'brief_received', label: 'Brief reçu par MOSH', description: 'Votre brief a été reçu et est en cours d\'analyse.', icon: FileText },
    { type: 'creators_proposed', label: 'Profils proposés', description: 'MOSH a sélectionné des créateurs pour vous. Choisissez votre favori !', icon: Users, actionRequired: true },
    { type: 'creator_validated', label: 'Créateur validé', description: 'Un créateur a été assigné à votre projet.', icon: CheckCircle2 },
    { type: 'script_sent', label: 'Script rédigé', description: 'Le script de votre vidéo est prêt.', icon: FileText },
    { type: 'script_brand_review', label: 'Validation du script', description: 'Relisez le script et validez pour lancer la production.', icon: Pen, actionRequired: true },
    { type: 'video_delivered', label: 'Vidéo en production', description: 'Le créateur produit votre vidéo.', icon: Video },
    { type: 'video_validated', label: 'Vidéo validée par MOSH', description: 'MOSH a vérifié la qualité de la vidéo.', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Vidéo livrée', description: 'Votre vidéo est prête pour votre validation finale.', icon: Package },
    { type: 'brand_final_review', label: 'Validation finale', description: 'Validez la vidéo ou demandez une révision (max 2).', icon: Star, actionRequired: true },
    { type: 'brand_final_approved', label: 'Mission terminée ✅', description: 'Votre vidéo UGC est finalisée. Téléchargez-la !', icon: CheckCircle2 },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Brief envoyé', color: 'text-amber-700', bg: 'bg-amber-50' },
    open: { label: 'Créateur en sélection', color: 'text-blue-700', bg: 'bg-blue-50' },
    in_progress: { label: 'En production', color: 'text-purple-700', bg: 'bg-purple-50' },
    completed: { label: 'Vidéo livrée', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    cancelled: { label: 'Annulé', color: 'text-red-700', bg: 'bg-red-50' },
}

// ================================================
// PROPOSED CREATOR CARD
// ================================================
function CreatorCard({ creator, onSelect }: {
    creator: { id: string; full_name: string; profiles_creator: ProfileCreator | null }
    onSelect: (id: string) => void
}) {
    const profile = creator.profiles_creator
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-xl p-4 hover:border-[#6C3FA0]/40 hover:shadow-md transition-all"
        >
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C3FA0]/20 to-[#6C3FA0]/5 flex items-center justify-center text-[#6C3FA0] font-bold text-lg shrink-0">
                    {creator.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{creator.full_name}</h4>
                    {profile?.bio && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{profile.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {profile?.specialties?.slice(0, 3).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{s}</span>
                        ))}
                    </div>
                    {(profile?.portfolio_video_urls?.length ?? 0) > 0 && profile && (
                        <a href={profile.portfolio_video_urls[0]} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#6C3FA0] hover:underline mt-2 inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Voir le portfolio
                        </a>
                    )}
                </div>
            </div>
            <button
                onClick={() => onSelect(creator.id)}
                className="w-full mt-3 py-2 px-4 bg-[#6C3FA0] text-white rounded-lg text-sm font-medium hover:bg-[#5a3488] transition-colors flex items-center justify-center gap-2"
            >
                <ThumbsUp className="w-4 h-4" />
                Sélectionner ce profil
            </button>
        </motion.div>
    )
}

// ================================================
// MAIN PAGE
// ================================================
export default function BrandCampaignDetailPage() {
    const params = useParams()
    const campaignId = params.id as string

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [proposedCreators, setProposedCreators] = useState<any[]>([])
    const [actionLoading, setActionLoading] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [showScriptModal, setShowScriptModal] = useState(false)
    const [showVideoModal, setShowVideoModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)

    const loadData = useCallback(async () => {
        const [campaignData, missionSteps] = await Promise.all([
            getCampaignById(campaignId),
            getMissionSteps(campaignId),
        ])
        setCampaign(campaignData)
        setSteps(missionSteps)
        setIsLoading(false)

        // Load proposed creators if needed
        if (campaignData?.proposed_creator_ids?.length) {
            const supabase = createClient()
            const { data } = await supabase
                .from('users')
                .select('*, profiles_creator(*)')
                .in('id', campaignData.proposed_creator_ids)
            if (data) setProposedCreators(data)
        }
    }, [campaignId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const isStepCompleted = (stepType: MissionStepType) =>
        steps.some(s => s.step_type === stepType)

    const getCurrentStepIndex = () => {
        let lastCompleted = -1
        TIMELINE_STEPS.forEach((ws, i) => {
            if (isStepCompleted(ws.type)) lastCompleted = i
        })
        return lastCompleted
    }

    // ---- Action handlers ----
    const handleSelectCreator = async (creatorId: string) => {
        setActionLoading(true)
        const result = await brandSelectCreator(campaignId, creatorId)
        if (result.success) await loadData()
        setActionLoading(false)
    }

    const handleRejectProfiles = async () => {
        setActionLoading(true)
        const result = await brandRejectProfiles(campaignId, rejectReason || null)
        if (result.success) {
            setShowRejectModal(false)
            setRejectReason('')
            await loadData()
        }
        setActionLoading(false)
    }

    const handleApproveScript = async () => {
        setActionLoading(true)
        const result = await brandApproveScript(campaignId)
        if (result.success) {
            setShowScriptModal(false)
            await loadData()
        }
        setActionLoading(false)
    }

    const handleScriptFeedback = async () => {
        if (!feedback.trim()) return
        setActionLoading(true)
        const result = await brandFeedbackScript(campaignId, feedback)
        if (result.success) {
            setShowScriptModal(false)
            setFeedback('')
            await loadData()
        }
        setActionLoading(false)
    }

    const handleApproveVideo = async () => {
        setActionLoading(true)
        const result = await brandApproveVideo(campaignId)
        if (result.success) {
            setShowVideoModal(false)
            await loadData()
        }
        setActionLoading(false)
    }

    const handleRequestRevision = async () => {
        if (!feedback.trim()) return
        setActionLoading(true)
        const result = await brandRequestRevision(campaignId, feedback)
        if (result.success) {
            setShowVideoModal(false)
            setFeedback('')
            await loadData()
        } else if (result.error) {
            alert(result.error)
        }
        setActionLoading(false)
    }

    if (isLoading) {
        return <div className="max-w-3xl mx-auto py-12 text-center text-gray-400">Chargement...</div>
    }

    if (!campaign) {
        return <div className="max-w-3xl mx-auto py-12 text-center text-gray-400">Brief introuvable</div>
    }

    const currentStep = getCurrentStepIndex()
    const statusCfg = statusConfig[campaign.status] || statusConfig.draft

    // Determine which action sections to show
    const needsBriefUpdate = !!campaign.brief_feedback_notes && campaign.status === 'draft'
    const needsProfileReview = isStepCompleted('brand_reviewing_profiles') && !isStepCompleted('creator_validated') && proposedCreators.length > 0
    const needsScriptReview = campaign.script_status === 'brand_review' && campaign.script_content
    const needsVideoReview = isStepCompleted('video_sent_to_brand') && !isStepCompleted('brand_final_approved') && campaign.status !== 'completed'
    const revisionCount = campaign.brand_revision_count || 0

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/brand/campaigns" className="hover:text-[#6C3FA0] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Mes briefs
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-900">{campaign.title}</span>
            </div>

            {/* Title & Status */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{campaign.title}</h1>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Target className="w-4 h-4" />
                        {campaign.script_type}
                    </span>
                    {campaign.deadline && (
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                        </span>
                    )}
                    <span className="font-semibold text-gray-900">{formatCHF(campaign.budget_chf)}</span>
                </div>
            </div>

            {/* ========== ACTION REQUIRED BANNERS ========== */}

            {/* Brief feedback alert */}
            {needsBriefUpdate && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-amber-800">Précisions requises sur votre brief</h3>
                        <p className="text-sm text-amber-700 mt-1 whitespace-pre-wrap">{campaign.brief_feedback_notes}</p>
                        <p className="text-xs text-amber-500 mt-2">Mettez à jour votre brief pour continuer.</p>
                    </div>
                </motion.div>
            )}

            {/* Profile selection action */}
            {needsProfileReview && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#6C3FA0]/30 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-[#6C3FA0]" />
                        <h3 className="text-lg font-semibold text-gray-900">Choisissez votre créateur</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[#6C3FA0]/10 text-[#6C3FA0] font-medium">
                            Action requise
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        MOSH a sélectionné {proposedCreators.length} profil{proposedCreators.length > 1 ? 's' : ''} pour votre projet. Consultez-les et choisissez votre favori.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {proposedCreators.map(c => (
                            <CreatorCard key={c.id} creator={c} onSelect={handleSelectCreator} />
                        ))}
                    </div>
                    <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="mt-4 py-2 px-4 text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2"
                    >
                        <ThumbsDown className="w-4 h-4" />
                        Aucun profil ne convient
                    </button>
                </motion.div>
            )}

            {/* Script review action */}
            {needsScriptReview && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#6C3FA0]/30 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Pen className="w-5 h-5 text-[#6C3FA0]" />
                        <h3 className="text-lg font-semibold text-gray-900">Script à valider</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[#6C3FA0]/10 text-[#6C3FA0] font-medium">
                            Action requise
                        </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.script_content}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleApproveScript}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ThumbsUp className="w-4 h-4" />
                            Valider le script
                        </button>
                        <button
                            onClick={() => setShowScriptModal(true)}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Proposer des modifications
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Video review action */}
            {needsVideoReview && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#6C3FA0]/30 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="w-5 h-5 text-[#6C3FA0]" />
                        <h3 className="text-lg font-semibold text-gray-900">Vidéo à valider</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[#6C3FA0]/10 text-[#6C3FA0] font-medium">
                            Action requise
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Votre vidéo UGC est prête. Visionnez-la et validez pour finaliser la mission.
                    </p>
                    {revisionCount > 0 && (
                        <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                            Révisions utilisées : {revisionCount}/2
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={handleApproveVideo}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Valider la vidéo
                        </button>
                        {revisionCount < 2 && (
                            <button
                                onClick={() => setShowVideoModal(true)}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Demander une révision ({revisionCount}/2)
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Avancement de votre projet</h2>
                <div className="space-y-0">
                    {TIMELINE_STEPS.map((step, i) => {
                        const completed = isStepCompleted(step.type)
                        const isCurrent = i === currentStep + 1
                        const isPast = i <= currentStep
                        const StepIcon = step.icon
                        const completedStep = steps.find(s => s.step_type === step.type)
                        const isAction = step.actionRequired && isCurrent

                        return (
                            <div key={step.type} className="relative flex gap-4">
                                {/* Timeline line */}
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isPast ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                                )}

                                {/* Step icon */}
                                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-100 text-emerald-600' :
                                    isAction ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300 animate-pulse' :
                                        isCurrent ? 'bg-[#6C3FA0]/10 text-[#6C3FA0] ring-2 ring-[#6C3FA0]/30' :
                                            'bg-gray-50 text-gray-300'
                                    }`}>
                                    {completed ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : isAction ? (
                                        <AlertCircle className="w-5 h-5" />
                                    ) : (
                                        <StepIcon className="w-4 h-4" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="pb-8 flex-1 min-w-0">
                                    <p className={`font-medium ${completed ? 'text-gray-900' :
                                        isAction ? 'text-amber-700' :
                                            isCurrent ? 'text-[#6C3FA0]' :
                                                'text-gray-400'
                                        }`}>
                                        {step.label}
                                        {isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                                                <AlertCircle className="w-3 h-3" />
                                                Action requise
                                            </span>
                                        )}
                                        {isCurrent && !isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[#6C3FA0]/10 text-[#6C3FA0] px-2 py-0.5 rounded-full">
                                                <Clock className="w-3 h-3" />
                                                En cours
                                            </span>
                                        )}
                                    </p>
                                    <p className={`text-sm mt-0.5 ${completed || isCurrent ? 'text-gray-500' : 'text-gray-300'}`}>
                                        {step.description}
                                    </p>
                                    {completedStep?.completed_at && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(completedStep.completed_at).toLocaleDateString('fr-CH', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Brief Details */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
            >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif du brief</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400 mb-1">Produit</p>
                        <p className="text-gray-900">{campaign.product_name || '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Format</p>
                        <p className="text-gray-900">{campaign.format || '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Type de script</p>
                        <p className="text-gray-900">{campaign.script_type || '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Droits d&apos;usage</p>
                        <p className="text-gray-900">{campaign.rights_usage || '—'}</p>
                    </div>
                    {campaign.description && (
                        <div className="col-span-2">
                            <p className="text-gray-400 mb-1">Description</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{campaign.description}</p>
                        </div>
                    )}
                    {campaign.product_description && (
                        <div className="col-span-2">
                            <p className="text-gray-400 mb-1">Description du produit</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{campaign.product_description}</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ========== MODALS ========== */}

            {/* Script feedback modal */}
            <AnimatePresence>
                {showScriptModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowScriptModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Vos retours sur le script</h3>
                                <button onClick={() => setShowScriptModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <textarea
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="Décrivez les modifications que vous souhaitez..."
                                className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C3FA0]/30 focus:border-[#6C3FA0]"
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowScriptModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    Annuler
                                </button>
                                <button onClick={handleScriptFeedback}
                                    disabled={!feedback.trim() || actionLoading}
                                    className="flex-1 py-2.5 bg-[#6C3FA0] text-white rounded-lg text-sm font-medium hover:bg-[#5a3488] disabled:opacity-50 flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Envoyer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video revision modal */}
            <AnimatePresence>
                {showVideoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowVideoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Demander une révision</h3>
                                <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                                Révision {revisionCount + 1}/2 — {revisionCount >= 1 ? 'Dernière révision disponible' : 'Encore 1 révision possible après celle-ci'}
                            </div>
                            <textarea
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                placeholder="Décrivez précisément ce que vous souhaitez modifier..."
                                className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C3FA0]/30 focus:border-[#6C3FA0]"
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowVideoModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    Annuler
                                </button>
                                <button onClick={handleRequestRevision}
                                    disabled={!feedback.trim() || actionLoading}
                                    className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Demander la révision
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile rejection modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowRejectModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Aucun profil ne convient ?</h3>
                                <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                Dites-nous pourquoi et nous vous proposerons de nouveaux profils.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Quel type de profil recherchez-vous ? (optionnel)"
                                className="w-full h-24 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowRejectModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    Annuler
                                </button>
                                <button onClick={handleRejectProfiles}
                                    disabled={actionLoading}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    <ThumbsDown className="w-4 h-4" />
                                    Refuser ces profils
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
