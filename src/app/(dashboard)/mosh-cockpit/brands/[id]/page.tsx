'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
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
} from 'lucide-react'
import { getBrandById, type BrandWithProfile, type CampaignWithDetails } from '@/lib/services/adminService'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    draft: { label: 'Brief reçu', class: 'bg-[#F4F3EF] text-[#71717A]' },
    open: { label: 'Profils proposés', class: 'bg-[#C4F042]/20 text-[#3F3F00]' },
    in_progress: { label: 'En production', class: 'bg-[#18181B] text-white' },
    completed: { label: 'Terminée', class: 'bg-[#C4F042] text-[#18181B]' },
    cancelled: { label: 'Annulée', class: 'bg-[#F4F3EF] text-[#A1A1AA]' },
}

export default function BrandDetailPage() {
    const params = useParams()
    const brandId = params.id as string

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
                <div className="h-4 bg-[#F4F3EF] rounded w-40 animate-pulse" />
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-8 animate-pulse">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-[#F4F3EF]" />
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-[#F4F3EF] rounded w-1/3" />
                            <div className="h-4 bg-[#F4F3EF] rounded w-1/4" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!brand) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <p className="text-[#71717A] font-medium">Marque introuvable</p>
                <Link href="/mosh-cockpit/brands" className="text-sm text-[#A1A1AA] hover:text-[#18181B] mt-2 inline-block">
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
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <Link href="/mosh-cockpit/brands" className="hover:text-[#18181B] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Marques
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#18181B]">{profile?.company_name || brand.full_name}</span>
            </div>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-8"
            >
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#18181B] flex items-center justify-center text-[#C4F042] text-2xl font-bold shrink-0">
                        {(profile?.company_name || brand.full_name)?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#18181B] tracking-tight">
                                {profile?.company_name || brand.full_name}
                            </h1>
                            {profile?.industry && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F4F3EF] text-[#18181B]">
                                    {profile.industry}
                                </span>
                            )}
                        </div>
                        <p className="text-[#71717A] text-sm mt-1">{brand.email}</p>
                        {profile?.company_name && (
                            <p className="text-[#A1A1AA] text-xs mt-0.5">Contact : {brand.full_name}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#71717A]">
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
                                    className="flex items-center gap-1.5 hover:text-[#18181B] transition-colors"
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
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-5 text-center">
                    <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2">
                        <Megaphone className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#18181B]">{campaigns.length}</p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">mission{campaigns.length > 1 ? 's' : ''} au total</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-5 text-center">
                    <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#18181B]">{completedCampaigns}</p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">terminée{completedCampaigns > 1 ? 's' : ''}</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-5 text-center">
                    <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2">
                        <Receipt className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#18181B]">
                        {totalBudget > 0 ? `${totalBudget.toLocaleString('fr-CH')}` : '—'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">CHF cumulés</p>
                </div>
            </motion.div>

            {/* Company Details */}
            {(profile?.description || profile?.uid_number) && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#18181B]">Informations entreprise</h2>
                    </div>
                    <div className="space-y-3">
                        {profile?.description && (
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Description</p>
                                <p className="text-[#71717A] text-sm leading-relaxed whitespace-pre-wrap">{profile.description}</p>
                            </div>
                        )}
                        {profile?.uid_number && (
                            <div>
                                <p className="text-xs text-[#A1A1AA] mb-1">Numéro IDE</p>
                                <p className="text-sm text-[#18181B] font-mono">{profile.uid_number}</p>
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
                className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[#18181B]">Historique des missions</h2>
                    <span className="text-xs text-[#A1A1AA] ml-auto">
                        {campaigns.length} mission{campaigns.length > 1 ? 's' : ''}
                        {activeCampaigns > 0 && ` · ${activeCampaigns} en cours`}
                    </span>
                </div>

                {campaigns.length === 0 ? (
                    <p className="text-[#A1A1AA] text-sm py-4">Aucune mission pour le moment</p>
                ) : (
                    <div className="divide-y divide-black/[0.04]">
                        {campaigns.map((campaign) => {
                            const statusCfg = STATUS_LABELS[campaign.status] || STATUS_LABELS.draft
                            const creator = campaign.selected_creator
                            return (
                                <Link
                                    key={campaign.id}
                                    href={`/mosh-cockpit/missions/${campaign.id}`}
                                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#F4F3EF]/50 -mx-2 px-2 rounded-xl transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#18181B] truncate group-hover:text-[#18181B]">
                                            {campaign.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-[#A1A1AA]">
                                                {campaign.script_type}
                                                {campaign.budget_chf ? ` · CHF ${campaign.budget_chf.toLocaleString('fr-CH')}` : ''}
                                            </p>
                                            {creator && (
                                                <span className="inline-flex items-center gap-1 text-xs text-[#71717A]">
                                                    <Users className="w-3 h-3" />
                                                    {(creator as any).full_name || '—'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.class}`}>
                                        {statusCfg.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-[#D4D4D8] group-hover:text-[#18181B] transition-colors" strokeWidth={1.5} />
                                </Link>
                            )
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
