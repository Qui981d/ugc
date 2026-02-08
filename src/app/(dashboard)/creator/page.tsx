'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Star, Clock, CheckCircle2, Upload, ArrowUpRight, Wallet, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

const statusConfig: Record<string, { label: string; class: string }> = {
    accepted: { label: "En cours", class: "bg-blue-500/20 text-blue-400" },
    pending: { label: "En attente", class: "bg-yellow-500/20 text-yellow-400" },
    completed: { label: "Terminée", class: "bg-green-500/20 text-green-400" },
    rejected: { label: "Refusée", class: "bg-red-500/20 text-red-400" },
    delivered: { label: "Livré", class: "bg-amber-500/20 text-amber-400" },
}

interface MissionDisplay {
    id: string
    title: string
    brand: string
    status: string
    deadline: string | null
    budget: number
}

export default function CreatorDashboardPage() {
    const { user, isLoading } = useAuth()
    const [missions, setMissions] = useState<MissionDisplay[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)

    const userId = user?.id

    useEffect(() => {
        // No user = nothing to load
        if (!userId) return

        async function loadData() {
            setIsDataLoading(true)

            const supabase = createClient()

            const { data, error } = await supabase
                .from('applications')
                .select(`
                    id,
                    status,
                    proposed_rate_chf,
                    campaign:campaigns (
                        title,
                        budget_chf,
                        deadline,
                        brand:users!campaigns_brand_id_fkey (
                            full_name
                        )
                    )
                `)
                .eq('creator_id', userId!)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })
                .limit(5)

            if (error && error.message) {
                console.error('Error fetching missions:', error.message)
            } else {
                const displayMissions: MissionDisplay[] = (data || []).map((app: any) => ({
                    id: app.id,
                    title: app.campaign?.title || 'Sans titre',
                    brand: app.campaign?.brand?.full_name || 'Marque',
                    status: app.status,
                    deadline: app.campaign?.deadline,
                    budget: app.proposed_rate_chf || app.campaign?.budget_chf || 0,
                }))
                setMissions(displayMissions)
            }
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    const stats = [
        { label: "Missions actives", value: String(missions.filter(m => m.status === 'accepted').length), icon: Clock, change: "En cours" },
        { label: "Missions terminées", value: String(missions.filter(m => m.status === 'completed').length), icon: CheckCircle2, change: "Total" },
        { label: "Revenus en attente", value: formatCHF(missions.filter(m => m.status !== 'completed').reduce((sum, m) => sum + m.budget, 0)), icon: Wallet, change: "À recevoir" },
        { label: "Note moyenne", value: "5.0", icon: Star, change: "Nouveau profil" },
    ]

    if (!user && isLoading) {
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
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Créateur'} 👋
                    </h1>
                    <p className="text-white/60 mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
                <Link href="/creator/marketplace">
                    <Button className="btn-primary">
                        <Search className="h-4 w-4 mr-2" />
                        Explorer les campagnes
                    </Button>
                </Link>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-white/50">{stat.label}</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                        <p className="text-xs text-white/40 mt-1">{stat.change}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                        <stat.icon className="h-6 w-6 text-white/40" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recent Missions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white">Missions récentes</CardTitle>
                        <Link href="/creator/missions">
                            <Button variant="ghost" className="text-white/60 hover:text-white">
                                Voir tout
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {missions.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune mission pour le moment</p>
                                <p className="text-sm mt-2">Explorez les campagnes disponibles</p>
                                <Link href="/creator/marketplace">
                                    <Button className="btn-primary mt-4">
                                        <Search className="w-4 h-4 mr-2" />
                                        Explorer
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {missions.map((mission, index) => (
                                    <motion.div
                                        key={mission.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold">
                                                {mission.brand.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{mission.title}</p>
                                                <p className="text-sm text-white/50">{mission.brand}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={statusConfig[mission.status]?.class || 'bg-white/10 text-white/60'}>
                                                {statusConfig[mission.status]?.label || mission.status}
                                            </Badge>
                                            <span className="text-white font-semibold">{formatCHF(mission.budget)}</span>
                                        </div>
                                    </motion.div>
                                ))}
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
                <div className="grid grid-cols-3 gap-4">
                    <Link href="/creator/portfolio">
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Mettre à jour le portfolio</p>
                                    <p className="text-sm text-white/50">Ajoutez vos dernières créations</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/creator/marketplace">
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Search className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Explorer les campagnes</p>
                                    <p className="text-sm text-white/50">Trouvez de nouvelles missions</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/creator/settings">
                        <Card className="bg-white/[0.08] border-white/[0.10] backdrop-blur-xl hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Star className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Compléter le profil</p>
                                    <p className="text-sm text-white/50">Augmentez votre visibilité</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
