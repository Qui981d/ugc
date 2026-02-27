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
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getMyCampaigns } from '@/lib/services/campaignService'
import { getMissionSteps } from '@/lib/services/adminService'
import type { Campaign, MissionStep, MissionStepType } from '@/types/database'

// ================================================
// WORKFLOW STEP DEFINITIONS
// ================================================
type StepOwner = 'mosh' | 'brand' | 'creator'

interface WorkflowStep {
    type: MissionStepType
    label: string
    owner: StepOwner
    icon: typeof FileText
}

const WORKFLOW_STEPS: WorkflowStep[] = [
    { type: 'brief_received', label: 'Brief analysé', owner: 'mosh', icon: FileText },
    { type: 'creators_proposed', label: 'Profils proposés', owner: 'mosh', icon: Users },
    { type: 'creator_validated', label: 'Créateur choisi', owner: 'brand', icon: CheckCircle2 },
    { type: 'script_sent', label: 'Script rédigé', owner: 'mosh', icon: Pen },
    { type: 'script_brand_review', label: 'Script envoyé', owner: 'mosh', icon: Send },
    { type: 'script_brand_approved', label: 'Script validé', owner: 'brand', icon: CheckCircle2 },
    { type: 'mission_sent_to_creator', label: 'Mission envoyée', owner: 'mosh', icon: Send },
    { type: 'contract_signed', label: 'Contrat signé', owner: 'creator', icon: FileText },
    { type: 'creator_accepted', label: 'Mission acceptée', owner: 'creator', icon: CheckCircle2 },
    { type: 'creator_shooting', label: 'En tournage', owner: 'creator', icon: Video },
    { type: 'video_uploaded_by_creator', label: 'Vidéo livrée', owner: 'creator', icon: Video },
    { type: 'video_validated', label: 'QC MOSH', owner: 'mosh', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Vidéo envoyée', owner: 'mosh', icon: Package },
    { type: 'brand_final_approved', label: 'Validation finale', owner: 'brand', icon: Star },
]

// ================================================
// MESSAGE INTERFACE
// ================================================
interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
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
    const [isLoading, setIsLoading] = useState(true)
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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
                // Creator: campaigns where they are the selected creator
                const { data } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('selected_creator_id', user.id)
                    .order('created_at', { ascending: false })
                const campaigns = (data || []) as Campaign[]
                setCampaigns(campaigns)
                if (campaigns.length > 0) setSelectedCampaignId(campaigns[0].id)
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
        if (!messageInput.trim() || !user || !selectedCampaignId) return
        const supabase = createClient()
        const { data, error } = await supabase
            .from('messages')
            .insert({ campaign_id: selectedCampaignId, sender_id: user.id, content: messageInput.trim() } as any)
            .select()
            .single()
        if (!error && data) {
            setMessages(prev => [...prev, data as Message])
            setMessageInput('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
    }

    // Helpers
    const isStepCompleted = (stepType: MissionStepType) =>
        steps.some(s => s.step_type === stepType)

    const getActiveStep = (): WorkflowStep | null => {
        for (let i = WORKFLOW_STEPS.length - 1; i >= 0; i--) {
            if (isStepCompleted(WORKFLOW_STEPS[i].type)) {
                return WORKFLOW_STEPS[i + 1] || null
            }
        }
        return WORKFLOW_STEPS[0]
    }

    const getCompletedCount = () => {
        let count = 0
        for (const step of WORKFLOW_STEPS) {
            if (isStepCompleted(step.type)) count++
            else break
        }
        return count
    }

    const activeStep = getActiveStep()
    const activeOwner = activeStep?.owner || 'mosh'
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
    const completedCount = getCompletedCount()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#A1A1AA]" />
                    <p className="text-sm text-[#A1A1AA]">Chargement…</p>
                </div>
            </div>
        )
    }

    if (!selectedCampaign) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#F4F3EF] flex items-center justify-center mx-auto mb-4">
                        <Package className="w-7 h-7 text-[#A1A1AA]" strokeWidth={1.5} />
                    </div>
                    <p className="font-semibold text-[#18181B]">Aucun projet en cours</p>
                    <p className="text-sm text-[#A1A1AA] mt-1 max-w-[260px] mx-auto">
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
        if (activeOwner === 'brand')
            return { bg: 'bg-[#C4F042] text-[#18181B]', text: userRole === 'brand' ? `⚡ ${activeStep?.label || 'Action requise'}` : `⏳ Marque : ${activeStep?.label || 'en attente'}` }
        if (activeOwner === 'creator')
            return { bg: 'bg-blue-100 text-blue-700', text: userRole === 'creator' ? `⚡ ${activeStep?.label || 'Action requise'}` : `🎬 Créateur : ${activeStep?.label || 'en action'}` }
        return { bg: 'bg-[#18181B] text-[#C4F042]', text: userRole === 'admin' ? `⚡ ${activeStep?.label || 'À traiter'}` : `⏳ MOSH : ${activeStep?.label || 'travaille'}` }
    }

    const statusBadge = getStatusBadge()

    // ============================================================
    // RENDER COLUMN (workflow column helper)
    // ============================================================
    const renderColumn = (
        title: string, letter: string, ownerSteps: WorkflowStep[],
        isActive: boolean, darkMode: boolean, accentColor: string
    ) => (
        <div className={`rounded-2xl p-4 transition-all ${isActive
            ? darkMode ? 'bg-[#18181B] shadow-lg' : `bg-white border-2 shadow-lg`
            : 'bg-[#F4F3EF]/60 border border-black/[0.04]'
            }`}
            style={isActive && !darkMode ? { borderColor: accentColor, boxShadow: `0 4px 20px ${accentColor}15` } : {}}
        >
            <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${isActive
                    ? darkMode ? 'text-[#18181B]' : 'bg-[#18181B] text-white'
                    : 'bg-black/[0.06] text-[#71717A]'
                    }`}
                    style={isActive && darkMode ? { backgroundColor: accentColor } : {}}
                >{letter}</div>
                <div className="min-w-0">
                    <p className={`text-xs font-semibold ${isActive && darkMode ? 'text-white' : 'text-[#18181B]'}`}>{title}</p>
                    {isActive && (
                        <p className={`text-[9px] font-medium flex items-center gap-1 ${darkMode ? '' : 'text-[#18181B]'}`}
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
                    const completed = isStepCompleted(step.type)
                    const isActiveStep = activeStep?.type === step.type
                    return (
                        <div key={step.type} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${completed
                            ? isActive && darkMode ? 'bg-white/10' : 'bg-black/[0.04] text-[#52525B]'
                            : isActiveStep
                                ? isActive && darkMode ? 'font-semibold' : 'bg-white text-[#18181B] font-semibold shadow-sm border border-black/[0.06]'
                                : isActive && darkMode ? 'text-white/30' : 'text-[#A1A1AA]'
                            }`}
                            style={completed && isActive && darkMode ? { color: accentColor } :
                                isActiveStep && isActive && darkMode ? { color: accentColor, backgroundColor: `${accentColor}15` } : {}}
                        >
                            {completed ? (
                                <CheckCircle2 className={`w-3 h-3 shrink-0 ${isActive && darkMode ? '' : 'text-[#71717A]'}`}
                                    style={isActive && darkMode ? { color: accentColor } : {}} />
                            ) : isActiveStep ? (
                                <div className="w-3 h-3 rounded-full border-2 shrink-0 animate-pulse"
                                    style={isActive && darkMode ? { borderColor: accentColor } : { borderColor: '#18181B' }} />
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

    // ============================================================
    // MAIN 3-BLOCK LAYOUT
    // ============================================================
    return (
        <div className="space-y-5">
            {/* ─── BLOCK 1: Project Selector + Status ─── */}
            <div className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-2xl p-5 shadow-sm relative z-20 overflow-visible">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Project Dropdown */}
                        <div className="relative min-w-0 flex-1 max-w-md">
                            <button
                                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                                className="w-full flex items-center justify-between gap-3 bg-[#F4F3EF] hover:bg-[#E8E6DF] rounded-xl px-4 py-3 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-[#18181B] flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-[#C4F042]" />
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-semibold text-[#18181B] truncate">{selectedCampaign.title}</p>
                                        <p className="text-[11px] text-[#A1A1AA] truncate">{selectedCampaign.script_type}</p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-[#A1A1AA] transition-transform flex-shrink-0 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {projectDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/[0.06] overflow-hidden max-h-64 overflow-y-auto"
                                    >
                                        {campaigns.map(camp => (
                                            <button
                                                key={camp.id}
                                                onClick={() => {
                                                    setSelectedCampaignId(camp.id)
                                                    setProjectDropdownOpen(false)
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-[#F4F3EF] transition-colors flex items-center gap-3 ${camp.id === selectedCampaignId ? 'bg-[#C4F042]/10' : ''}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${camp.id === selectedCampaignId ? 'bg-[#C4F042]' : 'bg-black/10'}`} />
                                                <div className="min-w-0">
                                                    <p className={`text-sm truncate ${camp.id === selectedCampaignId ? 'font-semibold text-[#18181B]' : 'text-[#52525B]'}`}>
                                                        {camp.title}
                                                    </p>
                                                    <p className="text-[11px] text-[#A1A1AA]">{camp.script_type}</p>
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
                            {WORKFLOW_STEPS.map((step, i) => (
                                <div
                                    key={step.type}
                                    className={`w-2 h-2 rounded-full transition-all ${i < completedCount
                                        ? 'bg-[#C4F042]'
                                        : i === completedCount
                                            ? 'bg-[#C4F042]/40 animate-pulse'
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
                <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-2xl shadow-sm overflow-hidden">
                    {/* Workflow header */}
                    <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#18181B] flex items-center justify-center">
                                <Shield className="w-3.5 h-3.5 text-[#C4F042]" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[#18181B] tracking-tight">Pipeline</h3>
                                <p className="text-[10px] text-[#A1A1AA]">{completedCount}/{WORKFLOW_STEPS.length} étapes</p>
                            </div>
                        </div>
                        {/* Linear progress */}
                        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[180px] ml-4">
                            <div className="flex-1 h-1.5 rounded-full bg-black/[0.04] overflow-hidden">
                                <div
                                    className="h-full bg-[#C4F042] rounded-full transition-all duration-700"
                                    style={{ width: `${(completedCount / WORKFLOW_STEPS.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-[#A1A1AA] font-medium">{Math.round((completedCount / WORKFLOW_STEPS.length) * 100)}%</span>
                        </div>
                    </div>

                    {/* 3 columns */}
                    <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {renderColumn('MOSH', 'M', moshSteps, activeOwner === 'mosh', true, '#C4F042')}
                            {renderColumn('Marque', 'B', brandSteps, activeOwner === 'brand', false, '#C4F042')}
                            {renderColumn('Créateur', 'C', creatorSteps, activeOwner === 'creator', false, '#3B82F6')}
                        </div>
                    </div>
                </div>

                {/* ─── BLOCK 3: Messages ─── */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-2xl shadow-sm flex flex-col overflow-hidden"
                    style={{ height: 'calc(100vh - 18rem)', minHeight: '420px' }}
                >
                    {/* Chat header */}
                    <div className="px-5 py-4 border-b border-black/[0.04] flex items-center gap-2.5 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-[#18181B] flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5 text-[#C4F042]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-[#18181B] tracking-tight">Échanges</h3>
                            <p className="text-[10px] text-[#A1A1AA]">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <div className="w-14 h-14 rounded-2xl bg-[#F4F3EF] flex items-center justify-center mb-4">
                                    <MessageSquare className="w-6 h-6 text-[#A1A1AA]" strokeWidth={1.5} />
                                </div>
                                <p className="text-sm font-medium text-[#52525B]">Aucun message</p>
                                <p className="text-xs text-[#A1A1AA] mt-1 max-w-[220px]">
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
                                                ? 'bg-[#18181B] text-white rounded-[16px] rounded-br-[4px]'
                                                : 'bg-[#F4F3EF] text-[#18181B] rounded-[16px] rounded-bl-[4px]'
                                                }`}>
                                                <p>{msg.content}</p>
                                                <p className={`text-[10px] mt-1.5 text-right ${isOwn ? 'text-white/40' : 'text-[#A1A1AA]'}`}>
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
                    <div className="p-4 border-t border-black/[0.06] bg-white/80 flex-shrink-0">
                        <div className="flex items-end gap-3">
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
                                    className="w-full bg-[#F4F3EF] border border-black/[0.06] rounded-2xl px-4 py-3 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50 focus:bg-white transition-all resize-none overflow-hidden"
                                    style={{ minHeight: '48px', maxHeight: '160px' }}
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!messageInput.trim()}
                                className="p-3 bg-[#18181B] text-white rounded-xl hover:bg-[#2A2A2E] transition-all disabled:opacity-30 disabled:cursor-not-allowed group flex-shrink-0"
                            >
                                <Send className="w-4 h-4 group-hover:text-[#C4F042] transition-colors" />
                            </button>
                        </div>
                        <p className="text-[10px] text-[#A1A1AA] mt-2 ml-1">
                            <kbd className="px-1.5 py-0.5 bg-[#F4F3EF] rounded text-[9px] font-mono">Entrée</kbd> envoyer · <kbd className="px-1.5 py-0.5 bg-[#F4F3EF] rounded text-[9px] font-mono">Maj+Entrée</kbd> retour à la ligne
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
