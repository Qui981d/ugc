'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Clock,
    CheckCircle2,
    Calendar,
    Eye,
    Target,
    Loader2,
    Megaphone,
    XCircle,
    ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { getMyCampaigns } from "@/lib/services/campaignService"
import type { Campaign } from "@/types/database"

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
    draft: { label: "Brief envoyé", class: "bg-amber-100 text-amber-700", icon: Clock },
    open: { label: "Créateur en sélection", class: "bg-blue-100 text-blue-700", icon: Eye },
    in_progress: { label: "En production", class: "bg-purple-100 text-purple-700", icon: Clock },
    completed: { label: "Vidéo livrée", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    cancelled: { label: "Annulé", class: "bg-red-100 text-red-700", icon: XCircle },
}

export default function BrandCampaignsPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('all')
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

    const tabs = [
        { id: 'all', label: 'Tous', count: campaigns.length },
        { id: 'active', label: 'En cours', count: campaigns.filter(c => c.status === 'draft' || c.status === 'open' || c.status === 'in_progress').length },
        { id: 'completed', label: 'Terminés', count: campaigns.filter(c => c.status === 'completed').length },
    ]

    const filteredCampaigns = campaigns.filter(campaign => {
        if (activeTab === 'all') return true
        if (activeTab === 'active') return campaign.status === 'draft' || campaign.status === 'open' || campaign.status === 'in_progress'
        if (activeTab === 'completed') return campaign.status === 'completed'
        return true
    })

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mes Briefs</h1>
                    <p className="text-gray-500 mt-1">Suivez l&apos;avancement de vos projets vidéo</p>
                </div>
                <Link href="/brand/campaigns/new">
                    <Button className="btn-primary w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau brief
                    </Button>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#6C3FA0] text-white'
                            : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {tab.label}
                        <span className="ml-2 text-xs opacity-70">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Briefs List */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                >
                    {filteredCampaigns.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun brief pour le moment</p>
                            <Link href="/brand/campaigns/new">
                                <Button className="btn-primary mt-4">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Envoyer un brief
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        filteredCampaigns.map((campaign, index) => {
                            const status = statusConfig[campaign.status] || statusConfig.draft
                            const StatusIcon = status.icon

                            return (
                                <motion.div
                                    key={campaign.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <Link
                                        href={`/brand/campaigns/${campaign.id}`}
                                        className="block bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 transition-all group hover:shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-gray-900 font-semibold truncate group-hover:text-[#6C3FA0] transition-colors">
                                                        {campaign.title}
                                                    </h3>
                                                    <Badge className={`${status.class} border-0`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                {campaign.description && (
                                                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">{campaign.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-3.5 h-3.5" />
                                                        {campaign.script_type}
                                                    </span>
                                                    {campaign.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {new Date(campaign.deadline).toLocaleDateString('fr-CH')}
                                                        </span>
                                                    )}
                                                    <span className="font-semibold text-gray-900">{formatCHF(campaign.budget_chf)}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#6C3FA0] group-hover:translate-x-1 transition-all ml-4" />
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
