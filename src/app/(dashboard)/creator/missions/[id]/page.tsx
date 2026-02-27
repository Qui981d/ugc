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
import { getMissionSteps, completeMissionStep } from '@/lib/services/adminService'
import { getMoshContractText, signMoshContract } from '@/lib/services/contractService'
import ContractViewer from '@/components/contracts/ContractViewer'
import type { Campaign, MissionStep, MissionStepType } from '@/types/database'

// ================================================
// CREATOR TIMELINE — starts at selection
// ================================================
const TIMELINE_STEPS: { type: MissionStepType; label: string; waitingDesc: string; doneDesc: string; icon: typeof FileText; creatorAction?: boolean }[] = [
    { type: 'creator_validated', label: 'Vous avez été sélectionné', waitingDesc: 'En attente de sélection par la marque.', doneDesc: 'La marque vous a choisi pour cette mission !', icon: Users },
    { type: 'script_brand_approved', label: 'Script prêt', waitingDesc: 'Le script est en cours de rédaction et de validation par la marque. Vous serez notifié dès qu\'il sera prêt.', doneDesc: 'Le script est validé. Consultez-le dans la section « Script » ci-dessous.', icon: Pen },
    { type: 'mission_sent_to_creator', label: 'Mission reçue', waitingDesc: 'MOSH prépare l\'envoi de votre mission avec le brief, le script et votre contrat.', doneDesc: 'Vous avez reçu la mission. Lisez le brief et le script, puis signez votre contrat pour commencer.', icon: Send },
    { type: 'contract_signed', label: 'Contrat signé', waitingDesc: 'Lisez et signez votre contrat pour pouvoir démarrer la mission.', doneDesc: 'Contrat signé ! Vous pouvez maintenant accepter la mission.', icon: ScrollText, creatorAction: true },
    { type: 'creator_accepted', label: 'Mission acceptée', waitingDesc: 'Confirmez que vous acceptez cette mission.', doneDesc: 'Vous avez accepté la mission. C\'est parti !', icon: CheckCircle2, creatorAction: true },
    { type: 'creator_shooting', label: 'En tournage', waitingDesc: 'Indiquez que vous commencez le tournage.', doneDesc: 'Tournage en cours — bonne création !', icon: Camera, creatorAction: true },
    { type: 'video_uploaded_by_creator', label: 'Vidéo livrée', waitingDesc: 'Uploadez votre vidéo pour la faire valider.', doneDesc: 'Vidéo livrée — en attente de vérification.', icon: Upload, creatorAction: true },
    { type: 'video_validated', label: 'Vérification MOSH', waitingDesc: 'MOSH vérifie la qualité de votre vidéo.', doneDesc: 'Vidéo validée par MOSH ✓', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Envoyée à la marque', waitingDesc: 'Votre vidéo va être transmise à la marque.', doneDesc: 'Vidéo transmise — en attente de validation finale.', icon: Package },
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

    // Contract
    const [contractOpen, setContractOpen] = useState(false)
    const [contractText, setContractText] = useState<string | null>(null)
    const [signLoading, setSignLoading] = useState(false)

    const loadData = useCallback(async () => {
        const supabase = createClient()
        const [{ data: campData }, missionSteps] = await Promise.all([
            supabase.from('campaigns').select('*').eq('id', campaignId).single(),
            getMissionSteps(campaignId),
        ])
        setCampaign(campData as Campaign | null)
        setSteps(missionSteps)
        setIsLoading(false)
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
        const text = await getMoshContractText(campaignId)
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
                    {campaign.creator_amount_chf ? (
                        <span className="font-semibold text-[#18181B]">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</span>
                    ) : (
                        <span className="font-semibold text-[#18181B]">CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                    )}
                </div>
            </div>

            {/* Studio Access — visible once accepted, hidden when upload step already shows Studio link */}
            {missionAccepted && nextStep?.type !== 'video_uploaded_by_creator' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Link href={`/creator/missions/${campaignId}/studio`}
                        className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-5 hover:from-purple-700 hover:to-purple-800 transition-all group shadow-lg shadow-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Camera className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Ouvrir le Studio</h3>
                                <p className="text-xs text-white/70">Checklist, notes, upload vidéo, script</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            )}

            {/* ========================================================== */}
            {/* MAIN ACTION BANNER — always visible, adapts to state */}
            {/* ========================================================== */}

            {/* 1) Waiting for others (script, QC, brand review, etc.) */}
            {isWaitingForOthers && (
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

            {/* 2) Contract to sign */}
            {nextStep?.type === 'contract_signed' && campaign.contract_mosh_status === 'pending_creator' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <ScrollText className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#18181B]">⚡ Contrat à signer</h3>
                            <p className="text-sm text-[#71717A]">Lisez et signez votre contrat pour pouvoir démarrer</p>
                        </div>
                    </div>
                    {campaign.creator_amount_chf && (
                        <div className="text-sm text-[#71717A] mb-3 bg-white rounded-lg px-3 py-2">
                            Rémunération : <strong className="text-[#18181B]">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</strong>
                        </div>
                    )}
                    <button
                        onClick={handleViewContract}
                        className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <ScrollText className="w-4 h-4" />
                        Lire & signer le contrat
                    </button>
                </motion.div>
            )}

            {/* 3) Accept mission */}
            {nextStep?.type === 'creator_accepted' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#18181B]">⚡ Accepter la mission</h3>
                            <p className="text-sm text-[#71717A]">Confirmez que vous êtes prêt à commencer</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleCreatorAction('creator_accepted', 'Mission acceptée !')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Accepter la mission
                    </button>
                </motion.div>
            )}

            {/* 4) Start shooting */}
            {nextStep?.type === 'creator_shooting' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#18181B]">⚡ Prêt à tourner ?</h3>
                            <p className="text-sm text-[#71717A]">Signalez le début de votre tournage — consultez le script ci-dessous</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleCreatorAction('creator_shooting', 'Tournage en cours !')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        Commencer le tournage
                    </button>
                </motion.div>
            )}

            {/* 5) Upload video — redirect to Studio */}
            {nextStep?.type === 'video_uploaded_by_creator' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    {campaign.mosh_qc_feedback && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                                <p className="text-sm font-medium text-amber-800">Révision demandée par MOSH</p>
                            </div>
                            <p className="text-sm text-amber-700 whitespace-pre-wrap">{campaign.mosh_qc_feedback}</p>
                        </div>
                    )}
                    <Link href={`/creator/missions/${campaignId}/studio`}
                        className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-5 hover:from-purple-700 hover:to-purple-800 transition-all group shadow-lg shadow-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Film className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">⚡ Livrer votre vidéo</h3>
                                <p className="text-xs text-white/70">Ouvrez le Studio pour uploader et livrer votre vidéo</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            )}

            {/* Video already uploaded — show preview */}
            {campaign.video_url && isStepCompleted('video_uploaded_by_creator') && !isStepCompleted('brand_final_approved') && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-[#18181B] mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-600" />
                        Votre vidéo
                        {isStepCompleted('video_validated') && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">QC validé ✓</span>
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
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-emerald-100 transition-colors"
                    onClick={handleViewContract}
                >
                    <ScrollText className="w-5 h-5 text-emerald-600" />
                    <div className="flex-1">
                        <p className="font-medium text-emerald-800 text-sm">Contrat signé ✓</p>
                        <p className="text-xs text-emerald-600">Cliquez pour consulter votre contrat</p>
                    </div>
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</span>
                </motion.div>
            )}

            {/* ========================================================== */}
            {/* SCRIPT — visible once mission_sent_to_creator */}
            {/* ========================================================== */}
            {campaign.script_content && missionReceived && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6"
                >
                    <h2 className="text-lg font-semibold text-[#18181B] mb-1 flex items-center gap-2">
                        <Pen className="w-4 h-4 text-blue-600" />
                        Script de la mission
                    </h2>
                    <p className="text-xs text-blue-600 mb-4">Voici le script à suivre pour votre production</p>
                    <div className="bg-white rounded-xl border border-blue-100 p-4">
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
                                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isPast ? 'bg-blue-200' : 'bg-gray-100'}`} />
                                )}
                                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-blue-100 text-blue-600' :
                                    isAction ? 'bg-blue-600 text-white ring-2 ring-blue-300 animate-pulse' :
                                        isCurrent ? 'bg-blue-50 text-blue-500 ring-2 ring-blue-200' :
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
                                        isAction ? 'text-blue-700' :
                                            isCurrent ? 'text-blue-600' :
                                                'text-gray-400'
                                        }`}>
                                        {step.label}
                                        {isAction && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
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
