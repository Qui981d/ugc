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
    Video,
    Clock,
    ChevronRight,
    Target,
    Calendar,
    Package,
} from 'lucide-react'
import { getCampaignById } from '@/lib/services/campaignService'
import { getMissionSteps } from '@/lib/services/adminService'
import { formatCHF } from '@/lib/validations/swiss'
import type { Campaign, MissionStep, MissionStepType } from '@/types/database'

const TIMELINE_STEPS: { type: MissionStepType; label: string; description: string; icon: typeof FileText }[] = [
    { type: 'brief_received', label: 'Brief reçu par MOSH', description: 'Votre brief a été reçu et est en cours d\'analyse.', icon: FileText },
    { type: 'creators_proposed', label: 'Créateur en sélection', description: 'MOSH sélectionne le meilleur créateur pour votre projet.', icon: Users },
    { type: 'creator_validated', label: 'Créateur validé', description: 'Un créateur a été assigné à votre projet.', icon: CheckCircle2 },
    { type: 'script_sent', label: 'Script validé', description: 'Le script de votre vidéo a été finalisé.', icon: FileText },
    { type: 'video_delivered', label: 'Vidéo en production', description: 'Le créateur produit votre vidéo.', icon: Video },
    { type: 'video_validated', label: 'Vidéo validée par MOSH', description: 'MOSH a vérifié la qualité de la vidéo.', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Vidéo livrée', description: 'Votre vidéo est prête !', icon: Package },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Brief envoyé', color: 'text-amber-700', bg: 'bg-amber-50' },
    open: { label: 'Créateur en sélection', color: 'text-blue-700', bg: 'bg-blue-50' },
    in_progress: { label: 'En production', color: 'text-purple-700', bg: 'bg-purple-50' },
    completed: { label: 'Vidéo livrée', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    cancelled: { label: 'Annulé', color: 'text-red-700', bg: 'bg-red-50' },
}

export default function BrandCampaignDetailPage() {
    const params = useParams()
    const campaignId = params.id as string

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadData = useCallback(async () => {
        const [campaignData, missionSteps] = await Promise.all([
            getCampaignById(campaignId),
            getMissionSteps(campaignId),
        ])
        setCampaign(campaignData)
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

    if (isLoading) {
        return <div className="max-w-3xl mx-auto py-12 text-center text-gray-400">Chargement...</div>
    }

    if (!campaign) {
        return <div className="max-w-3xl mx-auto py-12 text-center text-gray-400">Brief introuvable</div>
    }

    const currentStep = getCurrentStepIndex()
    const statusCfg = statusConfig[campaign.status] || statusConfig.draft

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Link href="/brand/campaigns" className="hover:text-[#6C3FA0] transition-colors flex items-center gap-1">
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
                </div>
            </div>

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
                        const isCurrent = i === currentStep + 1
                        const isPast = i <= currentStep
                        const StepIcon = step.icon
                        const completedStep = steps.find(s => s.step_type === step.type)

                        return (
                            <div key={step.type} className="relative flex gap-4">
                                {/* Timeline line */}
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isPast ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                                )}

                                {/* Step icon */}
                                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-100 text-emerald-600' :
                                    isCurrent ? 'bg-[#6C3FA0]/10 text-[#6C3FA0] ring-2 ring-[#6C3FA0]/30' :
                                        'bg-gray-50 text-gray-300'
                                    }`}>
                                    {completed ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <StepIcon className="w-4 h-4" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="pb-8 flex-1 min-w-0">
                                    <p className={`font-medium ${completed ? 'text-gray-900' :
                                        isCurrent ? 'text-[#6C3FA0]' :
                                            'text-gray-400'
                                        }`}>
                                        {step.label}
                                        {isCurrent && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[#6C3FA0]/10 text-[#6C3FA0] px-2 py-0.5 rounded-full">
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
        </div>
    )
}
