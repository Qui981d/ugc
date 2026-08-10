'use client'

import { cantonLabel } from "@/lib/validations/swiss"
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
    ExternalLink,
    UserRound
} from 'lucide-react'
import { getCreatorById, type CreatorWithProfile, type CampaignWithDetails } from '@/lib/services/adminService'
import { ageFromBirthYear, DELIVERY_DELAYS } from '@/lib/constants/creatorCasting'

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
    draft: { label: 'Brief reçu', class: 'bg-[#F4F4F3] text-[#6B6B6B]' },
    open: { label: 'Profils proposés', class: 'bg-[#EDEDEC] text-[#333333]' },
    in_progress: { label: 'En production', class: 'bg-[#1A1A1A] text-white' },
    completed: { label: 'Terminée', class: 'bg-[#1A1A1A] text-white' },
    cancelled: { label: 'Annulée', class: 'bg-[#F4F4F3] text-[#9B9B9B]' },
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
                <div className="h-4 bg-[#F4F4F3] rounded w-40 animate-pulse" />
                <div className="bg-white rounded-xl border border-[#E2E2E1] p-8 animate-pulse">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 rounded-lg bg-[#F4F4F3]" />
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-[#F4F4F3] rounded w-1/3" />
                            <div className="h-4 bg-[#F4F4F3] rounded w-1/4" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!creator) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <p className="text-[#6B6B6B] font-medium">Créateur introuvable</p>
                <Link href="/mosh-cockpit/creators" className="text-sm text-[#9B9B9B] hover:text-[#1A1A1A] mt-2 inline-block">
                    ← Retour au répertoire
                </Link>
            </div>
        )
    }

    const profile = creator.profiles_creator
    const completedMissions = missions.filter(m => m.status === 'completed').length

    // Casting attributes — self-declared, so anything undeclared is simply omitted
    const age = ageFromBirthYear(profile?.birth_year)

    const castingFlags = [
        profile?.can_travel && 'Peut se déplacer',
        profile?.has_vehicle && 'Véhicule',
        profile?.does_voiceover && 'Voix off',
        profile?.has_children && 'Enfants',
        profile?.has_pets && 'Animaux',
    ].filter(Boolean) as string[]

    const castingTraits = [
        age !== null && { label: 'Âge', value: `${age} ans` },
        profile?.gender && { label: 'Genre', value: profile.gender },
        profile?.height_cm && { label: 'Taille', value: `${profile.height_cm} cm` },
        profile?.hair_color && { label: 'Cheveux', value: profile.hair_color },
        profile?.eye_color && { label: 'Yeux', value: profile.eye_color },
        profile?.skin_tone && { label: 'Carnation', value: profile.skin_tone },
        profile?.has_visible_tattoos && { label: 'Tatouages', value: 'Visibles' },
    ].filter(Boolean) as { label: string; value: string }[]

    // How they work — the declared delay is a number, shown with the wording the creator chose from
    const deliveryDays = profile?.delivery_delay_days ?? null
    const deliveryLabel = deliveryDays !== null
        ? DELIVERY_DELAYS.find(d => d.value === deliveryDays)?.label ?? `Sous ${deliveryDays} jours`
        : null

    const workChips = [
        profile?.experience_level && `Expérience : ${profile.experience_level}`,
        deliveryLabel && `Livraison : ${deliveryLabel.toLowerCase()}`,
        profile?.hourly_rate_chf != null && `${profile.hourly_rate_chf} CHF / heure`,
    ].filter(Boolean) as string[]

    const stripAt = (handle: string) => handle.replace(/^@+/, '')
    const instagramHandle = profile?.instagram_handle?.trim() ?? ''
    const tiktokHandle = profile?.tiktok_handle?.trim() ?? ''
    const socialLinks = [
        instagramHandle && {
            label: 'Instagram',
            handle: `@${stripAt(instagramHandle)}`,
            href: `https://instagram.com/${stripAt(instagramHandle)}`,
        },
        tiktokHandle && {
            label: 'TikTok',
            handle: `@${stripAt(tiktokHandle)}`,
            href: `https://tiktok.com/@${stripAt(tiktokHandle)}`,
        },
    ].filter(Boolean) as { label: string; handle: string; href: string }[]
    const followerRange = profile?.follower_range?.trim() ?? ''
    const hasSocial = socialLinks.length > 0 || followerRange.length > 0

    const excludedTopics = profile?.excluded_topics ?? []

    const niches = profile?.niches ?? []
    const shootSettings = profile?.shoot_settings ?? []
    const equipment = profile?.equipment ?? []
    const workConditions = [...shootSettings, ...equipment, ...castingFlags, ...workChips]
    const hasCasting = niches.length > 0
        || workConditions.length > 0
        || castingTraits.length > 0
        || hasSocial
        || excludedTopics.length > 0

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#9B9B9B]">
                <Link href="/mosh-cockpit/creators" className="hover:text-[#1A1A1A] transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                    Créateurs
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#1A1A1A]">{creator.full_name}</span>
            </div>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-[#E2E2E1] p-8"
            >
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-lg bg-[#EDEDEC] flex items-center justify-center text-[#1A1A1A] text-2xl font-bold shrink-0">
                        {creator.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{creator.full_name}</h1>
                            {profile?.is_available ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EDEDEC] text-[#1A1A1A]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                                    Disponible
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F4F4F3] text-[#9B9B9B]">
                                    Indisponible
                                </span>
                            )}
                        </div>
                        <p className="text-[#6B6B6B] text-sm mt-1">{creator.email}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#6B6B6B]">
                            {profile?.location_canton && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    {cantonLabel(profile.location_canton)}
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
                <div className="bg-white rounded-xl border border-[#E2E2E1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#E2E2E1] flex items-center justify-center mx-auto mb-2">
                        <Star className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">
                        {profile?.rating_avg ? profile.rating_avg.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-[#9B9B9B] mt-0.5">{profile?.rating_count || 0} avis</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E2E2E1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#E2E2E1] flex items-center justify-center mx-auto mb-2">
                        <Video className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{completedMissions}</p>
                    <p className="text-xs text-[#9B9B9B] mt-0.5">missions terminées</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E2E2E1] p-5 text-center">
                    <div className="w-9 h-9 rounded-lg border border-[#E2E2E1] flex items-center justify-center mx-auto mb-2">
                        <Wallet className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">
                        {profile?.hourly_rate_chf ? `${profile.hourly_rate_chf}` : '—'}
                    </p>
                    <p className="text-xs text-[#9B9B9B] mt-0.5">CHF / heure</p>
                </div>
            </motion.div>

            {/* Bio */}
            {profile?.bio && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl border border-[#E2E2E1] p-6"
                >
                    <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">Bio</h2>
                    <p className="text-[#6B6B6B] text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
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
                <div className="bg-white rounded-xl border border-[#E2E2E1] p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1A1A1A]">Spécialités</h2>
                    </div>
                    {profile?.specialties?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.specialties.map(s => (
                                <span key={s} className="px-3 py-1.5 bg-[#EDEDEC] text-[#1A1A1A] rounded-full text-xs font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#9B9B9B] text-sm">Aucune spécialité renseignée</p>
                    )}
                </div>

                {/* Languages */}
                <div className="bg-white rounded-xl border border-[#E2E2E1] p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1A1A1A]">Langues</h2>
                    </div>
                    {profile?.languages?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {profile.languages.map(l => (
                                <span key={l} className="px-3 py-1.5 bg-[#F4F4F3] text-[#1A1A1A] rounded-full text-xs font-medium">
                                    {l}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#9B9B9B] text-sm">Aucune langue renseignée</p>
                    )}
                </div>
            </motion.div>

            {/* Casting attributes */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="bg-white rounded-xl border border-[#E2E2E1] p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <UserRound className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[#1A1A1A]">Critères de casting</h2>
                </div>

                {!hasCasting ? (
                    <p className="text-[#9B9B9B] text-[13px]">
                        Ce créateur n&apos;a pas encore renseigné ses critères de casting — il n&apos;apparaît donc pas dans les filtres.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {niches.length > 0 && (
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-2">Thématiques</p>
                                <div className="flex flex-wrap gap-2">
                                    {niches.map(n => (
                                        <span key={n} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F4F3] text-[#1A1A1A] border border-[#E2E2E1]">
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {workConditions.length > 0 && (
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-2">Conditions de tournage</p>
                                <div className="flex flex-wrap gap-2">
                                    {workConditions.map(item => (
                                        <span key={item} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F4F3] text-[#1A1A1A] border border-[#E2E2E1]">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {hasSocial && (
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-2">Réseaux</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    {socialLinks.map(link => (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F4F3] text-[#1A1A1A] border border-[#E2E2E1] hover:border-[#C4C4C3] transition-colors"
                                        >
                                            <span className="text-[#6B6B6B]">{link.label}</span>
                                            {link.handle}
                                            <ExternalLink className="w-3 h-3 text-[#9B9B9B]" strokeWidth={1.5} />
                                        </a>
                                    ))}
                                    {followerRange && (
                                        <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F4F3] text-[#1A1A1A] border border-[#E2E2E1]">
                                            <span className="text-[#6B6B6B]">Communauté</span> {followerRange}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {castingTraits.length > 0 && (
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-2">Profil</p>
                                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                                    {castingTraits.map(trait => (
                                        <div key={trait.label} className="flex items-baseline justify-between gap-3 border-b border-[#E2E2E1] pb-2">
                                            <dt className="text-[11px] uppercase tracking-wider text-[#9B9B9B]">{trait.label}</dt>
                                            <dd className="text-[13px] text-[#1A1A1A]">{trait.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}

                        {/* Refusals, kept visually apart so nobody reads them as specialties */}
                        {excludedTopics.length > 0 && (
                            <div className="border-t border-dashed border-[#E2E2E1] pt-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-2">Ne souhaite pas traiter</p>
                                <div className="flex flex-wrap gap-2">
                                    {excludedTopics.map(topic => (
                                        <span key={topic} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-[#6B6B6B] border border-dashed border-[#C4C4C3]">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Portfolio Videos */}
            {profile?.portfolio_video_urls?.length ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-xl border border-[#E2E2E1] p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Video className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                        <h2 className="text-sm font-semibold text-[#1A1A1A]">Portfolio</h2>
                        <span className="text-xs text-[#9B9B9B] ml-auto">{profile.portfolio_video_urls.length} vidéo{profile.portfolio_video_urls.length > 1 ? 's' : ''}</span>
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
                                                   className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#1A1A1A] hover:from-[#333333] hover:to-[#1A1A1A] transition-colors">
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
                className="bg-white rounded-xl border border-[#E2E2E1] p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#6B6B6B]" strokeWidth={1.5} />
                    <h2 className="text-sm font-semibold text-[#1A1A1A]">Historique des missions</h2>
                    <span className="text-xs text-[#9B9B9B] ml-auto">{missions.length} mission{missions.length > 1 ? 's' : ''}</span>
                </div>

                {missions.length === 0 ? (
                    <p className="text-[#9B9B9B] text-sm py-4">Aucune mission assignée pour le moment</p>
                ) : (
                    <div className="divide-y divide-[#E2E2E1]">
                        {missions.map((mission) => {
                            const statusCfg = STATUS_LABELS[mission.status] || STATUS_LABELS.draft
                            return (
                                <Link
                                    key={mission.id}
                                    href={`/mosh-cockpit/missions/${mission.id}`}
                                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#F4F4F3]/50 -mx-2 px-2 rounded-lg transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#1A1A1A]">
                                            {mission.title}
                                        </p>
                                        <p className="text-xs text-[#9B9B9B] mt-0.5">
                                            {mission.brand?.profiles_brand?.company_name || mission.brand?.full_name || '—'}
                                            {mission.budget_chf ? ` · CHF ${mission.budget_chf.toLocaleString('fr-CH')}` : ''}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.class}`}>
                                        {statusCfg.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors" strokeWidth={1.5} />
                                </Link>
                            )
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
