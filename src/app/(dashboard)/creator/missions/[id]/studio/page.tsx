'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
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
    const campaignId = params.id as string

    const [campaign, setCampaign] = useState<Campaign | null>(null)
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

    // Video upload
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoUploading, setVideoUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [dragOver, setDragOver] = useState(false)

    // UI
    const [scriptExpanded, setScriptExpanded] = useState(false)
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
    }, [campaignId])

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

    // ---- VIDEO UPLOAD ----
    const handleVideoUpload = async () => {
        if (!videoFile) return
        setVideoUploading(true)
        setUploadProgress(10)
        const supabase = createClient()
        const ext = videoFile.name.split('.').pop() || 'mp4'
        const filePath = `missions/${campaignId}/${Date.now()}.${ext}`

        setUploadProgress(30)
        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(filePath, videoFile, { cacheControl: '3600', upsert: true })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            setVideoUploading(false)
            return
        }

        setUploadProgress(70)
        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(filePath)
        const videoUrl = urlData?.publicUrl || ''

        await (supabase.from('campaigns') as ReturnType<typeof supabase.from>)
            .update({ video_url: videoUrl, video_uploaded_at: new Date().toISOString(), mosh_qc_feedback: null })
            .eq('id', campaignId)

        setUploadProgress(90)
        await completeMissionStep(campaignId, 'video_uploaded_by_creator')

        setUploadProgress(100)
        setActionSuccess('Vidéo livrée avec succès !')
        setTimeout(() => setActionSuccess(null), 3000)
        setVideoFile(null)
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
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-[#18181B] flex items-center gap-2">
                            <Film className="w-5 h-5 text-purple-600" />
                            Studio
                        </h1>
                        <p className="text-sm text-[#71717A]">{campaign.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${daysLeft <= 3 ? 'bg-red-100 text-red-700' :
                            daysLeft <= 7 ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {daysLeft === 0 ? 'Aujourd\'hui !' : `${daysLeft}j restants`}
                        </div>
                    )}
                    <Link href={`/creator/messages`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] text-white text-xs font-medium rounded-full hover:bg-[#18181B]/80 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message MOSH
                    </Link>
                </div>
            </div>

            {/* Success toast */}
            {actionSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {actionSuccess}
                </motion.div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ===== LEFT COLUMN — Main workspace ===== */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Current step banner */}
                    {!isStepCompleted('creator_shooting') && isStepCompleted('creator_accepted') && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <Camera className="w-5 h-5 text-purple-600" />
                                <div>
                                    <h3 className="font-semibold text-[#18181B]">Prêt à tourner ?</h3>
                                    <p className="text-sm text-[#71717A]">Signalez le début de votre tournage</p>
                                </div>
                            </div>
                            <button onClick={() => handleStepAction('creator_shooting', 'Tournage en cours !')}
                                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                                <Camera className="w-4 h-4" /> Commencer le tournage
                            </button>
                        </motion.div>
                    )}

                    {/* ===== VIDEO ZONE ===== */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-[#18181B] mb-4 flex items-center gap-2">
                            <Film className="w-5 h-5 text-purple-600" />
                            Votre vidéo
                        </h2>

                        {/* QC Feedback banner */}
                        {campaign.mosh_qc_feedback && !isStepCompleted('video_validated') && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
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
                                <video src={campaign.video_url} controls className="w-full rounded-xl bg-black max-h-[400px]" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isStepCompleted('video_validated') ? (
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">QC validé ✓</span>
                                        ) : (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> En vérification par MOSH
                                            </span>
                                        )}
                                    </div>
                                    {campaign.video_uploaded_at && (
                                        <span className="text-xs text-[#71717A]">
                                            Envoyée le {new Date(campaign.video_uploaded_at).toLocaleDateString('fr-CH')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : isStepCompleted('creator_shooting') ? (
                            /* Upload zone */
                            <>
                                {!videoFile ? (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            setDragOver(false)
                                            const file = e.dataTransfer.files[0]
                                            if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|avi|webm)$/i))) {
                                                setVideoFile(file)
                                            }
                                        }}
                                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => {
                                            const input = document.createElement('input')
                                            input.type = 'file'
                                            input.accept = 'video/*,.mp4,.mov,.avi,.webm'
                                            input.onchange = (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0]
                                                if (file) setVideoFile(file)
                                            }
                                            input.click()
                                        }}
                                    >
                                        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-[#18181B]">Glissez votre vidéo ici</p>
                                        <p className="text-xs text-[#71717A] mt-1">ou cliquez pour sélectionner — MP4, MOV, WebM (max 500 MB)</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <video src={URL.createObjectURL(videoFile)} controls className="w-full rounded-xl bg-black max-h-[350px]" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Play className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm text-[#18181B] font-medium truncate max-w-[250px]">{videoFile.name}</span>
                                                <span className="text-xs text-[#71717A]">({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                                            </div>
                                            <button onClick={() => setVideoFile(null)} className="text-xs text-[#71717A] hover:text-red-500">Changer</button>
                                        </div>

                                        {videoUploading && (
                                            <div className="w-full bg-purple-100 rounded-full h-2">
                                                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                        )}

                                        <button onClick={handleVideoUpload} disabled={videoUploading}
                                            className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                            {videoUploading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours ({uploadProgress}%)...</>
                                            ) : (
                                                <><Send className="w-4 h-4" /> Livrer cette vidéo à MOSH</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-[#A1A1AA]">
                                <Camera className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                <p className="text-sm">Commencez le tournage pour accéder à l&apos;upload</p>
                            </div>
                        )}
                    </motion.div>

                    {/* ===== NOTES ===== */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white border border-gray-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-[#18181B] flex items-center gap-2">
                                <StickyNote className="w-5 h-5 text-amber-500" />
                                Mes notes
                            </h2>
                            <span className="text-xs text-[#A1A1AA]">
                                {notesSaving ? 'Sauvegarde...' : notesSaved ? '✓ Sauvegardé' : 'Auto-sauvegardé'}
                            </span>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Idées de tournage, shot list, rappels personnels..."
                            rows={5}
                            className="w-full px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-xl text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:border-amber-300 resize-none"
                        />
                    </motion.div>
                </div>

                {/* ===== RIGHT COLUMN — Sidebar ===== */}
                <div className="space-y-6">

                    {/* Checklist */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="bg-white border border-gray-200 rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-[#18181B] mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-blue-500" />
                                Checklist
                            </span>
                            <span className="text-xs text-[#71717A] font-normal">{completedChecks}/{checklist.length}</span>
                        </h2>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: checklist.length ? `${(completedChecks / checklist.length) * 100}%` : '0%' }} />
                        </div>

                        <div className="space-y-1.5">
                            {checklist.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 group">
                                    <button onClick={() => toggleCheckItem(i)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${item.done ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'
                                            }`}>
                                        {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </button>
                                    <span className={`text-sm flex-1 ${item.done ? 'line-through text-[#A1A1AA]' : 'text-[#18181B]'}`}>{item.text}</span>
                                    <button onClick={() => removeCheckItem(i)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-3.5 h-3.5 text-[#A1A1AA] hover:text-red-500" />
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
                                className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder:text-[#A1A1AA] focus:outline-none focus:border-blue-300"
                            />
                            <button onClick={addCheckItem}
                                className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Script reference */}
                    {campaign.script_content && missionReceived && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white border border-gray-200 rounded-2xl p-5">
                            <button onClick={() => setScriptExpanded(!scriptExpanded)}
                                className="w-full flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                                    <Pen className="w-4 h-4 text-blue-500" />
                                    Script
                                </h2>
                                {scriptExpanded ? <ChevronUp className="w-4 h-4 text-[#71717A]" /> : <ChevronDown className="w-4 h-4 text-[#71717A]" />}
                            </button>
                            {scriptExpanded && (
                                <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                                    <p className="text-xs text-[#18181B] whitespace-pre-wrap leading-relaxed">{campaign.script_content}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Brief recap */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-white border border-gray-200 rounded-2xl p-5">
                        <button onClick={() => setBriefExpanded(!briefExpanded)}
                            className="w-full flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                Brief
                            </h2>
                            {briefExpanded ? <ChevronUp className="w-4 h-4 text-[#71717A]" /> : <ChevronDown className="w-4 h-4 text-[#71717A]" />}
                        </button>
                        {briefExpanded && (
                            <div className="mt-3 space-y-2 text-xs">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[#71717A]">Produit</p>
                                    <p className="text-[#18181B] font-medium">{campaign.product_name}</p>
                                </div>
                                {campaign.product_description && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#71717A]">Description produit</p>
                                        <p className="text-[#18181B] whitespace-pre-wrap">{campaign.product_description}</p>
                                    </div>
                                )}
                                {campaign.description && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#71717A]">Brief</p>
                                        <p className="text-[#18181B] whitespace-pre-wrap">{campaign.description}</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#71717A]">Format</p>
                                        <p className="text-[#18181B] font-medium">{campaign.format}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#71717A]">Type</p>
                                        <p className="text-[#18181B] font-medium">{campaign.script_type}</p>
                                    </div>
                                </div>
                                {campaign.script_notes && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[#71717A]">Notes script</p>
                                        <p className="text-[#18181B] whitespace-pre-wrap">{campaign.script_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Pipeline status */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white border border-gray-200 rounded-2xl p-5">
                        <h2 className="text-sm font-semibold text-[#18181B] mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#71717A]" />
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
                                    <div className={`w-2 h-2 rounded-full ${isStepCompleted(step) ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                    <span className={`text-xs ${isStepCompleted(step) ? 'text-[#18181B]' : 'text-[#A1A1AA]'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
