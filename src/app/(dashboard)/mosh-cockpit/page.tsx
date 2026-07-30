'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ClipboardList,
    Users,
    Building2,
    Video,
    ArrowRight,
    ChevronRight,
    FileText,
    TrendingUp,
} from 'lucide-react'
import { getAdminStats, getAllCampaigns, type CampaignWithDetails } from '@/lib/services/adminService'
import { PageHeader, MetricStrip, Panel, PanelList, PanelRow, StatusPill, EmptyState } from '@/components/ui/workspace'
import { getStatusConfig } from '@/lib/constants/statusConfig'

const SHORTCUTS = [
    { icon: ClipboardList, title: 'Pipeline', desc: 'Toutes les missions', href: '/mosh-cockpit/missions' },
    { icon: FileText, title: 'Briefs entrants', desc: 'Nouveaux briefs à traiter', href: '/mosh-cockpit/missions?filter=draft' },
    { icon: TrendingUp, title: 'En production', desc: 'Missions en cours', href: '/mosh-cockpit/missions?filter=in_progress' },
    { icon: Video, title: 'Vidéos', desc: 'À valider et livrer', href: '/mosh-cockpit/missions?filter=completed' },
    { icon: Users, title: 'Créateurs', desc: 'Répertoire créateurs', href: '/mosh-cockpit/creators' },
    { icon: Building2, title: 'Marques', desc: 'Marques et demandes', href: '/mosh-cockpit/brands' },
]

const toneFor = (status: string): 'progress' | 'waiting' | 'done' | 'idle' =>
    status === 'completed' ? 'done'
        : status === 'cancelled' ? 'idle'
            : status === 'draft' ? 'waiting'
                : 'progress'

export default function AdminDashboardPage() {
    const router = useRouter()
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
    const dash = (n: number) => (isLoading ? '—' : String(n))

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Pilotage"
                description="Vue d'ensemble des missions et de la production"
                actions={
                    <Link
                        href="/mosh-cockpit/missions?filter=draft"
                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors"
                    >
                        <FileText className="w-4 h-4" strokeWidth={2.2} />
                        Briefs en attente
                    </Link>
                }
            />

            <div className="mb-6">
                <MetricStrip
                    metrics={[
                        { label: 'Briefs en attente', value: dash(stats.pendingBriefs), hint: 'À qualifier' },
                        { label: 'Missions actives', value: dash(stats.activeMissions), hint: `sur ${isLoading ? '—' : totalMissions} au total`, tone: 'accent' },
                        { label: 'Vidéos à valider', value: dash(stats.pendingVideos), hint: 'En attente de revue' },
                        { label: 'Créateurs', value: dash(stats.totalCreators), hint: 'Inscrits sur la plateforme' },
                    ]}
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0 w-full">
                    <Panel
                        title="Missions récentes"
                        actions={
                            <Link
                                href="/mosh-cockpit/missions"
                                className="inline-flex items-center gap-1 text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                            >
                                Voir tout <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                            </Link>
                        }
                    >
                        {isLoading ? (
                            <div className="divide-y divide-[#E2E2E1]">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                        <div className="h-4 bg-[#F4F4F3] rounded w-1/3" />
                                        <div className="h-4 bg-[#F4F4F3] rounded w-1/6 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        ) : recentCampaigns.length === 0 ? (
                            <EmptyState
                                icon={ClipboardList}
                                title="Aucune mission"
                                description="Les briefs reçus apparaîtront ici."
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-[#E2E2E1]">
                                            <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Mission</th>
                                            <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden md:table-cell">Marque</th>
                                            <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Statut</th>
                                            <th className="text-right font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden sm:table-cell">Créée</th>
                                            <th className="w-8" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E2E2E1]">
                                        {recentCampaigns.map((campaign) => {
                                            const brandName = campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'
                                            return (
                                                <tr
                                                    key={campaign.id}
                                                    onClick={() => router.push(`/mosh-cockpit/missions/${campaign.id}`)}
                                                    className="hover:bg-[#FAFAF9] cursor-pointer transition-colors group"
                                                >
                                                    <td className="px-4 py-2.5 max-w-[280px]">
                                                        <span className="block font-medium text-[#1A1A1A] truncate">{campaign.title}</span>
                                                        <span className="block text-[12px] text-[#9B9B9B] truncate md:hidden">{brandName}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[#6B6B6B] hidden md:table-cell max-w-[200px]">
                                                        <span className="block truncate">{brandName}</span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <StatusPill tone={toneFor(campaign.status)}>
                                                            {getStatusConfig(campaign.status).label}
                                                        </StatusPill>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-[#6B6B6B] tabular-nums hidden sm:table-cell whitespace-nowrap">
                                                        {new Date(campaign.created_at).toLocaleDateString('fr-CH')}
                                                    </td>
                                                    <td className="pr-3">
                                                        <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors" strokeWidth={2} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>
                </div>

                <aside className="w-full lg:w-[260px] shrink-0">
                    <Panel title="Raccourcis">
                        <PanelList>
                            {SHORTCUTS.map((item) => (
                                <PanelRow key={item.title} href={item.href}>
                                    <item.icon className="w-4 h-4 text-[#9B9B9B] shrink-0" strokeWidth={1.8} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{item.title}</p>
                                        <p className="text-[12px] text-[#9B9B9B] truncate">{item.desc}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors shrink-0" strokeWidth={2} />
                                </PanelRow>
                            ))}
                        </PanelList>
                    </Panel>
                </aside>
            </div>
        </div>
    )
}
