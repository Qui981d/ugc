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
    type CampaignWithDetails,
    type CreatorWithProfile,
} from '@/lib/services/adminService'
import type { MissionStep, MissionStepType } from '@/types/database'

const WORKFLOW_STEPS: { type: MissionStepType; label: string; icon: typeof FileText }[] = [
    { type: 'brief_received', label: 'Brief reçu', icon: FileText },
    { type: 'creators_proposed', label: 'Profils proposés', icon: Users },
    { type: 'creator_validated', label: 'Créateur validé', icon: CheckCircle2 },
    { type: 'script_sent', label: 'Script envoyé', icon: Send },
    { type: 'video_delivered', label: 'Vidéo livrée', icon: Video },
    { type: 'video_validated', label: 'Vidéo validée', icon: Shield },
    { type: 'video_sent_to_brand', label: 'Envoyée à la marque', icon: CheckCircle2 },
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
    // Contract & Invoice
    const [creatorAmount, setCreatorAmount] = useState('')
    const [showContractForm, setShowContractForm] = useState(false)
    const [contractText, setContractText] = useState<string | null>(null)
    const [showContractPreview, setShowContractPreview] = useState(false)
    const [invoiceText, setInvoiceText] = useState<string | null>(null)
    const [showInvoicePreview, setShowInvoicePreview] = useState(false)

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

    const handleProposeCreators = async () => {
        if (selectedCreators.length === 0) return
        setActionLoading(true)
        await proposeCreatorsForCampaign(campaignId, selectedCreators)
        setShowCreatorSelector(false)
        setSelectedCreators([])
        await loadData()
        setActionLoading(false)
    }

    const handleAssignCreator = async (creatorId: string) => {
        setActionLoading(true)
        await assignCreatorToCampaign(campaignId, creatorId)
        await loadData()
        setActionLoading(false)
    }

    const handleSaveScript = async (status: 'draft' | 'validated') => {
        setActionLoading(true)
        await updateCampaignScript(campaignId, scriptDraft, status)
        await loadData()
        setActionLoading(false)
    }

    const handleCompleteStep = async (stepType: MissionStepType) => {
        setActionLoading(true)
        await completeMissionStep(campaignId, stepType)
        if (stepType === 'video_sent_to_brand') {
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
                    <button
                        onClick={() => handleCompleteStep('brief_received')}
                        disabled={actionLoading}
                        className="mt-4 px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50"
                    >
                        ✓ Marquer le brief comme traité
                    </button>
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    Script
                    {campaign.script_status === 'validated' && (
                        <span className="text-xs bg-[#C4F042]/20 text-[#18181B] px-2 py-0.5 rounded-full font-medium">Validé</span>
                    )}
                </h2>
                <textarea
                    value={scriptDraft}
                    onChange={(e) => setScriptDraft(e.target.value)}
                    placeholder="Rédigez le script ici..."
                    rows={8}
                    disabled={campaign.script_status === 'validated'}
                    className="w-full bg-[#F4F3EF]/50 border border-black/[0.04] rounded-xl p-4 text-[#18181B] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C4F042]/50 focus:ring-2 focus:ring-[#C4F042]/20 resize-y disabled:opacity-50"
                />
                {campaign.script_status !== 'validated' && (
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
                            ✓ Valider et envoyer au créateur
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Contract Section */}
            {campaign.selected_creator && (
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
                            <span className="text-xs bg-[#F4F3EF] text-[#71717A] px-2 py-0.5 rounded-full font-medium">En attente</span>
                        )}
                    </h2>

                    {!campaign.contract_mosh_status ? (
                        showContractForm ? (
                            <div className="space-y-4">
                                <p className="text-sm text-[#71717A]">Définissez le montant de rémunération du créateur pour cette mission :</p>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 max-w-xs">
                                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" strokeWidth={1.5} />
                                        <input
                                            type="number"
                                            value={creatorAmount}
                                            onChange={(e) => setCreatorAmount(e.target.value)}
                                            placeholder="Ex: 300"
                                            className="w-full pl-10 pr-16 py-3 bg-[#F4F3EF]/50 border border-black/[0.04] rounded-xl text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#C4F042]/50 focus:ring-2 focus:ring-[#C4F042]/20"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#A1A1AA]">CHF</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerateContract}
                                        disabled={actionLoading || !creatorAmount || parseFloat(creatorAmount) <= 0}
                                        className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" strokeWidth={1.5} />}
                                        Générer le contrat
                                    </button>
                                    <button
                                        onClick={() => setShowContractForm(false)}
                                        className="px-4 py-2 bg-[#F4F3EF] text-[#18181B] rounded-xl hover:bg-[#E8E6DF] transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowContractForm(true)}
                                className="px-4 py-2 bg-[#18181B] text-white font-medium rounded-xl hover:bg-[#18181B]/80 transition-colors flex items-center gap-2"
                            >
                                <ScrollText className="w-4 h-4" strokeWidth={1.5} />
                                Générer le contrat
                            </button>
                        )
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-[#71717A]">
                                <span>Montant créateur : <strong className="text-[#18181B]">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</strong></span>
                                {campaign.contract_mosh_generated_at && (
                                    <span>Généré le {new Date(campaign.contract_mosh_generated_at).toLocaleDateString('fr-CH')}</span>
                                )}
                                {campaign.contract_mosh_signed_at && (
                                    <span className="text-[#18181B] font-medium">Signé le {new Date(campaign.contract_mosh_signed_at).toLocaleDateString('fr-CH')}</span>
                                )}
                            </div>
                            <div className="flex gap-3">
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
                        </div>
                    )}
                </motion.div>
            )}

            {/* Contract Preview Modal */}
            {showContractPreview && contractText && (
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
            )}

            {/* Video / Deliverables Section */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                <h2 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    Vidéo
                </h2>
                {!isStepCompleted('video_delivered') ? (
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
                ) : (
                    <p className="text-[#18181B] text-sm font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#C4F042]" strokeWidth={1.5} />
                        Vidéo envoyée à la marque — Mission terminée
                    </p>
                )}
            </motion.div>

            {/* Invoice Section */}
            {isStepCompleted('video_sent_to_brand') && (
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
            )}

            {/* Invoice Preview Modal */}
            {showInvoicePreview && invoiceText && (
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
            )}
        </div>
    )
}
