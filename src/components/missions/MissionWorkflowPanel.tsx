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
    ArrowLeft,
    MessageSquare,
    Loader2,
    ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getMyCampaigns } from '@/lib/services/campaignService'
import { getMissionSteps } from '@/lib/services/adminService'
import type { Campaign, MissionStep, MissionStepType } from '@/types/database'

// ================================================
// WORKFLOW STEP DEFINITIONS
// ================================================
type StepOwner = 'mosh' | 'brand'

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
    { type: 'video_delivered', label: 'Vidéo produite', owner: 'mosh', icon: Video },
    { type: 'video_validated', label: 'Vidéo validée MOSH', owner: 'mosh', icon: CheckCircle2 },
    { type: 'video_sent_to_brand', label: 'Vidéo livrée', owner: 'mosh', icon: Package },
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
    userRole: 'brand' | 'admin'
}

export default function MissionWorkflowPanel({ userRole }: MissionWorkflowPanelProps) {
    const { user } = useAuth()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
    const [steps, setSteps] = useState<MissionStep[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [messageInput, setMessageInput] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load campaigns
    useEffect(() => {
        async function load() {
            if (!user) return
            if (userRole === 'admin') {
                // Admin: load ALL campaigns
                const supabase = createClient()
                const { data } = await supabase
                    .from('campaigns')
                    .select('*')
                    .order('created_at', { ascending: false })
                const campaigns = (data || []) as Campaign[]
                setCampaigns(campaigns)
                if (campaigns.length > 0) setSelectedCampaignId(campaigns[0].id)
            } else {
                // Brand: load own campaigns
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

        // Load messages
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
        }
    }

    // Helpers
    const isStepCompleted = (stepType: MissionStepType) =>
        steps.some(s => s.step_type === stepType)

    const getActiveStep = (): WorkflowStep | null => {
        for (let i = WORKFLOW_STEPS.length - 1; i >= 0; i--) {
            if (isStepCompleted(WORKFLOW_STEPS[i].type)) {
                return WORKFLOW_STEPS[i + 1] || null // next step is active
            }
        }
        return WORKFLOW_STEPS[0] // first step
    }

    const activeStep = getActiveStep()
    const activeOwner = activeStep?.owner || 'mosh'
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    // ================================================
    // RENDER: Campaign List (left sidebar)
    // ================================================
    const renderCampaignList = () => (
        <div className={`${selectedCampaignId ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-hidden flex-col`}>
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-lg font-bold text-gray-900">Mes projets</h1>
                <p className="text-xs text-gray-500 mt-1">Suivi du workflow en temps réel</p>
            </div>
            <div className="flex-1 overflow-y-auto">
                {campaigns.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Aucun projet en cours</p>
                    </div>
                ) : (
                    campaigns.map(camp => {
                        const isSelected = camp.id === selectedCampaignId
                        return (
                            <button
                                key={camp.id}
                                onClick={() => setSelectedCampaignId(camp.id)}
                                className={`w-full p-4 text-left border-b border-gray-100 transition-colors ${isSelected ? 'bg-white border-l-2 border-l-[#6C3FA0]' : 'hover:bg-white/60'
                                    }`}
                            >
                                <p className="font-medium text-gray-900 text-sm truncate">{camp.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{camp.script_type}</p>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )

    // ================================================
    // RENDER: Workflow Dual Panel
    // ================================================
    const renderWorkflowPanel = () => {
        const moshSteps = WORKFLOW_STEPS.filter(s => s.owner === 'mosh')
        const brandSteps = WORKFLOW_STEPS.filter(s => s.owner === 'brand')
        const isMoshTurn = activeOwner === 'mosh'
        const isBrandTurn = activeOwner === 'brand'

        return (
            <div className="grid grid-cols-2 gap-3">
                {/* MOSH Column */}
                <div className={`rounded-2xl p-4 border-2 transition-all ${isMoshTurn
                    ? 'border-emerald-400 bg-emerald-50/50 shadow-lg shadow-emerald-100'
                    : 'border-gray-200 bg-gray-50/50 opacity-60'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isMoshTurn ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-600'
                            }`}>M</div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">MOSH</p>
                            {isMoshTurn && (
                                <p className="text-[10px] text-emerald-600 font-medium">⚡ À leur tour</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {moshSteps.map(step => {
                            const completed = isStepCompleted(step.type)
                            const isActive = activeStep?.type === step.type
                            const Icon = step.icon
                            return (
                                <div key={step.type} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${completed ? 'bg-emerald-100 text-emerald-800' :
                                    isActive ? 'bg-white border border-emerald-300 text-emerald-700 font-semibold shadow-sm' :
                                        'text-gray-400'
                                    }`}>
                                    {completed ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    ) : isActive ? (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 animate-pulse shrink-0" />
                                    ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                                    )}
                                    <span>{step.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* BRAND Column */}
                <div className={`rounded-2xl p-4 border-2 transition-all ${isBrandTurn
                    ? 'border-[#6C3FA0] bg-purple-50/50 shadow-lg shadow-purple-100'
                    : 'border-gray-200 bg-gray-50/50 opacity-60'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isBrandTurn ? 'bg-[#6C3FA0] text-white' : 'bg-gray-300 text-gray-600'
                            }`}>B</div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Marque</p>
                            {isBrandTurn && (
                                <p className="text-[10px] text-[#6C3FA0] font-medium">⚡ À votre tour</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {brandSteps.map(step => {
                            const completed = isStepCompleted(step.type)
                            const isActive = activeStep?.type === step.type
                            const Icon = step.icon
                            return (
                                <div key={step.type} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${completed ? 'bg-purple-100 text-purple-800' :
                                    isActive ? 'bg-white border border-[#6C3FA0]/40 text-[#6C3FA0] font-semibold shadow-sm' :
                                        'text-gray-400'
                                    }`}>
                                    {completed ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#6C3FA0] shrink-0" />
                                    ) : isActive ? (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#6C3FA0] animate-pulse shrink-0" />
                                    ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                                    )}
                                    <span>{step.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // ================================================
    // RENDER: Integrated Chat
    // ================================================
    const renderChat = () => (
        <div className="flex-1 flex flex-col min-h-0 border-t border-gray-200">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Échanges avec MOSH</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Aucun message pour le moment</p>
                        <p className="text-xs mt-1">Posez une question à MOSH à tout moment</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender_id === user?.id
                                    ? 'bg-[#6C3FA0] text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-white/60' : 'text-gray-400'
                                        }`}>
                                        {new Date(msg.created_at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Écrivez à MOSH..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6C3FA0]/40 focus:ring-1 focus:ring-[#6C3FA0]/20"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="p-2.5 bg-[#6C3FA0] text-white rounded-xl hover:bg-[#5a3488] transition-colors disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )

    // ================================================
    // MAIN LAYOUT
    // ================================================
    if (!selectedCampaign) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-gray-400">
                <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Aucun projet en cours</p>
                    <p className="text-sm mt-1">Vos projets et communications avec MOSH apparaîtront ici</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-120px)] flex -mx-4 md:mx-0 -mt-4 md:mt-0">
            {/* Campaign list sidebar */}
            {renderCampaignList()}

            {/* Main content area — workflow + chat */}
            <div className={`${selectedCampaignId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white overflow-hidden`}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                    <button
                        onClick={() => setSelectedCampaignId(null)}
                        className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-gray-900 truncate">{selectedCampaign.title}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${activeOwner === 'brand'
                                ? 'bg-purple-100 text-[#6C3FA0]'
                                : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                {activeOwner === 'brand' ? '⚡ Action requise' : '⏳ MOSH travaille'}
                            </span>
                            {activeStep && (
                                <span className="text-xs text-gray-400">
                                    Prochaine étape : {activeStep.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Workflow Panel */}
                <div className="px-5 py-4 overflow-y-auto">
                    {renderWorkflowPanel()}
                </div>

                {/* Chat */}
                {renderChat()}
            </div>
        </div>
    )
}
