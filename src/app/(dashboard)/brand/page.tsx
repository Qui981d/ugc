'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Clock, CheckCircle2, XCircle, ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import type { Campaign } from "@/types/database"

const statusConfig: Record<string, { label: string; icon: typeof Clock; class: string }> = {
    draft: { label: "Brouillon", icon: Clock, class: "bg-white/10 text-white/60" },
    open: { label: "Ouverte", icon: Eye, class: "bg-green-500/20 text-green-400" },
    in_progress: { label: "En cours", icon: Clock, class: "bg-yellow-500/20 text-yellow-400" },
    completed: { label: "Terminée", icon: CheckCircle2, class: "bg-white/10 text-white/60" },
    cancelled: { label: "Annulée", icon: XCircle, class: "bg-red-500/20 text-red-400" },
}

export default function BrandDashboardPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        // Don't do anything while auth is loading
        if (!userId) return

        // No user = nothing to load
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
        { label: "Campagnes actives", value: String(campaigns.filter(c => c.status === 'open' || c.status === 'in_progress').length), change: "En cours" },
        { label: "Candidatures", value: "0", change: "À traiter" },
        { label: "Campagnes terminées", value: String(campaigns.filter(c => c.status === 'completed').length), change: "Total" },
        { label: "Budget total", value: formatCHF(campaigns.reduce((sum, c) => sum + c.budget_chf, 0)), change: "Toutes campagnes" },
    ]

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
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
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Marque'} 👋
                    </h1>
                    <p className="text-white/60 mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
                <Link href="/brand/campaigns/new">
                    <Button className="btn-primary w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle campagne
                    </Button>
                </Link>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl">
                            <CardContent className="pt-6">
                                <p className="text-sm text-white/50">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                <p className="text-xs text-white/40 mt-1">{stat.change}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Campaigns */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Campagnes récentes</CardTitle>
                        <Link href="/brand/campaigns">
                            <Button variant="ghost" className="text-white/60 hover:text-white">
                                Voir tout
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {campaigns.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune campagne pour le moment</p>
                                <p className="text-sm mt-2">Créez votre première campagne</p>
                                <Link href="/brand/campaigns/new">
                                    <Button className="btn-primary mt-4">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Créer une campagne
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {campaigns.slice(0, 5).map((campaign, index) => {
                                    const status = statusConfig[campaign.status] || statusConfig.draft
                                    const StatusIcon = status.icon

                                    return (
                                        <motion.div
                                            key={campaign.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + index * 0.05 }}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                                    <StatusIcon className="h-5 w-5 text-accent" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{campaign.title}</p>
                                                    <p className="text-sm text-white/50">{campaign.script_type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={status.class}>
                                                    {status.label}
                                                </Badge>
                                                <span className="text-white font-semibold">{formatCHF(campaign.budget_chf)}</span>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/brand/campaigns/new">
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="h-6 w-6 text-accent" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Créer une campagne</p>
                                    <p className="text-sm text-white/50">Lancez une nouvelle campagne UGC</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/marketplace">
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Eye className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Explorer les créateurs</p>
                                    <p className="text-sm text-white/50">Trouvez les meilleurs talents</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/brand/settings">
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="h-6 w-6 text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Compléter le profil</p>
                                    <p className="text-sm text-white/50">Finalisez votre profil marque</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
