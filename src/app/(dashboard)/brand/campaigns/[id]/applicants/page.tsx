'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Star,
    Eye,
    MapPin,
    Filter,
    Search,
    Loader2,
    Users
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getCampaignApplications, updateApplicationStatus, type ApplicationWithCreator } from "@/lib/services/applicationService"
import { getCampaignById } from "@/lib/services/campaignService"

const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: "En attente", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    accepted: { label: "Accepté", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    rejected: { label: "Refusé", class: "bg-red-500/20 text-red-400 border-red-500/30" },
    withdrawn: { label: "Retiré", class: "bg-white/20 text-white/60 border-white/30" },
}

export default function CampaignApplicantsPage() {
    const params = useParams()
    const campaignId = params.id as string
    const { user, isLoading } = useAuth()
    const userId = user?.id

    const [applications, setApplications] = useState<ApplicationWithCreator[]>([])
    const [campaignTitle, setCampaignTitle] = useState<string>('')
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        // Don't do anything while auth is loading
        if (!userId) return

        // No data to load without campaignId or user
        if (!campaignId || !user) return

        async function loadData() {
            setIsDataLoading(true)
            // Load campaign details
            const campaign = await getCampaignById(campaignId)
            if (campaign) {
                setCampaignTitle(campaign.title)
            }

            // Load applications
            const apps = await getCampaignApplications(campaignId)
            setApplications(apps)
            setIsDataLoading(false)
        }

        loadData()
    }, [campaignId, userId])

    const handleUpdateStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
        setUpdatingId(applicationId)
        const result = await updateApplicationStatus(applicationId, status)
        if (result.success) {
            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId ? { ...app, status } : app
                )
            )
        } else {
            alert('Erreur: ' + result.error)
        }
        setUpdatingId(null)
    }

    // Calculate counts for tabs
    const counts = {
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        accepted: applications.filter(a => a.status === 'accepted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    const tabs = [
        { id: 'all', label: 'Tous', count: counts.all },
        { id: 'pending', label: 'En attente', count: counts.pending },
        { id: 'accepted', label: 'Acceptés', count: counts.accepted },
        { id: 'rejected', label: 'Refusés', count: counts.rejected },
    ]

    const filteredApplications = applications.filter(app => {
        const matchesTab = activeTab === 'all' || app.status === activeTab
        const creatorName = app.creator?.full_name || ''
        const matchesSearch = creatorName.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesTab && matchesSearch
    })

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/brand/campaigns">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Candidatures</h1>
                    <p className="text-white/60 text-sm">{campaignTitle || 'Chargement...'}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {tabs.map((tab, index) => (
                    <motion.div
                        key={tab.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`bg-white/[0.08] backdrop-blur-xl border rounded-2xl p-5 cursor-pointer transition-all ${activeTab === tab.id
                            ? 'border-accent/50 bg-accent/10'
                            : 'border-white/[0.15] hover:border-white/25'
                            }`}
                    >
                        <p className="text-2xl font-bold text-white">{tab.count}</p>
                        <p className="text-sm text-white/50">{tab.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Rechercher un créateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/25"
                />
            </div>

            {/* Applicants List */}
            <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                    <div className="text-center py-16 text-white/40">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{applications.length === 0 ? 'Aucune candidature pour le moment' : 'Aucun créateur dans cette catégorie'}</p>
                    </div>
                ) : (
                    filteredApplications.map((application, index) => {
                        const status = statusConfig[application.status] || statusConfig.pending
                        const creator = application.creator
                        const profile = creator?.profiles_creator

                        return (
                            <motion.div
                                key={application.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] hover:border-white/25 rounded-2xl p-6 transition-all"
                            >
                                <div className="flex items-start gap-5">
                                    {/* Avatar */}
                                    <Link href={`/creators/${creator?.id}`}>
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 cursor-pointer hover:ring-2 ring-accent transition-all">
                                            {creator?.avatar_url ? (
                                                <Image
                                                    src={creator.avatar_url}
                                                    alt={creator?.full_name || 'Creator'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/40 text-xl font-bold">
                                                    {creator?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <Link href={`/creators/${creator?.id}`}>
                                                        <h3 className="text-lg font-semibold text-white hover:text-accent transition-colors cursor-pointer">
                                                            {creator?.full_name || 'Créateur inconnu'}
                                                        </h3>
                                                    </Link>
                                                    <Badge className={`${status.class} border`}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                                                    {(profile as any)?.location_canton && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {(profile as any).location_canton}
                                                        </span>
                                                    )}
                                                    {(profile as any)?.rating_avg > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 text-amber-400" />
                                                            {Number((profile as any).rating_avg).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-white/40">
                                                {new Date(application.created_at).toLocaleDateString('fr-CH')}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        {application.pitch_message && (
                                            <p className="text-sm text-white/60 mt-3 line-clamp-2">
                                                "{application.pitch_message}"
                                            </p>
                                        )}

                                        {/* Specialties */}
                                        {profile?.specialties && profile.specialties.length > 0 && (
                                            <div className="flex items-center gap-2 mt-3">
                                                {profile.specialties.slice(0, 3).map(specialty => (
                                                    <span
                                                        key={specialty}
                                                        className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-md"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        {application.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="btn-primary"
                                                    onClick={() => handleUpdateStatus(application.id, 'accepted')}
                                                    disabled={updatingId === application.id}
                                                >
                                                    {updatingId === application.id ? (
                                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                    )}
                                                    Accepter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => handleUpdateStatus(application.id, 'rejected')}
                                                    disabled={updatingId === application.id}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Refuser
                                                </Button>
                                            </>
                                        )}
                                        <Link href={`/brand/messages?campaign=${params.id}&creator=${creator?.id}`}>
                                            <Button size="sm" variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10">
                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                Message
                                            </Button>
                                        </Link>
                                        <Link href={`/creators/${creator?.id}`}>
                                            <Button size="sm" variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10">
                                                <Eye className="w-4 h-4 mr-1" />
                                                Profil
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
