'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    ChevronRight,
    Building2,
    Clock,
    Globe,
    FileText,
    Megaphone,
    MapPin,
    ExternalLink,
    Receipt,
    Users,
    CheckCircle2,
    LogIn,
} from 'lucide-react'
import { getBrandById, type BrandWithProfile, type CampaignWithDetails } from '@/lib/services/adminService'
import { useActingBrandStore } from '@/stores/useActingBrandStore'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    draft: { label: 'Brief reçu', class: 'bg-[#F0F2F5] text-[#65676B]' },
    open: { label: 'Profils proposés', class: 'bg-[#E7F0FF] text-[#0653CC]' },
    in_progress: { label: 'En production', class: 'bg-[#1C1E21] text-white' },
    completed: { label: 'Terminée', class: 'bg-[#0866FF] text-white' },
    cancelled: { label: 'Annulée', class: 'bg-[#F0F2F5] text-[#8A8D91]' },
}

export default function BrandDetailPage() {
    const params = useParams()
    const router = useRouter()
    const brandId = params.id as string
    const setActingBrand = useActingBrandStore((s) => s.setActingBrand)

    const [brand, setBrand] = useState<BrandWithProfile | null>(null)
    const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const result = await getBrandById(brandId)
            setBrand(result.brand)
            setCampaigns(result.campaigns)
            setIsLoading(false)
        }
        load()
    }, [brandId])

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-4 bg-[#F0F2F5] rounded w-40 animate-pulse" />
                <div className="bg-white rounded-xl border border-[#DADDE1] p-8 animate-pulse">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-lg bg-[#F0F2F5]" />
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-[#F0F2F5] rounded w-1/3" />
                            <div className="h-4 bg-[#F0F2F5] rounded w-1/4" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!brand) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <p className="text-[#65676B] font-medium">Marque introuvable</p>
                <Link href="/mosh-cockpit/brands" className="text-sm text-[#8A8D91] hover:text-[#1C1E21] mt-2 inline-block">
                    ← Retour aux marques
                </Link>
            </div>
        )
    }

    const profile = brand.profiles_brand
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
    const activeCampaigns = campaigns.filter(c => c.status === 'in_progress' || c.status === 'open').length
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_chf || 0), 0)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb + primary action */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-[#8A8D91]">
                    <Link href="/mosh-cockpit/brands" className="hover:text-[#1C1E21] transition-colors flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        Marques
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1C1E21]">{profile?.company_name || brand.full_name}</span>
                </div>
                <button
                    onClick={() => {
                        setActingBrand(brand.id, profile?.company_name || brand.full_name)
                        router.push('/brand')
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0866FF] text-white rounded-lg text-sm font-medium hover:bg-[#0653CC] transition-colors shrink-0"
                >
                    <LogIn className="w-4 h-4" strokeWidth={1.8} />
                    Ouvrir l&apos;espace de la marque
                </button>
            </div>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-[#DADDE1] p-8"
            >
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-lg bg-[#E7F0FF] flex items-center justify-center text-[#0866FF] text-2xl font-bold shrink-0">
                        {(profile?.company_name || brand.full_name)?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#1C1E21] tracking-tight">
                                {profile?.company_name || brand.full_name}
                            </h1>
                            {profile?.industry && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F0F2F5] text-[#1C1E21]">
                                    {profile.industry}
                                </span>
                            )}
                        </div>
                        <p className="text-[#65676B] text-sm mt-1">{brand.email}</p>
                        {profile?.company_name && (
                            <p className="text-[#8A8D91] text-xs mt-0.5">Contact : {brand.full_name}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#65676B]">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                                Client depuis le {new Date(brand.created_at).toLocaleDateString('fr-CH')}
                            </span>
                            {profile?.address && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {profile.address}
                                </span>
                            )}
                            {profile?.website && (
                                <a
                                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 hover:text-[#1C1E21] transition-colors"
                                >
                                    <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {profile.website.replace(/^https?:\/\//, '')}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-3 gap-5"
            >
                <div className="bg-white rounded-xl border border-[#DADDE1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#DADDE1] flex items-center justify-center mx-auto mb-2">
                        <Megaphone className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">{campaigns.length}</p>
                    <p className="text-xs text-[#8A8D91] mt-0.5">mission{campaigns.length > 1 ? 's' : ''} au total</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DADDE1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#DADDE1] flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">{completedCampaigns}</p>
                    <p className="text-xs text-[#8A8D91] mt-0.5">terminée{completedCampaigns > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DADDE1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#DADDE1] flex items-center justify-center mx-auto mb-2">
                        <Receipt className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">
                        {totalBudget > 0 ? `${totalBudget.toLocaleString('fr-CH')}` : '—'}
                    </p>
                    <p className="text-xs text-[#8A8D91] mt-0.5">CHF cumulés</p>
                </div>
            </motion.div>

            {/* Company Details */}
            {(profile?.description || profile?.uid_number) && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl border border-[#DADDE1] p-6"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1C1E21]">Informations entreprise</h2>
                    </div>
                    <div className="space-y-3">
                        {profile?.description && (
                            <div>
                                <p className="text-xs text-[#8A8D91] mb-1">Description</p>
                                <p className="text-[#65676B] text-sm leading-relaxed whitespace-pre-wrap">{profile.description}</p>
                            </div>
                        )}
                        {profile?.uid_number && (
                            <div>
                                <p className="text-xs text-[#8A8D91] mb-1">Numéro IDE</p>
                                <p className="text-sm text-[#1C1E21] font-mono">{profile.uid_number}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Campaign / Mission History */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-xl border border-[#DADDE1] p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[#1C1E21]">Historique des missions</h2>
                    <span className="text-xs text-[#8A8D91] ml-auto">
                        {campaigns.length} mission{campaigns.length > 1 ? 's' : ''}
                        {activeCampaigns > 0 && ` · ${activeCampaigns} en cours`}
                    </span>
                </div>

                {campaigns.length === 0 ? (
                    <p className="text-[#8A8D91] text-sm py-4">Aucune mission pour le moment</p>
                ) : (
                    <div className="divide-y divide-[#DADDE1]">
                        {campaigns.map((campaign) => {
                            const statusCfg = STATUS_LABELS[campaign.status] || STATUS_LABELS.draft
                            const creator = campaign.selected_creator
                            return (
                                <Link
                                    key={campaign.id}
                                    href={`/mosh-cockpit/missions/${campaign.id}`}
                                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#F0F2F5]/50 -mx-2 px-2 rounded-lg transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1C1E21] truncate group-hover:text-[#1C1E21]">
                                            {campaign.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-[#8A8D91]">
                                                {campaign.script_type}
                                                {campaign.budget_chf ? ` · CHF ${campaign.budget_chf.toLocaleString('fr-CH')}` : ''}
                                            </p>
                                            {creator && (
                                                <span className="inline-flex items-center gap-1 text-xs text-[#65676B]">
                                                    <Users className="w-3 h-3" />
                                                    {(creator as any).full_name || '—'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.class}`}>
                                        {statusCfg.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-[#BCC0C4] group-hover:text-[#1C1E21] transition-colors" strokeWidth={1.5} />
                                </Link>
                            )
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
