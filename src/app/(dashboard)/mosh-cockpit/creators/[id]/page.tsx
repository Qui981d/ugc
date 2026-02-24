'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    ChevronRight,
    MapPin,
    Star,
    Clock,
    Sparkles,
    Globe,
    Wallet,
    Video,
    CheckCircle2,
    FileText,
    Building2,
    ExternalLink
} from 'lucide-react'
import { getCreatorById, type CreatorWithProfile, type CampaignWithDetails } from '@/lib/services/adminService'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    draft: { label: 'Brief reçu', class: 'bg-[#F4F3EF] text-[#71717A]' },
    open: { label: 'Profils proposés', class: 'bg-[#C4F042]/20 text-[#3F3F00]' },
    in_progress: { label: 'En production', class: 'bg-[#18181B] text-white' },
    completed: { label: 'Terminée', class: 'bg-[#C4F042] text-[#18181B]' },
    cancelled: { label: 'Annulée', class: 'bg-[#F4F3EF] text-[#A1A1AA]' },
}

export default function CreatorDetailPage() {
    const params = useParams()
    const creatorId = params.id as string

    const [creator, setCreator] = useState<CreatorWithProfile | null>(null)
    const [missions, setMissions] = useState<CampaignWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const result = await getCreatorById(creatorId)
            setCreator(result.creator)
            setMissions(result.missions)
            setIsLoading(false)
        }
        load()
    }, [creatorId])

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

    if (!creator) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <p className="text-[#71717A] font-medium">Créateur introuvable</p>
                <Link href="/mosh-cockpit/creators" className="text-sm text-[#A1A1AA] hover:text-[#18181B] mt-2 inline-block">
                    ← Retour au répertoire
                </Link>
            </div>
        )
    }

    const profile = creator.profiles_creator
    const completedMissions = missions.filter(m => m.status === 'completed').length

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                <Link href="/mosh-cockpit/creators" className="hover:text-[#18181B] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Créateurs
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#18181B]">{creator.full_name}</span>
            </div>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-8"
            >
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#C4F042]/20 flex items-center justify-center text-[#18181B] text-2xl font-bold shrink-0">
                        {creator.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#18181B] tracking-tight">{creator.full_name}</h1>
                            {profile?.is_available ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#C4F042]/20 text-[#18181B]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C4F042]" />
                                    Disponible
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F4F3EF] text-[#A1A1AA]">
                                    Indisponible
                                </span>
                            )}
                        </div>
                        <p className="text-[#71717A] text-sm mt-1">{creator.email}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#71717A]">
                            {profile?.location_canton && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {profile.location_canton}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                                Inscrit le {new Date(creator.created_at).toLocaleDateString('fr-CH')}
                            </span>
                            {profile?.address && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {profile.address}
                                </span>
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
                        <Star className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#18181B]">
                        {profile?.rating_avg ? profile.rating_avg.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">{profile?.rating_count || 0} avis</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-5 text-center">
                    <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2">
                        <Video className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#18181B]">{completedMissions}</p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">missions terminées</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-5 text-center">
                    <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2">
                        <Wallet className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#18181B]">
                        {profile?.hourly_rate_chf ? `${profile.hourly_rate_chf}` : '—'}
                    </p>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">CHF / heure</p>
                </div>
            </motion.div>

            {/* Bio */}
            {profile?.bio && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6"
                >
                    <h2 className="text-sm font-semibold text-[#18181B] mb-3">Bio</h2>
                    <p className="text-[#71717A] text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </motion.div>
            )}

            {/* Specialties & Languages */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="grid grid-cols-2 gap-5"
            >
                {/* Specialties */}
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#18181B]">Spécialités</h2>
                    </div>
                    {profile?.specialties?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.specialties.map(s => (
                                <span key={s} className="px-3 py-1.5 bg-[#C4F042]/15 text-[#18181B] rounded-full text-xs font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#A1A1AA] text-sm">Aucune spécialité renseignée</p>
                    )}
                </div>

                {/* Languages */}
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#18181B]">Langues</h2>
                    </div>
                    {profile?.languages?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.languages.map(l => (
                                <span key={l} className="px-3 py-1.5 bg-[#F4F3EF] text-[#18181B] rounded-full text-xs font-medium">
                                    {l}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#A1A1AA] text-sm">Aucune langue renseignée</p>
                    )}
                </div>
            </motion.div>

            {/* Portfolio Videos */}
            {profile?.portfolio_video_urls?.length ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#18181B]">Portfolio</h2>
                    </div>
                    <div className="space-y-2">
                        {profile.portfolio_video_urls.map((url, i) => (
                            <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-[#F4F3EF] rounded-xl hover:bg-[#C4F042]/10 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg border border-black/[0.06] flex items-center justify-center">
                                    <Video className="w-3.5 h-3.5 text-[#71717A]" strokeWidth={1.5} />
                                </div>
                                <span className="text-sm text-[#18181B] truncate flex-1">{url}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#18181B] transition-colors" strokeWidth={1.5} />
                            </a>
                        ))}
                    </div>
                </motion.div>
            ) : null}

            {/* Mission History */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[#18181B]">Historique des missions</h2>
                    <span className="text-xs text-[#A1A1AA] ml-auto">{missions.length} mission{missions.length > 1 ? 's' : ''}</span>
                </div>

                {missions.length === 0 ? (
                    <p className="text-[#A1A1AA] text-sm py-4">Aucune mission assignée pour le moment</p>
                ) : (
                    <div className="divide-y divide-black/[0.04]">
                        {missions.map((mission) => {
                            const statusCfg = STATUS_LABELS[mission.status] || STATUS_LABELS.draft
                            return (
                                <Link
                                    key={mission.id}
                                    href={`/mosh-cockpit/missions/${mission.id}`}
                                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#F4F3EF]/50 -mx-2 px-2 rounded-xl transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#18181B] truncate group-hover:text-[#18181B]">
                                            {mission.title}
                                        </p>
                                        <p className="text-xs text-[#A1A1AA] mt-0.5">
                                            {mission.brand?.profiles_brand?.company_name || mission.brand?.full_name || '—'}
                                            {mission.budget_chf ? ` · CHF ${mission.budget_chf.toLocaleString('fr-CH')}` : ''}
                                        </p>
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
