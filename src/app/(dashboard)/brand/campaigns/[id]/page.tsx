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
import { getMissionSteps, completeMissionStep } from '@/lib/services/adminService'
import {
    brandSelectCreator,
    brandRejectProfiles,
    brandApproveScript,
    brandFeedbackScript,
    brandApproveVideo,
    brandRequestRevision,
} from '@/lib/services/adminService'
import { formatCHF } from '@/lib/validations/swiss'
import { getStatusConfig } from '@/lib/constants/statusConfig'
import { isStepCompletedOrPassed } from '@/lib/constants/workflowSteps'
import type { Campaign, MissionStep, MissionStepType, ProfileCreator, CampaignContent, ContentStatus } from '@/types/database'
import { WatermarkedPlayer } from '@/components/video/WatermarkedPlayer'
import { createClient } from '@/lib/supabase/client'
import { getCampaignContents } from '@/lib/services/campaignService'

const CONTENT_STATUS_LABELS: Record<ContentStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'En préparation', color: 'text-gray-600', bg: 'bg-gray-100' },
    script_pending: { label: 'Script en cours', color: 'text-amber-700', bg: 'bg-amber-100' },
    script_approved: { label: 'Script validé', color: 'text-blue-700', bg: 'bg-blue-100' },
    shooting: { label: 'En tournage', color: 'text-purple-700', bg: 'bg-purple-100' },
    uploaded: { label: 'Vidéo livrée', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    qc_approved: { label: 'Contrôle qualité ✓', color: 'text-teal-700', bg: 'bg-teal-100' },
    sent_to_brand: { label: 'À valider', color: 'text-orange-700', bg: 'bg-orange-100' },
    brand_approved: { label: 'Validée ✓', color: 'text-emerald-700', bg: 'bg-emerald-100' },
}

// ================================================
// TIMELINE CONFIGURATION — Visible steps for the brand
// ================================================
const TIMELINE_STEPS: { type: MissionStepType; label: string; description: string; icon: typeof FileText; actionRequired?: boolean }[] = [
    { type: 'brief_received', label: 'Analyse du brief', description: 'Votre brief a été reçu et est en cours d\'analyse.', icon: FileText },
    { type: 'creators_proposed', label: 'Proposition de profils', description: 'MOSH a sélectionné des créateurs pour vous. Validez-les pour lancer la production !', icon: Users, actionRequired: true },
    { type: 'script_sent', label: 'Rédaction du script', description: 'Le script de votre vidéo est prêt.', icon: FileText },
    { type: 'script_brand_review', label: 'Validation du script', description: 'Relisez le script et validez pour lancer la production.', icon: Pen, actionRequired: true },
    { type: 'mission_sent_to_creator', label: 'Envoi de la mission', description: 'Le créateur a reçu la mission et le script validé.', icon: Send },
    { type: 'creator_accepted', label: 'Acceptation mission', description: 'Le créateur a accepté et prépare le tournage.', icon: CheckCircle2 },
    { type: 'creator_shooting', label: 'Tournage', description: 'Le créateur produit votre vidéo.', icon: Video },
    { type: 'video_uploaded_by_creator', label: 'Livraison de la vidéo', description: 'Le créateur a soumis la vidéo pour vérification.', icon: Video },
    { type: 'video_validated', label: 'Contrôle qualité', description: 'MOSH a vérifié la qualité de la vidéo.', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Envoi à la marque', description: 'Votre vidéo est prête pour votre validation finale.', icon: Package },
    { type: 'brand_final_review', label: 'Validation finale', description: 'Validez la vidéo ou demandez une révision (max 2).', icon: Star, actionRequired: true },
    { type: 'brand_final_approved', label: 'Mission terminée ✅', description: 'Votre vidéo UGC est finalisée. Téléchargez-la !', icon: CheckCircle2 },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Brief envoyé', color: getStatusConfig('draft').color, bg: getStatusConfig('draft').bg },
    open: { label: 'Créateur en sélection', color: getStatusConfig('open').color, bg: getStatusConfig('open').bg },
    in_progress: { label: 'En production', color: getStatusConfig('in_progress').color, bg: getStatusConfig('in_progress').bg },
    completed: { label: 'Terminée', color: getStatusConfig('completed').color, bg: getStatusConfig('completed').bg },
    cancelled: { label: 'Annulé', color: getStatusConfig('cancelled').color, bg: getStatusConfig('cancelled').bg },
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
            className="border border-gray-200 rounded-xl p-4 hover:border-[#18181B]/40 hover:shadow-md transition-all"
        >
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#18181B]/20 to-[#18181B]/5 flex items-center justify-center text-[#18181B] font-bold text-lg shrink-0">
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
                            className="text-xs text-[#18181B] hover:underline mt-2 inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Voir le portfolio
                        </a>
                    )}
                </div>
            </div>
            <button
                onClick={() => onSelect(creator.id)}
                className="w-full mt-3 py-2 px-4 bg-[#18181B] text-white rounded-lg text-sm font-medium hover:bg-[#27272A] transition-colors flex items-center justify-center gap-2"
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
    const [downloadLoading, setDownloadLoading] = useState(false)
    const [confirmCreatorId, setConfirmCreatorId] = useState<string | null>(null)
    const [campaignContents, setCampaignContents] = useState<CampaignContent[]>([])
    const [profileCreator, setProfileCreator] = useState<any | null>(null)

    const loadData = useCallback(async () => {
        const [campaignData, missionSteps, contents] = await Promise.all([
            getCampaignById(campaignId),
            getMissionSteps(campaignId),
            getCampaignContents(campaignId),
        ])
        setCampaign(campaignData)
        setSteps(missionSteps)
        setCampaignContents(contents)
        setIsLoading(false)

        // Load proposed creators + assigned content creators
        const supabase = createClient()
        const allCreatorIds: string[] = []
        if (campaignData?.proposed_creator_ids?.length) {
            allCreatorIds.push(...campaignData.proposed_creator_ids)
        }
        // Also load creators assigned to individual contents
        for (const c of contents) {
            if (c.assigned_creator_id && !allCreatorIds.includes(c.assigned_creator_id)) {
                allCreatorIds.push(c.assigned_creator_id)
            }
        }
        if (allCreatorIds.length > 0) {
            const { data } = await supabase
                .from('users')
                .select('*, profiles_creator(*)')
                .in('id', allCreatorIds)
            if (data) setProposedCreators(data)
        }

        // Auto-recovery: if all assigned contents are brand_approved but creator_validated step missing, complete it
        const assignedContents = contents.filter(c => c.assigned_creator_id)
        const allApproved = assignedContents.length > 0 && assignedContents.every(c => c.creator_status === 'brand_approved')
        const hasCreatorValidated = missionSteps.some(s => s.step_type === 'creator_validated')
        if (allApproved && !hasCreatorValidated) {
            await completeMissionStep(campaignId, 'creator_validated')
            const updatedSteps = await getMissionSteps(campaignId)
            setSteps(updatedSteps)
        }
    }, [campaignId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const isStepCompleted = (stepType: MissionStepType) => {
        const completedTypes = steps.map(s => s.step_type)
        return isStepCompletedOrPassed(stepType, completedTypes)
    }

    const isStepInProgress = (stepType: MissionStepType) => {
        // creators_proposed is "in progress" when proposed but not yet validated
        if (stepType === 'creators_proposed') {
            return steps.some(s => s.step_type === 'creators_proposed') && !steps.some(s => s.step_type === 'creator_validated')
        }
        return false
    }

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
        if (result.success) {
            setConfirmCreatorId(null)
            await loadData()
        }
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

    const handleDownloadVideo = async () => {
        if (!campaign?.video_url) return
        setDownloadLoading(true)
        try {
            // Fetch original binary — zero re-encoding, zero quality loss
            const response = await fetch(campaign.video_url)
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            // Derive filename from campaign title
            const safeName = (campaign.title || 'video-ugc').replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').replace(/\s+/g, '-')
            const ext = campaign.video_url.split('.').pop()?.split('?')[0] || 'mp4'
            link.download = `${safeName}.${ext}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Cleanup blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
        } catch (err) {
            console.error('Download failed:', err)
            // Fallback: open in new tab
            window.open(campaign.video_url, '_blank')
        } finally {
            setDownloadLoading(false)
        }
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
                <Link href="/brand/campaigns" className="hover:text-[#18181B] transition-colors flex items-center gap-1">
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
                    <Link href="/brand/messages" className="ml-auto text-sm text-[#71717A] hover:text-[#18181B] transition-colors flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        Contacter MOSH
                    </Link>
                </div>
            </div>

            {/* Content blocks overview */}
            {campaignContents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Video className="w-4 h-4 text-gray-500" />
                            Vos contenus ({campaignContents.filter(c => c.status === 'brand_approved').length}/{campaignContents.length})
                        </h2>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#18181B] rounded-full transition-all"
                                style={{ width: `${(campaignContents.filter(c => c.status === 'brand_approved').length / campaignContents.length) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {campaignContents.map((content, idx) => {
                            const statusCfg = CONTENT_STATUS_LABELS[content.status as ContentStatus] || CONTENT_STATUS_LABELS.draft
                            return (
                                <div key={content.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-sm">{content.content_type === 'video' ? '📹' : '📷'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">Contenu {idx + 1} — {content.script_type}</p>
                                        <p className="text-xs text-gray-500">{content.format}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                                        {statusCfg.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* ========== PER-CONTENT CREATOR VALIDATION ========== */}
            {campaignContents.some(c => c.assigned_creator_id) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#18181B]/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-[#18181B]" />
                        <h2 className="text-lg font-semibold text-gray-900">Validation des créateurs</h2>
                        {campaignContents.some(c => c.creator_status === 'proposed') && (
                            <span className="ml-auto px-2.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                                Action requise
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Validez le créateur proposé pour chaque contenu afin de lancer la rédaction des scripts.
                    </p>
                    <div className="space-y-3">
                        {campaignContents.map((content, idx) => {
                            const creator = content.assigned_creator_id
                                ? proposedCreators.find((cr: any) => cr.id === content.assigned_creator_id)
                                : null
                            const isPending = content.creator_status === 'proposed'
                            const isApproved = content.creator_status === 'brand_approved'
                            const profile = (creator as any)?.profiles_creator

                            return (
                                <div key={content.id} className={`rounded-xl border p-4 ${isPending ? 'border-amber-300 bg-amber-50/50' : isApproved ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-gray-50'}`}>
                                    {/* Content header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-sm">{content.content_type === 'video' ? '📹' : '📷'}</span>
                                        <span className="text-sm font-medium text-gray-900">Contenu {idx + 1} — {content.script_type}</span>
                                        <span className="text-xs text-gray-400">{content.format}</span>
                                    </div>

                                    {/* Creator assigned */}
                                    {creator ? (
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                {(creator as any)?.full_name?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900">{(creator as any)?.full_name || 'Créateur'}</p>
                                                {profile?.bio && (
                                                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{profile.bio}</p>
                                                )}
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {profile?.specialties?.slice(0, 3).map((s: string) => (
                                                        <span key={s} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500">{s}</span>
                                                    ))}
                                                    {profile?.location_canton && (
                                                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500">{profile.location_canton}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                {/* View profile button */}
                                                <button
                                                    onClick={() => setProfileCreator(creator)}
                                                    className="px-3 py-1.5 text-xs font-medium text-[#18181B] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Voir le profil
                                                </button>
                                                {/* Validate / Status */}
                                                {isPending ? (
                                                    <button
                                                        onClick={async () => {
                                                            setActionLoading(true)
                                                            const supabase = createClient()
                                                            await (supabase.from('campaign_contents') as any)
                                                                .update({ creator_status: 'brand_approved' })
                                                                .eq('id', content.id)
                                                            const updatedContents = campaignContents.map(c =>
                                                                c.id === content.id ? { ...c, creator_status: 'brand_approved' as const } : c
                                                            )
                                                            setCampaignContents(updatedContents)
                                                            // If all assigned creators are now validated, complete the mission step
                                                            const allValidated = updatedContents
                                                                .filter(c => c.assigned_creator_id)
                                                                .every(c => c.creator_status === 'brand_approved')
                                                            if (allValidated) {
                                                                await completeMissionStep(campaignId, 'creator_validated')
                                                                // Reload steps to update timeline
                                                                const newSteps = await getMissionSteps(campaignId)
                                                                setSteps(newSteps)
                                                            }
                                                            setActionLoading(false)
                                                        }}
                                                        disabled={actionLoading}
                                                        className="px-4 py-2 bg-[#18181B] text-white rounded-lg text-sm font-medium hover:bg-[#27272A] transition-colors flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        <ThumbsUp className="w-4 h-4" />
                                                        Valider
                                                    </button>
                                                ) : isApproved ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Validé ✓
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Aucun créateur assigné pour le moment</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* ========== ACTION REQUIRED BANNERS ========== */}

            {/* Per-content creator validation action */}

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
                    className="bg-white border-2 border-[#18181B]/30 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-[#18181B]" />
                        <h3 className="text-lg font-semibold text-gray-900">Choisissez votre créateur</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[#18181B]/10 text-[#18181B] font-medium">
                            Action requise
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        MOSH a sélectionné {proposedCreators.length} profil{proposedCreators.length > 1 ? 's' : ''} pour votre projet. Consultez-les et choisissez votre favori.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {proposedCreators.map(c => (
                            <CreatorCard key={c.id} creator={c} onSelect={(id) => setConfirmCreatorId(id)} />
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
                    className="bg-white border-2 border-[#18181B]/30 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Pen className="w-5 h-5 text-[#18181B]" />
                        <h3 className="text-lg font-semibold text-gray-900">Script à valider</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[#18181B]/10 text-[#18181B] font-medium">
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

            {/* ========== PER-CONTENT SCRIPT REVIEW ========== */}
            {campaignContents.some(c => c.status === 'script_pending' && c.script_content) && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#18181B]/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Pen className="w-5 h-5 text-[#18181B]" />
                        <h2 className="text-lg font-semibold text-gray-900">Scripts à valider</h2>
                        <span className="ml-auto px-2.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                            Action requise
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Relisez les scripts proposés par MOSH et validez-les pour lancer la production.</p>
                    <div className="space-y-4">
                        {campaignContents.filter(c => c.status === 'script_pending' && c.script_content).map((content, idx) => (
                            <div key={content.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm">📹</span>
                                    <p className="text-sm font-semibold text-gray-900">
                                        Contenu {campaignContents.findIndex(c => c.id === content.id) + 1} — {content.script_type}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-4 mb-4 max-h-48 overflow-y-auto border border-gray-100">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{content.script_content}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={async () => {
                                            setActionLoading(true)
                                            const supabase = createClient()
                                            await (supabase.from('campaign_contents') as any)
                                                .update({ status: 'script_approved' })
                                                .eq('id', content.id)
                                            const updatedContents = campaignContents.map(c =>
                                                c.id === content.id ? { ...c, status: 'script_approved' as const } : c
                                            )
                                            setCampaignContents(updatedContents)
                                            // If all scripts approved, complete mission step
                                            const allApproved = updatedContents
                                                .filter(c => c.script_content)
                                                .every(c => c.status === 'script_approved' || c.status === 'shooting' || c.status === 'uploaded' || c.status === 'qc_approved' || c.status === 'sent_to_brand' || c.status === 'brand_approved')
                                            if (allApproved) {
                                                await completeMissionStep(campaignId, 'script_brand_approved')
                                                const newSteps = await getMissionSteps(campaignId)
                                                setSteps(newSteps)
                                            }
                                            setActionLoading(false)
                                        }}
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
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Video review action */}
            {needsVideoReview && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#18181B]/30 rounded-xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="w-5 h-5 text-[#18181B]" />
                        <h3 className="text-lg font-semibold text-gray-900">Vidéo à valider</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-[#18181B]/10 text-[#18181B] font-medium">
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
                        const inProgress = isStepInProgress(step.type)
                        const isCurrent = i === currentStep + 1
                        const isPast = i <= currentStep
                        const StepIcon = step.icon
                        const completedStep = steps.find(s => s.step_type === step.type)
                        const isAction = (step.actionRequired && isCurrent) || inProgress

                        return (
                            <div key={step.type} className="relative flex gap-4">
                                {/* Timeline line */}
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isPast ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                                )}

                                {/* Step icon */}
                                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-100 text-emerald-600' :
                                    isAction ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300 animate-pulse' :
                                        isCurrent ? 'bg-[#18181B]/10 text-[#18181B] ring-2 ring-[#18181B]/30' :
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
                                            isCurrent ? 'text-[#18181B]' :
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
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[#18181B]/10 text-[#18181B] px-2 py-0.5 rounded-full">
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

            {/* ========== VIDEO REVIEW ========== */}
            {isStepCompleted('video_sent_to_brand') && campaign.video_url && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#18181B]" />
                        Vidéo UGC
                        {isStepCompleted('brand_final_approved') && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Approuvée ✓</span>
                        )}
                    </h2>

                    {/* B5: Watermarked player for pre-approval, raw player after approval */}
                    {isStepCompleted('brand_final_approved') ? (
                        <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[450px] mb-4" />
                    ) : (
                        <div className="mb-4 flex justify-center">
                            <WatermarkedPlayer
                                videoUrl={campaign.video_url}
                                isWatermarked={true}
                            />
                        </div>
                    )}

                    {/* Actions — only if not yet approved */}
                    {!isStepCompleted('brand_final_approved') && (
                        <div className="space-y-3">
                            {campaign.brand_revision_count > 0 && (
                                <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                    Révisions utilisées : {campaign.brand_revision_count}/2
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleApproveVideo}
                                    disabled={actionLoading}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approuver la vidéo
                                </button>
                                {(campaign.brand_revision_count || 0) < 2 && (
                                    <button
                                        onClick={() => setShowVideoModal(true)}
                                        className="flex-1 py-2.5 bg-amber-100 text-amber-800 rounded-xl text-sm font-medium hover:bg-amber-200 flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Demander une révision
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Approved — download section */}
                    {isStepCompleted('brand_final_approved') && (
                        <div className="space-y-3 mt-2">
                            <div className="text-center bg-emerald-50 rounded-xl p-4">
                                <p className="text-emerald-700 font-medium">🎉 Vidéo approuvée — Mission terminée !</p>
                                <p className="text-emerald-600 text-sm mt-1">Merci pour votre confiance. Votre contenu UGC est prêt à être téléchargé.</p>
                            </div>
                            <button
                                onClick={handleDownloadVideo}
                                disabled={downloadLoading}
                                className="w-full py-3 px-4 bg-[#18181B] text-white rounded-xl text-sm font-semibold hover:bg-[#27272A] transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60"
                            >
                                {downloadLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Téléchargement en cours…
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Télécharger la vidéo (qualité originale)
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-gray-400">
                                Fichier original sans compression — qualité identique à la source
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

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
                                className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#18181B]/30 focus:border-[#18181B]"
                            />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowScriptModal(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    Annuler
                                </button>
                                <button onClick={handleScriptFeedback}
                                    disabled={!feedback.trim() || actionLoading}
                                    className="flex-1 py-2.5 bg-[#18181B] text-white rounded-lg text-sm font-medium hover:bg-[#27272A] disabled:opacity-50 flex items-center justify-center gap-2">
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
                                className="w-full h-32 border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#18181B]/30 focus:border-[#18181B]"
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

            {/* Creator selection confirmation modal */}
            <AnimatePresence>
                {confirmCreatorId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setConfirmCreatorId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-[#18181B]/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-7 h-7 text-[#18181B]" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Confirmer la sélection</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    Êtes-vous sûr de vouloir sélectionner ce créateur ?<br />
                                    <span className="text-amber-600 font-medium">Ce choix est définitif.</span>
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmCreatorId(null)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleSelectCreator(confirmCreatorId)}
                                    disabled={actionLoading}
                                    className="flex-1 py-2.5 bg-[#18181B] text-white rounded-lg text-sm font-medium hover:bg-[#27272A] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                >
                                    {actionLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Confirmer
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Creator Profile Modal */}
            <AnimatePresence>
                {profileCreator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setProfileCreator(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-[#18181B]/10 flex items-center justify-center text-[#18181B] font-bold text-xl">
                                        {profileCreator.full_name?.[0] || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{profileCreator.full_name}</h3>
                                        {profileCreator.profiles_creator?.location_canton && (
                                            <p className="text-sm text-gray-500">{profileCreator.profiles_creator.location_canton}, Suisse</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Body */}
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {profileCreator.profiles_creator?.bio && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bio</h4>
                                        <p className="text-sm text-gray-700">{profileCreator.profiles_creator.bio}</p>
                                    </div>
                                )}
                                {profileCreator.profiles_creator?.specialties?.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Spécialités</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {profileCreator.profiles_creator.specialties.map((s: string) => (
                                                <span key={s} className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profileCreator.profiles_creator?.instagram_url && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Instagram</h4>
                                        <a href={profileCreator.profiles_creator.instagram_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            {profileCreator.profiles_creator.instagram_url}
                                        </a>
                                    </div>
                                )}
                                {profileCreator.profiles_creator?.tiktok_url && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">TikTok</h4>
                                        <a href={profileCreator.profiles_creator.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            {profileCreator.profiles_creator.tiktok_url}
                                        </a>
                                    </div>
                                )}
                                {profileCreator.profiles_creator?.portfolio_url && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Portfolio</h4>
                                        <a href={profileCreator.profiles_creator.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            {profileCreator.profiles_creator.portfolio_url}
                                        </a>
                                    </div>
                                )}
                                {profileCreator.profiles_creator?.experience_level && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Expérience</h4>
                                        <p className="text-sm text-gray-700 capitalize">{profileCreator.profiles_creator.experience_level}</p>
                                    </div>
                                )}
                            </div>
                            {/* Footer */}
                            <div className="p-6 border-t border-gray-100">
                                <button
                                    onClick={() => setProfileCreator(null)}
                                    className="w-full py-2.5 bg-[#18181B] text-white rounded-lg text-sm font-medium hover:bg-[#27272A] transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
