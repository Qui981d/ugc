'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send,
    FileText,
    Users,
    CheckCircle2,
    Video,
    Clock,
    Pen,
    Star,
    Package,
    MessageSquare,
    Loader2,
    Sparkles,
    ChevronDown,
    Shield,
    Paperclip,
    X,
    Download,
} from 'lucide-react'
import { uploadMessageAttachment } from '@/lib/services/messageService'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getMyCampaigns } from '@/lib/services/campaignService'
import { getMissionSteps } from '@/lib/services/adminService'
import type { Campaign, MissionStep, MissionStepType } from '@/types/database'
import { WORKFLOW_STEPS, getStepsByOwner, isStepCompletedOrPassed, type StepOwner, type WorkflowStepDef } from '@/lib/constants/workflowSteps'

// ================================================
// MESSAGE INTERFACE
// ================================================
interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
    attachment_url: string | null
    attachment_name: string | null
    attachment_type: string | null
}

// ================================================
// MAIN COMPONENT
// ================================================
interface MissionWorkflowPanelProps {
    userRole: 'brand' | 'admin' | 'creator'
}

export default function MissionWorkflowPanel({ userRole }: MissionWorkflowPanelProps) {
    const { user } = useAuth()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [messageInput, setMessageInput] = useState('')
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load campaigns
    useEffect(() => {
        async function load() {
            if (!user) return
            const supabase = createClient()

            if (userRole === 'admin') {
                const { data } = await supabase
                    .from('campaigns')
                    .select('*')
                    .order('created_at', { ascending: false })
                const campaigns = (data || []) as Campaign[]
                setCampaigns(campaigns)
                if (campaigns.length > 0) setSelectedCampaignId(campaigns[0].id)
            } else if (userRole === 'creator') {
                // Creator: campaigns where they are assigned (campaign-level OR content-level)
                const { data: directData } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('selected_creator_id', user.id)
                    .order('created_at', { ascending: false })

                // Also check content-level assignments
                const { data: contentAssignments } = await (supabase as any)
                    .from('campaign_contents')
                    .select('campaign_id')
                    .eq('assigned_creator_id', user.id)

                const directIds = (directData || []).map((c: any) => c.id)
                const contentIds = [...new Set((contentAssignments || []).map((ca: any) => ca.campaign_id))] as string[]
                const missingIds = contentIds.filter(id => !directIds.includes(id))

                let extraCampaigns: Campaign[] = []
                if (missingIds.length > 0) {
                    const { data } = await supabase
                        .from('campaigns')
                        .select('*')
                        .in('id', missingIds)
                        .order('created_at', { ascending: false })
                    extraCampaigns = (data || []) as Campaign[]
                }

                const allCampaigns = [...(directData || []) as Campaign[], ...extraCampaigns]

                // Only show campaigns where Mosh has explicitly sent the mission
                const sentCampaigns: Campaign[] = []
                for (const camp of allCampaigns) {
                    const steps = await getMissionSteps(camp.id)
                    if (steps.some((s: any) => s.step_type === 'mission_sent_to_creator')) {
                        sentCampaigns.push(camp)
                    }
                }
                setCampaigns(sentCampaigns)
                if (sentCampaigns.length > 0) setSelectedCampaignId(sentCampaigns[0].id)
            } else {
                // Brand
                const data = await getMyCampaigns()
                setCampaigns(data)
                if (data.length > 0) setSelectedCampaignId(data[0].id)
            }
            setIsLoading(false)
        }
        load()
    }, [user, userRole])

    // Load steps + messages for selected campaign
    const loadCampaignData = useCallback(async () => {
        if (!selectedCampaignId) return
        const [missionSteps] = await Promise.all([
            getMissionSteps(selectedCampaignId),
        ])
        setSteps(missionSteps)

        const supabase = createClient()
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('campaign_id', selectedCampaignId)
            .order('created_at', { ascending: true })
        if (data) setMessages(data as Message[])
    }, [selectedCampaignId])

    useEffect(() => { loadCampaignData() }, [loadCampaignData])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }

    // Send message
    const handleSendMessage = async () => {
        if ((!messageInput.trim() && !pendingFile) || !user || !selectedCampaignId) return

        setIsUploading(!!pendingFile)
        let attachment: { url: string; name: string; type: string } | undefined

        if (pendingFile) {
            const result = await uploadMessageAttachment(pendingFile, selectedCampaignId)
            if ('error' in result) {
                setIsUploading(false)
                return
            }
            attachment = result
        }

        const supabase = createClient()
        const { data, error } = await supabase
            .from('messages')
            .insert({
                campaign_id: selectedCampaignId,
                sender_id: user.id,
                content: (messageInput || '').trim(),
                attachment_url: attachment?.url || null,
                attachment_name: attachment?.name || null,
                attachment_type: attachment?.type || null,
            } as any)
            .select()
            .single()
        if (!error && data) {
            setMessages(prev => [...prev, data as Message])
            setMessageInput('')
            setPendingFile(null)
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
        setIsUploading(false)
    }

    // Helpers
    const isStepCompleted = (stepType: MissionStepType) => {
        const completedTypes = steps.map(s => s.step_type)
        return isStepCompletedOrPassed(stepType, completedTypes)
    }

    const getActiveStep = (): WorkflowStepDef | null => {
        for (let i = WORKFLOW_STEPS.length - 1; i >= 0; i--) {
            if (isStepCompleted(WORKFLOW_STEPS[i].type as MissionStepType)) {
                return WORKFLOW_STEPS[i + 1] || null
            }
        }
        return WORKFLOW_STEPS[0]
    }

    const getCompletedCount = () => {
        let count = 0
        for (const step of WORKFLOW_STEPS) {
            if (isStepCompleted(step.type as MissionStepType)) count++
            else break
        }
        return count
    }

    const activeStep = getActiveStep()
    const isMissionCompleted = activeStep === null && getCompletedCount() === WORKFLOW_STEPS.length
    const activeOwner: StepOwner | 'none' = isMissionCompleted ? 'none' : (activeStep?.owner || 'mosh')
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
    const completedCount = getCompletedCount()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#8A8D91]" />
                    <p className="text-sm text-[#8A8D91]">Chargement…</p>
                </div>
            </div>
        )
    }

    if (!selectedCampaign) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-lg bg-[#F0F2F5] flex items-center justify-center mx-auto mb-4">
                        <Package className="w-7 h-7 text-[#8A8D91]" strokeWidth={1.5} />
                    </div>
                    <p className="font-semibold text-[#1C1E21]">Aucun projet en cours</p>
                    <p className="text-sm text-[#8A8D91] mt-1 max-w-[260px] mx-auto">
                        Vos projets et communications apparaîtront ici
                    </p>
                </div>
            </div>
        )
    }

    // Perspective labels
    const getTurnLabel = (columnOwner: StepOwner) => {
        if (userRole === 'admin') return columnOwner === 'mosh' ? 'À votre tour' : 'À leur tour'
        if (userRole === 'brand') return columnOwner === 'brand' ? 'À votre tour' : columnOwner === 'mosh' ? 'MOSH travaille' : 'Créateur en action'
        return columnOwner === 'creator' ? 'À votre tour' : columnOwner === 'mosh' ? 'MOSH travaille' : 'Marque décide'
    }

    const getStatusBadge = () => {
        if (isMissionCompleted)
            return { bg: 'bg-emerald-100 text-emerald-700', text: '✅ Mission terminée' }
        if (activeOwner === 'brand')
            return { bg: 'bg-[#0866FF] text-white', text: userRole === 'brand' ? `⚡ ${activeStep?.label || 'Action requise'}` : `⏳ Marque : ${activeStep?.label || 'en attente'}` }
        if (activeOwner === 'creator')
            return { bg: 'bg-blue-100 text-blue-700', text: userRole === 'creator' ? `⚡ ${activeStep?.label || 'Action requise'}` : `🎬 Créateur : ${activeStep?.label || 'en action'}` }
        return { bg: 'bg-[#0866FF] text-white', text: userRole === 'admin' ? `⚡ ${activeStep?.label || 'À traiter'}` : `⏳ MOSH : ${activeStep?.label || 'travaille'}` }
    }

    const statusBadge = getStatusBadge()

    // ============================================================
    // RENDER COLUMN (workflow column helper)
    // ============================================================
    const renderColumn = (
        title: string, letter: string, ownerSteps: WorkflowStepDef[],
        isActive: boolean, darkMode: boolean, accentColor: string
    ) => (
        <div className={`rounded-lg p-4 transition-all ${isActive
            ? darkMode ? 'bg-[#1C1E21] shadow-lg' : `bg-white border-2 shadow-lg`
            : 'bg-[#F0F2F5]/60 border border-[#DADDE1]'
            }`}
            style={isActive && !darkMode ? { borderColor: accentColor, boxShadow: `0 4px 20px ${accentColor}15` } : {}}
        >
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${isActive
                    ? darkMode ? 'text-[#1C1E21]' : 'bg-[#1C1E21] text-white'
                    : 'bg-black/[0.06] text-[#65676B]'
                    }`}
                    style={isActive && darkMode ? { backgroundColor: accentColor } : {}}
                >{letter}</div>
                <div className="min-w-0">
                    <p className={`text-xs font-semibold ${isActive && darkMode ? 'text-white' : 'text-[#1C1E21]'}`}>{title}</p>
                    {isActive && !isMissionCompleted && (
                        <p className={`text-[9px] font-medium flex items-center gap-1 ${darkMode ? '' : 'text-[#1C1E21]'}`}
                            style={darkMode ? { color: accentColor } : {}}
                        >
                            <Sparkles className="w-2.5 h-2.5" />
                            {getTurnLabel(ownerSteps[0]?.owner || 'mosh')}
                        </p>
                    )}
                </div>
            </div>
            <div className="space-y-1">
                {ownerSteps.map(step => {
                    const completed = isStepCompleted(step.type as MissionStepType)
                    const isActiveStep = activeStep?.type === step.type
                    return (
                        <div key={step.type} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${completed
                            ? isActive && darkMode ? 'bg-white/10' : 'bg-black/[0.04] text-[#65676B]'
                            : isActiveStep
                                ? isActive && darkMode ? 'font-semibold' : 'bg-white text-[#1C1E21] font-semibold shadow-sm border border-[#DADDE1]'
                                : isActive && darkMode ? 'text-white/30' : 'text-[#8A8D91]'
                            }`}
                            style={completed && isActive && darkMode ? { color: accentColor } :
                                isActiveStep && isActive && darkMode ? { color: accentColor, backgroundColor: `${accentColor}15` } : {}}
                        >
                            {completed ? (
                                <CheckCircle2 className={`w-3 h-3 shrink-0 ${isActive && darkMode ? '' : 'text-[#65676B]'}`}
                                    style={isActive && darkMode ? { color: accentColor } : {}} />
                            ) : isActiveStep ? (
                                <div className="w-3 h-3 rounded-full border-2 shrink-0 animate-pulse"
                                    style={isActive && darkMode ? { borderColor: accentColor } : { borderColor: '#1C1E21' }} />
                            ) : (
                                <div className={`w-3 h-3 rounded-full border shrink-0 ${isActive && darkMode ? 'border-white/20' : 'border-black/10'}`} />
                            )}
                            <span className="truncate">{step.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const moshSteps = WORKFLOW_STEPS.filter(s => s.owner === 'mosh')
    const brandSteps = WORKFLOW_STEPS.filter(s => s.owner === 'brand')
    const creatorSteps = WORKFLOW_STEPS.filter(s => s.owner === 'creator')

    // Creator-centric pipeline steps (simplified view)
    const CREATOR_PIPELINE: WorkflowStepDef[] = [
        { type: 'contract_signed', label: 'Contrat', owner: 'creator', icon: WORKFLOW_STEPS[0].icon },
        { type: 'creator_accepted', label: 'Acceptation', owner: 'creator', icon: WORKFLOW_STEPS[0].icon },
        { type: 'creator_shooting', label: 'Tournage', owner: 'creator', icon: WORKFLOW_STEPS[0].icon },
        { type: 'video_uploaded_by_creator', label: 'Livraison', owner: 'creator', icon: WORKFLOW_STEPS[0].icon },
        { type: 'video_validated', label: 'Contrôle qualité', owner: 'mosh', icon: WORKFLOW_STEPS[0].icon },
        { type: 'video_sent_to_brand', label: 'Envoi marque', owner: 'mosh', icon: WORKFLOW_STEPS[0].icon },
        { type: 'brand_final_approved', label: 'Terminée ✅', owner: 'brand', icon: WORKFLOW_STEPS[0].icon },
    ]
    const creatorCompletedCount = CREATOR_PIPELINE.filter(s => isStepCompleted(s.type as MissionStepType)).length

    // ============================================================
    // MAIN 3-BLOCK LAYOUT
    // ============================================================
    return (
        <div className="space-y-5">
            {/* ─── BLOCK 1: Project Selector + Status ─── */}
            <div className="bg-white border border-[#DADDE1] rounded-lg p-5 shadow-sm relative z-20 overflow-visible">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Project Dropdown */}
                        <div className="relative min-w-0 flex-1 max-w-md">
                            <button
                                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                                className="w-full flex items-center justify-between gap-3 bg-[#F0F2F5] hover:bg-[#EBEDF0] rounded-lg px-4 py-3 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-[#1C1E21] flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-[#0866FF]" />
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-semibold text-[#1C1E21] truncate">{selectedCampaign.title}</p>
                                        <p className="text-[11px] text-[#8A8D91] truncate">{selectedCampaign.script_type}</p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-[#8A8D91] transition-transform flex-shrink-0 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {projectDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-[#DADDE1] overflow-hidden max-h-64 overflow-y-auto"
                                    >
                                        {campaigns.map(camp => (
                                            <button
                                                key={camp.id}
                                                onClick={() => {
                                                    setSelectedCampaignId(camp.id)
                                                    setProjectDropdownOpen(false)
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-[#F0F2F5] transition-colors flex items-center gap-3 ${camp.id === selectedCampaignId ? 'bg-[#E7F0FF]' : ''}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${camp.id === selectedCampaignId ? 'bg-[#0866FF]' : 'bg-black/10'}`} />
                                                <div className="min-w-0">
                                                    <p className={`text-sm truncate ${camp.id === selectedCampaignId ? 'font-semibold text-[#1C1E21]' : 'text-[#65676B]'}`}>
                                                        {camp.title}
                                                    </p>
                                                    <p className="text-[11px] text-[#8A8D91]">{camp.script_type}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Status Badge + Progress */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-medium ${statusBadge.bg}`}>
                            {statusBadge.text}
                        </span>
                        <div className="hidden md:flex items-center gap-[3px]">
                            {(userRole === 'creator' ? CREATOR_PIPELINE : WORKFLOW_STEPS).map((step, i) => (
                                <div
                                    key={step.type}
                                    className={`w-2 h-2 rounded-full transition-all ${i < (userRole === 'creator' ? creatorCompletedCount : completedCount)
                                        ? 'bg-[#0866FF]'
                                        : i === (userRole === 'creator' ? creatorCompletedCount : completedCount)
                                            ? 'bg-[#0866FF]/40 animate-pulse'
                                            : 'bg-black/[0.06]'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── BLOCK 2 + 3: Workflow + Messages ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* ─── BLOCK 2: Workflow Columns ─── */}
                <div className="lg:col-span-3 bg-white border border-[#DADDE1] rounded-lg shadow-sm overflow-hidden">
                    {/* Workflow header */}
                    <div className="px-6 py-4 border-b border-[#DADDE1] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#1C1E21] flex items-center justify-center">
                                <Shield className="w-3.5 h-3.5 text-[#0866FF]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[#1C1E21] tracking-tight">Pipeline</h3>
                                <p className="text-[10px] text-[#8A8D91]">{userRole === 'creator' ? creatorCompletedCount : completedCount}/{userRole === 'creator' ? CREATOR_PIPELINE.length : WORKFLOW_STEPS.length} étapes</p>
                            </div>
                        </div>
                        {/* Linear progress */}
                        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[180px] ml-4">
                            <div className="flex-1 h-1.5 rounded-full bg-black/[0.04] overflow-hidden">
                                <div
                                    className="h-full bg-[#0866FF] rounded-full transition-all duration-700"
                                    style={{ width: `${((userRole === 'creator' ? creatorCompletedCount : completedCount) / (userRole === 'creator' ? CREATOR_PIPELINE.length : WORKFLOW_STEPS.length)) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-[#8A8D91] font-medium">{Math.round(((userRole === 'creator' ? creatorCompletedCount : completedCount) / (userRole === 'creator' ? CREATOR_PIPELINE.length : WORKFLOW_STEPS.length)) * 100)}%</span>
                        </div>
                    </div>

                    {/* 3 columns */}
                    <div className="p-5">
                        {userRole === 'creator' ? (
                            /* Creator: single simplified pipeline */
                            <div className="space-y-1.5">
                                {CREATOR_PIPELINE.map((step, i) => {
                                    const completed = isStepCompleted(step.type as MissionStepType)
                                    const isActiveStep = !completed && (i === 0 || isStepCompleted(CREATOR_PIPELINE[i - 1].type as MissionStepType))
                                    const isCreatorAction = step.owner === 'creator' && isActiveStep
                                    return (
                                        <div key={step.type} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                                            completed ? 'bg-[#E7F0FF] text-[#1C1E21]'
                                            : isCreatorAction ? 'bg-[#1C1E21] text-white font-semibold shadow-sm'
                                            : isActiveStep ? 'bg-[#F0F2F5] text-[#65676B] font-medium'
                                            : 'text-[#8A8D91]'
                                        }`}>
                                            {completed ? (
                                                <CheckCircle2 className="w-4 h-4 text-[#1C1E21] shrink-0" />
                                            ) : isActiveStep ? (
                                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 animate-pulse ${isCreatorAction ? 'border-[#0866FF]' : 'border-[#65676B]'}`} />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-black/10 shrink-0" />
                                            )}
                                            <span>{step.label}</span>
                                            {isCreatorAction && <span className="ml-auto text-xs bg-[#0866FF] text-white px-2 py-0.5 rounded-full font-medium">⚡ À vous</span>}
                                            {isActiveStep && !isCreatorAction && step.owner !== 'creator' && <span className="ml-auto text-xs text-[#8A8D91]">En attente</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            /* Admin/Brand: full 3-column pipeline */
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {renderColumn('MOSH', 'M', moshSteps, activeOwner === 'mosh', true, '#0866FF')}
                                {renderColumn('Marque', 'B', brandSteps, activeOwner === 'brand', false, '#0866FF')}
                                {renderColumn('Créateur', 'C', creatorSteps, activeOwner === 'creator', false, '#3B82F6')}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── BLOCK 3: Messages ─── */}
                <div className="lg:col-span-2 bg-white border border-[#DADDE1] rounded-lg shadow-sm flex flex-col overflow-hidden"
                    style={{ height: 'calc(100vh - 18rem)', minHeight: '420px' }}
                >
                    {/* Chat header */}
                    <div className="px-5 py-4 border-b border-[#DADDE1] flex items-center gap-2.5 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-[#1C1E21] flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5 text-[#0866FF]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-[#1C1E21] tracking-tight">Échanges</h3>
                            <p className="text-[10px] text-[#8A8D91]">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <div className="w-14 h-14 rounded-lg bg-[#F0F2F5] flex items-center justify-center mb-4">
                                    <MessageSquare className="w-6 h-6 text-[#8A8D91]" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-medium text-[#65676B]">Aucun message</p>
                                <p className="text-xs text-[#8A8D91] mt-1 max-w-[220px]">
                                    Posez une question ou partagez un commentaire à tout moment
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {messages.map((msg, i) => {
                                    const isOwn = msg.sender_id === user?.id
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.015 }}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${isOwn
                                                ? 'bg-[#1C1E21] text-white rounded-xl rounded-br-[4px]'
                                                : 'bg-[#F0F2F5] text-[#1C1E21] rounded-xl rounded-bl-[4px]'
                                                }`}>
                                                {/* Attachment */}
                                                {msg.attachment_url && (
                                                    msg.attachment_type === 'image' ? (
                                                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                                            <img src={msg.attachment_url} alt={msg.attachment_name || 'Image'} className="max-w-full max-h-40 rounded-lg object-cover" />
                                                        </a>
                                                    ) : (
                                                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                                                            className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg transition-colors ${isOwn ? 'bg-white/10 hover:bg-white/15' : 'bg-black/[0.04] hover:bg-black/[0.06]'}`}>
                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                            <span className="text-xs truncate flex-1">{msg.attachment_name || 'Fichier'}</span>
                                                            <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                                                        </a>
                                                    )
                                                )}
                                                {msg.content && <p>{msg.content}</p>}
                                                <p className={`text-[10px] mt-1.5 text-right ${isOwn ? 'text-white/40' : 'text-[#8A8D91]'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className="p-4 border-t border-[#DADDE1] bg-white/80 flex-shrink-0">
                        {/* Pending file preview */}
                        {pendingFile && (
                            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[#F0F2F5] rounded-lg">
                                <Paperclip className="w-3.5 h-3.5 text-[#8A8D91] flex-shrink-0" />
                                <span className="text-xs text-[#65676B] truncate flex-1">{pendingFile.name}</span>
                                <span className="text-[10px] text-[#8A8D91]">{(pendingFile.size / 1024).toFixed(0)} KB</span>
                                <button onClick={() => setPendingFile(null)} className="text-[#8A8D91] hover:text-[#1C1E21]">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-lg bg-[#F0F2F5] border border-[#DADDE1] flex items-center justify-center text-[#8A8D91] hover:text-[#1C1E21] hover:bg-[#EBEDF0] transition-all flex-shrink-0">
                                <Paperclip className="w-4 h-4" />
                            </button>
                            <div className="flex-1 relative">
                                <textarea
                                    ref={textareaRef}
                                    placeholder="Écrivez un message…"
                                    value={messageInput}
                                    onChange={(e) => {
                                        setMessageInput(e.target.value)
                                        adjustTextareaHeight()
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                    rows={1}
                                    className="w-full bg-[#F0F2F5] border border-[#DADDE1] rounded-lg px-4 py-3 text-sm text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:ring-2 focus:ring-[#0866FF]/30 focus:border-[#0866FF]/50 focus:bg-white transition-all resize-none overflow-hidden"
                                    style={{ minHeight: '48px', maxHeight: '160px' }}
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={(!messageInput.trim() && !pendingFile) || isUploading}
                                className="p-3 bg-[#1C1E21] text-white rounded-lg hover:bg-[#2A2A2E] transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex-shrink-0"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:text-[#0866FF] transition-colors" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-[#8A8D91] mt-2 ml-1">
                            <kbd className="px-1.5 py-0.5 bg-[#F0F2F5] rounded text-[9px] font-mono">Entrée</kbd> envoyer · <kbd className="px-1.5 py-0.5 bg-[#F0F2F5] rounded text-[9px] font-mono">Maj+Entrée</kbd> retour à la ligne
                        </p>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setPendingFile(file)
                            if (e.target) e.target.value = ''
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
