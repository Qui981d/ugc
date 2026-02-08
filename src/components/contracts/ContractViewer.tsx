'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    FileText,
    Download,
    CheckCircle2,
    Clock,
    Loader2,
    Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContractViewerProps {
    isOpen: boolean
    onClose: () => void
    contractText: string | null
    contractStatus: 'pending_creator' | 'active' | 'cancelled' | null
    onSign?: () => void
    isSignLoading?: boolean
    mode: 'brand' | 'creator'
    contractUrl?: string | null
}

export default function ContractViewer({
    isOpen,
    onClose,
    contractText,
    contractStatus,
    onSign,
    isSignLoading,
    mode,
    contractUrl,
}: ContractViewerProps) {
    const [accepted, setAccepted] = useState(false)

    if (!isOpen) return null

    const statusConfig = {
        pending_creator: {
            label: 'En attente de signature du créateur',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10 border-amber-500/20',
            icon: Clock,
        },
        active: {
            label: 'Contrat signé par les deux parties',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20',
            icon: CheckCircle2,
        },
        cancelled: {
            label: 'Contrat résilié',
            color: 'text-red-400',
            bgColor: 'bg-red-500/10 border-red-500/20',
            icon: X,
        },
    }

    const status = contractStatus ? statusConfig[contractStatus] : null
    const StatusIcon = status?.icon || Clock
    const needsCreatorSignature = mode === 'creator' && contractStatus === 'pending_creator'

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

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
                        <div className="flex items-center justify-between p-5 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Contrat de mandat</h2>
                                    <p className="text-xs text-white/50">Art. 394 ss CO</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* Status badge */}
                        {status && (
                            <div className="px-5 pb-3">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${status.bgColor}`}>
                                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                    <span className={`text-sm ${status.color}`}>{status.label}</span>
                                </div>
                            </div>
                        )}

                        {/* Contract text */}
                        <div className="flex-1 overflow-y-auto px-5">
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                                <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed">
                                    {contractText || 'Chargement du contrat...'}
                                </pre>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/[0.08] p-5 space-y-3 bg-[#0a0a0f]">
                            {/* Creator needs to sign */}
                            {needsCreatorSignature && onSign && (
                                <>
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

                                    <Button
                                        onClick={onSign}
                                        disabled={!accepted || isSignLoading}
                                        className="w-full btn-primary h-12 text-base font-semibold disabled:opacity-40"
                                    >
                                        {isSignLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Signature en cours...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                Signer et commencer la mission
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-[10px] text-white/30 text-center">
                                        Signature électronique — Art. 1 CO
                                    </p>
                                </>
                            )}

                            {/* Already signed — show download */}
                            {!needsCreatorSignature && (
                                <div className="flex gap-3">
                                    {contractUrl && (
                                        <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                            <Button
                                                variant="ghost"
                                                className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Télécharger
                                            </Button>
                                        </a>
                                    )}
                                    <Button
                                        onClick={onClose}
                                        className="flex-1 btn-primary"
                                    >
                                        Fermer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
