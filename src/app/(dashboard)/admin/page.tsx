'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    ClipboardList,
    Users,
    Building2,
    Video,
    ArrowRight,
    Clock,
    FileText
} from 'lucide-react'
import { getAdminStats, getAllCampaigns, type CampaignWithDetails } from '@/lib/services/adminService'

const STEP_LABELS: Record<string, string> = {
    draft: 'Brief reçu',
    open: 'Profils proposés',
    in_progress: 'En production',
    completed: 'Terminée',
    cancelled: 'Annulée',
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ pendingBriefs: 0, activeMissions: 0, pendingVideos: 0, totalCreators: 0 })
    const [recentCampaigns, setRecentCampaigns] = useState<CampaignWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const [statsData, campaigns] = await Promise.all([
                getAdminStats(),
                getAllCampaigns({ limit: 8 }),
            ])
            setStats(statsData)
            setRecentCampaigns(campaigns)
            setIsLoading(false)
        }
        load()
    }, [])

    const statCards = [
        { label: 'Briefs en attente', value: stats.pendingBriefs, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'Missions actives', value: stats.activeMissions, icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Vidéos à valider', value: stats.pendingVideos, icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Créateurs actifs', value: stats.totalCreators, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard MOSH</h1>
                <p className="text-white/50 mt-1">Cockpit de pilotage des missions UGC</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{isLoading ? '—' : stat.value}</p>
                        <p className="text-sm text-white/50 mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/missions?filter=draft" className="group bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-400 font-semibold">Briefs entrants</p>
                            <p className="text-white/50 text-sm mt-1">Nouveaux briefs à traiter</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                <Link href="/admin/missions?filter=in_progress" className="group bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-400 font-semibold">Missions en cours</p>
                            <p className="text-white/50 text-sm mt-1">Suivre la production</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                <Link href="/admin/creators" className="group bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-400 font-semibold">Répertoire créateurs</p>
                            <p className="text-white/50 text-sm mt-1">Gérer les profils</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Recent Missions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Missions récentes</h2>
                    <Link href="/admin/missions" className="text-sm text-accent hover:underline">
                        Voir toutes →
                    </Link>
                </div>
                <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-white/40">Chargement...</div>
                    ) : recentCampaigns.length === 0 ? (
                        <div className="p-8 text-center text-white/40">Aucune mission pour le moment</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Mission</th>
                                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Marque</th>
                                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Créateur</th>
                                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Statut</th>
                                    <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCampaigns.map((campaign) => (
                                    <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/missions/${campaign.id}`} className="text-white font-medium hover:text-accent transition-colors">
                                                {campaign.title}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-white/60">
                                            {campaign.brand?.profiles_brand?.company_name || campaign.brand?.full_name || '—'}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-white/60">
                                            {campaign.selected_creator?.full_name || '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${campaign.status === 'draft' ? 'bg-amber-400/10 text-amber-400' :
                                                    campaign.status === 'open' ? 'bg-blue-400/10 text-blue-400' :
                                                        campaign.status === 'in_progress' ? 'bg-purple-400/10 text-purple-400' :
                                                            campaign.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400' :
                                                                'bg-white/10 text-white/40'
                                                }`}>
                                                {STEP_LABELS[campaign.status] || campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-white/40">
                                            {new Date(campaign.created_at).toLocaleDateString('fr-CH')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
