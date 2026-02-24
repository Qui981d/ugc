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
    Search,
    Loader2,
    Users,
    FileText,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getCampaignApplications, updateApplicationStatus, type ApplicationWithCreator } from "@/lib/services/applicationService"
import { getCampaignById } from "@/lib/services/campaignService"
// Note: In the agency model, contracts are managed via admin dashboard (MOSH ↔ Creator).
// This page only handles basic accept/reject of applications.
import ContractModal from "@/components/contracts/ContractModal"
import ContractViewer from "@/components/contracts/ContractViewer"
import type { Campaign } from "@/types/database"

const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: "En attente", class: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
    accepted: { label: "Accepté", class: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" },
    rejected: { label: "Refusé", class: "bg-red-500/20 text-red-700 border-red-500/30" },
    withdrawn: { label: "Retiré", class: "bg-gray-100 text-gray-500 border-white/30" },
}

export default function CampaignApplicantsPage() {
    const params = useParams()
    const campaignId = params.id as string
    const { user, isLoading, profile } = useAuth()
    const userId = user?.id
    const brandProfile = profile?.brandProfile

    const [applications, setApplications] = useState<ApplicationWithCreator[]>([])
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)

    // Contract modal state
    const [contractModalOpen, setContractModalOpen] = useState(false)
    const [selectedApplication, setSelectedApplication] = useState<ApplicationWithCreator | null>(null)
    const [contractLoading, setContractLoading] = useState(false)

    // Contract viewer state
    const [viewerOpen, setViewerOpen] = useState(false)
    const [viewerText, setViewerText] = useState<string | null>(null)
    const [viewerApp, setViewerApp] = useState<ApplicationWithCreator | null>(null)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!userId) return
        if (!campaignId || !user) return

        async function loadData() {
            setIsDataLoading(true)
            const campaignData = await getCampaignById(campaignId)
            if (campaignData) {
                setCampaign(campaignData)
            }
            const apps = await getCampaignApplications(campaignId)
            setApplications(apps)
            setIsDataLoading(false)
        }

        loadData()
    }, [campaignId, userId])

    // Open contract modal for brand acceptance
    const handleAcceptClick = (application: ApplicationWithCreator) => {
        setSelectedApplication(application)
        setContractModalOpen(true)
    }

    // Brand accepts application (in agency model, contract is handled by MOSH admin)
    const handleContractAccept = async () => {
        if (!selectedApplication) return
        setContractLoading(true)

        try {
            const result = await updateApplicationStatus(selectedApplication.id, 'accepted')

            if (result.success) {
                setApplications(prev =>
                    prev.map(app =>
                        app.id === selectedApplication.id
                            ? { ...app, status: 'accepted' as const }
                            : app
                    )
                )
                setContractModalOpen(false)
                setSelectedApplication(null)
            } else {
                alert('Erreur: ' + result.error)
            }
        } catch (err) {
            console.error('Accept error:', err)
            alert('Erreur lors de l\'acceptation')
        }

        setContractLoading(false)
    }

    // Reject application (direct, no contract needed)
    const handleReject = async (applicationId: string) => {
        setUpdatingId(applicationId)
        const result = await updateApplicationStatus(applicationId, 'rejected')
        if (result.success) {
            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId ? { ...app, status: 'rejected' as const } : app
                )
            )
        } else {
            alert('Erreur: ' + result.error)
        }
        setUpdatingId(null)
    }

    // View existing contract (disabled in agency model — contracts managed by admin)
    const handleViewContract = async (_application: ApplicationWithCreator) => {
        // No-op in agency model
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
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/brand/campaigns">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div className="h-6 w-px bg-gray-100" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Candidatures</h1>
                    <p className="text-gray-500 text-sm">{campaign?.title || 'Chargement...'}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {tabs.map((tab, index) => (
                    <motion.div
                        key={tab.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`bg-white border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${activeTab === tab.id
                            ? 'border-[#6C3FA0]/50 bg-[#6C3FA0]/10'
                            : 'border-white/[0.15] hover:border-white/25'
                            }`}
                    >
                        <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
                        <p className="text-sm text-gray-500">{tab.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher un créateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-white/25"
                />
            </div>

            {/* Applicants List */}
            <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{applications.length === 0 ? 'Aucune candidature pour le moment' : 'Aucun créateur dans cette catégorie'}</p>
                    </div>
                ) : (
                    filteredApplications.map((application, index) => {
                        const status = statusConfig[application.status] || statusConfig.pending
                        const creator = application.creator
                        const profile = creator?.profiles_creator
                        const hasContract = !!(application as any).contract_status

                        return (
                            <motion.div
                                key={application.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white border border-white/[0.15] hover:border-white/25 rounded-2xl p-4 sm:p-6 transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                                    {/* Avatar */}
                                    <Link href={`/creators/${creator?.id}`}>
                                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer hover:ring-2 ring-[#6C3FA0] transition-all">
                                            {creator?.avatar_url ? (
                                                <Image
                                                    src={creator.avatar_url}
                                                    alt={creator?.full_name || 'Creator'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                                                    {creator?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Link href={`/creators/${creator?.id}`}>
                                                        <h3 className="text-lg font-semibold text-gray-900 hover:text-[#6C3FA0] transition-colors cursor-pointer">
                                                            {creator?.full_name || 'Créateur inconnu'}
                                                        </h3>
                                                    </Link>
                                                    <Badge className={`${status.class} border`}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                    {(profile as any)?.location_canton && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {(profile as any).location_canton}
                                                        </span>
                                                    )}
                                                    {(profile as any)?.rating_avg > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 text-amber-700" />
                                                            {Number((profile as any).rating_avg).toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 hidden sm:block">
                                                {new Date(application.created_at).toLocaleDateString('fr-CH')}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        {application.pitch_message && (
                                            <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                                                &ldquo;{application.pitch_message}&rdquo;
                                            </p>
                                        )}

                                        {/* Specialties */}
                                        {profile?.specialties && profile.specialties.length > 0 && (
                                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                {profile.specialties.slice(0, 3).map(specialty => (
                                                    <span
                                                        key={specialty}
                                                        className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                                        {application.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="btn-primary flex-1 sm:flex-none"
                                                    onClick={() => handleAcceptClick(application)}
                                                    disabled={updatingId === application.id}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                    Accepter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-700 hover:text-red-300 hover:bg-red-500/10 flex-1 sm:flex-none"
                                                    onClick={() => handleReject(application.id)}
                                                    disabled={updatingId === application.id}
                                                >
                                                    {updatingId === application.id ? (
                                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                    )}
                                                    Refuser
                                                </Button>
                                            </>
                                        )}
                                        {hasContract && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-[#6C3FA0] hover:text-[#6C3FA0] hover:bg-[#6C3FA0]/10 w-full"
                                                onClick={() => handleViewContract(application)}
                                            >
                                                <FileText className="w-4 h-4 mr-1" />
                                                Contrat
                                            </Button>
                                        )}
                                        <Link href={`/brand/messages?campaign=${params.id}&creator=${creator?.id}`}>
                                            <Button size="sm" variant="ghost" className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                                                <MessageSquare className="w-4 h-4 mr-1" />
                                                Message
                                            </Button>
                                        </Link>
                                        <Link href={`/creators/${creator?.id}`}>
                                            <Button size="sm" variant="ghost" className="w-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
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

            {/* Contract Modal for brand acceptance */}
            {selectedApplication && campaign && (
                <ContractModal
                    isOpen={contractModalOpen}
                    onClose={() => {
                        setContractModalOpen(false)
                        setSelectedApplication(null)
                    }}
                    onAccept={handleContractAccept}
                    isLoading={contractLoading}
                    mode="brand"
                    data={{
                        brandName: brandProfile?.company_name || user?.full_name || 'Marque',
                        brandContact: user?.full_name || '',
                        creatorName: selectedApplication.creator?.full_name || 'Créateur',
                        campaignTitle: campaign.title,
                        campaignDescription: campaign.description || '',
                        amount: campaign.budget_chf,
                        deadline: campaign.deadline,
                        format: campaign.format,
                        scriptType: campaign.script_type,
                    }}
                />
            )}

            {/* Contract Viewer for viewing existing contracts */}
            {viewerApp && (
                <ContractViewer
                    isOpen={viewerOpen}
                    onClose={() => {
                        setViewerOpen(false)
                        setViewerApp(null)
                        setViewerText(null)
                    }}
                    contractText={viewerText}
                    contractStatus={(viewerApp as any).contract_status}
                    contractUrl={(viewerApp as any).contract_url}
                    mode="brand"
                />
            )}
        </div>
    )
}
