'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WatermarkedPlayer } from "@/components/video/WatermarkedPlayer"
import {
    Check, X, MessageSquare, Upload, Clock, User, Send,
    ArrowLeft, Download, RefreshCw, FileVideo, AlertCircle,
    Loader2, CheckCircle2, XCircle, RotateCcw
} from "lucide-react"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import {
    uploadVideo, createDeliverable, getDeliverables,
    updateDeliverableStatus, getDownloadUrl, getVideoSignedUrl,
    type Deliverable
} from "@/lib/services/deliverableService"
import {
    notifyDeliverableSubmitted, notifyDeliverableApproved,
    notifyDeliverableRevision, notifyDeliverableRejected
} from "@/lib/services/notificationService"
import { toast } from "sonner"
import Link from "next/link"
import { useParams } from "next/navigation"

// ================================================
// STATUS CONFIG
// ================================================

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'En attente', color: 'bg-amber-500/20 text-amber-700 border-amber-500/30', icon: Clock },
    review: { label: 'En validation', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', icon: Clock },
    revision_requested: { label: 'Révision demandée', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: RotateCcw },
    approved: { label: 'Approuvé', color: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30', icon: CheckCircle2 },
    rejected: { label: 'Rejeté', color: 'bg-red-500/20 text-red-700 border-red-500/30', icon: XCircle },
}

// ================================================
// TYPES
// ================================================

interface MissionData {
    application_id: string
    campaign_id: string
    campaign_title: string
    campaign_description: string
    budget_chf: number
    deadline: string | null
    script_type: string | null
    video_format: string | null
    brand_id: string
    brand_name: string
    creator_id: string
    creator_name: string
    application_status: string
}

// ================================================
// MAIN COMPONENT
// ================================================

export default function SharedMissionPage() {
    const { user } = useAuth()
    const params = useParams()
    const missionId = params?.id as string

    const [mission, setMission] = useState<MissionData | null>(null)
    const [deliverables, setDeliverables] = useState<Deliverable[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('details')

    // Upload state
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Review state
    const [revisionNotes, setRevisionNotes] = useState('')
    const [showRevisionInput, setShowRevisionInput] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null)

    const userRole = user?.role as 'brand' | 'creator' | undefined
    const latestDeliverable = deliverables[0] || null

    // Resolve signed URL when deliverable changes
    useEffect(() => {
        if (latestDeliverable?.video_url) {
            getVideoSignedUrl(latestDeliverable.video_url).then(url => {
                setSignedVideoUrl(url)
            })
        } else {
            setSignedVideoUrl(null)
        }
    }, [latestDeliverable?.video_url])

    // ================================================
    // DATA FETCHING
    // ================================================

    const fetchMissionData = useCallback(async () => {
        if (!missionId || !user) return
        setIsLoading(true)
        const supabase = createClient()

        // Step 1: Fetch the application with campaign data
        const { data, error } = await (supabase as any)
            .from('applications')
            .select(`
                id,
                status,
                campaign_id,
                creator_id,
                campaigns (
                    id, title, description, budget_chf, deadline, script_type, format,
                    brand_id
                )
            `)
            .eq('id', missionId)
            .single()

        if (error || !data) {
            console.error('Error fetching mission:', JSON.stringify(error, null, 2), 'missionId:', missionId, 'userId:', user?.id)
            setIsLoading(false)
            return
        }

        const campaign = data.campaigns

        // Step 2: Fetch brand name
        const { data: brandData } = await (supabase as any)
            .from('users')
            .select('full_name')
            .eq('id', campaign.brand_id)
            .single()

        // Step 3: Fetch creator name
        const { data: creatorData } = await (supabase as any)
            .from('users')
            .select('full_name')
            .eq('id', data.creator_id)
            .single()

        setMission({
            application_id: data.id,
            campaign_id: campaign.id,
            campaign_title: campaign.title,
            campaign_description: campaign.description || '',
            budget_chf: campaign.budget_chf,
            deadline: campaign.deadline,
            script_type: campaign.script_type,
            video_format: campaign.format,
            brand_id: campaign.brand_id,
            brand_name: brandData?.full_name || 'Marque',
            creator_id: data.creator_id,
            creator_name: creatorData?.full_name || 'Créateur',
            application_status: data.status,
        })

        // Fetch deliverables for this campaign + creator
        const delivs = await getDeliverables(campaign.id, data.creator_id)
        setDeliverables(delivs)
        setIsLoading(false)
    }, [missionId, user])

    useEffect(() => {
        fetchMissionData()
    }, [fetchMissionData])

    // ================================================
    // UPLOAD HANDLERS
    // ================================================

    const handleFileSelect = async (file: File) => {
        if (!mission || !user) return

        // Validate file type
        if (!file.type.startsWith('video/')) {
            alert('Veuillez sélectionner un fichier vidéo')
            return
        }

        // Max 500MB
        if (file.size > 500 * 1024 * 1024) {
            alert('La taille maximale est de 500 MB')
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        // Simulate progress (Supabase doesn't provide real progress)
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + Math.random() * 15, 90))
        }, 500)

        try {
            // Upload video
            const videoUrl = await uploadVideo(file, mission.campaign_id, user.id)
            if (!videoUrl) {
                throw new Error('Upload failed')
            }

            clearInterval(progressInterval)
            setUploadProgress(95)

            // Create deliverable record
            const deliverable = await createDeliverable({
                campaign_id: mission.campaign_id,
                creator_id: user.id,
                video_url: videoUrl,
            })

            if (!deliverable) {
                throw new Error('Failed to create deliverable record')
            }

            setUploadProgress(100)

            // Send notification to brand
            await notifyDeliverableSubmitted(
                mission.brand_id,
                mission.campaign_id,
                mission.creator_name
            )

            // Refresh deliverables
            const delivs = await getDeliverables(mission.campaign_id, user.id)
            setDeliverables(delivs)
            setActiveTab('deliverable')
        } catch (err) {
            console.error('Upload error:', err)
            alert('Erreur lors de l\'upload. Veuillez réessayer.')
        } finally {
            clearInterval(progressInterval)
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileSelect(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = () => setDragActive(false)

    // ================================================
    // REVIEW HANDLERS (Brand)
    // ================================================

    const handleApprove = async () => {
        if (!latestDeliverable || !mission) return
        setIsSubmitting(true)

        const success = await updateDeliverableStatus(latestDeliverable.id, 'approved')
        if (success) {
            toast.success('Livrable approuvé !', { description: 'La mission a été marquée comme terminée.' })
            await notifyDeliverableApproved(mission.creator_id, mission.campaign_id, mission.campaign_title)
            const delivs = await getDeliverables(mission.campaign_id, mission.creator_id)
            setDeliverables(delivs)
        } else {
            toast.error('Erreur lors de l\'approbation')
        }
        setIsSubmitting(false)
    }

    const handleRequestRevision = async () => {
        if (!latestDeliverable || !mission || !revisionNotes.trim()) return
        setIsSubmitting(true)

        const success = await updateDeliverableStatus(latestDeliverable.id, 'revision_requested', revisionNotes)
        if (success) {
            toast.success('Demande de révision envoyée', { description: 'Le créateur a été notifié.' })
            await notifyDeliverableRevision(mission.creator_id, mission.campaign_id, mission.campaign_title)
            const delivs = await getDeliverables(mission.campaign_id, mission.creator_id)
            setDeliverables(delivs)
            setRevisionNotes('')
            setShowRevisionInput(false)
        } else {
            toast.error('Erreur lors de l\'envoi de la révision')
        }
        setIsSubmitting(false)
    }

    const handleReject = async () => {
        if (!latestDeliverable || !mission) return
        if (!confirm('Êtes-vous sûr de vouloir rejeter ce livrable ?')) return
        setIsSubmitting(true)

        const success = await updateDeliverableStatus(latestDeliverable.id, 'rejected')
        if (success) {
            toast.success('Livrable rejeté', { description: 'Le créateur a été notifié.' })
            await notifyDeliverableRejected(mission.creator_id, mission.campaign_id, mission.campaign_title)
            const delivs = await getDeliverables(mission.campaign_id, mission.creator_id)
            setDeliverables(delivs)
        } else {
            toast.error('Erreur lors du rejet')
        }
        setIsSubmitting(false)
    }

    const handleDownload = async () => {
        if (!latestDeliverable) return
        const url = await getDownloadUrl(latestDeliverable.video_url)
        if (url) {
            window.open(url, '_blank')
        }
    }

    // ================================================
    // LOADING STATE
    // ================================================

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (!mission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="w-12 h-12 text-gray-400" />
                <p className="text-gray-500">Mission introuvable</p>
                <Link href={userRole === 'brand' ? '/brand/campaigns' : '/creator/missions'}>
                    <Button variant="outline" className="border-gray-200 text-gray-900 hover:bg-gray-100">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
            </div>
        )
    }

    const deliverableStatus = latestDeliverable?.status || 'pending'
    const statusInfo = statusConfig[deliverableStatus] || statusConfig.pending

    // ================================================
    // RENDER
    // ================================================

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Back Button */}
            <Link href={userRole === 'brand' ? '/brand/campaigns' : '/creator/missions'}>
                <Button variant="ghost" className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                </Button>
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Badge className={`${statusInfo.color} border`}>
                            {statusInfo.label}
                        </Badge>
                        {mission.deadline && (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Deadline: {new Date(mission.deadline).toLocaleDateString('fr-CH')}
                            </span>
                        )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">{mission.campaign_title}</h1>
                    <p className="text-gray-500 mt-1">
                        {userRole === 'brand'
                            ? `Créateur: ${mission.creator_name}`
                            : `Marque: ${mission.brand_name}`
                        }
                    </p>
                </div>
                <div className="sm:text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCHF(mission.budget_chf)}</p>
                    <p className="text-sm text-gray-400">
                        {deliverableStatus === 'approved' ? 'Payé ✓' : 'En séquestre'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-50 border border-gray-200">
                    <TabsTrigger value="details" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500">
                        Détails du brief
                    </TabsTrigger>
                    <TabsTrigger value="deliverable" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500 gap-2">
                        <FileVideo className="w-4 h-4" />
                        Livrable
                        {latestDeliverable && (
                            <span className={`w-2 h-2 rounded-full ${deliverableStatus === 'approved' ? 'bg-emerald-400' :
                                deliverableStatus === 'revision_requested' ? 'bg-orange-400' :
                                    deliverableStatus === 'rejected' ? 'bg-red-400' :
                                        'bg-blue-400'
                                }`} />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 text-gray-500 gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Messages
                    </TabsTrigger>
                </TabsList>

                {/* ============================================ */}
                {/* DETAILS TAB */}
                {/* ============================================ */}
                <TabsContent value="details" className="mt-6">
                    <div className="bg-white/[0.03] border border-gray-200 rounded-2xl p-6 space-y-6">
                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Description</h4>
                            <p className="text-gray-600 leading-relaxed">
                                {mission.campaign_description || 'Aucune description fournie.'}
                            </p>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs text-gray-400 mb-1">Budget</p>
                                <p className="text-gray-900 font-semibold">{formatCHF(mission.budget_chf)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs text-gray-400 mb-1">Format</p>
                                <p className="text-gray-900 font-semibold">{mission.video_format || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs text-gray-400 mb-1">Type</p>
                                <p className="text-gray-900 font-semibold">{mission.script_type || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs text-gray-400 mb-1">Deadline</p>
                                <p className="text-gray-900 font-semibold">
                                    {mission.deadline
                                        ? new Date(mission.deadline).toLocaleDateString('fr-CH')
                                        : '—'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ============================================ */}
                {/* DELIVERABLE TAB */}
                {/* ============================================ */}
                <TabsContent value="deliverable" className="mt-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Left: Video Preview or Upload */}
                        <div>
                            {latestDeliverable ? (
                                /* Video Player */
                                <div className="bg-white/[0.03] border border-gray-200 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-900 font-semibold">Vidéo soumise</h3>
                                        <Badge className={`${statusInfo.color} border`}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-center">
                                        {signedVideoUrl ? (
                                            <WatermarkedPlayer
                                                videoUrl={signedVideoUrl}
                                                isWatermarked={latestDeliverable.is_watermarked}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center min-h-[300px]">
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                                        <span>
                                            Soumis le {new Date(latestDeliverable.created_at).toLocaleDateString('fr-CH')}
                                        </span>
                                        {deliverableStatus === 'approved' && (
                                            <Button
                                                size="sm"
                                                onClick={handleDownload}
                                                className="bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 border border-emerald-500/30"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Télécharger HD
                                            </Button>
                                        )}
                                    </div>

                                    {/* Creator: re-upload if revision requested */}
                                    {userRole === 'creator' && deliverableStatus === 'revision_requested' && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full bg-[#6C3FA0] hover:bg-[#6C3FA0]/80"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Soumettre une nouvelle version
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="video/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFileSelect(file)
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : userRole === 'creator' ? (
                                /* Upload Zone */
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={`
                                        bg-white/[0.03] border-2 border-dashed rounded-2xl p-8
                                        flex flex-col items-center justify-center text-center
                                        min-h-[400px] transition-all duration-300 cursor-pointer
                                        ${dragActive
                                            ? 'border-[#6C3FA0] bg-[#6C3FA0]/5 scale-[1.01]'
                                            : 'border-gray-200 hover:border-white/30 hover:bg-gray-50'
                                        }
                                        ${isUploading ? 'pointer-events-none' : ''}
                                    `}
                                    onClick={() => !isUploading && fileInputRef.current?.click()}
                                >
                                    {isUploading ? (
                                        /* Upload Progress */
                                        <div className="w-full max-w-xs space-y-4">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-[#6C3FA0]/20 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-[#6C3FA0] animate-spin" />
                                            </div>
                                            <p className="text-gray-900 font-medium">Upload en cours...</p>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-[#6C3FA0] h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-gray-400 text-sm">{Math.round(uploadProgress)}%</p>
                                        </div>
                                    ) : (
                                        /* Drop zone */
                                        <>
                                            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                                <Upload className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 font-medium text-lg mb-1">
                                                Glissez votre vidéo ici
                                            </p>
                                            <p className="text-gray-400 text-sm mb-4">
                                                ou cliquez pour sélectionner
                                            </p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                <span className="px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-400">MP4</span>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-400">MOV</span>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-400">WebM</span>
                                                <span className="px-3 py-1 bg-gray-50 rounded-full text-xs text-gray-400">Max 500 MB</span>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleFileSelect(file)
                                        }}
                                    />
                                </div>
                            ) : (
                                /* Brand: no deliverable yet */
                                <div className="bg-white/[0.03] border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <Clock className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">En attente du livrable</p>
                                    <p className="text-gray-400 text-sm mt-1">Le créateur n'a pas encore soumis de vidéo</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Actions & Status */}
                        <div className="space-y-4">
                            {/* Status Timeline */}
                            <div className="bg-white/[0.03] border border-gray-200 rounded-2xl p-6">
                                <h3 className="text-gray-900 font-semibold mb-4">Historique</h3>
                                <div className="space-y-4">
                                    {deliverables.length === 0 ? (
                                        <p className="text-gray-400 text-sm">Aucun livrable soumis</p>
                                    ) : (
                                        deliverables.map((deliv, index) => {
                                            const info = statusConfig[deliv.status] || statusConfig.pending
                                            const StatusIcon = info.icon
                                            return (
                                                <div key={deliv.id} className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index === 0 ? 'bg-gray-100' : 'bg-gray-50'
                                                        }`}>
                                                        <StatusIcon className={`w-4 h-4 ${deliv.status === 'approved' ? 'text-emerald-700' :
                                                            deliv.status === 'rejected' ? 'text-red-700' :
                                                                deliv.status === 'revision_requested' ? 'text-orange-400' :
                                                                    'text-blue-700'
                                                            }`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-600">
                                                            {info.label}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(deliv.updated_at).toLocaleDateString('fr-CH', {
                                                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                        {deliv.revision_notes && (
                                                            <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                                                <p className="text-xs text-orange-400 font-medium mb-1">Notes de révision :</p>
                                                                <p className="text-sm text-gray-500">{deliv.revision_notes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Brand Review Actions */}
                            {userRole === 'brand' && latestDeliverable && deliverableStatus === 'review' && (
                                <div className="bg-white/[0.03] border border-gray-200 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-gray-900 font-semibold">Actions</h3>

                                    <Button
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-medium"
                                        onClick={handleApprove}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4 mr-2" />
                                        )}
                                        Approuver le livrable
                                    </Button>

                                    {showRevisionInput ? (
                                        <div className="space-y-3">
                                            <textarea
                                                placeholder="Décrivez les modifications souhaitées..."
                                                value={revisionNotes}
                                                onChange={(e) => setRevisionNotes(e.target.value)}
                                                rows={3}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-white/25 placeholder:text-gray-400 resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    className="flex-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30"
                                                    onClick={handleRequestRevision}
                                                    disabled={isSubmitting || !revisionNotes.trim()}
                                                >
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    Envoyer
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                                                    onClick={() => { setShowRevisionInput(false); setRevisionNotes('') }}
                                                >
                                                    Annuler
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            onClick={() => setShowRevisionInput(true)}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Demander une révision
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        className="w-full text-red-700/60 hover:text-red-700 hover:bg-red-500/10"
                                        onClick={handleReject}
                                        disabled={isSubmitting}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Rejeter
                                    </Button>
                                </div>
                            )}

                            {/* Approved Download Card */}
                            {deliverableStatus === 'approved' && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                                    <div>
                                        <p className="text-emerald-700 font-semibold">Livrable approuvé</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Les droits ont été transférés le{' '}
                                            {latestDeliverable?.rights_transferred_at
                                                ? new Date(latestDeliverable.rights_transferred_at).toLocaleDateString('fr-CH')
                                                : '—'
                                            }
                                        </p>
                                    </div>
                                    {userRole === 'brand' && (
                                        <Button
                                            className="bg-emerald-500 hover:bg-emerald-600 text-gray-900"
                                            onClick={handleDownload}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Télécharger la version HD
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Revision Notes for Creator */}
                            {userRole === 'creator' && deliverableStatus === 'revision_requested' && latestDeliverable?.revision_notes && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="w-5 h-5 text-orange-400" />
                                        <h3 className="text-orange-400 font-semibold">Révision demandée</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        {latestDeliverable.revision_notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* ============================================ */}
                {/* MESSAGES TAB */}
                {/* ============================================ */}
                <TabsContent value="messages" className="mt-6">
                    <div className="bg-white/[0.03] border border-gray-200 rounded-2xl p-6">
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Messagerie</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Utilisez la messagerie du dashboard pour communiquer
                            </p>
                            <Link href={userRole === 'brand' ? '/brand/messages' : '/creator/messages'}>
                                <Button variant="outline" className="mt-4 border-gray-200 text-gray-900 hover:bg-gray-100">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Ouvrir les messages
                                </Button>
                            </Link>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
