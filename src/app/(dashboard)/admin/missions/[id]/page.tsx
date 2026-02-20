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
        // Auto-generate invoice when mission is complete
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
        return <div className="max-w-5xl mx-auto py-12 text-center text-white/40">Chargement...</div>
    }

    if (!campaign) {
        return <div className="max-w-5xl mx-auto py-12 text-center text-white/40">Mission introuvable</div>
    }

    const currentStep = getCurrentStepIndex()

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/40">
                <Link href="/admin/missions" className="hover:text-accent transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Missions
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white">{campaign.title}</span>
            </div>

            {/* Title & Meta */}
            <div>
                <h1 className="text-3xl font-bold text-white">{campaign.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {campaign.selected_creator?.full_name || 'Non assigné'}
                    </span>
                    {campaign.deadline && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                        </span>
                    )}
                    <span>CHF {campaign.budget_chf?.toLocaleString('fr-CH')}</span>
                </div>
            </div>

            {/* Workflow Progress */}
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Progression du workflow</h2>
                <div className="flex items-center gap-1">
                    {WORKFLOW_STEPS.map((step, i) => {
                        const completed = isStepCompleted(step.type)
                        const isCurrent = i === currentStep + 1
                        const StepIcon = step.icon

                        return (
                            <div key={step.type} className="flex items-center flex-1">
                                <div className="flex flex-col items-center w-full">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${completed ? 'bg-emerald-400/20 text-emerald-400' :
                                        isCurrent ? 'bg-accent/20 text-accent ring-2 ring-accent/40' :
                                            'bg-white/5 text-white/20'
                                        }`}>
                                        <StepIcon className="w-4 h-4" />
                                    </div>
                                    <p className={`text-[10px] text-center leading-tight ${completed ? 'text-emerald-400' :
                                        isCurrent ? 'text-accent' :
                                            'text-white/20'
                                        }`}>
                                        {step.label}
                                    </p>
                                </div>
                                {i < WORKFLOW_STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-1 mt-[-20px] ${completed ? 'bg-emerald-400/40' : 'bg-white/5'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Brief Section */}
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    Brief de la marque
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-white/40 mb-1">Produit</p>
                        <p className="text-white">{campaign.product_name}</p>
                    </div>
                    <div>
                        <p className="text-white/40 mb-1">Format</p>
                        <p className="text-white">{campaign.format}</p>
                    </div>
                    <div>
                        <p className="text-white/40 mb-1">Type de script</p>
                        <p className="text-white">{campaign.script_type}</p>
                    </div>
                    <div>
                        <p className="text-white/40 mb-1">Droits d&apos;usage</p>
                        <p className="text-white">{campaign.rights_usage}</p>
                    </div>
                    {campaign.description && (
                        <div className="col-span-2">
                            <p className="text-white/40 mb-1">Description</p>
                            <p className="text-white whitespace-pre-wrap">{campaign.description}</p>
                        </div>
                    )}
                    {campaign.product_description && (
                        <div className="col-span-2">
                            <p className="text-white/40 mb-1">Description du produit</p>
                            <p className="text-white whitespace-pre-wrap">{campaign.product_description}</p>
                        </div>
                    )}
                </div>
                {!isStepCompleted('brief_received') && (
                    <button
                        onClick={() => handleCompleteStep('brief_received')}
                        disabled={actionLoading}
                        className="mt-4 px-4 py-2 bg-amber-500 text-black font-medium rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                        ✓ Marquer le brief comme traité
                    </button>
                )}
            </div>

            {/* Creators Section */}
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Sélection des créateurs
                </h2>

                {campaign.selected_creator ? (
                    <div className="flex items-center gap-4 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 font-bold">
                            {campaign.selected_creator.full_name?.[0] || '?'}
                        </div>
                        <div>
                            <p className="text-white font-medium">{campaign.selected_creator.full_name}</p>
                            <p className="text-emerald-400 text-sm">Créateur validé ✓</p>
                        </div>
                    </div>
                ) : showCreatorSelector ? (
                    <div className="space-y-3">
                        <p className="text-sm text-white/50">Sélectionnez 2-3 créateurs à proposer à la marque :</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                            {creators.map(creator => (
                                <label
                                    key={creator.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCreators.includes(creator.id)
                                        ? 'border-accent bg-accent/10'
                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
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
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">
                                        {creator.full_name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{creator.full_name}</p>
                                        <p className="text-white/40 text-xs truncate">
                                            {creator.profiles_creator?.location_canton || 'Suisse'}
                                            {creator.profiles_creator?.specialties?.length ? ` · ${creator.profiles_creator.specialties[0]}` : ''}
                                        </p>
                                    </div>
                                    {selectedCreators.includes(creator.id) && (
                                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                                    )}
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleProposeCreators}
                                disabled={selectedCreators.length === 0 || actionLoading}
                                className="px-4 py-2 bg-accent text-black font-medium rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
                            >
                                Proposer {selectedCreators.length} créateur{selectedCreators.length > 1 ? 's' : ''}
                            </button>
                            <button
                                onClick={() => { setShowCreatorSelector(false); setSelectedCreators([]) }}
                                className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCreatorSelector(true)}
                        className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-400 transition-colors"
                    >
                        + Sélectionner des créateurs
                    </button>
                )}
            </div>

            {/* Script Section */}
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-purple-400" />
                    Script
                    {campaign.script_status === 'validated' && (
                        <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full">Validé</span>
                    )}
                </h2>
                <textarea
                    value={scriptDraft}
                    onChange={(e) => setScriptDraft(e.target.value)}
                    placeholder="Rédigez le script ici..."
                    rows={8}
                    disabled={campaign.script_status === 'validated'}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 resize-y disabled:opacity-50"
                />
                {campaign.script_status !== 'validated' && (
                    <div className="flex gap-3 mt-3">
                        <button
                            onClick={() => handleSaveScript('draft')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                        >
                            Sauvegarder le brouillon
                        </button>
                        <button
                            onClick={() => handleSaveScript('validated')}
                            disabled={actionLoading || !scriptDraft}
                            className="px-4 py-2 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-400 transition-colors disabled:opacity-50"
                        >
                            ✓ Valider et envoyer au créateur
                        </button>
                    </div>
                )}
            </div>

            {/* Contract Section */}
            {campaign.selected_creator && (
                <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-orange-400" />
                        Contrat MOSH ↔ Créateur
                        {campaign.contract_mosh_status === 'active' && (
                            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full">Signé ✓</span>
                        )}
                        {campaign.contract_mosh_status === 'pending_creator' && (
                            <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">En attente de signature</span>
                        )}
                    </h2>

                    {!campaign.contract_mosh_status ? (
                        // No contract yet
                        showContractForm ? (
                            <div className="space-y-4">
                                <p className="text-sm text-white/50">Définissez le montant de rémunération du créateur pour cette mission :</p>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 max-w-xs">
                                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="number"
                                            value={creatorAmount}
                                            onChange={(e) => setCreatorAmount(e.target.value)}
                                            placeholder="Ex: 300"
                                            className="w-full pl-10 pr-16 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">CHF</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerateContract}
                                        disabled={actionLoading || !creatorAmount || parseFloat(creatorAmount) <= 0}
                                        className="px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScrollText className="w-4 h-4" />}
                                        Générer le contrat
                                    </button>
                                    <button
                                        onClick={() => setShowContractForm(false)}
                                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowContractForm(true)}
                                className="px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-400 transition-colors flex items-center gap-2"
                            >
                                <ScrollText className="w-4 h-4" />
                                Générer le contrat
                            </button>
                        )
                    ) : (
                        // Contract exists
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-white/50">
                                <span>Montant créateur : <strong className="text-white">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</strong></span>
                                {campaign.contract_mosh_generated_at && (
                                    <span>Généré le {new Date(campaign.contract_mosh_generated_at).toLocaleDateString('fr-CH')}</span>
                                )}
                                {campaign.contract_mosh_signed_at && (
                                    <span className="text-emerald-400">Signé le {new Date(campaign.contract_mosh_signed_at).toLocaleDateString('fr-CH')}</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleViewContract}
                                    className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Voir le contrat
                                </button>
                                {campaign.contract_mosh_url && (
                                    <a
                                        href={campaign.contract_mosh_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Télécharger
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Contract Preview Modal */}
            {showContractPreview && contractText && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowContractPreview(false)}>
                    <div className="bg-[#0a0a0f] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <ScrollText className="w-5 h-5 text-orange-400" /> Contrat de mandat
                            </h3>
                            <button onClick={() => setShowContractPreview(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed">{contractText}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Video / Deliverables Section */}
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-pink-400" />
                    Vidéo
                </h2>
                {!isStepCompleted('video_delivered') ? (
                    <div className="text-white/40 text-sm py-4">
                        En attente de la livraison du créateur...
                    </div>
                ) : !isStepCompleted('video_validated') ? (
                    <div className="space-y-4">
                        <p className="text-emerald-400 text-sm">✓ Vidéo livrée par le créateur</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleCompleteStep('video_validated')}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
                            >
                                ✓ Valider la vidéo
                            </button>
                        </div>
                    </div>
                ) : !isStepCompleted('video_sent_to_brand') ? (
                    <div className="space-y-4">
                        <p className="text-emerald-400 text-sm">✓ Vidéo validée</p>
                        <button
                            onClick={() => handleCompleteStep('video_sent_to_brand')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-accent text-black font-medium rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
                        >
                            Envoyer la vidéo à la marque
                        </button>
                    </div>
                ) : (
                    <p className="text-emerald-400 text-sm">✓ Vidéo envoyée à la marque — Mission terminée</p>
                )}
            </div>

            {/* Invoice Section */}
            {isStepCompleted('video_sent_to_brand') && (
                <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-cyan-400" />
                        Facture
                        {campaign.invoice_number && (
                            <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full">{campaign.invoice_number}</span>
                        )}
                    </h2>

                    {campaign.invoice_number ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-white/50">
                                <span>Montant : <strong className="text-white">CHF {campaign.creator_amount_chf?.toLocaleString('fr-CH')}</strong></span>
                                {campaign.invoice_generated_at && (
                                    <span>Générée le {new Date(campaign.invoice_generated_at).toLocaleDateString('fr-CH')}</span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleViewInvoice}
                                    className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Voir la facture
                                </button>
                                {campaign.invoice_url && (
                                    <a
                                        href={campaign.invoice_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Télécharger
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-white/50">La mission est terminée. Générez la facture pour le créateur.</p>
                            <button
                                onClick={handleGenerateInvoice}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                                Générer la facture
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Invoice Preview Modal */}
            {showInvoicePreview && invoiceText && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInvoicePreview(false)}>
                    <div className="bg-[#0a0a0f] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-cyan-400" /> Facture
                            </h3>
                            <button onClick={() => setShowInvoicePreview(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed">{invoiceText}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
