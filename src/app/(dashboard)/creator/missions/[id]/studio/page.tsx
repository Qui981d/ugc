'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    FileText,
    Upload,
    CheckCircle2,
    Clock,
    Play,
    Pen,
    Loader2,
    Camera,
    MessageSquare,
    StickyNote,
    ListChecks,
    Plus,
    Trash2,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Film,
    Calendar,
    Send,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getMissionSteps, completeMissionStep } from '@/lib/services/adminService'
import type { Campaign, MissionStep, MissionStepType } from '@/types/database'

// Default checklist items for a new production
const DEFAULT_CHECKLIST = [
    'Lire le brief et le script',
    'Préparer le setup (éclairage, son, cadrage)',
    'Tester l\'enregistrement audio',
    'Filmer la première prise',
    'Vérifier la qualité avant export',
    'Exporter en haute qualité',
]

export default function CreatorStudioPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const campaignId = params.id as string
    const contentId = searchParams.get('content')

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [contentData, setContentData] = useState<any>(null)
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Notes
    const [notes, setNotes] = useState('')
    const [notesSaving, setNotesSaving] = useState(false)
    const [notesSaved, setNotesSaved] = useState(false)
    const notesTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Checklist
    const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([])
    const [newCheckItem, setNewCheckItem] = useState('')

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoUploading, setVideoUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragOver, setDragOver] = useState(false)
    const [fileError, setFileError] = useState<string | null>(null)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
    const [videoDuration, setVideoDuration] = useState<number | null>(null)

    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB
    const ACCEPTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mov']

    const validateAndSetVideo = (file: File) => {
        setFileError(null)

        // Check format
        const isVideoExt = /\.(mp4|mov|avi|webm)$/i.test(file.name)
        if (!file.type.startsWith('video/') && !isVideoExt) {
            setFileError('Format non supporté. Utilisez MP4, MOV, AVI ou WebM.')
            return
        }

        // Check size
        if (file.size > MAX_FILE_SIZE) {
            setFileError(`Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(0)} MB). Maximum : 500 MB.`)
            return
        }

        // Create preview URL
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
        const previewUrl = URL.createObjectURL(file)
        setVideoPreviewUrl(previewUrl)

        // Get duration via a hidden video element
        const tempVideo = document.createElement('video')
        tempVideo.preload = 'metadata'
        tempVideo.onloadedmetadata = () => {
            setVideoDuration(tempVideo.duration)
            URL.revokeObjectURL(tempVideo.src)
        }
        tempVideo.src = previewUrl

        setVideoFile(file)
    }

    // UI
    const [scriptExpanded, setScriptExpanded] = useState(true)
    const [briefExpanded, setBriefExpanded] = useState(false)
    const [actionSuccess, setActionSuccess] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        const supabase = createClient()
        const [{ data: campData }, missionSteps] = await Promise.all([
            supabase.from('campaigns').select('*').eq('id', campaignId).single(),
            getMissionSteps(campaignId),
        ])
        const camp = campData as unknown as Campaign
        setCampaign(camp)
        setSteps(missionSteps)

        // Load specific content if content ID provided
        if (contentId) {
            const { data: cData } = await supabase
                .from('campaign_contents')
                .select('*')
                .eq('id', contentId)
                .single()
            setContentData(cData)
        } else {
            // If no content param, load first content
            const { data: contents } = await supabase
                .from('campaign_contents')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('position', { ascending: true })
                .limit(1)
            if (contents && contents.length > 0) setContentData(contents[0])
        }

        setIsLoading(false)

        // Load notes
        if (camp?.creator_notes) setNotes(camp.creator_notes)

        // Load checklist
        if (camp?.creator_checklist && camp.creator_checklist.length > 0) {
            try {
                const parsed = camp.creator_checklist.map((item: string) => {
                    if (item.startsWith('[x] ')) return { text: item.slice(4), done: true }
                    if (item.startsWith('[ ] ')) return { text: item.slice(4), done: false }
                    return { text: item, done: false }
                })
                setChecklist(parsed)
            } catch {
                setChecklist(DEFAULT_CHECKLIST.map(t => ({ text: t, done: false })))
            }
        } else {
            setChecklist(DEFAULT_CHECKLIST.map(t => ({ text: t, done: false })))
        }
    }, [campaignId, contentId])

    useEffect(() => { loadData() }, [loadData])

    const isStepCompleted = (stepType: MissionStepType) =>
        steps.some(s => s.step_type === stepType)

    // ---- AUTO-SAVE NOTES ----
    const saveNotes = useCallback(async (value: string) => {
        setNotesSaving(true)
        const supabase = createClient()
        await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
            .update({ creator_notes: value })
            .eq('id', campaignId)
        setNotesSaving(false)
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
    }, [campaignId])

    const handleNotesChange = (value: string) => {
        setNotes(value)
        if (notesTimeout.current) clearTimeout(notesTimeout.current)
        notesTimeout.current = setTimeout(() => saveNotes(value), 1000)
    }

    // ---- CHECKLIST ----
    const saveChecklist = useCallback(async (items: { text: string; done: boolean }[]) => {
        const supabase = createClient()
        const serialized = items.map(item => `${item.done ? '[x]' : '[ ]'} ${item.text}`)
        await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
            .update({ creator_checklist: serialized })
            .eq('id', campaignId)
    }, [campaignId])

    const toggleCheckItem = (index: number) => {
        const updated = checklist.map((item, i) => i === index ? { ...item, done: !item.done } : item)
        setChecklist(updated)
        saveChecklist(updated)
    }

    const addCheckItem = () => {
        if (!newCheckItem.trim()) return
        const updated = [...checklist, { text: newCheckItem.trim(), done: false }]
        setChecklist(updated)
        setNewCheckItem('')
        saveChecklist(updated)
    }

    const removeCheckItem = (index: number) => {
        const updated = checklist.filter((_, i) => i !== index)
        setChecklist(updated)
        saveChecklist(updated)
    }

    // ---- DIRECT VIDEO UPLOAD ----
    const handleDirectUpload = async () => {
        if (!videoFile) return
        setVideoUploading(true)
        setUploadProgress(10)
        const supabase = createClient()
        const ext = videoFile.name.split('.').pop() || 'mp4'
        const filePath = `missions/${campaignId}/${Date.now()}.${ext}`

        setUploadProgress(30)
        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(filePath, videoFile, { cacheControl: '3600', upsert: true, contentType: videoFile.type || 'video/mp4' })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            setFileError('Erreur lors de l\'upload. Réessayez.')
            setVideoUploading(false)
            setUploadProgress(0)
            return
        }

        setUploadProgress(70)
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath)
        const videoUrl = urlData?.publicUrl || ''

        // Update the specific content block with the video URL.
        // Surface RLS/write errors instead of silently "succeeding" (past bug:
        // creators lacked an UPDATE policy on campaign_contents, so delivery
        // was rejected in silence and MOSH never saw the video).
        if (contentData?.id) {
            const { error: contentErr } = await (supabase.from('campaign_contents') as ReturnType<typeof supabase.from>)
                .update({ video_url: videoUrl, status: 'uploaded' })
                .eq('id', contentData.id)
            if (contentErr) {
                console.error('campaign_contents update error:', contentErr)
                setFileError("La vidéo a été envoyée mais n'a pas pu être enregistrée (droits insuffisants). Contactez MOSH — le fichier n'est pas perdu.")
                setVideoUploading(false)
                setUploadProgress(0)
                return
            }
        }

        // Also update campaign-level video_url (backward compat for single-video campaigns)
        const { error: campErr } = await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
            .update({ video_url: videoUrl, video_uploaded_at: new Date().toISOString(), mosh_qc_feedback: null })
            .eq('id', campaignId)
        if (campErr) {
            console.error('campaign update error:', campErr)
            setFileError("La vidéo a été envoyée mais n'a pas pu être enregistrée (droits insuffisants). Contactez MOSH — le fichier n'est pas perdu.")
            setVideoUploading(false)
            setUploadProgress(0)
            return
        }

        setUploadProgress(90)

        // Check if ALL content blocks for this campaign have been uploaded
        const { data: allContents } = await supabase
            .from('campaign_contents')
            .select('id, status, video_url')
            .eq('campaign_id', campaignId)

        const allUploaded = allContents && allContents.length > 0
            ? allContents.every((c: any) => c.video_url || c.status === 'uploaded' || c.status === 'qc_approved' || c.status === 'sent_to_brand' || c.status === 'brand_approved')
            : true // If no content blocks exist, treat as single-video campaign

        if (allUploaded) {
            const stepRes = await completeMissionStep(campaignId, 'video_uploaded_by_creator')
            if (!stepRes.success) {
                console.error('completeMissionStep error:', stepRes.error)
                setFileError("La vidéo est enregistrée mais l'étape n'a pas pu être marquée comme livrée (droits insuffisants). Contactez MOSH.")
                setVideoUploading(false)
                setUploadProgress(0)
                await loadData()
                return
            }
        }

        // Auto-add video to creator's portfolio
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
            const { data: profileData } = await supabase
                .from('profiles_creator')
                .select('portfolio_video_urls')
                .eq('user_id', currentUser.id)
                .single()
            const existing: string[] = (profileData as any)?.portfolio_video_urls || []
            if (!existing.includes(videoUrl)) {
                await (supabase.from('profiles_creator') as ReturnType<typeof supabase.from>)
                    .update({ portfolio_video_urls: [...existing, videoUrl] })
                    .eq('user_id', currentUser.id)
            }
        }

        setUploadProgress(100)
        setActionSuccess('Vidéo livrée avec succès !')
        setTimeout(() => setActionSuccess(null), 3000)
        setVideoFile(null)
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
        setVideoPreviewUrl(null)
        setVideoDuration(null)
        setVideoUploading(false)
        setUploadProgress(0)
        await loadData()
    }

    // ---- STEP ACTION ----
    const handleStepAction = async (step: MissionStepType, msg: string) => {
        await completeMissionStep(campaignId, step)
        setActionSuccess(msg)
        setTimeout(() => setActionSuccess(null), 3000)
        await loadData()
    }

    if (isLoading || !campaign) {
        return (
            <div className="max-w-5xl mx-auto py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        )
    }

    const daysLeft = campaign.deadline
        ? Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / 86400000))
        : null

    const completedChecks = checklist.filter(i => i.done).length
    const missionReceived = isStepCompleted('mission_sent_to_creator')
    const canShowStudio = isStepCompleted('creator_accepted') || isStepCompleted('creator_shooting')

    return (
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/creator/missions/${campaignId}`}
                        className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                            <Film className="w-5 h-5 text-[#1A1A1A]" />
                            Studio
                        </h1>
                        <p className="text-sm text-[#6B6B6B]">{campaign.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${daysLeft <= 3 ? 'bg-red-100 text-red-700' :
                            daysLeft <= 7 ? 'bg-amber-100 text-amber-700' :
                                'bg-[#EDEDEC] text-[#1A1A1A]'
                            }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {daysLeft === 0 ? 'Aujourd\'hui !' : `${daysLeft}j restants`}
                        </div>
                    )}
                    <Link href={`/creator/messages`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-full hover:bg-[#333333] transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message MOSH
                    </Link>
                </div>
            </div>

            {/* Success toast */}
            {actionSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#EDEDEC] border border-[#1A1A1A]/30 rounded-lg px-4 py-3 text-[#1A1A1A] text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {actionSuccess}
                </motion.div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ===== LEFT COLUMN — Main workspace ===== */}
                <div className="lg:col-span-2 space-y-6">



                    {/* ===== VIDEO ZONE ===== */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
                            <Film className="w-5 h-5 text-[#1A1A1A]" />
                            {videoFile ? 'Éditeur vidéo' : 'Votre vidéo'}
                        </h2>

                        {/* QC Feedback banner */}
                        {campaign.mosh_qc_feedback && !isStepCompleted('video_validated') && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <RotateCcw className="w-4 h-4 text-amber-600" />
                                    <p className="text-sm font-medium text-amber-800">Révision demandée par MOSH</p>
                                </div>
                                <p className="text-sm text-amber-700 whitespace-pre-wrap">{campaign.mosh_qc_feedback}</p>
                            </div>
                        )}

                        {/* Already uploaded — show preview */}
                        {campaign.video_url && isStepCompleted('video_uploaded_by_creator') ? (
                            <div className="space-y-3">
                                <video src={campaign.video_url} controls className="w-full rounded-lg bg-black max-h-[400px]" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isStepCompleted('video_validated') ? (
                                            <span className="text-xs bg-[#EDEDEC] text-[#1A1A1A] px-2 py-0.5 rounded-full font-medium">QC validé ✓</span>
                                        ) : (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> En vérification par MOSH
                                            </span>
                                        )}
                                    </div>
                                    {campaign.video_uploaded_at && (
                                        <span className="text-xs text-[#6B6B6B]">
                                            Envoyée le {new Date(campaign.video_uploaded_at).toLocaleDateString('fr-CH')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : isStepCompleted('contract_signed') ? (
                            /* Video preview + direct upload */
                            <>
                                {videoFile && videoPreviewUrl ? (
                                    <div className="space-y-4">
                                        <video src={videoPreviewUrl} controls className="w-full rounded-lg bg-black max-h-[350px]" />
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6B6B]">
                                            <span className="bg-[#F4F4F3] px-2 py-1 rounded">{videoFile.name}</span>
                                            <span className="bg-[#F4F4F3] px-2 py-1 rounded">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                                            {videoDuration && <span className="bg-[#F4F4F3] px-2 py-1 rounded">{Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60)).toString().padStart(2, '0')}</span>}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDirectUpload}
                                                disabled={videoUploading}
                                                className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {videoUploading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours ({uploadProgress}%)...</>
                                                ) : (
                                                    <><Upload className="w-4 h-4" /> Livrer cette vidéo</>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setVideoFile(null); if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null); setVideoDuration(null) }}
                                                disabled={videoUploading}
                                                className="px-4 py-2.5 bg-[#F4F4F3] text-[#1A1A1A] rounded-lg text-sm hover:bg-[#E2E2E1] transition-colors disabled:opacity-50"
                                            >
                                                Changer
                                            </button>
                                        </div>
                                        {videoUploading && (
                                            <div className="w-full bg-[#F4F4F3] rounded-full h-2">
                                                <div className="bg-[#1A1A1A] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Drop zone */
                                    <div>
                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                setDragOver(false)
                                                const file = e.dataTransfer.files[0]
                                                if (file) validateAndSetVideo(file)
                                            }}
                                            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-[#1A1A1A] bg-[#EDEDEC]' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            onClick={() => {
                                                const input = document.createElement('input')
                                                input.type = 'file'
                                                input.accept = 'video/*,.mp4,.mov,.avi,.webm'
                                                input.onchange = (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0]
                                                    if (file) validateAndSetVideo(file)
                                                }
                                                input.click()
                                            }}
                                        >
                                            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-[#1A1A1A]">Glissez votre vidéo ici</p>
                                            <p className="text-xs text-[#6B6B6B] mt-1">MP4, MOV, AVI, WebM • Max 500 MB</p>
                                        </div>
                                        {fileError && (
                                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                                <span className="text-red-600 text-sm">⚠️ {fileError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-[#9B9B9B]">
                                <Camera className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                <p className="text-sm">Commencez le tournage pour accéder à l&apos;éditeur</p>
                            </div>
                        )}
                    </motion.div>

                    {/* ===== NOTES ===== */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                                <StickyNote className="w-5 h-5 text-[#1A1A1A]" />
                                Mes notes
                            </h2>
                            <span className="text-xs text-[#9B9B9B]">
                                {notesSaving ? 'Sauvegarde...' : notesSaved ? '✓ Sauvegardé' : 'Auto-sauvegardé'}
                            </span>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Idées de tournage, shot list, rappels personnels..."
                            rows={5}
                            className="w-full px-4 py-3 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg text-sm placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 resize-none"
                        />
                    </motion.div>
                </div>

                {/* ===== RIGHT COLUMN — Sidebar ===== */}
                <div className="space-y-6">

                    {/* Checklist */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="bg-white border border-gray-200 rounded-lg p-5">
                        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-[#1A1A1A]" />
                                Checklist
                            </span>
                            <span className="text-xs text-[#6B6B6B] font-normal">{completedChecks}/{checklist.length}</span>
                        </h2>

                        {/* Progress bar */}
                        <div className="w-full bg-[#F4F4F3] rounded-full h-1.5 mb-3">
                            <div className="bg-[#1A1A1A] h-1.5 rounded-full transition-all" style={{ width: checklist.length ? `${(completedChecks / checklist.length) * 100}%` : '0%' }} />
                        </div>

                        <div className="space-y-1.5">
                            {checklist.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 group">
                                    <button onClick={() => toggleCheckItem(i)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${item.done ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'border-[#E2E2E1] hover:border-[#1A1A1A]/60'
                                            }`}>
                                        {item.done && <CheckCircle2 className="w-3 h-3 text-[#1A1A1A]" />}
                                    </button>
                                    <span className={`text-sm flex-1 ${item.done ? 'line-through text-[#9B9B9B]' : 'text-[#1A1A1A]'}`}>{item.text}</span>
                                    <button onClick={() => removeCheckItem(i)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-3.5 h-3.5 text-[#9B9B9B] hover:text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <input
                                value={newCheckItem}
                                onChange={(e) => setNewCheckItem(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                                placeholder="Ajouter un élément..."
                                className="flex-1 px-3 py-1.5 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg text-xs placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                            />
                            <button onClick={addCheckItem}
                                className="w-7 h-7 bg-[#1A1A1A] text-white rounded-lg flex items-center justify-center hover:bg-[#333333] transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Script — per-content (priority) or campaign-level fallback */}
                    {(contentData?.script_content || campaign.script_content) && missionReceived && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white border border-gray-200 rounded-lg p-5">
                            <button onClick={() => setScriptExpanded(!scriptExpanded)}
                                className="w-full flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                                    <Pen className="w-4 h-4 text-[#1A1A1A]" />
                                    Script {contentData ? `— ${contentData.script_type}` : ''}
                                </h2>
                                {scriptExpanded ? <ChevronUp className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />}
                            </button>
                            {scriptExpanded && (
                                <div className="mt-3 bg-[#EDEDEC] rounded-lg p-3 border border-[#1A1A1A]/20">
                                    <p className="text-xs text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                                        {contentData?.script_content || campaign.script_content}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Brief recap */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-white border border-gray-200 rounded-lg p-5">
                        <button onClick={() => setBriefExpanded(!briefExpanded)}
                            className="w-full flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#1A1A1A]" />
                                Brief
                            </h2>
                            {briefExpanded ? <ChevronUp className="w-4 h-4 text-[#6B6B6B]" /> : <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />}
                        </button>
                        {briefExpanded && (
                            <div className="mt-3 space-y-2 text-xs">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[#6B6B6B]">Produit</p>
                                    <p className="text-[#1A1A1A] font-medium">{campaign.product_name}</p>
                                </div>
                                {campaign.product_description && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#6B6B6B]">Description produit</p>
                                        <p className="text-[#1A1A1A] whitespace-pre-wrap">{campaign.product_description}</p>
                                    </div>
                                )}
                                {campaign.description && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#6B6B6B]">Brief</p>
                                        <p className="text-[#1A1A1A] whitespace-pre-wrap">{campaign.description}</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#6B6B6B]">Format</p>
                                        <p className="text-[#1A1A1A] font-medium">{campaign.format}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#6B6B6B]">Type</p>
                                        <p className="text-[#1A1A1A] font-medium">{campaign.script_type}</p>
                                    </div>
                                </div>
                                {campaign.script_notes && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#6B6B6B]">Notes script</p>
                                        <p className="text-[#1A1A1A] whitespace-pre-wrap">{campaign.script_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Pipeline status */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white border border-gray-200 rounded-lg p-5">
                        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#6B6B6B]" />
                            Étape actuelle
                        </h2>
                        <div className="space-y-2">
                            {[
                                { step: 'creator_accepted' as MissionStepType, label: 'Mission acceptée' },
                                { step: 'creator_shooting' as MissionStepType, label: 'Tournage' },
                                { step: 'video_uploaded_by_creator' as MissionStepType, label: 'Vidéo livrée' },
                                { step: 'video_validated' as MissionStepType, label: 'QC MOSH' },
                                { step: 'video_sent_to_brand' as MissionStepType, label: 'Envoyée marque' },
                                { step: 'brand_final_approved' as MissionStepType, label: 'Terminée ✅' },
                            ].map(({ step, label }) => (
                                <div key={step} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isStepCompleted(step) ? 'bg-[#1A1A1A]' : 'bg-[#E2E2E1]'}`} />
                                    <span className={`text-xs ${isStepCompleted(step) ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
