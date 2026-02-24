'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    ClipboardList,
    Users,
    Building2,
    Video,
    ArrowUpRight,
    FileText,
    TrendingUp,
    Settings,
} from 'lucide-react'
import { getAdminStats, getAllCampaigns, type CampaignWithDetails } from '@/lib/services/adminService'

const STEP_LABELS: Record<string, string> = {
    draft: 'Brief reçu',
    open: 'Profils proposés',
    in_progress: 'En production',
    completed: 'Terminée',
    cancelled: 'Annulée',
}

const STATUS_DOT: Record<string, string> = {
    draft: 'bg-amber-500',
    open: 'bg-blue-500',
    in_progress: 'bg-violet-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-gray-400',
}

/* ── Capsule progress indicators (like Make.com) ── */
function CapsuleBar({ filled, total = 7, dark = false }: { filled: number; total?: number; dark?: boolean }) {
    return (
        <div className="flex gap-[4px] mt-5">
            {[...Array(total)].map((_, i) => (
                <div
                    key={i}
                    className={`h-[15px] w-[15px] rounded-full transition-all ${i < filled
                        ? dark ? 'bg-[#C4F042]' : 'bg-[#18181B]'
                        : dark ? 'bg-white/[0.1]' : 'bg-black/[0.06]'
                        }`}
                />
            ))}
        </div>
    )
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ pendingBriefs: 0, activeMissions: 0, pendingVideos: 0, totalCreators: 0 })
    const [recentCampaigns, setRecentCampaigns] = useState<CampaignWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [statsData, campaigns] = await Promise.all([
                getAdminStats(),
                getAllCampaigns({ limit: 6 }),
            ])
            setStats(statsData)
            setRecentCampaigns(campaigns)
            setIsLoading(false)
        }
        load()
    }, [])

    const totalMissions = stats.pendingBriefs + stats.activeMissions

    return (
        <div className="flex gap-6 max-w-[1400px] mx-auto">
            {/* ═══════════ MAIN CONTENT ═══════════ */}
            <div className="flex-1 min-w-0 space-y-8">

                {/* ── Title ── */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-start justify-between"
                >
                    <div>
                        <h1 className="text-[40px] leading-[1.15] font-medium text-[#18181B] tracking-[-0.02em]">
                            Pilotage <span className="inline-flex items-center align-middle"><Settings className="w-6 h-6 text-gray-400 mx-1" /></span> Missions
                            <br />
                            et <span className="inline-flex items-center align-middle"><span className="text-[#C4F042] text-2xl mx-1">✦</span></span> Production
                        </h1>
                    </div>
                    <Link
                        href="/mosh-cockpit/missions?filter=draft"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#18181B] text-white text-sm font-medium rounded-full hover:bg-[#2A2A2E] transition-colors shadow-sm"
                    >
                        + Nouveau brief
                    </Link>
                </motion.div>

                {/* ── Stat Cards Row — 3 cards ── */}
                <div className="grid grid-cols-3 gap-5">
                    {/* Card 1: Briefs — white bg */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/90 backdrop-blur-sm rounded-[24px] p-6 shadow-sm border border-black/[0.03]"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#F4F4F5] flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 text-[#71717A]" strokeWidth={1.5} />
                                </div>
                                <span className="text-sm font-medium text-[#71717A]">Briefs</span>
                            </div>
                            <button className="text-[#A1A1AA] hover:text-[#71717A]">⋮</button>
                        </div>
                        <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-[52px] leading-none font-bold text-[#18181B] tracking-[-0.03em]">
                                {isLoading ? '—' : stats.pendingBriefs}
                            </span>
                            <span className="text-sm text-[#A1A1AA] font-normal">en attente</span>
                        </div>
                        <CapsuleBar filled={isLoading ? 0 : Math.min(stats.pendingBriefs, 7)} />
                    </motion.div>

                    {/* Card 2: Missions — accent lime/green bg */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-[#E2F57A] rounded-[24px] p-6 shadow-sm border border-[#D4E542]/40"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-black/[0.06] flex items-center justify-center">
                                    <ClipboardList className="w-3.5 h-3.5 text-[#3F3F00]" strokeWidth={1.5} />
                                </div>
                                <span className="text-sm font-medium text-[#3F3F00]/70">Missions actives</span>
                            </div>
                            <button className="text-[#3F3F00]/40 hover:text-[#3F3F00]/70">⋮</button>
                        </div>
                        <div className="flex items-baseline gap-2 mt-4">
                            <span className="text-[52px] leading-none font-bold text-[#18181B] tracking-[-0.03em]">
                                {isLoading ? '—' : stats.activeMissions}
                            </span>
                            <span className="text-sm text-[#3F3F00]/50 font-normal">/ {totalMissions || '—'}</span>
                        </div>
                        <CapsuleBar filled={isLoading ? 0 : Math.min(stats.activeMissions, 7)} />
                    </motion.div>

                    {/* Card 3: CTA promo card — dark bg */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#18181B] rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden"
                    >
                        {/* Decorative gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C4F042]/20 to-transparent rounded-bl-full" />
                        <div>
                            <p className="text-white/90 text-lg font-medium leading-snug relative z-10">
                                Gérez vos missions<br />
                                <span className="text-[#C4F042]">UGC en direct ↗</span>
                            </p>
                        </div>
                        <Link
                            href="/mosh-cockpit/missions"
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white text-[#18181B] text-sm font-medium rounded-full hover:bg-gray-100 transition-colors w-fit"
                        >
                            Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </motion.div>
                </div>

                {/* ── Missions récentes ── */}
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm border border-black/[0.04]">
                            <ClipboardList className="w-3.5 h-3.5 text-[#71717A]" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-lg font-semibold text-[#18181B] tracking-tight">Missions récentes</h2>
                        <div className="flex-1" />
                        <Link
                            href="/mosh-cockpit/missions"
                            className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors flex items-center gap-1"
                        >
                            Voir tout <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] divide-y divide-gray-100">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-5 animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-gray-50 rounded w-1/5" />
                                </div>
                            ))}
                        </div>
                    ) : recentCampaigns.length === 0 ? (
                        <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-10 text-center">
                            <p className="text-[#A1A1AA] font-medium">Aucune mission</p>
                            <p className="text-[#D4D4D8] text-sm mt-1">Les briefs apparaîtront ici</p>
                        </div>
                    ) : (
                        <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] divide-y divide-gray-100 overflow-hidden">
                            {recentCampaigns.map((campaign, i) => (
                                <motion.div
                                    key={campaign.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.04 }}
                                >
                                    <Link
                                        href={`/mosh-cockpit/missions/${campaign.id}`}
                                        className="group flex items-center gap-4 p-5 hover:bg-[#FAFAF9] transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#18181B] text-[15px] group-hover:text-[#18181B] transition-colors truncate">
                                                {campaign.title}
                                            </p>
                                            <p className="text-sm text-[#A1A1AA] mt-0.5">
                                                {campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F4F4F5] text-[#52525B]">
                                            <span className={`w-[6px] h-[6px] rounded-full ${STATUS_DOT[campaign.status] || 'bg-gray-400'}`} />
                                            {STEP_LABELS[campaign.status] || campaign.status}
                                        </span>
                                        <span className="text-xs text-[#D4D4D8] font-medium tabular-nums">
                                            {new Date(campaign.created_at).toLocaleDateString('fr-CH')}
                                        </span>
                                        <ArrowUpRight className="w-4 h-4 text-[#D4D4D8] group-hover:text-[#C4F042] transition-all flex-shrink-0" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════ RIGHT SIDEBAR ═══════════ */}
            <motion.aside
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="hidden lg:flex flex-col gap-3 w-[240px] flex-shrink-0 pt-2"
            >
                {/* Top row: 2 icon cards */}
                <div className="grid grid-cols-2 gap-3">
                    <Link href="/mosh-cockpit/creators" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-black/[0.03] text-center hover:shadow-sm transition-all group">
                        <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2 group-hover:border-[#C4F042]/40 transition-colors">
                            <Users className="w-4 h-4 text-[#71717A] group-hover:text-[#1A1A1D] transition-colors" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-semibold text-[#18181B]">Créateurs</p>
                    </Link>
                    <Link href="/mosh-cockpit/brands" className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-black/[0.03] text-center hover:shadow-sm transition-all group">
                        <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center mx-auto mb-2 group-hover:border-[#C4F042]/40 transition-colors">
                            <Building2 className="w-4 h-4 text-[#71717A] group-hover:text-[#1A1A1D] transition-colors" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-semibold text-[#18181B]">Marques</p>
                    </Link>
                </div>

                {/* Link cards */}
                {[
                    { icon: ClipboardList, title: 'Pipeline', desc: 'Gérer toutes les missions…', href: '/mosh-cockpit/missions' },
                    { icon: FileText, title: 'Briefs entrants', desc: 'Nouveaux briefs à traiter…', href: '/mosh-cockpit/missions?filter=draft' },
                    { icon: TrendingUp, title: 'En production', desc: 'Missions en cours…', href: '/mosh-cockpit/missions?filter=in_progress' },
                    { icon: Video, title: 'Vidéos', desc: 'À valider et livrer…', href: '/mosh-cockpit/missions?filter=completed' },
                ].map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                        className="group flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-black/[0.03] hover:shadow-sm transition-all"
                    >
                        <div className="w-9 h-9 rounded-xl border border-black/[0.06] flex items-center justify-center flex-shrink-0 group-hover:border-[#C4F042]/40 transition-colors">
                            <item.icon className="w-4 h-4 text-[#71717A] group-hover:text-[#1A1A1D] transition-colors" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#18181B]">{item.title}</p>
                            <p className="text-xs text-[#A1A1AA] mt-0.5 truncate">{item.desc}</p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#D4D4D8] group-hover:text-[#1A1A1D] transition-all flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    </Link>
                ))}
            </motion.aside>
        </div>
    )
}
