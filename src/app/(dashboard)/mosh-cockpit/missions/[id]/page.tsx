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
    ScrollText,
    Receipt,
    Download,
    Loader2,
    Banknote
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
import type { MissionStep, MissionStepType } from '@/types/database'

const WORKFLOW_STEPS: { type: MissionStepType; label: string; icon: typeof FileText }[] = [
    { type: 'brief_received', label: 'Brief reçu', icon: FileText },
    { type: 'creators_proposed', label: 'Profils proposés', icon: Users },
    { type: 'brand_reviewing_profiles', label: 'Marque review', icon: Users },
    { type: 'creator_validated', label: 'Créateur validé', icon: CheckCircle2 },
    { type: 'script_sent', label: 'Script validé', icon: Send },
    { type: 'script_brand_review', label: 'Script → Marque', icon: Send },
    { type: 'script_brand_approved', label: 'Script OK', icon: CheckCircle2 },
    { type: 'mission_sent_to_creator', label: 'Mission envoyée', icon: Send },
    { type: 'creator_accepted', label: 'Créateur accepte', icon: CheckCircle2 },
    { type: 'creator_shooting', label: 'En tournage', icon: Video },
    { type: 'video_uploaded_by_creator', label: 'Vidéo reçue', icon: Video },
    { type: 'video_validated', label: 'QC MOSH', icon: Shield },
    { type: 'video_sent_to_brand', label: 'Envoyée marque', icon: CheckCircle2 },
    { type: 'brand_final_review', label: 'Review marque', icon: Shield },
    { type: 'brand_final_approved', label: 'Validé ✓', icon: CheckCircle2 },
]

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
        setIsLoading(false)
    }, [campaignId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const isStepCompleted = (stepType: MissionStepType) =>
        steps.some(s => s.step_type === stepType)

    const getCurrentStepIndex = () => {
        let lastCompleted = -1
        WORKFLOW_STEPS.forEach((ws, i) => {
            if (isStepCompleted(ws.type)) lastCompleted = i
        })
        return lastCompleted
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
        const result = await createMoshContract(campaignId, amount)
        if (result.success) {
            setShowContractForm(false)
            await loadData()
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
        await generateInvoice(campaignId)
        await loadData()
        setActionLoading(false)
    }

    const handleViewInvoice = async () => {
        const text = await getInvoiceText(campaignId)
        setInvoiceText(text)
        setShowInvoicePreview(true)
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
                <div className="flex items-center gap-1">
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
                                    <div className={`h-0.5 flex-1 mx-1 mt-[-20px] ${completed ? 'bg-[#C4F042]' : 'bg-[#F4F3EF]'}`} />
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
                </h2>
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

            {/* Creators Section */}
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
                        className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors"
                    >
                        + Sélectionner des créateurs
                    </button>
                )}
            </motion.div>

            {/* Script Section */}
            {isStepCompleted('brand_reviewing_profiles') && !isStepCompleted('creator_validated') ? (
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
                        {campaign.script_status === 'validated' && (
                            <span className="text-xs bg-[#C4F042]/20 text-[#18181B] px-2 py-0.5 rounded-full font-medium">Validé MOSH</span>
                        )}
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
                    {campaign.script_status !== 'validated' && campaign.script_status !== 'brand_review' && campaign.script_status !== 'brand_approved' && (
                        <div className="flex gap-3 mt-3">
                            <button
                                onClick={() => handleSaveScript('draft')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors disabled:opacity-50"
                            >
                                Sauvegarder le brouillon
                            </button>
                            <button
                                onClick={() => handleSaveScript('validated')}
                                disabled={actionLoading || !scriptDraft}
                                className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50"
                            >
                                ✓ Valider le script MOSH
                            </button>
                        </div>
                    )}
                    {campaign.script_status === 'validated' && (
                        <div className="flex gap-3 mt-3">
                            <button
                                onClick={handleSendScriptToBrand}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" strokeWidth={1.5} />
                                Envoyer à la marque pour validation
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ─── Unified: Contract + Send to Creator ─── */}
            {isStepCompleted('script_brand_approved') && !isStepCompleted('mission_sent_to_creator') && campaign.selected_creator && (
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
                        <button
                            onClick={() => handleCompleteStep('video_validated')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50"
                        >
                            ✓ Valider la vidéo
                        </button>
                    </div>
                ) : !isStepCompleted('video_sent_to_brand') ? (
                    <div className="space-y-4">
                        <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#C4F042]" strokeWidth={1.5} />
                            Vidéo validée
                        </p>
                        <button
                            onClick={() => handleCompleteStep('video_sent_to_brand')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50"
                        >
                            Envoyer la vidéo à la marque
                        </button>
                    </div>
                ) : isStepCompleted('brand_final_approved') ? (
                    <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#C4F042]" strokeWidth={1.5} />
                        Vidéo validée par la marque — Mission terminée
                    </p>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                            En attente de validation par la marque
                        </p>
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
        </div >
    )
}
