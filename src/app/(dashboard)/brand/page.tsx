'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Clock, CheckCircle2, XCircle, ArrowUpRight, Loader2, Settings } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import { getStatusConfig } from "@/lib/constants/statusConfig"
import type { Campaign } from "@/types/database"



export default function BrandDashboardPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!userId) return
        if (!user) return

        async function loadData() {
            setIsDataLoading(true)
            const realCampaigns = await getMyCampaigns()
            setCampaigns(realCampaigns)
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    const stats = [
        { label: "Campagnes actives", value: String(campaigns.filter(c => c.status === 'open' || c.status === 'in_progress' || c.status === 'draft').length), change: "En cours de traitement" },
        { label: "En production", value: String(campaigns.filter(c => c.status === 'in_progress').length), change: "Vidéos en cours" },
        { label: "Vidéos livrées", value: String(campaigns.filter(c => c.status === 'completed').length), change: "Terminées" },
        { label: "Budget total", value: formatCHF(campaigns.reduce((sum, c) => sum + c.budget_chf, 0)), change: "Toutes campagnes" },
    ]

    if (!mounted || (!user && isLoading) || isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#A1A1AA]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#18181B] tracking-[-0.02em]">
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Marque'} 👋
                    </h1>
                    <p className="text-[#71717A] mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
                <Link href="/brand/campaigns/new">
                    <Button className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full px-6 w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        Nouvelle campagne
                    </Button>
                </Link>
            </motion.div>

            {/* Action Required Banner (B10) */}
            {(() => {
                const actionCampaigns = campaigns.filter(c => c.status === 'open')
                if (actionCampaigns.length === 0) return null
                return (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#C4F042]/15 border border-[#C4F042]/30 rounded-2xl p-4 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-[#C4F042]/25 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">⚡</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-[#18181B]">
                                {actionCampaigns.length} campagne{actionCampaigns.length > 1 ? 's' : ''} nécessite{actionCampaigns.length > 1 ? 'nt' : ''} votre attention
                            </p>
                            <p className="text-xs text-[#71717A]">
                                Sélection de créateur en attente
                            </p>
                        </div>
                        <Link href={`/brand/campaigns/${actionCampaigns[0].id}`}>
                            <Button size="sm" className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full px-4">
                                Voir
                                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </motion.div>
                )
            })()}

            {/* Stats Grid — glassmorphism */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] p-5"
                    >
                        <p className="text-sm text-[#71717A]">{stat.label}</p>
                        <p className="text-2xl font-bold text-[#18181B] mt-1">{stat.value}</p>
                        <p className="text-xs text-[#A1A1AA] mt-1">{stat.change}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Campaigns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#18181B]">Mes campagnes récentes</h2>
                    <Link href="/brand/campaigns">
                        <Button variant="ghost" className="text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F3EF] rounded-full">
                            Voir tout
                            <ArrowUpRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
                        </Button>
                    </Link>
                </div>
                <div className="px-6 pb-6">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12 text-[#A1A1AA]">
                            <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune campagne pour le moment</p>
                            <p className="text-sm mt-2">Créez votre première campagne</p>
                            <Link href="/brand/campaigns/new">
                                <Button className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full px-6 mt-4">
                                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                                    Créer une campagne
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {campaigns.slice(0, 5).map((campaign, index) => {
                                const status = getStatusConfig(campaign.status)
                                const StatusIcon = status.icon

                                return (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                    >
                                        <Link
                                            href={`/brand/campaigns/${campaign.id}`}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F4F3EF]/60 hover:bg-[#F4F3EF] transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#C4F042]/20 flex items-center justify-center">
                                                    <StatusIcon className="h-5 w-5 text-[#18181B]" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#18181B] group-hover:text-[#18181B]">{campaign.title}</p>
                                                    <p className="text-sm text-[#71717A]">{campaign.script_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={status.badgeClass}>
                                                    {status.label}
                                                </Badge>
                                                <span className="text-[#18181B] font-semibold">{formatCHF(campaign.budget_chf)}</span>
                                                <ArrowUpRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#C4F042] transition-colors" strokeWidth={1.5} />
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-lg font-semibold text-[#18181B] mb-4">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/brand/campaigns/new">
                        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#C4F042]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6 text-[#18181B]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#18181B]">Créer une campagne</p>
                                <p className="text-sm text-[#71717A]">Décrivez votre besoin en vidéo UGC</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/brand/campaigns">
                        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Eye className="h-6 w-6 text-blue-700" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#18181B]">Suivre mes campagnes</p>
                                <p className="text-sm text-[#71717A]">Voyez l&apos;avancement de vos projets</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/brand/settings">
                        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#F4F3EF] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Settings className="h-6 w-6 text-[#18181B]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#18181B]">Compléter le profil</p>
                                <p className="text-sm text-[#71717A]">Finalisez votre profil marque</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
