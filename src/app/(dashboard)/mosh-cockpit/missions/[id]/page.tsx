'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    FileText,
    Users,
    CheckCircle2,
    Send,
    Video,
    Shield,
    Clock,
    User,
    Building2,
    Pencil,
    ChevronRight,
    ChevronDown,
    ScrollText,
    Receipt,
    Download,
    Loader2,
    Banknote,
    RotateCcw,
    Sparkles,
    Camera,
    Image,
} from 'lucide-react'
import { createMoshContract, getMoshContractText } from '@/lib/services/contractService'
import { generateInvoice, getInvoiceText } from '@/lib/services/invoiceService'
import {
    getAllCampaigns,
    getAllCreators,
    getMissionSteps,
    proposeCreatorsForCampaign,
    assignCreatorToCampaign,
    updateCampaignScript,
    completeMissionStep,
    validateBrief,
    requestBriefFeedback,
    sendScriptToBrand,
    sendMissionToCreator,
    type CampaignWithDetails,
    type CreatorWithProfile,
} from '@/lib/services/adminService'
import type { MissionStep, MissionStepType, CampaignContent, ContentStatus } from '@/types/database'
import { WORKFLOW_STEPS as CENTRAL_STEPS, isStepCompletedOrPassed } from '@/lib/constants/workflowSteps'
import { createClient } from '@/lib/supabase/client'
import { getCampaignContents, updateContentField } from '@/lib/services/campaignService'

const CONTENT_STATUS_LABELS: Record<ContentStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-100' },
    script_pending: { label: 'Script en attente', color: 'text-amber-700', bg: 'bg-amber-100' },
    script_approved: { label: 'Script validé', color: 'text-blue-700', bg: 'bg-blue-100' },
    shooting: { label: 'En tournage', color: 'text-purple-700', bg: 'bg-purple-100' },
    uploaded: { label: 'Vidéo livrée', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    qc_approved: { label: 'QC validé', color: 'text-teal-700', bg: 'bg-teal-100' },
    sent_to_brand: { label: 'Envoyée à la marque', color: 'text-orange-700', bg: 'bg-orange-100' },
    brand_approved: { label: 'Validée ✓', color: 'text-emerald-700', bg: 'bg-emerald-100' },
}

const WORKFLOW_STEPS = CENTRAL_STEPS.map(s => ({
    type: s.type as MissionStepType,
    label: s.label,
    icon: s.icon,
}))

export default function AdminMissionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const campaignId = params.id as string

    const [campaign, setCampaign] = useState<CampaignWithDetails | null>(null)
    const [creators, setCreators] = useState<CreatorWithProfile[]>([])
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCreators, setSelectedCreators] = useState<string[]>([])
    const [scriptDraft, setScriptDraft] = useState('')
    const [showCreatorSelector, setShowCreatorSelector] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)
    // Contract & Invoice
    const [creatorAmount, setCreatorAmount] = useState('')
    const [showContractForm, setShowContractForm] = useState(false)
    const [contractText, setContractText] = useState<string | null>(null)
    const [showContractPreview, setShowContractPreview] = useState(false)
    const [invoiceText, setInvoiceText] = useState<string | null>(null)
    const [showInvoicePreview, setShowInvoicePreview] = useState(false)
    // Brief feedback
    const [briefFeedbackNotes, setBriefFeedbackNotes] = useState('')
    const [showBriefFeedback, setShowBriefFeedback] = useState(false)
    // QC
    const [showQcFeedback, setShowQcFeedback] = useState(false)
    const [qcFeedback, setQcFeedback] = useState('')
    // AI
    const [aiLoading, setAiLoading] = useState<'brief' | 'script' | null>(null)
    const [aiBriefReview, setAiBriefReview] = useState<string | null>(null)
    // A8: Admin internal notes
    const [adminNotes, setAdminNotes] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)
    // Content blocks
    const [campaignContents, setCampaignContents] = useState<CampaignContent[]>([])
    const [expandedContent, setExpandedContent] = useState<string | null>(null)
    const [contentScriptDrafts, setContentScriptDrafts] = useState<Record<string, string>>({})

    const handleAIBriefReview = async () => {
        if (!campaign || aiLoading) return
        setAiLoading('brief')
        setAiBriefReview(null)
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'review_brief',
                    briefData: {
                        title: campaign.title,
                        product_name: campaign.product_name,
                        product_description: campaign.product_description,
                        description: campaign.description,
                        format: campaign.format,
                        script_type: campaign.script_type,
                        script_notes: campaign.script_notes,
                        rights_usage: campaign.rights_usage,
                        budget_chf: campaign.budget_chf,
                    },
                }),
            })
            const data = await res.json()
            if (data.error) {
                setActionError(data.error)
            } else {
                setAiBriefReview(data.result)
            }
        } catch {
            setActionError('Erreur de connexion au service IA')
        }
        setAiLoading(null)
    }

    const handleAIScriptGenerate = async () => {
        if (!campaign || aiLoading) return
        setAiLoading('script')
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_script',
                    briefData: {
                        title: campaign.title,
                        product_name: campaign.product_name,
                        product_description: campaign.product_description,
                        description: campaign.description,
                        format: campaign.format,
                        script_type: campaign.script_type,
                        script_notes: campaign.script_notes,
                        rights_usage: campaign.rights_usage,
                        script_brand_feedback: campaign.script_brand_feedback,
                    },
                }),
            })
            const data = await res.json()
            if (data.error) {
                setActionError(data.error)
            } else {
                setScriptDraft(data.result)
            }
        } catch {
            setActionError('Erreur de connexion au service IA')
        }
        setAiLoading(null)
    }

    const loadData = useCallback(async () => {
        const [campaigns, allCreators, missionSteps] = await Promise.all([
            getAllCampaigns(),
            getAllCreators(),
            getMissionSteps(campaignId),
        ])
        const found = campaigns.find(c => c.id === campaignId) || null
        setCampaign(found)
        setCreators(allCreators)
        setSteps(missionSteps)
        if (found?.script_content) setScriptDraft(found.script_content)
        if (found?.admin_notes) setAdminNotes(found.admin_notes)
        // Load content blocks
        const contents = await getCampaignContents(campaignId)
        setCampaignContents(contents)
        const drafts: Record<string, string> = {}
        contents.forEach(c => { if (c.script_content) drafts[c.id] = c.script_content })
        setContentScriptDrafts(prev => ({ ...prev, ...drafts }))
        setIsLoading(false)
    }, [campaignId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const isStepCompleted = (stepType: MissionStepType) => {
        const completedTypes = steps.map(s => s.step_type)
        return isStepCompletedOrPassed(stepType, completedTypes)
    }

    const getCurrentStepIndex = () => {
        let lastCompleted = -1
        WORKFLOW_STEPS.forEach((ws, i) => {
            if (isStepCompleted(ws.type)) lastCompleted = i
        })
        return lastCompleted
    }

    // A8: Save admin notes
    const handleSaveAdminNotes = async () => {
        setSavingNotes(true)
        const supabase = createClient()
        await (supabase as any).from('campaigns')
            .update({ admin_notes: adminNotes || null })
            .eq('id', campaignId)
        setSavingNotes(false)
    }

    const handleValidateBrief = async () => {
        setActionLoading(true)
        setActionError(null)
        const result = await validateBrief(campaignId)
        if (!result.success) {
            setActionError(result.error || 'Erreur lors de la validation du brief')
        } else {
            setActionSuccess('Brief validé avec succès !')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleBriefFeedback = async () => {
        if (!briefFeedbackNotes.trim()) return
        setActionLoading(true)
        setActionError(null)
        const result = await requestBriefFeedback(campaignId, briefFeedbackNotes)
        if (!result.success) {
            setActionError(result.error || 'Erreur')
        } else {
            setActionSuccess('Retour envoyé à la marque !')
            setTimeout(() => setActionSuccess(null), 3000)
            setShowBriefFeedback(false)
            setBriefFeedbackNotes('')
        }
        await loadData()
        setActionLoading(false)
    }

    const handleSendScriptToBrand = async () => {
        setActionLoading(true)
        setActionError(null)
        const result = await sendScriptToBrand(campaignId)
        if (!result.success) {
            setActionError(result.error || 'Erreur')
        } else {
            setActionSuccess('Script envoyé à la marque pour validation !')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleSendToCreator = async () => {
        const amount = parseFloat(creatorAmount)
        if (!amount || amount <= 0) return
        setActionLoading(true)
        setActionError(null)
        const result = await sendMissionToCreator(campaignId, amount)
        if (!result.success) {
            setActionError(result.error || 'Erreur')
        } else {
            setActionSuccess('Contrat généré et mission envoyée au créateur !')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleProposeCreators = async () => {
        if (selectedCreators.length === 0) return
        setActionLoading(true)
        setActionError(null)
        const result = await proposeCreatorsForCampaign(campaignId, selectedCreators)
        if (!result.success) {
            setActionError(result.error || 'Erreur lors de la proposition des créateurs')
        } else {
            setActionSuccess('Créateurs proposés avec succès !')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        setShowCreatorSelector(false)
        setSelectedCreators([])
        await loadData()
        setActionLoading(false)
    }

    const handleAssignCreator = async (creatorId: string) => {
        setActionLoading(true)
        setActionError(null)
        const result = await assignCreatorToCampaign(campaignId, creatorId)
        if (!result.success) {
            setActionError(result.error || 'Erreur lors de l\'assignation du créateur')
        } else {
            setActionSuccess('Créateur assigné avec succès !')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleSaveScript = async (status: 'draft' | 'validated') => {
        setActionLoading(true)
        setActionError(null)
        const result = await updateCampaignScript(campaignId, scriptDraft, status)
        if (!result.success) {
            setActionError(result.error || 'Erreur lors de la mise à jour du script')
        } else {
            setActionSuccess(status === 'validated' ? 'Script validé !' : 'Brouillon sauvegardé')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleCompleteStep = async (stepType: MissionStepType) => {
        setActionLoading(true)
        setActionError(null)
        const result = await completeMissionStep(campaignId, stepType)
        if (!result.success) {
            setActionError(result.error || `Erreur lors de la complétion de l'étape`)
        } else {
            setActionSuccess('Étape complétée !')
            setTimeout(() => setActionSuccess(null), 3000)
        }
        if (stepType === 'video_sent_to_brand') {
            await completeMissionStep(campaignId, 'brand_final_review')
            await generateInvoice(campaignId)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleGenerateContract = async () => {
        const amount = parseFloat(creatorAmount)
        if (!amount || amount <= 0) return
        setActionLoading(true)
        setActionError(null)
        const result = await createMoshContract(campaignId, amount)
        if (result.success) {
            setActionSuccess('Contrat généré avec succès !')
            setTimeout(() => setActionSuccess(null), 3000)
            setShowContractForm(false)
            await loadData()
        } else {
            setActionError('Erreur lors de la génération du contrat')
        }
        setActionLoading(false)
    }

    const handleViewContract = async () => {
        const text = await getMoshContractText(campaignId)
        setContractText(text)
        setShowContractPreview(true)
    }

    const handleGenerateInvoice = async () => {
        setActionLoading(true)
        setActionError(null)
        try {
            await generateInvoice(campaignId)
            setActionSuccess('Facture générée avec succès !')
            setTimeout(() => setActionSuccess(null), 3000)
        } catch {
            setActionError('Erreur lors de la génération de la facture')
        }
        await loadData()
        setActionLoading(false)
    }

    const handleViewInvoice = async () => {
        const text = await getInvoiceText(campaignId)
        setInvoiceText(text)
        setShowInvoicePreview(true)
    }

    const handleQcRevision = async () => {
        setActionLoading(true)
        setActionError(null)
        const supabase = (await import('@/lib/supabase/client')).createClient()
        // Save QC feedback to campaign
        await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
            .update({ mosh_qc_feedback: qcFeedback })
            .eq('id', campaignId)
        // Delete the video_uploaded_by_creator step so the creator can re-upload
        await (supabase.from('mission_steps') as ReturnType<typeof supabase.from>)
            .delete()
            .eq('campaign_id', campaignId)
            .eq('step_type', 'video_uploaded_by_creator')
        setActionSuccess('Feedback envoyé au créateur')
        setTimeout(() => setActionSuccess(null), 3000)
        setShowQcFeedback(false)
        setQcFeedback('')
        await loadData()
        setActionLoading(false)
    }

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="h-4 bg-[#F4F3EF] rounded w-40 animate-pulse" />
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-8 animate-pulse space-y-4">
                    <div className="h-6 bg-[#F4F3EF] rounded w-1/3" />
                    <div className="h-4 bg-[#F4F3EF] rounded w-2/3" />
                </div>
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="max-w-5xl mx-auto py-12 text-center">
                <p className="text-[#71717A] font-medium">Mission introuvable</p>
                <Link href="/mosh-cockpit/missions" className="text-sm text-[#A1A1AA] hover:text-[#18181B] mt-2 inline-block">← Retour aux missions</Link>
            </div>
        )
    }

    const currentStep = getCurrentStepIndex()

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Error/Success Toast */}
            {actionError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm"
                >
                    <span className="text-sm font-medium">{actionError}</span>
                    <button onClick={() => setActionError(null)} className="text-white/80 hover:text-white">✕</button>
                </motion.div>
            )}
            {actionSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 right-4 z-50 bg-[#C4F042] text-[#18181B] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{actionSuccess}</span>
                </motion.div>
            )}
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <Link href="/mosh-cockpit/missions" className="hover:text-[#18181B] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Missions
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#18181B]">{campaign.title}</span>
            </div>

            {/* Title & Meta */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">{campaign.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-[#A1A1AA]">
                    <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" strokeWidth={1.5} />
                        {campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" strokeWidth={1.5} />
                        {campaign.selected_creator?.full_name || 'Non assigné'}
                    </span>
                    {campaign.deadline && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" strokeWidth={1.5} />
                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                        </span>
                    )}
                    <span>CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                </div>
            </motion.div>

            {/* Workflow Progress */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                <h2 className="text-sm font-semibold text-[#18181B] mb-4">Progression du workflow</h2>
                <div className="flex items-start gap-1">
                    {WORKFLOW_STEPS.map((step, i) => {
                        const completed = isStepCompleted(step.type)
                        const isCurrent = i === currentStep + 1
                        const StepIcon = step.icon

                        return (
                            <div key={step.type} className="flex items-center flex-1">
                                <div className="flex flex-col items-center w-full">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${completed ? 'bg-[#C4F042] text-[#18181B]' :
                                        isCurrent ? 'bg-[#18181B] text-white ring-2 ring-[#C4F042]/40' :
                                            'bg-[#F4F3EF] text-[#D4D4D8]'
                                        }`}>
                                        <StepIcon className="w-4 h-4" strokeWidth={1.5} />
                                    </div>
                                    <p className={`text-[10px] text-center leading-tight ${completed ? 'text-[#18181B] font-medium' :
                                        isCurrent ? 'text-[#18181B]' :
                                            'text-[#D4D4D8]'
                                        }`}>
                                        {step.label}
                                    </p>
                                </div>
                                {i < WORKFLOW_STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-1 mt-5 ${completed ? 'bg-[#C4F042]' : 'bg-[#F4F3EF]'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Brief Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    Brief de la marque
                    <div className="flex-1" />
                    <button
                        onClick={handleAIBriefReview}
                        disabled={aiLoading === 'brief'}
                        className="px-3 py-1.5 bg-[#18181B] text-white text-xs font-medium rounded-lg hover:bg-[#18181B]/80 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                        {aiLoading === 'brief' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Relecture IA
                    </button>
                </h2>
                {aiBriefReview && (
                    <div className="mb-4 p-4 bg-[#F4F3EF] border border-black/[0.06] rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#18181B]" />
                            <p className="text-xs font-semibold text-[#18181B]">Analyse IA du brief</p>
                            <div className="flex-1" />
                            <button onClick={() => setAiBriefReview(null)} className="text-[#A1A1AA] hover:text-[#18181B] text-xs">
                                Fermer
                            </button>
                        </div>
                        <div className="text-sm text-[#18181B] whitespace-pre-wrap leading-relaxed">{aiBriefReview}</div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[#A1A1AA] mb-1">Produit</p>
                        <p className="text-[#18181B]">{campaign.product_name}</p>
                    </div>
                    <div>
                        <p className="text-[#A1A1AA] mb-1">Format</p>
                        <p className="text-[#18181B]">{campaign.format}</p>
                    </div>
                    <div>
                        <p className="text-[#A1A1AA] mb-1">Type de script</p>
                        <p className="text-[#18181B]">{campaign.script_type}</p>
                    </div>
                    <div>
                        <p className="text-[#A1A1AA] mb-1">Droits d&apos;usage</p>
                        <p className="text-[#18181B]">{campaign.rights_usage}</p>
                    </div>
                    {campaign.description && (
                        <div className="col-span-2">
                            <p className="text-[#A1A1AA] mb-1">Description</p>
                            <p className="text-[#18181B] whitespace-pre-wrap">{campaign.description}</p>
                        </div>
                    )}
                    {campaign.product_description && (
                        <div className="col-span-2">
                            <p className="text-[#A1A1AA] mb-1">Description du produit</p>
                            <p className="text-[#18181B] whitespace-pre-wrap">{campaign.product_description}</p>
                        </div>
                    )}
                </div>
                {!isStepCompleted('brief_received') && (
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleValidateBrief}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Valider le brief
                        </button>
                        <button
                            onClick={() => setShowBriefFeedback(!showBriefFeedback)}
                            className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors flex items-center gap-2"
                        >
                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                            Demander des précisions
                        </button>
                    </div>
                )}
                {showBriefFeedback && (
                    <div className="mt-4 space-y-3">
                        <textarea
                            value={briefFeedbackNotes}
                            onChange={(e) => setBriefFeedbackNotes(e.target.value)}
                            placeholder="Quelles précisions manquent dans le brief ?"
                            rows={3}
                            className="w-full bg-[#F4F3EF]/50 border border-black/[0.04] rounded-xl p-4 text-[#18181B] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C4F042]/50 focus:ring-2 focus:ring-[#C4F042]/20 resize-y"
                        />
                        <button
                            onClick={handleBriefFeedback}
                            disabled={actionLoading || !briefFeedbackNotes.trim()}
                            className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" strokeWidth={1.5} />
                            Envoyer les retours à la marque
                        </button>
                    </div>
                )}
                {campaign.brief_feedback_notes && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                        <p className="text-amber-800 font-medium text-xs mb-1">Précisions demandées :</p>
                        <p className="text-amber-700 whitespace-pre-wrap">{campaign.brief_feedback_notes}</p>
                    </div>
                )}
            </motion.div>

            {/* Creators Section — only for single-content campaigns */}
            {campaignContents.length <= 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                    <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        Sélection des créateurs
                    </h2>

                    {campaign.selected_creator ? (
                        <div className="flex items-center gap-4 p-4 bg-[#C4F042]/10 border border-[#C4F042]/30 rounded-xl">
                            <div className="w-12 h-12 rounded-2xl bg-[#C4F042]/20 flex items-center justify-center text-[#18181B] font-bold">
                                {campaign.selected_creator.full_name?.[0] || '?'}
                            </div>
                            <div>
                                <p className="text-[#18181B] font-medium">{campaign.selected_creator.full_name}</p>
                                <p className="text-[#3F3F00] text-sm">Créateur validé ✓</p>
                            </div>
                        </div>
                    ) : showCreatorSelector ? (
                        <div className="space-y-3">
                            <p className="text-sm text-[#71717A]">Sélectionnez 2-3 créateurs à proposer à la marque :</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                                {creators.map(creator => (
                                    <label
                                        key={creator.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCreators.includes(creator.id)
                                            ? 'border-[#C4F042] bg-[#C4F042]/10'
                                            : 'border-black/[0.04] bg-white/50 hover:bg-[#F4F3EF]'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCreators.includes(creator.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedCreators(prev => [...prev, creator.id])
                                                } else {
                                                    setSelectedCreators(prev => prev.filter(id => id !== creator.id))
                                                }
                                            }}
                                            className="sr-only"
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-[#F4F3EF] flex items-center justify-center text-[#18181B] font-medium text-sm">
                                            {creator.full_name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[#18181B] text-sm font-medium truncate">{creator.full_name}</p>
                                            <p className="text-[#A1A1AA] text-xs truncate">
                                                {creator.profiles_creator?.location_canton || 'Suisse'}
                                                {creator.profiles_creator?.specialties?.length ? ` · ${creator.profiles_creator.specialties[0]}` : ''}
                                            </p>
                                        </div>
                                        {selectedCreators.includes(creator.id) && (
                                            <CheckCircle2 className="w-5 h-5 text-[#C4F042] shrink-0" strokeWidth={1.5} />
                                        )}
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleProposeCreators}
                                    disabled={selectedCreators.length === 0 || actionLoading}
                                    className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50"
                                >
                                    Proposer {selectedCreators.length} créateur{selectedCreators.length > 1 ? 's' : ''}
                                </button>
                                <button
                                    onClick={() => { setShowCreatorSelector(false); setSelectedCreators([]) }}
                                    className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreatorSelector(true)}
                            className="px-4 py-2 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors"
                        >
                            + Sélectionner des créateurs
                        </button>
                )}
            </motion.div>
            )}

            {/* Script Section — only show for single-content campaigns */}
            {campaignContents.length <= 1 && (
                isStepCompleted('brand_reviewing_profiles') && !isStepCompleted('creator_validated') ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                        className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-[24px] p-6"
                    >
                        <h2 className="text-sm font-semibold text-[#18181B] mb-3 flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                            Script
                        </h2>
                        <div className="flex items-center gap-3 text-amber-700 bg-amber-50 rounded-xl p-4">
                            <Clock className="w-5 h-5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">En attente du choix de la marque</p>
                                <p className="text-xs text-amber-600 mt-0.5">La marque doit d'abord valider un créateur parmi les profils proposés.</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                        className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
                    >
                        <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                            Script
                            {campaign.script_status === 'brand_review' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">En attente marque</span>
                            )}
                            {campaign.script_status === 'brand_approved' && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Validé par la marque ✓</span>
                            )}
                        </h2>
                        {campaign.script_brand_feedback && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                                <p className="text-amber-800 font-medium text-xs mb-1">Retour de la marque :</p>
                                <p className="text-amber-700 whitespace-pre-wrap">{campaign.script_brand_feedback}</p>
                            </div>
                        )}
                        <textarea
                            value={scriptDraft}
                            onChange={(e) => setScriptDraft(e.target.value)}
                            placeholder="Rédigez le script ici..."
                            rows={8}
                            disabled={campaign.script_status === 'brand_review' || campaign.script_status === 'brand_approved'}
                            className="w-full bg-[#F4F3EF]/50 border border-black/[0.04] rounded-xl p-4 text-[#18181B] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C4F042]/50 focus:ring-2 focus:ring-[#C4F042]/20 resize-y disabled:opacity-50"
                        />
                        {campaign.script_status !== 'brand_review' && campaign.script_status !== 'brand_approved' && (
                            <div className="flex flex-wrap gap-3 mt-3">
                                <button
                                    onClick={handleAIScriptGenerate}
                                    disabled={aiLoading === 'script'}
                                    className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {aiLoading === 'script' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Proposer script IA
                                </button>
                                <button
                                    onClick={() => handleSaveScript('draft')}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors disabled:opacity-50"
                                >
                                    Sauvegarder le brouillon
                                </button>
                                <button
                                    onClick={async () => {
                                        await handleSaveScript('validated')
                                        await handleSendScriptToBrand()
                                    }}
                                    disabled={actionLoading || !scriptDraft}
                                    className="px-4 py-2 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" strokeWidth={1.5} />
                                    Envoyer à la marque pour validation
                                </button>
                            </div>
                        )}
                    </motion.div>
                )
            )}

            {/* ─── Unified: Contract + Send to Creator ─── */}
            {(() => {
                const hasCreator = campaign.selected_creator || campaignContents.some(c => c.assigned_creator_id)
                const missionNotSent = !isStepCompleted('mission_sent_to_creator')
                const contractMissing = !campaign.contract_mosh_status || (campaign.contract_mosh_status as string) === 'none'
                // Show when: creator assigned AND (mission not sent OR contract not generated)
                return hasCreator && (missionNotSent || contractMissing)
            })() && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
                    className="bg-[#C4F042]/10 border-2 border-[#C4F042]/40 rounded-[24px] p-6"
                >
                    <h2 className="text-sm font-semibold text-[#18181B] mb-2 flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-[#18181B]" strokeWidth={1.5} />
                        Préparer & envoyer au créateur
                    </h2>
                    <p className="text-xs text-[#71717A] mb-4">
                        Le script a été validé par la marque. Définissez la rémunération du créateur, un contrat sera automatiquement généré et la mission sera envoyée.
                    </p>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1 max-w-xs">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" strokeWidth={1.5} />
                            <input
                                type="number"
                                value={creatorAmount}
                                onChange={(e) => setCreatorAmount(e.target.value)}
                                placeholder="Ex: 300"
                                className="w-full pl-10 pr-16 py-3 bg-white/80 border border-black/[0.06] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C4F042]/50 focus:ring-2 focus:ring-[#C4F042]/20"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#A1A1AA]">CHF</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSendToCreator}
                        disabled={actionLoading || !creatorAmount || parseFloat(creatorAmount) <= 0}
                        className="px-5 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.5} />}
                        Générer le contrat & envoyer la mission
                    </button>
                </motion.div>
            )}

            {/* Contract Section (read-only, after contract exists) */}
            {campaign.selected_creator && campaign.contract_mosh_status && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
                >
                    <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        Contrat MOSH ↔ Créateur
                        {campaign.contract_mosh_status === 'active' && (
                            <span className="text-xs bg-[#C4F042]/20 text-[#18181B] px-2 py-0.5 rounded-full font-medium">Signé ✓</span>
                        )}
                        {campaign.contract_mosh_status === 'pending_creator' && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">En attente de signature</span>
                        )}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#71717A]">
                            <span>Montant créateur : <strong className="text-[#18181B]">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</strong></span>
                            {campaign.contract_mosh_generated_at && (
                                <span>Généré le {new Date(campaign.contract_mosh_generated_at).toLocaleDateString('fr-CH')}</span>
                            )}
                            {campaign.contract_mosh_signed_at && (
                                <span className="text-[#18181B] font-medium">Signé le {new Date(campaign.contract_mosh_signed_at).toLocaleDateString('fr-CH')}</span>
                            )}
                        </div>
                        <button
                            onClick={handleViewContract}
                            className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" strokeWidth={1.5} />
                            Voir le contrat
                        </button>
                        {campaign.contract_mosh_url && (
                            <a
                                href={campaign.contract_mosh_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" strokeWidth={1.5} />
                                Télécharger
                            </a>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Contract Preview Modal */}
            {
                showContractPreview && contractText && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowContractPreview(false)}>
                        <div className="bg-[#FAFAF8] border border-black/[0.06] rounded-[24px] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-black/[0.04]">
                                <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                                    <ScrollText className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} /> Contrat de mandat
                                </h3>
                                <button onClick={() => setShowContractPreview(false)} className="text-[#A1A1AA] hover:text-[#18181B] transition-colors">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <pre className="text-xs text-[#71717A] whitespace-pre-wrap font-mono leading-relaxed">{contractText}</pre>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ══════ Content Blocks Panel ══════ */}
            {campaignContents.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-5"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                            <Video className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                            Contenus ({campaignContents.filter(c => c.status === 'brand_approved').length}/{campaignContents.length} validés)
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#C4F042] rounded-full transition-all"
                                    style={{ width: `${(campaignContents.filter(c => c.status === 'brand_approved').length / campaignContents.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {campaignContents.map((content, idx) => {
                            const isExpanded = expandedContent === content.id
                            const statusCfg = CONTENT_STATUS_LABELS[content.status as ContentStatus] || CONTENT_STATUS_LABELS.draft
                            const ContentIcon = content.content_type === 'video' ? Video : Image
                            const assignedCreator = creators.find(c => c.id === content.assigned_creator_id)
                            const isMultiContent = campaignContents.length > 1

                            return (
                                <div key={content.id} className={`border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-[#18181B]/20 shadow-sm' : 'border-black/[0.04]'}`}>
                                    {/* Content header — clickable */}
                                    <button
                                        onClick={() => setExpandedContent(isExpanded ? null : content.id)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-black/[0.01] transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#F4F3EF] flex items-center justify-center shrink-0">
                                            <ContentIcon className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-medium text-[#18181B] truncate">
                                                {content.content_type === 'video' ? '📹' : '📷'} Contenu {idx + 1} — {content.script_type}
                                            </p>
                                            <p className="text-xs text-[#A1A1AA]">
                                                {content.format} · {content.content_type}
                                                {assignedCreator && ` · ${assignedCreator.full_name}`}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusCfg.bg} ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#A1A1AA] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#A1A1AA] shrink-0" />}
                                    </button>

                                    {/* Expanded panel */}
                                    {isExpanded && (
                                        <div className="border-t border-black/[0.04] p-4 space-y-4 bg-[#FAFAF8]">
                                            {/* ── Per-content creator assignment (multi-video only) ── */}
                                            {isMultiContent && (
                                                <div>
                                                    <label className="text-xs text-[#A1A1AA] mb-1.5 block flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                        Créateur assigné
                                                    </label>
                                                    {assignedCreator ? (
                                                        <div className={`p-3 rounded-xl border ${content.creator_status === 'brand_approved'
                                                            ? 'bg-[#C4F042]/10 border-[#C4F042]/30'
                                                            : 'bg-amber-50 border-amber-200'
                                                        }`}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${content.creator_status === 'brand_approved'
                                                                    ? 'bg-[#C4F042]/20 text-[#18181B]'
                                                                    : 'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {assignedCreator.full_name?.[0] || '?'}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-[#18181B]">{assignedCreator.full_name}</p>
                                                                    {content.creator_status === 'brand_approved' ? (
                                                                        <p className="text-xs text-emerald-600 font-medium">Validé par la marque ✓</p>
                                                                    ) : (
                                                                        <p className="text-xs text-amber-600">Proposé — en attente validation marque</p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={async () => {
                                                                        await updateContentField(content.id, { assigned_creator_id: null, creator_status: null } as any)
                                                                        setCampaignContents(prev => prev.map(c => c.id === content.id ? { ...c, assigned_creator_id: null, creator_status: null } : c))
                                                                    }}
                                                                    className="text-xs text-[#A1A1AA] hover:text-red-500 transition-colors"
                                                                >
                                                                    Changer
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value=""
                                                            onChange={async (e) => {
                                                                const creatorId = e.target.value
                                                                if (!creatorId) return
                                                                await updateContentField(content.id, { assigned_creator_id: creatorId, creator_status: 'proposed' } as any)
                                                                setCampaignContents(prev => prev.map(c => c.id === content.id ? { ...c, assigned_creator_id: creatorId, creator_status: 'proposed' } : c))
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-sm text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40"
                                                        >
                                                            <option value="">Sélectionner un créateur...</option>
                                                            {creators.map(c => (
                                                                <option key={c.id} value={c.id}>{c.full_name} — {c.profiles_creator?.location_canton || 'Suisse'}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            )}



                                            {/* Script editor — locked until creator is brand_approved */}
                                            {(isMultiContent && (!assignedCreator || content.creator_status !== 'brand_approved')) ? (
                                                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                                                    <Clock className="w-5 h-5 shrink-0" />
                                                    <div>
                                                        {!assignedCreator ? (
                                                            <>
                                                                <p className="font-medium text-sm">En attente du créateur</p>
                                                                <p className="text-xs text-amber-600 mt-0.5">Assignez un créateur à ce contenu avant de rédiger le script.</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p className="font-medium text-sm">En attente de validation marque</p>
                                                                <p className="text-xs text-amber-600 mt-0.5">Le créateur {assignedCreator.full_name} a été proposé. La marque doit valider avant la rédaction du script.</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-xs text-[#A1A1AA] mb-1.5 block">Script</label>
                                                    <textarea
                                                        value={contentScriptDrafts[content.id] || ''}
                                                        onChange={(e) => setContentScriptDrafts(prev => ({ ...prev, [content.id]: e.target.value }))}
                                                        placeholder="Rédigez le script pour ce contenu..."
                                                        rows={5}
                                                        className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-xl text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 resize-none"
                                                    />
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <button
                                                            onClick={async () => {
                                                                await updateContentField(content.id, {
                                                                    script_content: contentScriptDrafts[content.id] || null,
                                                                    script_status: 'draft',
                                                                })
                                                                setActionSuccess('Brouillon sauvegardé !')
                                                                setTimeout(() => setActionSuccess(null), 2000)
                                                            }}
                                                            className="px-3 py-1.5 bg-[#F4F3EF] text-[#18181B] text-xs font-medium rounded-lg hover:bg-[#E8E6DF] transition-colors"
                                                        >
                                                            Sauvegarder brouillon
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                await updateContentField(content.id, {
                                                                    script_content: contentScriptDrafts[content.id] || null,
                                                                    script_status: 'validated',
                                                                    status: 'script_pending',
                                                                })
                                                                setCampaignContents(prev => prev.map(c => c.id === content.id ? { ...c, status: 'script_pending' as ContentStatus, script_status: 'validated' } : c))
                                                                setActionSuccess('Script envoyé à la marque !')
                                                                setTimeout(() => setActionSuccess(null), 2000)
                                                            }}
                                                            disabled={!contentScriptDrafts[content.id]}
                                                            className="px-3 py-1.5 bg-[#C4F042] text-[#18181B] text-xs font-medium rounded-lg hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            <Send className="w-3 h-3" strokeWidth={1.5} />
                                                            Envoyer à la marque
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!campaign || aiLoading) return
                                                                setAiLoading('script')
                                                                try {
                                                                    const res = await fetch('/api/ai', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            action: 'generate_script',
                                                                            briefData: {
                                                                                title: campaign.title,
                                                                                product_name: campaign.product_name,
                                                                                product_description: campaign.product_description,
                                                                                description: content.description || campaign.description,
                                                                                format: content.format,
                                                                                script_type: content.script_type,
                                                                                script_notes: campaign.script_notes,
                                                                            },
                                                                        }),
                                                                    })
                                                                    const data = await res.json()
                                                                    if (!data.error) {
                                                                        setContentScriptDrafts(prev => ({ ...prev, [content.id]: data.result }))
                                                                    }
                                                                } catch { /* ignore */ }
                                                                setAiLoading(null)
                                                            }}
                                                            disabled={aiLoading === 'script'}
                                                            className="px-3 py-1.5 bg-[#18181B] text-white text-xs font-medium rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {aiLoading === 'script' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                            Script IA
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video preview if uploaded */}
                                            {content.video_url && (
                                                <div>
                                                    <label className="text-xs text-[#A1A1AA] mb-1.5 block">Vidéo</label>
                                                    <video src={content.video_url} controls className="w-full rounded-xl bg-black max-h-[300px]" />
                                                </div>
                                            )}

                                            {/* Description */}
                                            {content.description && (
                                                <div>
                                                    <label className="text-xs text-[#A1A1AA] mb-1 block">Description</label>
                                                    <p className="text-sm text-[#18181B]">{content.description}</p>
                                                </div>
                                            )}

                                            {/* Brand feedback */}
                                            {content.brand_final_feedback && (
                                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <p className="text-xs text-amber-800 font-medium mb-1">Retour marque :</p>
                                                    <p className="text-sm text-amber-700 whitespace-pre-wrap">{content.brand_final_feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}

            {/* Video / Deliverables Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    Vidéo
                </h2>
                {!isStepCompleted('video_uploaded_by_creator') ? (
                    <div className="text-[#A1A1AA] text-sm py-4">
                        En attente de la livraison du créateur...
                    </div>
                ) : !isStepCompleted('video_validated') ? (
                    <div className="space-y-4">
                        <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#C4F042]" strokeWidth={1.5} />
                            Vidéo livrée par le créateur
                        </p>

                        {/* Video player */}
                        {campaign.video_url && (
                            <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[400px]" />
                        )}

                        {/* QC Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleCompleteStep('video_validated')}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                                Valider le QC
                            </button>
                            <button
                                onClick={() => setShowQcFeedback(!showQcFeedback)}
                                className="px-4 py-2.5 bg-amber-100 text-amber-800 font-medium rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                                Demander révision
                            </button>
                        </div>

                        {/* QC Feedback form */}
                        {showQcFeedback && (
                            <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <textarea
                                    value={qcFeedback}
                                    onChange={(e) => setQcFeedback(e.target.value)}
                                    placeholder="Décrivez ce qui doit être corrigé..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-amber-400"
                                />
                                <button
                                    onClick={handleQcRevision}
                                    disabled={actionLoading || !qcFeedback.trim()}
                                    className="w-full px-4 py-2 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.5} />}
                                    Envoyer le feedback au créateur
                                </button>
                            </div>
                        )}
                    </div>
                ) : !isStepCompleted('video_sent_to_brand') ? (
                    <div className="space-y-4">
                        <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#C4F042]" strokeWidth={1.5} />
                            Vidéo validée (QC OK)
                        </p>
                        {campaign.video_url && (
                            <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[300px]" />
                        )}
                        <button
                            onClick={() => handleCompleteStep('video_sent_to_brand')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50"
                        >
                            Envoyer la vidéo à la marque
                        </button>
                    </div>
                ) : isStepCompleted('brand_final_approved') ? (
                    <div className="space-y-3">
                        <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#C4F042]" strokeWidth={1.5} />
                            Vidéo validée par la marque — Mission terminée
                        </p>
                        {campaign.video_url && (
                            <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[300px]" />
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                            En attente de validation par la marque
                        </p>
                        {campaign.video_url && (
                            <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[300px]" />
                        )}
                        {campaign.brand_revision_count > 0 && (
                            <div className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                                Révisions demandées par la marque : {campaign.brand_revision_count}/2
                            </div>
                        )}
                        {campaign.brand_final_feedback && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                                <p className="text-amber-800 font-medium text-xs mb-1">Retour de la marque :</p>
                                <p className="text-amber-700 whitespace-pre-wrap">{campaign.brand_final_feedback}</p>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Invoice Section */}
            {
                isStepCompleted('video_sent_to_brand') && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                        className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
                    >
                        <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                            Facture
                            {campaign.invoice_number && (
                                <span className="text-xs bg-[#C4F042]/20 text-[#18181B] px-2 py-0.5 rounded-full font-medium">{campaign.invoice_number}</span>
                            )}
                        </h2>

                        {campaign.invoice_number ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 text-sm text-[#71717A]">
                                    <span>Montant : <strong className="text-[#18181B]">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</strong></span>
                                    {campaign.invoice_generated_at && (
                                        <span>Générée le {new Date(campaign.invoice_generated_at).toLocaleDateString('fr-CH')}</span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleViewInvoice}
                                        className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" strokeWidth={1.5} />
                                        Voir la facture
                                    </button>
                                    {campaign.invoice_url && (
                                        <a
                                            href={campaign.invoice_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" strokeWidth={1.5} />
                                            Télécharger
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-[#71717A]">La mission est terminée. Générez la facture pour le créateur.</p>
                                <button
                                    onClick={handleGenerateInvoice}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" strokeWidth={1.5} />}
                                    Générer la facture
                                </button>
                            </div>
                        )}
                    </motion.div>
                )
            }

            {/* Invoice Preview Modal */}
            {
                showInvoicePreview && invoiceText && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInvoicePreview(false)}>
                        <div className="bg-[#FAFAF8] border border-black/[0.06] rounded-[24px] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-5 border-b border-black/[0.04]">
                                <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} /> Facture
                                </h3>
                                <button onClick={() => setShowInvoicePreview(false)} className="text-[#A1A1AA] hover:text-[#18181B] transition-colors">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">
                                <pre className="text-xs text-[#71717A] whitespace-pre-wrap font-mono leading-relaxed">{invoiceText}</pre>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Quote/Devis Signed Badge */}
            {campaign.quote_number && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-bold text-[#18181B]">Devis signé</h3>
                        <span className="text-xs font-mono text-[#71717A] bg-[#F4F3EF] px-2 py-0.5 rounded-full">{campaign.quote_number}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                            <p className="text-[#A1A1AA]">Signé le</p>
                            <p className="text-[#18181B] font-medium">{campaign.quote_signed_at ? new Date(campaign.quote_signed_at).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                        </div>
                        <div>
                            <p className="text-[#A1A1AA]">IP signataire</p>
                            <p className="text-[#18181B] font-mono">{campaign.quote_signer_ip || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[#A1A1AA]">Offre</p>
                            <p className="text-[#18181B] font-medium capitalize">{campaign.pricing_pack || '—'}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* A8: Admin Internal Notes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-5"
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        Notes internes (admin)
                    </h3>
                    <button
                        onClick={handleSaveAdminNotes}
                        disabled={savingNotes}
                        className="text-xs font-medium text-[#71717A] hover:text-[#18181B] transition-colors disabled:opacity-50"
                    >
                        {savingNotes ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                </div>
                <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    onBlur={handleSaveAdminNotes}
                    placeholder="Notes privées sur cette mission (visibles uniquement par l'admin)..."
                    rows={3}
                    className="w-full bg-[#F4F3EF] border border-[#D9D7D0] rounded-xl px-4 py-3 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50 resize-none"
                />
            </motion.div>
        </div>
    )
}
