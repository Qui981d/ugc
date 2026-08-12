'use client'

import RightsSummary from '@/components/contracts/RightsSummary'
import { parseMissionRights } from '@/lib/contracts/rights'
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
    draft: { label: 'À livrer', color: 'text-[#6B6B6B]', bg: 'bg-[#F4F4F3]', canDeliver: true },
    script_pending: { label: 'À livrer', color: 'text-[#6B6B6B]', bg: 'bg-[#F4F4F3]', canDeliver: true },
    script_approved: { label: 'À livrer', color: 'text-[#6B6B6B]', bg: 'bg-[#F4F4F3]', canDeliver: true },
    shooting: { label: 'À livrer', color: 'text-[#6B6B6B]', bg: 'bg-[#F4F4F3]', canDeliver: true },
    uploaded: { label: 'Livrée', color: 'text-[#1A1A1A]', bg: 'bg-[#F4F4F3]', canDeliver: false },
    qc_approved: { label: 'QC validé ✓', color: 'text-[#1A7F37]', bg: 'bg-[#E8F3EA]', canDeliver: false },
    sent_to_brand: { label: 'Chez la marque', color: 'text-[#8A6100]', bg: 'bg-[#FBF3E2]', canDeliver: false },
    brand_approved: { label: 'Validée ✓', color: 'text-[#1A7F37]', bg: 'bg-[#E8F3EA]', canDeliver: false },
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
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="max-w-3xl mx-auto py-12 text-center">
                <p className="text-[#6B6B6B]">Mission introuvable</p>
                <Link href="/creator/missions" className="text-sm text-[#9B9B9B] hover:text-[#1A1A1A] mt-2 inline-block">← Retour</Link>
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
                    className="fixed top-4 right-4 z-50 bg-[#1A1A1A] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{actionSuccess}</span>
                </motion.div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#9B9B9B]">
                <Link href="/creator/missions" className="hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Mes missions
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#1A1A1A]">{campaign.title}</span>
            </div>

            {/* Title */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">{campaign.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#6B6B6B]">
                    <span>{campaign.script_type}</span>
                    {campaign.deadline && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                        </span>
                    )}
                    {(myCreatorAmount || campaign.creator_amount_chf) ? (
                        <span className="font-semibold text-[#1A1A1A]">CHF {(myCreatorAmount || campaign.creator_amount_chf)?.toLocaleString('fr-CH')}</span>
                    ) : (
                        <span className="font-semibold text-[#1A1A1A]">CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                    )}
                </div>
            </div>

            {/* Content blocks — per-content delivery */}
            {campaignContents.length > 0 && contractSigned && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E2E2E1] rounded-lg p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                            <Film className="w-4 h-4 text-[#6B6B6B]" />
                            Contenus à produire ({campaignContents.filter(c => ['uploaded', 'qc_approved', 'sent_to_brand', 'brand_approved'].includes(c.status)).length}/{campaignContents.length})
                        </h2>
                        <div className="w-20 h-1.5 bg-[#F4F4F3] rounded-full overflow-hidden">
                            <div className="h-full bg-[#1A1A1A] rounded-full transition-all" style={{ width: `${(campaignContents.filter(c => ['uploaded', 'qc_approved', 'sent_to_brand', 'brand_approved'].includes(c.status)).length / campaignContents.length) * 100}%` }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {campaignContents.map((content, idx) => {
                            const statusCfg = CREATOR_CONTENT_STATUS[content.status] || CREATOR_CONTENT_STATUS.draft
                            return (
                                <div key={content.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#F4F4F3]/50">
                                    <span className="text-sm">{content.content_type === 'video' ? '📹' : '📷'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1A1A1A] truncate">Contenu {idx + 1} — {content.script_type}</p>
                                        <p className="text-xs text-[#9B9B9B]">{content.format}</p>
                                    </div>
                                    {statusCfg.canDeliver ? (
                                        <Link href={`/creator/missions/${campaignId}/studio?content=${content.id}`}
                                            className="flex items-center gap-1.5 bg-[#1A1A1A] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors"
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
                    className="bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg p-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                            <Hourglass className="w-5 h-5 text-[#6B6B6B]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                                En attente
                                <span className="text-xs bg-[#F2F2F1] text-[#6B6B6B] px-2 py-0.5 rounded-full font-medium">{nextStep.label}</span>
                            </h3>
                            <p className="text-sm text-[#6B6B6B] mt-0.5">{nextStep.waitingDesc}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex">
                        <Link href={`/creator/messages?campaign=${campaignId}`}
                            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1.5 transition-colors"
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
                    className={`border-2 rounded-lg p-5 ${campaign.contract_mosh_status === 'pending_creator' ? 'bg-[#FBF3E2] border-[#F0E0BC]' : 'bg-[#F4F4F3] border-[#E2E2E1]'}`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${campaign.contract_mosh_status === 'pending_creator' ? 'bg-[#FBF3E2]' : 'bg-white'}`}>
                            <ScrollText className={`w-5 h-5 ${campaign.contract_mosh_status === 'pending_creator' ? 'text-[#8A6100]' : 'text-[#6B6B6B]'}`} />
                        </div>
                        <div>
                            {campaign.contract_mosh_status === 'pending_creator' ? (
                                <>
                                    <h3 className="font-semibold text-[#1A1A1A]">⚡ Contrat à signer</h3>
                                    <p className="text-sm text-[#6B6B6B]">Lisez et signez votre contrat pour pouvoir démarrer</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                                        En préparation
                                        <span className="text-xs bg-[#F2F2F1] text-[#6B6B6B] px-2 py-0.5 rounded-full font-medium">Contrat</span>
                                    </h3>
                                    <p className="text-sm text-[#6B6B6B]">MOSH prépare votre contrat. Vous serez notifié dès qu&apos;il sera prêt à signer.</p>
                                </>
                            )}
                        </div>
                    </div>
                    {(myCreatorAmount || campaign.creator_amount_chf) && (
                        <div className="text-sm text-[#6B6B6B] mb-3 bg-white rounded-lg px-3 py-2">
                            Rémunération : <strong className="text-[#1A1A1A]">CHF {(myCreatorAmount || campaign.creator_amount_chf)?.toLocaleString('fr-CH')}</strong>
                        </div>
                    )}

                    {/* What the creator is actually agreeing to. Shown before the
                        contract text, because this is the part people read. */}
                    <div className="bg-white rounded-lg px-3 py-3 mb-3">
                        <RightsSummary rights={parseMissionRights(campaign.rights)} />
                    </div>
                    {campaign.contract_mosh_status === 'pending_creator' && (
                        <div className="space-y-2">
                            {campaign.creator_price_status === 'counter' && (
                                <div className="bg-white border border-[#F0E0BC] rounded-lg px-3 py-2 text-sm text-[#8A6100]">
                                    💬 Tarif demandé : <strong>CHF {campaign.creator_counter_amount_chf?.toLocaleString('fr-CH')}</strong> — en attente de la réponse de MOSH.
                                </div>
                            )}
                            <button
                                onClick={handleViewContract}
                                className="w-full py-2.5 bg-[#8A6100] text-white rounded-lg text-sm font-medium hover:bg-[#8A6100] transition-colors flex items-center justify-center gap-2"
                            >
                                <ScrollText className="w-4 h-4" />
                                Lire &amp; signer le contrat
                            </button>

                            {campaign.creator_price_status !== 'counter' && !showPriceForm && (
                                <button
                                    onClick={() => { setPriceInput(String(myCreatorAmount || campaign.creator_amount_chf || '')); setShowPriceForm(true) }}
                                    className="w-full py-2.5 bg-white border border-[#E2E2E1] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-[#F4F4F3] transition-colors"
                                >
                                    Demander un autre tarif
                                </button>
                            )}

                            {showPriceForm && (
                                <div className="bg-white border border-[#E2E2E1] rounded-lg p-3 space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Tarif souhaité (CHF)</label>
                                        <input
                                            type="number" min="0" step="10" value={priceInput}
                                            onChange={e => setPriceInput(e.target.value)}
                                            placeholder="Ex : 600"
                                            className="w-full px-3 py-2 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg text-sm focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                        />
                                    </div>
                                    <textarea
                                        value={priceMessage} onChange={e => setPriceMessage(e.target.value)}
                                        rows={2} placeholder="Message pour MOSH (optionnel)"
                                        className="w-full px-3 py-2 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg text-sm resize-none focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRequestPrice}
                                            disabled={priceLoading || !parseFloat(priceInput)}
                                            className="flex-1 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333333] transition-colors disabled:opacity-50"
                                        >
                                            {priceLoading ? 'Envoi…' : 'Envoyer la demande'}
                                        </button>
                                        <button
                                            onClick={() => setShowPriceForm(false)}
                                            className="px-3 py-2 text-[#6B6B6B] text-sm hover:bg-[#F4F4F3] rounded-lg transition-colors"
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
                    className="bg-white border border-[#E2E2E1] rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4 text-[#1A1A1A]" />
                        Votre vidéo
                        {isStepCompleted('video_validated') && (
                            <span className="text-xs bg-[#EDEDEC] text-[#1A1A1A] px-2 py-0.5 rounded-full">QC validé ✓</span>
                        )}
                    </h2>
                    <video src={campaign.video_url} controls className="w-full rounded-lg bg-black max-h-[400px]" />
                </motion.div>
            )}

            {/* Mission complete banner */}
            {isStepCompleted('brand_final_approved') && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#EDEDEC] border-2 border-[#1A1A1A]/40 rounded-lg p-5 text-center"
                >
                    <Star className="w-8 h-8 text-[#1A1A1A] mx-auto mb-2" />
                    <h3 className="font-bold text-[#1A1A1A] text-lg">Mission terminée ! 🎉</h3>
                    <p className="text-sm text-[#6B6B6B] mt-1">La marque a validé votre vidéo. Bravo pour cette collaboration !</p>
                </motion.div>
            )}

            {/* Contract signed info banner */}
            {contractSigned && !isStepCompleted('brand_final_approved') && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#F2F2F1] transition-colors"
                    onClick={handleViewContract}
                >
                    <ScrollText className="w-4 h-4 text-[#6B6B6B]" />
                    <p className="flex-1 text-sm text-[#1A1A1A]">Contrat signé ✓ · <span className="text-[#6B6B6B]">Consulter</span></p>
                    <span className="text-xs text-[#6B6B6B] font-medium">CHF {(myCreatorAmount || campaign.creator_amount_chf)?.toLocaleString('fr-CH')}</span>
                </motion.div>
            )}

            {/* ========================================================== */}
            {/* Script — always visible for the creator (they need context) */}
            {/* ========================================================== */}
            {campaign.script_content && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E2E2E1] rounded-lg p-6"
                >
                    <h2 className="text-sm font-semibold text-[#1A1A1A] mb-1 flex items-center gap-2">
                        <Pen className="w-4 h-4 text-[#6B6B6B]" />
                        Script de la mission
                    </h2>
                    <p className="text-xs text-[#6B6B6B] mb-4">Voici le script à suivre pour votre production</p>
                    <div className="bg-[#F4F4F3]/50 rounded-lg border border-[#E2E2E1] p-4">
                        <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">{campaign.script_content}</p>
                    </div>
                </motion.div>
            )}

            {/* ========================================================== */}
            {/* TIMELINE */}
            {/* ========================================================== */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#E2E2E1] rounded-lg p-6"
            >
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">Suivi de votre mission</h2>
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
                                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isPast ? 'bg-[#1A1A1A]/30' : 'bg-[#F4F4F3]'}`} />
                                )}
                                <div className={`relative z-10 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${completed ? 'bg-[#EDEDEC] text-[#1A1A1A]' :
                                    isAction ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A]/40 animate-pulse' :
                                        isCurrent ? 'bg-[#EDEDEC] text-[#1A1A1A] ring-2 ring-[#1A1A1A]/15' :
                                            'bg-[#FAFAF9] text-[#C4C4C3]'
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
                                    <p className={`font-medium ${completed ? 'text-[#1A1A1A]' :
                                        isAction ? 'text-[#1A1A1A]' :
                                            isCurrent ? 'text-[#1A1A1A]' :
                                                'text-[#9B9B9B]'
                                        }`}>
                                        {step.label}
                                        {isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[#EDEDEC] text-[#1A1A1A] px-2 py-0.5 rounded-full font-semibold">
                                                <AlertCircle className="w-3 h-3" />
                                                À vous
                                            </span>
                                        )}
                                        {isCurrent && !isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[#F4F4F3] text-[#6B6B6B] px-2 py-0.5 rounded-full">
                                                <Clock className="w-3 h-3" />
                                                En attente
                                            </span>
                                        )}
                                    </p>
                                    <p className={`text-sm mt-0.5 ${completed || isCurrent ? 'text-[#6B6B6B]' : 'text-[#C4C4C3]'}`}>
                                        {completed ? step.doneDesc : isCurrent ? step.waitingDesc : step.waitingDesc}
                                    </p>
                                    {completedStep?.completed_at && (
                                        <p className="text-xs text-[#9B9B9B] mt-1">
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
                    className="bg-white border border-[#E2E2E1] rounded-lg p-6"
                >
                    <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Brief de la mission</h2>
                    <div className="space-y-4">
                        {campaign.product_name && (
                            <div>
                                <p className="text-xs text-[#9B9B9B] mb-1">Produit</p>
                                <p className="text-sm text-[#1A1A1A]">{campaign.product_name}</p>
                            </div>
                        )}
                        {campaign.product_description && (
                            <div>
                                <p className="text-xs text-[#9B9B9B] mb-1">Description du produit</p>
                                <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{campaign.product_description}</p>
                            </div>
                        )}
                        {campaign.description && (
                            <div>
                                <p className="text-xs text-[#9B9B9B] mb-1">Instructions</p>
                                <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{campaign.description}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-[#9B9B9B] mb-1">Format</p>
                                <p className="text-[#1A1A1A]">{campaign.format || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#9B9B9B] mb-1">Droits d&apos;usage</p>
                                <p className="text-[#1A1A1A]">{campaign.rights_usage || '—'}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Video feedback section */}
            {campaign.brand_final_feedback && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#FBF3E2] border border-[#F0E0BC] rounded-lg p-6"
                >
                    <h2 className="text-sm font-semibold text-[#8A6100] mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Retour de la marque {campaign.brand_revision_count ? `(Révision ${campaign.brand_revision_count}/2)` : ''}
                    </h2>
                    <p className="text-sm text-[#8A6100] whitespace-pre-wrap">{campaign.brand_final_feedback}</p>
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
