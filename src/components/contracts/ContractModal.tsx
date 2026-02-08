'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    FileText,
    CheckCircle2,
    Loader2,
    ChevronDown,
    ChevronUp,
    User,
    Building2,
    Calendar,
    Banknote,
    ScrollText,
    Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateContractText } from '@/lib/contracts/contractTemplate'

interface ContractModalProps {
    isOpen: boolean
    onClose: () => void
    onAccept: () => void
    isLoading: boolean
    // Contract summary data
    data: {
        brandName: string
        brandContact: string
        creatorName: string
        campaignTitle: string
        campaignDescription: string
        amount: number
        deadline: string | null
        format: string
        scriptType: string
    }
    mode: 'brand' | 'creator'
    contractText?: string | null
}

const formatMap: Record<string, string> = {
    '9_16': 'Vertical 9:16',
    '16_9': 'Horizontal 16:9',
    '1_1': 'Carré 1:1',
    '4_5': 'Portrait 4:5',
}

const typeMap: Record<string, string> = {
    testimonial: 'Témoignage',
    unboxing: 'Unboxing',
    asmr: 'ASMR',
    tutorial: 'Tutoriel',
    lifestyle: 'Lifestyle',
    review: 'Review',
}

export default function ContractModal({
    isOpen,
    onClose,
    onAccept,
    isLoading,
    data,
    mode,
    contractText,
}: ContractModalProps) {
    const [accepted, setAccepted] = useState(false)
    const [showFullContract, setShowFullContract] = useState(false)

    // Generate preview text from template using data already available
    const previewText = useMemo(() => {
        if (contractText) return contractText
        return generateContractText({
            CONTRACT_ID: '(sera généré à la signature)',
            CONTRACT_DATE: new Date().toLocaleDateString('fr-CH'),
            BRAND_COMPANY_NAME: data.brandName,
            BRAND_CONTACT_NAME: data.brandContact,
            BRAND_ADDRESS: '(adresse du profil)',
            BRAND_EMAIL: '(email du compte)',
            CREATOR_FULL_NAME: data.creatorName,
            CREATOR_ADDRESS: '(adresse du profil)',
            CREATOR_EMAIL: '(email du compte)',
            CAMPAIGN_TITLE: data.campaignTitle,
            CAMPAIGN_DESCRIPTION: data.campaignDescription || 'Selon le brief créatif',
            DELIVERABLES: `1 vidéo ${typeMap[data.scriptType] || data.scriptType} au format ${formatMap[data.format] || data.format}`,
            DEADLINE: data.deadline
                ? new Date(data.deadline).toLocaleDateString('fr-CH')
                : 'À convenir entre les parties',
            REVISION_COUNT: '2',
            AMOUNT_CHF: data.amount.toLocaleString('fr-CH'),
            PAYMENT_TERMS: 'Paiement intégral via la plateforme UGC Suisse après validation des livrables.',
            BRAND_ACCEPTANCE_TIMESTAMP: '(en attente de signature)',
            BRAND_IP_ADDRESS: '(en attente)',
            CREATOR_ACCEPTANCE_TIMESTAMP: '(en attente de signature)',
            CREATOR_IP_ADDRESS: '(en attente)',
        })
    }, [data, contractText])

    // Reset when opening + lock body scroll
    useEffect(() => {
        if (isOpen) {
            setAccepted(false)
            setShowFullContract(false)
            // Lock body scroll
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal / Bottom Sheet */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 
                                   bg-[#0a0a0f] border border-white/[0.15] 
                                   rounded-t-3xl md:rounded-2xl 
                                   w-full md:w-[600px] md:max-w-[95vw]
                                   max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Mobile drag indicator */}
                        <div className="md:hidden flex justify-center pt-3">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                                    <ScrollText className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        {mode === 'brand' ? 'Contrat de mandat' : 'Contrat à signer'}
                                    </h2>
                                    <p className="text-xs text-white/50">
                                        Droit suisse — Art. 394 ss CO
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Contract Summary Cards */}
                            <div className="space-y-3">
                                {/* Parties */}
                                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                                        Parties
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-accent flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-white font-medium">
                                                    {data.brandName}
                                                </p>
                                                <p className="text-xs text-white/40">
                                                    Marque — {data.brandContact}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/[0.06]" />
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-white font-medium">
                                                    {data.creatorName}
                                                </p>
                                                <p className="text-xs text-white/40">
                                                    Créateur indépendant
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mission */}
                                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                                        Mission
                                    </h3>
                                    <p className="text-sm text-white font-medium">
                                        {data.campaignTitle}
                                    </p>
                                    {data.campaignDescription && (
                                        <p className="text-xs text-white/50 mt-1 line-clamp-2">
                                            {data.campaignDescription}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-md">
                                            {typeMap[data.scriptType] || data.scriptType}
                                        </span>
                                        <span className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-md">
                                            {formatMap[data.format] || data.format}
                                        </span>
                                    </div>
                                </div>

                                {/* Amount & Deadline */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-xs text-white/40">Montant</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">
                                            {data.amount.toLocaleString('fr-CH')} <span className="text-sm text-white/50">CHF</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3.5 h-3.5 text-accent" />
                                            <span className="text-xs text-white/40">Deadline</span>
                                        </div>
                                        <p className="text-sm font-semibold text-white">
                                            {data.deadline
                                                ? new Date(data.deadline).toLocaleDateString('fr-CH')
                                                : 'À convenir'}
                                        </p>
                                    </div>
                                </div>

                                {/* Key clauses summary */}
                                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
                                        Clauses principales
                                    </h3>
                                    <div className="space-y-2 text-xs text-white/60">
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                            <span>Cession des droits de propriété intellectuelle (non-exclusive, mondiale)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                            <span>2 révisions incluses dans le tarif</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                            <span>Autorisation d'utilisation de l'image (Art. 28 CC)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                            <span>Confidentialité des informations échangées (2 ans)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                                            <span>Résiliation possible en tout temps (Art. 404 CO)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Full contract expandable */}
                                <button
                                    onClick={() => setShowFullContract(!showFullContract)}
                                    className="w-full flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.05] transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-white/40" />
                                        <span className="text-sm text-white/60">
                                            Lire le contrat complet
                                        </span>
                                    </div>
                                    {showFullContract
                                        ? <ChevronUp className="w-4 h-4 text-white/40" />
                                        : <ChevronDown className="w-4 h-4 text-white/40" />
                                    }
                                </button>

                                <AnimatePresence>
                                    {showFullContract && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 max-h-[400px] overflow-y-auto">
                                                <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed">
                                                    {previewText}
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer — Sticky */}
                        <div className="border-t border-white/[0.08] p-5 space-y-3 bg-[#0a0a0f]">
                            {/* Checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${accepted
                                        ? 'bg-accent border-accent'
                                        : 'border-white/20 group-hover:border-white/40'
                                        }`}>
                                        {accepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </div>
                                <span className="text-xs text-white/60 leading-relaxed">
                                    Je confirme avoir pris connaissance des conditions du contrat de mandat et j'accepte
                                    l'ensemble des clauses conformément aux articles 394 ss du Code des obligations suisse.
                                </span>
                            </label>

                            {/* Sign button */}
                            <Button
                                onClick={onAccept}
                                disabled={!accepted || isLoading}
                                className="w-full btn-primary h-12 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Signature en cours...
                                    </>
                                ) : mode === 'brand' ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Accepter et signer le contrat
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Signer et commencer la mission
                                    </>
                                )}
                            </Button>

                            <p className="text-[10px] text-white/30 text-center">
                                Signature électronique valable conformément à l'Art. 1 CO — Horodatage et IP enregistrés
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        , document.body)
}
