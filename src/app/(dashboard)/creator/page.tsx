'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle2, Upload, ChevronRight, Wallet, Loader2, Briefcase, Star } from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getAssignedCampaigns } from "@/lib/services/campaignService"

const statusConfig: Record<string, { label: string; class: string }> = {
    draft: { label: "Brief reçu", class: "bg-amber-500/15 text-amber-700 border border-amber-500/25" },
    open: { label: "En recherche", class: "bg-blue-500/15 text-blue-700 border border-blue-500/25" },
    in_progress: { label: "En cours", class: "bg-[#C4F042]/20 text-[#18181B] border border-[#C4F042]/30" },
    completed: { label: "Terminée", class: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/25" },
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
                        Bienvenue, {user?.full_name?.split(' ')[0] || 'Créateur'} 👋
                    </h1>
                    <p className="text-[#71717A] mt-1">
                        Voici un aperçu de votre activité
                    </p>
                </div>
            </motion.div>

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
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm text-[#71717A]">{stat.label}</p>
                                <p className="text-lg md:text-2xl font-bold text-[#18181B] mt-1 truncate">{stat.value}</p>
                                <p className="text-xs text-[#A1A1AA] mt-1">{stat.change}</p>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#C4F042]/15 flex items-center justify-center flex-shrink-0">
                                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-[#18181B]" strokeWidth={1.5} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Missions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-lg font-semibold text-[#18181B]">Missions récentes</h2>
                    <Link href="/creator/missions">
                        <Button variant="ghost" className="text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F3EF] rounded-full">
                            Voir tout
                            <ChevronRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
                        </Button>
                    </Link>
                </div>
                <div className="px-6 pb-6">
                    {missions.length === 0 ? (
                        <div className="text-center py-12 text-[#A1A1AA]">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune mission pour le moment</p>
                            <p className="text-sm mt-2">MOSH vous contactera dès qu&apos;une mission correspond à votre profil</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {missions.map((mission, index) => (
                                <motion.div
                                    key={mission.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.05 }}
                                >
                                    <Link href={`/creator/missions/${mission.id}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F4F3EF]/60 hover:bg-[#F4F3EF] transition-all group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#C4F042]/20 flex items-center justify-center text-[#18181B] font-bold text-sm">
                                                    {mission.brand.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#18181B] group-hover:text-blue-600 transition-colors">{mission.title}</p>
                                                    <p className="text-sm text-[#71717A]">{mission.brand}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={statusConfig[mission.status]?.class || 'bg-[#F4F3EF] text-[#71717A]'}>
                                                    {statusConfig[mission.status]?.label || mission.status}
                                                </Badge>
                                                <span className="text-[#18181B] font-semibold">{formatCHF(mission.budget)}</span>
                                                <ChevronRight className="w-4 h-4 text-[#A1A1AA] group-hover:text-blue-500 transition-colors" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
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
                    <Link href="/creator/portfolio">
                        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#C4F042]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-6 w-6 text-[#18181B]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#18181B]">Mettre à jour le portfolio</p>
                                <p className="text-sm text-[#71717A]">Ajoutez vos dernières créations</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/creator/missions">
                        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Briefcase className="h-6 w-6 text-blue-700" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#18181B]">Mes missions</p>
                                <p className="text-sm text-[#71717A]">Suivre vos missions en cours</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/creator/settings">
                        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] hover:bg-white transition-all cursor-pointer group p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Star className="h-6 w-6 text-emerald-700" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-medium text-[#18181B]">Compléter le profil</p>
                                <p className="text-sm text-[#71717A]">Augmentez votre visibilité</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
