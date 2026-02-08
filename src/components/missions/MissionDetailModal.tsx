'use client'

import { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    DollarSign,
    Briefcase,
    Clock,
    FileText,
    MessageSquare,
    Upload,
    Building2,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Package,
} from 'lucide-react'
import { formatCHF } from '@/lib/validations/swiss'
import { getCampaignById } from '@/lib/services/campaignService'
import type { CampaignWithBrand } from '@/lib/services/campaignService'
import { useRouter } from 'next/navigation'

interface MissionDetailModalProps {
    isOpen: boolean
    onClose: () => void
    missionId: string
    campaignId: string
    applicationStatus: string
    userRole: 'creator' | 'brand'
}

const statusConfig: Record<string, { label: string; class: string }> = {
    accepted: { label: 'En cours', class: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    pending: { label: 'En attente', class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    completed: { label: 'Terminée', class: 'bg-green-500/20 text-green-300 border-green-500/30' },
    rejected: { label: 'Refusée', class: 'bg-red-500/20 text-red-300 border-red-500/30' },
    delivered: { label: 'Livré', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
}

export default function MissionDetailModal({
    isOpen,
    onClose,
    missionId,
    campaignId,
    applicationStatus,
    userRole,
}: MissionDetailModalProps) {
    const router = useRouter()
    const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!isOpen || !campaignId) return

        async function fetchCampaign() {
            setIsLoading(true)
            const data = await getCampaignById(campaignId)
            setCampaign(data)
            setIsLoading(false)
        }

        fetchCampaign()
    }, [isOpen, campaignId])

    const status = statusConfig[applicationStatus] || statusConfig.pending

    const handleMessage = () => {
        onClose()
        router.push(`/${userRole}/messages?campaign=${campaignId}`)
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="!w-[480px] !max-w-[480px] bg-[#0f1419] border-white/10 overflow-y-auto p-0"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <SheetTitle className="sr-only">Chargement...</SheetTitle>
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                ) : campaign ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <SheetHeader className="p-6 pb-4 border-b border-white/10">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-6 h-6 text-white/40" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-white text-lg">
                                        {campaign.title}
                                    </SheetTitle>
                                    <SheetDescription className="text-white/50 mt-1">
                                        {(campaign as any).brand?.full_name || 'Marque'}
                                    </SheetDescription>
                                </div>
                            </div>
                            <Badge className={`${status.class} border mt-3 w-fit`}>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {status.label}
                            </Badge>
                        </SheetHeader>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.08]">
                                    <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        Budget
                                    </div>
                                    <p className="text-white font-semibold text-lg">
                                        {formatCHF(campaign.budget_chf)}
                                    </p>
                                </div>
                                {campaign.deadline && (
                                    <div className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.08]">
                                        <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Échéance
                                        </div>
                                        <p className="text-white font-semibold">
                                            {new Date(campaign.deadline).toLocaleDateString('fr-CH', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Campaign Details */}
                            {campaign.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Description
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                                        {campaign.description}
                                    </p>
                                </div>
                            )}

                            {/* Product Info */}
                            {(campaign.product_name || campaign.product_description) && (
                                <div>
                                    <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Produit
                                    </h3>
                                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06] space-y-2">
                                        {campaign.product_name && (
                                            <p className="text-sm font-medium text-white">
                                                {campaign.product_name}
                                            </p>
                                        )}
                                        {campaign.product_description && (
                                            <p className="text-sm text-white/60 leading-relaxed">
                                                {campaign.product_description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Technical Details */}
                            <div>
                                <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Spécifications
                                </h3>
                                <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06] space-y-3">
                                    {campaign.format && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/50">Format</span>
                                            <span className="text-sm text-white font-medium">{campaign.format}</span>
                                        </div>
                                    )}
                                    {campaign.script_type && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/50">Type de script</span>
                                            <span className="text-sm text-white font-medium">{campaign.script_type}</span>
                                        </div>
                                    )}
                                    {campaign.rights_usage && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/50">Droits d'utilisation</span>
                                            <span className="text-sm text-white font-medium">{campaign.rights_usage}</span>
                                        </div>
                                    )}
                                    {(campaign as any).duration_days && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/50">Durée</span>
                                            <span className="text-sm text-white font-medium">{(campaign as any).duration_days} jours</span>
                                        </div>
                                    )}
                                    {(campaign as any).creator_count && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-white/50">Créateurs recherchés</span>
                                            <span className="text-sm text-white font-medium">{(campaign as any).creator_count}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Script Notes */}
                            {campaign.script_notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Notes de script
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                                        {campaign.script_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 pt-4 border-t border-white/10 space-y-2">
                            <Button
                                onClick={handleMessage}
                                className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Envoyer un message
                            </Button>
                            {applicationStatus === 'accepted' && (
                                <Button className="w-full btn-primary">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Livrer le contenu
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-white/40">
                        <SheetTitle className="sr-only">Erreur</SheetTitle>
                        <p>Impossible de charger les détails</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
