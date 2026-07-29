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
    draft: { label: 'Brief reçu', class: 'bg-[#F0F2F5] text-[#65676B]' },
    open: { label: 'Profils proposés', class: 'bg-[#E7F0FF] text-[#0653CC]' },
    in_progress: { label: 'En production', class: 'bg-[#1C1E21] text-white' },
    completed: { label: 'Terminée', class: 'bg-[#0866FF] text-white' },
    cancelled: { label: 'Annulée', class: 'bg-[#F0F2F5] text-[#8A8D91]' },
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

    if (!creator) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <p className="text-[#65676B] font-medium">Créateur introuvable</p>
                <Link href="/mosh-cockpit/creators" className="text-sm text-[#8A8D91] hover:text-[#1C1E21] mt-2 inline-block">
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
            <div className="flex items-center gap-2 text-sm text-[#8A8D91]">
                <Link href="/mosh-cockpit/creators" className="hover:text-[#1C1E21] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Créateurs
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#1C1E21]">{creator.full_name}</span>
            </div>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-[#DADDE1] p-8"
            >
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-lg bg-[#E7F0FF] flex items-center justify-center text-[#1C1E21] text-2xl font-bold shrink-0">
                        {creator.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#1C1E21] tracking-tight">{creator.full_name}</h1>
                            {profile?.is_available ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E7F0FF] text-[#1C1E21]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0866FF]" />
                                    Disponible
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F0F2F5] text-[#8A8D91]">
                                    Indisponible
                                </span>
                            )}
                        </div>
                        <p className="text-[#65676B] text-sm mt-1">{creator.email}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#65676B]">
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
                <div className="bg-white rounded-xl border border-[#DADDE1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#DADDE1] flex items-center justify-center mx-auto mb-2">
                        <Star className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">
                        {profile?.rating_avg ? profile.rating_avg.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-[#8A8D91] mt-0.5">{profile?.rating_count || 0} avis</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DADDE1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#DADDE1] flex items-center justify-center mx-auto mb-2">
                        <Video className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">{completedMissions}</p>
                    <p className="text-xs text-[#8A8D91] mt-0.5">missions terminées</p>
                </div>
                <div className="bg-white rounded-xl border border-[#DADDE1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#DADDE1] flex items-center justify-center mx-auto mb-2">
                        <Wallet className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">
                        {profile?.hourly_rate_chf ? `${profile.hourly_rate_chf}` : '—'}
                    </p>
                    <p className="text-xs text-[#8A8D91] mt-0.5">CHF / heure</p>
                </div>
            </motion.div>

            {/* Bio */}
            {profile?.bio && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl border border-[#DADDE1] p-6"
                >
                    <h2 className="text-sm font-semibold text-[#1C1E21] mb-3">Bio</h2>
                    <p className="text-[#65676B] text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
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
                <div className="bg-white rounded-xl border border-[#DADDE1] p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1C1E21]">Spécialités</h2>
                    </div>
                    {profile?.specialties?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.specialties.map(s => (
                                <span key={s} className="px-3 py-1.5 bg-[#E7F0FF] text-[#1C1E21] rounded-full text-xs font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#8A8D91] text-sm">Aucune spécialité renseignée</p>
                    )}
                </div>

                {/* Languages */}
                <div className="bg-white rounded-xl border border-[#DADDE1] p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1C1E21]">Langues</h2>
                    </div>
                    {profile?.languages?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.languages.map(l => (
                                <span key={l} className="px-3 py-1.5 bg-[#F0F2F5] text-[#1C1E21] rounded-full text-xs font-medium">
                                    {l}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#8A8D91] text-sm">Aucune langue renseignée</p>
                    )}
                </div>
            </motion.div>

            {/* Portfolio Videos */}
            {profile?.portfolio_video_urls?.length ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-xl border border-[#DADDE1] p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1C1E21]">Portfolio</h2>
                        <span className="text-xs text-[#8A8D91] ml-auto">{profile.portfolio_video_urls.length} vidéo{profile.portfolio_video_urls.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {profile.portfolio_video_urls.map((url, i) => {
                            const isDirect = url.includes('supabase') || /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
                            return (
                                <div key={i} className="group relative">
                                    <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-lg shadow-black/10">
                                            {isDirect ? (
                                                <video
                                                    src={url}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    playsInline
                                                    loop
                                                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
                                                />
                                            ) : (
                                                <a href={url} target="_blank" rel="noopener noreferrer"
                                                   className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1C1E21] to-[#1C1E21] hover:from-[#3F3F46] hover:to-[#1C1E21] transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
                                                        <ExternalLink className="w-4 h-4 text-white/60" />
                                                    </div>
                                                    <span className="text-white/50 text-[10px] px-2 text-center truncate max-w-full">
                                                        {url.includes('tiktok') ? 'TikTok' :
                                                         url.includes('instagram') ? 'Instagram' :
                                                         url.includes('youtube') ? 'YouTube' : 'Lien'}
                                                    </span>
                                                </a>
                                            )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            ) : null}

            {/* Mission History */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="bg-white rounded-xl border border-[#DADDE1] p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#65676B]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[#1C1E21]">Historique des missions</h2>
                    <span className="text-xs text-[#8A8D91] ml-auto">{missions.length} mission{missions.length > 1 ? 's' : ''}</span>
                </div>

                {missions.length === 0 ? (
                    <p className="text-[#8A8D91] text-sm py-4">Aucune mission assignée pour le moment</p>
                ) : (
                    <div className="divide-y divide-[#DADDE1]">
                        {missions.map((mission) => {
                            const statusCfg = STATUS_LABELS[mission.status] || STATUS_LABELS.draft
                            return (
                                <Link
                                    key={mission.id}
                                    href={`/mosh-cockpit/missions/${mission.id}`}
                                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#F0F2F5]/50 -mx-2 px-2 rounded-lg transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1C1E21] truncate group-hover:text-[#1C1E21]">
                                            {mission.title}
                                        </p>
                                        <p className="text-xs text-[#8A8D91] mt-0.5">
                                            {mission.brand?.profiles_brand?.company_name || mission.brand?.full_name || '—'}
                                            {mission.budget_chf ? ` · CHF ${mission.budget_chf.toLocaleString('fr-CH')}` : ''}
                                        </p>
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
