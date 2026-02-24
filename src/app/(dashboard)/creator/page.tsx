'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, Upload, ArrowUpRight, Wallet, Loader2, Briefcase, Star } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getAssignedCampaigns } from "@/lib/services/campaignService"

const statusConfig: Record<string, { label: string; class: string }> = {
    draft: { label: "Brief reçu", class: "bg-yellow-500/20 text-yellow-700" },
    open: { label: "En recherche", class: "bg-blue-500/20 text-blue-700" },
    in_progress: { label: "En cours", class: "bg-purple-500/20 text-purple-700" },
    completed: { label: "Terminée", class: "bg-green-500/20 text-green-700" },
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
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    const userId = user?.id

    useEffect(() => {
        if (!userId) return

        async function loadData() {
            setIsDataLoading(true)
            const campaigns = await getAssignedCampaigns()
            const displayMissions: MissionDisplay[] = campaigns.map((c: any) => ({
                id: c.id,
                title: c.title || 'Sans titre',
                brand: c.brand?.full_name || c.brand?.profiles_brand?.company_name || 'Marque',
                status: c.status,
                deadline: c.deadline,
                budget: c.budget_chf || 0,
            }))
            setMissions(displayMissions)
            setIsDataLoading(false)
        }

        loadData()
    }, [userId])

    const nextDeadline = missions
        .filter(m => m.status === 'in_progress' && m.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

    const stats = [
        { label: "Missions actives", value: String(missions.filter(m => m.status === 'in_progress').length), icon: Clock, change: "En cours" },
        { label: "Missions terminées", value: String(missions.filter(m => m.status === 'completed').length), icon: CheckCircle2, change: "Total" },
        { label: "Revenus estimés", value: formatCHF(missions.filter(m => m.status !== 'completed').reduce((sum, m) => sum + m.budget, 0)), icon: Wallet, change: "À venir" },
        { label: "Prochaine deadline", value: nextDeadline?.deadline ? new Date(nextDeadline.deadline).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' }) : '—', icon: Calendar, change: nextDeadline?.title || 'Aucune' },
    ]

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Créateur'} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
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
                        <Card className="bg-white border-white/[0.10] backdrop-blur-xl">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                                        <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                                    </div>
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                        <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
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
                <Card className="bg-white border-white/[0.10] backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-gray-900">Missions récentes</CardTitle>
                        <Link href="/creator/missions">
                            <Button variant="ghost" className="text-gray-500 hover:text-gray-900">
                                Voir tout
                                <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {missions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune mission pour le moment</p>
                                <p className="text-sm mt-2">MOSH vous contactera dès qu&apos;une mission correspond à votre profil</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {missions.map((mission, index) => (
                                    <motion.div
                                        key={mission.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-white/[0.08] hover:bg-white transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#6C3FA0]/20 flex items-center justify-center text-[#6C3FA0] font-bold">
                                                {mission.brand.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{mission.title}</p>
                                                <p className="text-sm text-gray-500">{mission.brand}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={statusConfig[mission.status]?.class || 'bg-gray-100 text-gray-500'}>
                                                {statusConfig[mission.status]?.label || mission.status}
                                            </Badge>
                                            <span className="text-gray-900 font-semibold">{formatCHF(mission.budget)}</span>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/creator/portfolio">
                        <Card className="bg-white border-white/[0.10] hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-purple-700" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Mettre à jour le portfolio</p>
                                    <p className="text-sm text-gray-500">Ajoutez vos dernières créations</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/creator/missions">
                        <Card className="bg-white border-white/[0.10] hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Briefcase className="h-6 w-6 text-blue-700" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Mes missions</p>
                                    <p className="text-sm text-gray-500">Suivre vos missions en cours</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/creator/settings">
                        <Card className="bg-white border-white/[0.10] hover:bg-white/[0.12] transition-colors cursor-pointer group">
                            <CardContent className="pt-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Star className="h-6 w-6 text-emerald-700" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Compléter le profil</p>
                                    <p className="text-sm text-gray-500">Augmentez votre visibilité</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
