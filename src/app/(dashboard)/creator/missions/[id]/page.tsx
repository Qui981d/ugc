'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    FileText,
    Users,
    CheckCircle2,
    Clock,
    ChevronRight,
    Send,
    Upload,
    Package,
    Star,
    Pen,
    Loader2,
    AlertCircle,
    Camera,
    ScrollText,
    MessageSquare,
    Hourglass,
    Play,
    RotateCcw,
    Film,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getMissionSteps, completeMissionStep, requestPriceChange } from '@/lib/services/adminService'
import { getMoshContractText, signMoshContract } from '@/lib/services/contractService'
import ContractViewer from '@/components/contracts/ContractViewer'
import type { Campaign, MissionStep, MissionStepType, CampaignContent, ContentStatus } from '@/types/database'
import { getCampaignContents } from '@/lib/services/campaignService'
import { isStepCompletedOrPassed } from '@/lib/constants/workflowSteps'

// Creator-centric content status (they don't care about script stages)
const CREATOR_CONTENT_STATUS: Record<string, { label: string; color: string; bg: string; canDeliver: boolean }> = {
    draft: { label: 'À livrer', color: 'text-[#71717A]', bg: 'bg-gray-100', canDeliver: true },
    script_pending: { label: 'À livrer', color: 'text-[#71717A]', bg: 'bg-gray-100', canDeliver: true },
    script_approved: { label: 'À livrer', color: 'text-[#71717A]', bg: 'bg-gray-100', canDeliver: true },
    shooting: { label: 'À livrer', color: 'text-[#71717A]', bg: 'bg-gray-100', canDeliver: true },
    uploaded: { label: 'Livrée', color: 'text-indigo-700', bg: 'bg-indigo-100', canDeliver: false },
    qc_approved: { label: 'QC validé ✓', color: 'text-teal-700', bg: 'bg-teal-100', canDeliver: false },
    sent_to_brand: { label: 'Chez la marque', color: 'text-orange-700', bg: 'bg-orange-100', canDeliver: false },
    brand_approved: { label: 'Validée ✓', color: 'text-emerald-700', bg: 'bg-emerald-100', canDeliver: false },
}

// ================================================
// CREATOR TIMELINE — only steps the creator cares about
// Pre-conditions (selection, script, mission send) are implicit
// ================================================
const TIMELINE_STEPS: { type: MissionStepType; label: string; waitingDesc: string; doneDesc: string; icon: typeof FileText; creatorAction?: boolean }[] = [
    { type: 'contract_signed', label: 'Signature du contrat', waitingDesc: 'Lisez et signez votre contrat pour démarrer.', doneDesc: 'Contrat signé !', icon: ScrollText, creatorAction: true },
    { type: 'video_uploaded_by_creator', label: 'Livraison vidéo', waitingDesc: 'Uploadez votre vidéo via le Studio.', doneDesc: 'Vidéo livrée — en attente de vérification.', icon: Upload, creatorAction: true },
    { type: 'video_validated', label: 'Contrôle qualité', waitingDesc: 'MOSH vérifie la qualité de votre vidéo.', doneDesc: 'Vidéo validée par MOSH ✓', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Envoi à la marque', waitingDesc: 'Votre vidéo va être transmise à la marque.', doneDesc: 'Vidéo transmise — en attente de validation finale.', icon: Package },
    { type: 'brand_final_approved', label: 'Mission terminée ✅', waitingDesc: 'La marque examine votre vidéo.', doneDesc: 'La marque a validé votre vidéo. Bravo !', icon: Star },
]

export default function CreatorMissionDetailPage() {
    const params = useParams()
    const campaignId = params.id as string
    const { user } = useAuth()

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)
    const [campaignContents, setCampaignContents] = useState<CampaignContent[]>([])

    // Contract
    const [contractOpen, setContractOpen] = useState(false)
    const [contractText, setContractText] = useState<string | null>(null)
    const [signLoading, setSignLoading] = useState(false)
    // P3: Per-creator amount from content-level data
    const [myCreatorAmount, setMyCreatorAmount] = useState<number | null>(null)
    // Price negotiation (counter-offer before signing)
    const [showPriceForm, setShowPriceForm] = useState(false)
    const [priceInput, setPriceInput] = useState('')
    const [priceMessage, setPriceMessage] = useState('')
    const [priceLoading, setPriceLoading] = useState(false)

    const loadData = useCallback(async () => {
        const supabase = createClient()
        const [{ data: campData }, missionSteps, allContents] = await Promise.all([
            supabase.from('campaigns').select('*').eq('id', campaignId).single(),
            getMissionSteps(campaignId),
            getCampaignContents(campaignId),
        ])
        setCampaign(campData as Campaign | null)
        setSteps(missionSteps)
        // P2: Filter contents to only those assigned to this creator
        const myContents = user?.id
            ? allContents.filter(c => c.assigned_creator_id === user.id || !c.assigned_creator_id)
            : allContents
        setCampaignContents(myContents)
        // P3: Compute per-creator amount from content-level data
        if (user?.id && myContents.length > 0) {
            const contentAmount = (myContents[0] as any)?.creator_amount_chf
            if (contentAmount) setMyCreatorAmount(contentAmount)
        }
        setIsLoading(false)
    }, [campaignId, user?.id])

    useEffect(() => {
        loadData()
    }, [loadData])

    const isStepCompleted = (stepType: MissionStepType) => {
        const completedTypes = steps.map(s => s.step_type)
        return isStepCompletedOrPassed(stepType, completedTypes)
    }

    const getCurrentStepIndex = () => {
        let lastCompleted = -1
        TIMELINE_STEPS.forEach((ws, i) => {
            if (isStepCompleted(ws.type)) lastCompleted = i
        })
        return lastCompleted
    }

    const handleCreatorAction = async (stepType: MissionStepType, successMsg: string) => {
        setActionLoading(true)
        const result = await completeMissionStep(campaignId, stepType)
        if (result.success) {
            setActionSuccess(successMsg)
            setTimeout(() => setActionSuccess(null), 3000)
        }
        await loadData()
        setActionLoading(false)
    }

    const handleViewContract = async () => {
        setContractText(null)
        setContractOpen(true)
        // Pass creatorId so multi-creator campaigns show the correct contract
        const text = await getMoshContractText(campaignId, user?.id || undefined)
        setContractText(text)
    }

    const handleSignContract = async () => {
        setSignLoading(true)
        let clientIp = 'unknown'
        try {
            const res = await fetch('https://api.ipify.org?format=json')
            const data = await res.json()
            clientIp = data.ip
        } catch { /* fallback */ }
        const result = await signMoshContract(campaignId, clientIp)
        if (result.success) {
            setContractOpen(false)
            await loadData()
        }
        setSignLoading(false)
    }

    const handleRequestPrice = async () => {
        const amount = parseFloat(priceInput)
        if (!amount || amount <= 0) return
        setPriceLoading(true)
        const result = await requestPriceChange(campaignId, amount, priceMessage.trim() || undefined)
        if (result.success) {
            setActionSuccess('Demande de tarif envoyée à MOSH')
            setTimeout(() => setActionSuccess(null), 3000)
            setShowPriceForm(false)
            setPriceInput('')
            setPriceMessage('')
            await loadData()
        }
        setPriceLoading(false)
    }

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto py-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#A1A1AA]" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center">
                <p className="text-[#71717A]">Mission introuvable</p>
                <Link href="/creator/missions" className="text-sm text-[#A1A1AA] hover:text-[#18181B] mt-2 inline-block">← Retour</Link>
            </div>
        )
    }

    const currentStep = getCurrentStepIndex()
    const nextStep = TIMELINE_STEPS[currentStep + 1]

    // Determine what the creator should see
    const missionReceived = isStepCompleted('mission_sent_to_creator')
    const contractSigned = isStepCompleted('contract_signed')
    const missionAccepted = isStepCompleted('creator_accepted')
    const isWaitingForOthers = nextStep && !nextStep.creatorAction
    // If no steps completed yet, first action is contract
    const isFirstAction = currentStep === -1

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Success toast */}
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
                <Link href="/creator/missions" className="hover:text-[#18181B] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Mes missions
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#18181B]">{campaign.title}</span>
            </div>

            {/* Title */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#18181B] tracking-tight">{campaign.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#71717A]">
                    <span>{campaign.script_type}</span>
                    {campaign.deadline && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                        </span>
                    )}
                    {(myCreatorAmount || campaign.creator_amount_chf) ? (
                        <span className="font-semibold text-[#18181B]">CHF {(myCreatorAmount || campaign.creator_amount_chf)?.toLocaleString('fr-CH')}</span>
                    ) : (
                        <span className="font-semibold text-[#18181B]">CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                    )}
                </div>
            </div>

            {/* Content blocks — per-content delivery */}
            {campaignContents.length > 0 && contractSigned && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-black/[0.06] rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                            <Film className="w-4 h-4 text-[#71717A]" />
                            Contenus à produire ({campaignContents.filter(c => ['uploaded', 'qc_approved', 'sent_to_brand', 'brand_approved'].includes(c.status)).length}/{campaignContents.length})
                        </h2>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#C4F042] rounded-full transition-all" style={{ width: `${(campaignContents.filter(c => ['uploaded', 'qc_approved', 'sent_to_brand', 'brand_approved'].includes(c.status)).length / campaignContents.length) * 100}%` }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {campaignContents.map((content, idx) => {
                            const statusCfg = CREATOR_CONTENT_STATUS[content.status] || CREATOR_CONTENT_STATUS.draft
                            return (
                                <div key={content.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F3EF]/50">
                                    <span className="text-sm">{content.content_type === 'video' ? '📹' : '📷'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#18181B] truncate">Contenu {idx + 1} — {content.script_type}</p>
                                        <p className="text-xs text-[#A1A1AA]">{content.format}</p>
                                    </div>
                                    {statusCfg.canDeliver ? (
                                        <Link href={`/creator/missions/${campaignId}/studio?content=${content.id}`}
                                            className="flex items-center gap-1.5 bg-[#18181B] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#27272A] transition-colors"
                                        >
                                            <Upload className="w-3 h-3" />
                                            Livrer
                                        </Link>
                                    ) : (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}



            {/* ========================================================== */}
            {/* MAIN ACTION BANNER — always visible, adapts to state */}
            {/* ========================================================== */}

            {/* 1) Waiting for others (QC, brand review, etc.) */}
            {isWaitingForOthers && !isFirstAction && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F4F3EF] border border-[#D9D7D0] rounded-xl p-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                            <Hourglass className="w-5 h-5 text-[#71717A]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#18181B] flex items-center gap-2">
                                En attente
                                <span className="text-xs bg-[#E8E6DF] text-[#71717A] px-2 py-0.5 rounded-full font-medium">{nextStep.label}</span>
                            </h3>
                            <p className="text-sm text-[#71717A] mt-0.5">{nextStep.waitingDesc}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex">
                        <Link href={`/creator/messages?campaign=${campaignId}`}
                            className="text-sm text-[#71717A] hover:text-[#18181B] flex items-center gap-1.5 transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Envoyer un message à MOSH
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* 2) Contract step — first thing the creator sees */}
            {(isFirstAction || nextStep?.type === 'contract_signed') && !contractSigned && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`border-2 rounded-xl p-5 ${campaign.contract_mosh_status === 'pending_creator' ? 'bg-amber-50 border-amber-200' : 'bg-[#F4F3EF] border-[#D9D7D0]'}`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${campaign.contract_mosh_status === 'pending_creator' ? 'bg-amber-100' : 'bg-white'}`}>
                            <ScrollText className={`w-5 h-5 ${campaign.contract_mosh_status === 'pending_creator' ? 'text-amber-600' : 'text-[#71717A]'}`} />
                        </div>
                        <div>
                            {campaign.contract_mosh_status === 'pending_creator' ? (
                                <>
                                    <h3 className="font-semibold text-[#18181B]">⚡ Contrat à signer</h3>
                                    <p className="text-sm text-[#71717A]">Lisez et signez votre contrat pour pouvoir démarrer</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-semibold text-[#18181B] flex items-center gap-2">
                                        En préparation
                                        <span className="text-xs bg-[#E8E6DF] text-[#71717A] px-2 py-0.5 rounded-full font-medium">Contrat</span>
                                    </h3>
                                    <p className="text-sm text-[#71717A]">MOSH prépare votre contrat. Vous serez notifié dès qu&apos;il sera prêt à signer.</p>
                                </>
                            )}
                        </div>
                    </div>
                    {(myCreatorAmount || campaign.creator_amount_chf) && (
                        <div className="text-sm text-[#71717A] mb-3 bg-white rounded-lg px-3 py-2">
                            Rémunération : <strong className="text-[#18181B]">CHF {(myCreatorAmount || campaign.creator_amount_chf)?.toLocaleString('fr-CH')}</strong>
                        </div>
                    )}
                    {campaign.contract_mosh_status === 'pending_creator' && (
                        <div className="space-y-2">
                            {campaign.creator_price_status === 'counter' && (
                                <div className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                                    💬 Tarif demandé : <strong>CHF {campaign.creator_counter_amount_chf?.toLocaleString('fr-CH')}</strong> — en attente de la réponse de MOSH.
                                </div>
                            )}
                            <button
                                onClick={handleViewContract}
                                className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <ScrollText className="w-4 h-4" />
                                Lire &amp; signer le contrat
                            </button>

                            {campaign.creator_price_status !== 'counter' && !showPriceForm && (
                                <button
                                    onClick={() => { setPriceInput(String(myCreatorAmount || campaign.creator_amount_chf || '')); setShowPriceForm(true) }}
                                    className="w-full py-2.5 bg-white border border-[#D9D7D0] text-[#18181B] rounded-xl text-sm font-medium hover:bg-[#F4F3EF] transition-colors"
                                >
                                    Demander un autre tarif
                                </button>
                            )}

                            {showPriceForm && (
                                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-[#18181B] mb-1">Tarif souhaité (CHF)</label>
                                        <input
                                            type="number" min="0" step="10" value={priceInput}
                                            onChange={e => setPriceInput(e.target.value)}
                                            placeholder="Ex : 600"
                                            className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#C4F042] focus:ring-1 focus:ring-[#C4F042]/25"
                                        />
                                    </div>
                                    <textarea
                                        value={priceMessage} onChange={e => setPriceMessage(e.target.value)}
                                        rows={2} placeholder="Message pour MOSH (optionnel)"
                                        className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#E5E7EB] rounded-lg text-sm resize-none focus:outline-none focus:border-[#C4F042] focus:ring-1 focus:ring-[#C4F042]/25"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRequestPrice}
                                            disabled={priceLoading || !parseFloat(priceInput)}
                                            className="flex-1 py-2 bg-[#18181B] text-[#C4F042] rounded-lg text-sm font-medium hover:bg-[#18181B]/90 transition-colors disabled:opacity-50"
                                        >
                                            {priceLoading ? 'Envoi…' : 'Envoyer la demande'}
                                        </button>
                                        <button
                                            onClick={() => setShowPriceForm(false)}
                                            className="px-3 py-2 text-[#71717A] text-sm hover:bg-[#F4F3EF] rounded-lg transition-colors"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}





            {/* Video already uploaded — show preview */}
            {campaign.video_url && isStepCompleted('video_uploaded_by_creator') && !isStepCompleted('brand_final_approved') && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-[#18181B] mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4 text-[#C4F042]" />
                        Votre vidéo
                        {isStepCompleted('video_validated') && (
                            <span className="text-xs bg-[#C4F042]/20 text-[#18181B] px-2 py-0.5 rounded-full">QC validé ✓</span>
                        )}
                    </h2>
                    <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[400px]" />
                </motion.div>
            )}

            {/* Mission complete banner */}
            {isStepCompleted('brand_final_approved') && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#C4F042]/20 border-2 border-[#C4F042]/40 rounded-xl p-5 text-center"
                >
                    <Star className="w-8 h-8 text-[#18181B] mx-auto mb-2" />
                    <h3 className="font-bold text-[#18181B] text-lg">Mission terminée ! 🎉</h3>
                    <p className="text-sm text-[#71717A] mt-1">La marque a validé votre vidéo. Bravo pour cette collaboration !</p>
                </motion.div>
            )}

            {/* Contract signed info banner */}
            {contractSigned && !isStepCompleted('brand_final_approved') && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F4F3EF] border border-black/[0.04] rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#E8E6DF] transition-colors"
                    onClick={handleViewContract}
                >
                    <ScrollText className="w-4 h-4 text-[#71717A]" />
                    <p className="flex-1 text-sm text-[#18181B]">Contrat signé ✓ · <span className="text-[#71717A]">Consulter</span></p>
                    <span className="text-xs text-[#71717A] font-medium">CHF {(myCreatorAmount || campaign.creator_amount_chf)?.toLocaleString('fr-CH')}</span>
                </motion.div>
            )}

            {/* ========================================================== */}
            {/* Script — always visible for the creator (they need context) */}
            {/* ========================================================== */}
            {campaign.script_content && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-black/[0.06] rounded-2xl p-6"
                >
                    <h2 className="text-sm font-semibold text-[#18181B] mb-1 flex items-center gap-2">
                        <Pen className="w-4 h-4 text-[#71717A]" />
                        Script de la mission
                    </h2>
                    <p className="text-xs text-[#71717A] mb-4">Voici le script à suivre pour votre production</p>
                    <div className="bg-[#F4F3EF]/50 rounded-xl border border-black/[0.04] p-4">
                        <p className="text-sm text-[#18181B] whitespace-pre-wrap leading-relaxed">{campaign.script_content}</p>
                    </div>
                </motion.div>
            )}

            {/* ========================================================== */}
            {/* TIMELINE */}
            {/* ========================================================== */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl p-6"
            >
                <h2 className="text-lg font-semibold text-[#18181B] mb-6">Suivi de votre mission</h2>
                <div className="space-y-0">
                    {TIMELINE_STEPS.map((step, i) => {
                        const completed = isStepCompleted(step.type)
                        const isCurrent = i === currentStep + 1
                        const isPast = i <= currentStep
                        const StepIcon = step.icon
                        const completedStep = steps.find(s => s.step_type === step.type)
                        const isAction = step.creatorAction && isCurrent

                        return (
                            <div key={step.type} className="relative flex gap-4">
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isPast ? 'bg-[#C4F042]/30' : 'bg-gray-100'}`} />
                                )}
                                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-[#C4F042]/20 text-[#18181B]' :
                                    isAction ? 'bg-[#18181B] text-[#C4F042] ring-2 ring-[#C4F042]/40 animate-pulse' :
                                        isCurrent ? 'bg-[#C4F042]/10 text-[#C4F042] ring-2 ring-[#C4F042]/30' :
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
                                <div className="pb-8 flex-1 min-w-0">
                                    <p className={`font-medium ${completed ? 'text-gray-900' :
                                        isAction ? 'text-[#18181B]' :
                                            isCurrent ? 'text-[#18181B]' :
                                                'text-gray-400'
                                        }`}>
                                        {step.label}
                                        {isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[#C4F042]/20 text-[#18181B] px-2 py-0.5 rounded-full font-semibold">
                                                <AlertCircle className="w-3 h-3" />
                                                À vous
                                            </span>
                                        )}
                                        {isCurrent && !isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                <Clock className="w-3 h-3" />
                                                En attente
                                            </span>
                                        )}
                                    </p>
                                    <p className={`text-sm mt-0.5 ${completed || isCurrent ? 'text-gray-500' : 'text-gray-300'}`}>
                                        {completed ? step.doneDesc : isCurrent ? step.waitingDesc : step.waitingDesc}
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

            {/* ========================================================== */}
            {/* BRIEF — always visible (the creator needs context) */}
            {/* ========================================================== */}
            {(campaign.description || campaign.product_name) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold text-[#18181B] mb-4">Brief de la mission</h2>
                    <div className="space-y-4">
                        {campaign.product_name && (
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Produit</p>
                                <p className="text-sm text-[#18181B]">{campaign.product_name}</p>
                            </div>
                        )}
                        {campaign.product_description && (
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Description du produit</p>
                                <p className="text-sm text-[#18181B] whitespace-pre-wrap">{campaign.product_description}</p>
                            </div>
                        )}
                        {campaign.description && (
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Instructions</p>
                                <p className="text-sm text-[#18181B] whitespace-pre-wrap">{campaign.description}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Format</p>
                                <p className="text-[#18181B]">{campaign.format || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Droits d&apos;usage</p>
                                <p className="text-[#18181B]">{campaign.rights_usage || '—'}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Video feedback section */}
            {campaign.brand_final_feedback && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
                >
                    <h2 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Retour de la marque {campaign.brand_revision_count ? `(Révision ${campaign.brand_revision_count}/2)` : ''}
                    </h2>
                    <p className="text-sm text-amber-700 whitespace-pre-wrap">{campaign.brand_final_feedback}</p>
                </motion.div>
            )}

            {/* Contract Viewer Modal */}
            <ContractViewer
                isOpen={contractOpen}
                onClose={() => { setContractOpen(false); setContractText(null) }}
                contractText={contractText}
                contractStatus={campaign.contract_mosh_status as any}
                contractUrl={campaign.contract_mosh_url}
                mode="creator"
                onSign={handleSignContract}
                isSignLoading={signLoading}
            />
        </div>
    )
}
