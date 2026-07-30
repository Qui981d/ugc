'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send,
    Search,
    Paperclip,
    FileText,
    MoreVertical,
    MessageSquare,
    Loader2,
    ArrowLeft,
    X,
    Download
} from "lucide-react"
import { uploadMessageAttachment } from '@/lib/services/messageService'
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
    attachment_url: string | null
    attachment_name: string | null
    attachment_type: string | null
}

interface Conversation {
    id: string
    campaignId: string
    campaignTitle: string
    partnerName: string
    partnerAvatar: string | null
    lastMessage: string
    timestamp: string
    unread: number
}

interface MessagesPageProps {
    userRole: 'creator' | 'brand'
    initialCampaignId?: string
    initialCreatorId?: string
}

export default function MessagesPage({ userRole, initialCampaignId, initialCreatorId }: MessagesPageProps) {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [messageInput, setMessageInput] = useState("")
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDataLoading, setIsDataLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Fetch conversations based on campaigns with messages
    useEffect(() => {
        // Wait for auth to finish loading
        if (!userId) return

        // No user = nothing to load
        if (!user) return

        async function fetchConversations() {
            setIsDataLoading(true)

            const supabase = createClient()

            // For creators: get campaigns where they have accepted applications with messages
            // For brands: get their own campaigns with messages
            let query

            if (userRole === 'creator') {
                // Get campaigns where creator is assigned
                const { data: campaigns } = await supabase
                    .from('campaigns')
                    .select(`
                        id,
                        title,
                        brand:users!campaigns_brand_id_fkey (
                            id,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('selected_creator_id', userId!) as { data: any[] | null }

                if (campaigns && campaigns.length > 0) {
                    const convs: Conversation[] = campaigns.map((camp: any) => ({
                        id: camp.id,
                        campaignId: camp.id,
                        campaignTitle: camp.title || 'Campagne',
                        partnerName: camp.brand?.full_name || 'Marque',
                        partnerAvatar: camp.brand?.avatar_url,
                        lastMessage: '',
                        timestamp: '',
                        unread: 0,
                    }))
                    setConversations(convs)
                }
            } else {
                // Get brand's campaigns with assigned creators
                const { data: campaigns } = await supabase
                    .from('campaigns')
                    .select(`
                        id,
                        title,
                        selected_creator:users!selected_creator_id (
                            id,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('brand_id', userId!)
                    .not('selected_creator_id', 'is', null) as { data: any[] | null }

                if (campaigns && campaigns.length > 0) {
                    const convs: Conversation[] = campaigns.map((camp: any) => ({
                        id: camp.id,
                        campaignId: camp.id,
                        campaignTitle: camp.title,
                        partnerName: camp.selected_creator?.full_name || 'Créateur',
                        partnerAvatar: camp.selected_creator?.avatar_url,
                        lastMessage: '',
                        timestamp: '',
                        unread: 0,
                    }))
                    setConversations(convs)
                }
            }

            setIsDataLoading(false)
        }

        fetchConversations()
    }, [userId, userRole])

    // Auto-select conversation based on initial params
    useEffect(() => {
        if (!conversations.length || !initialCampaignId) return

        // Find conversation matching the campaign ID
        const matchingConv = conversations.find(c => c.campaignId === initialCampaignId)
        if (matchingConv) {
            setSelectedConversation(matchingConv.id)
        } else if (conversations.length > 0 && !selectedConversation) {
            // Default to first conversation if no match
            setSelectedConversation(conversations[0].id)
        }
    }, [conversations, initialCampaignId, selectedConversation])

    // Fetch messages for selected campaign
    useEffect(() => {
        async function fetchMessages() {
            if (!user || !selectedConversation) return

            const supabase = createClient()

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('campaign_id', selectedConversation)
                .order('created_at', { ascending: true })

            if (!error && data) {
                setMessages(data)
            }
        }

        fetchMessages()
    }, [selectedConversation, user])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setPendingFile(file)
        if (e.target) e.target.value = '' // reset so same file can be re-selected
    }, [])

    const handleSendMessage = async () => {
        if ((!messageInput.trim() && !pendingFile) || !user || !selectedConversation) return

        setIsUploading(!!pendingFile)
        let attachment: { url: string; name: string; type: string } | undefined

        // Upload attachment if present
        if (pendingFile) {
            const result = await uploadMessageAttachment(pendingFile, selectedConversation)
            if ('error' in result) {
                setIsUploading(false)
                return // TODO: show toast
            }
            attachment = result
        }

        const supabase = createClient()
        const { data, error } = await supabase
            .from('messages')
            .insert({
                campaign_id: selectedConversation,
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
            setMessageInput("")
            setPendingFile(null)
        }
        setIsUploading(false)
    }

    const selectedConv = conversations.find(c => c.id === selectedConversation)
    const filteredConversations = conversations.filter(c =>
        c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-5 h-5 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    // Shared message bubble renderer
    const renderMessages = (maxWidth: string) => (
        <>
            {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <p className="text-[13px] font-medium text-[#6B6B6B]">Aucun message</p>
                    <p className="mt-1 text-[12px] text-[#9B9B9B]">Commencez la conversation.</p>
                </div>
            ) : (
                <AnimatePresence>
                    {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`${maxWidth} px-3.5 py-2.5 rounded-2xl ${isOwn
                                    ? 'bg-[#1A1A1A] text-white rounded-br-md'
                                    : 'bg-[#F4F4F3] text-[#1A1A1A] rounded-bl-md'
                                    }`}>
                                    {/* Attachment rendering */}
                                    {msg.attachment_url && (
                                        msg.attachment_type === 'image' ? (
                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                                <img
                                                    src={msg.attachment_url}
                                                    alt={msg.attachment_name || 'Image'}
                                                    className="max-w-full max-h-48 rounded-lg object-cover"
                                                />
                                            </a>
                                        ) : (
                                            <a
                                                href={msg.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2 mb-2 px-2.5 py-2 rounded-lg transition-colors ${isOwn
                                                    ? 'bg-white/10 hover:bg-white/15'
                                                    : 'bg-white border border-[#E2E2E1] hover:bg-[#FAFAF9]'
                                                    }`}
                                            >
                                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-[#6B6B6B]'}`} />
                                                <span className="text-[12px] truncate flex-1">{msg.attachment_name || 'Fichier'}</span>
                                                <Download className={`w-3.5 h-3.5 flex-shrink-0 ${isOwn ? 'text-white/60' : 'text-[#9B9B9B]'}`} />
                                            </a>
                                        )
                                    )}
                                    {msg.content && <p className="text-[13px] leading-relaxed">{msg.content}</p>}
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className={`text-[11px] ${isOwn ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
        </>
    )

    // Shared partner avatar renderer
    const renderAvatar = (conv: Conversation, px: 36 | 40) => (
        <div className={`${px === 40 ? 'w-10 h-10' : 'w-9 h-9'} rounded-full overflow-hidden bg-[#F4F4F3] border border-[#E2E2E1] flex items-center justify-center flex-shrink-0`}>
            {conv.partnerAvatar ? (
                <Image
                    src={conv.partnerAvatar}
                    alt={conv.partnerName}
                    width={px}
                    height={px}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="text-[11px] font-semibold text-[#6B6B6B]">{conv.partnerName.charAt(0).toUpperCase()}</span>
            )}
        </div>
    )

    return (
        <div className="h-[calc(100vh-120px)] flex gap-0 md:gap-6 -mx-4 md:mx-0 -mt-4 md:mt-0">
            {/* Conversations List — visible on desktop always, on mobile only when no conversation selected */}
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 bg-white md:border md:border-[#E2E2E1] md:rounded-xl overflow-hidden flex-col`}>
                {/* Header */}
                <div className="px-4 py-3.5 border-b border-[#E2E2E1]">
                    <h1 className="text-[15px] font-semibold text-[#1A1A1A] mb-3">Messages</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9B9B]" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
                    {filteredConversations.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <MessageSquare className="w-5 h-5 mx-auto mb-3 text-[#C4C4C3]" />
                            <p className="text-[13px] font-medium text-[#6B6B6B]">Aucune conversation</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-[#9B9B9B]">
                                {userRole === 'creator'
                                    ? 'Vos échanges avec les marques apparaîtront ici dès qu\'une mission vous sera attribuée'
                                    : 'Les conversations avec vos créateurs apparaîtront ici'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E2E2E1]">
                            {filteredConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 ${selectedConversation === conv.id ? 'bg-[#EDEDEC]' : 'hover:bg-[#FAFAF9]'
                                        }`}
                                >
                                    {renderAvatar(conv, 36)}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`block truncate text-[13px] text-[#1A1A1A] ${conv.unread > 0 ? 'font-semibold' : 'font-medium'}`}>
                                                {conv.partnerName}
                                            </span>
                                            {conv.unread > 0 && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="truncate text-[12px] text-[#9B9B9B]">{conv.campaignTitle}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedConv ? (
                <>
                    {/* ===== MOBILE: fixed full-screen chat ===== */}
                    <div className={`${selectedConversation ? 'flex' : 'hidden'} md:hidden fixed inset-0 z-40 flex-col bg-white`}>
                        {/* Chat Header — pinned top */}
                        <div className="px-4 py-3 border-b border-[#E2E2E1] flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                {renderAvatar(selectedConv, 36)}
                                <div className="min-w-0">
                                    <h2 className="truncate text-[13px] font-semibold text-[#1A1A1A]">{selectedConv.partnerName}</h2>
                                    <p className="truncate text-[11px] text-[#9B9B9B]">{selectedConv.campaignTitle}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-1.5 rounded-lg text-[#9B9B9B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages — fills remaining space, messages pushed to bottom */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                            <div className="flex-1" />
                            {renderMessages('max-w-[80%]')}
                        </div>

                        {/* Input — pinned just above bottom nav */}
                        <div className="flex-shrink-0 p-3 border-t border-[#E2E2E1] bg-white mb-16">
                            {/* Pending file preview */}
                            {pendingFile && (
                                <div className="flex items-center gap-2 mb-2 px-2.5 py-2 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg">
                                    <Paperclip className="w-3.5 h-3.5 text-[#9B9B9B] flex-shrink-0" />
                                    <span className="text-[12px] text-[#1A1A1A] truncate flex-1">{pendingFile.name}</span>
                                    <span className="text-[11px] text-[#9B9B9B]">{(pendingFile.size / 1024).toFixed(0)} KB</span>
                                    <button
                                        onClick={() => setPendingFile(null)}
                                        className="text-[#9B9B9B] hover:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 rounded"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 rounded-lg text-[#6B6B6B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Écrivez votre message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!messageInput.trim() && !pendingFile) || isUploading}
                                    className="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-[#1A1A1A] text-white transition-colors hover:bg-[#333333] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ===== DESKTOP: normal flex layout ===== */}
                    <div className="hidden md:flex flex-1 bg-white border border-[#E2E2E1] rounded-xl overflow-hidden flex-col">
                        {/* Chat Header */}
                        <div className="px-4 py-3 border-b border-[#E2E2E1] flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                {renderAvatar(selectedConv, 36)}
                                <div className="min-w-0">
                                    <h2 className="truncate text-[13px] font-semibold text-[#1A1A1A]">{selectedConv.partnerName}</h2>
                                    <p className="truncate text-[11px] text-[#9B9B9B]">{selectedConv.campaignTitle}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-1.5 rounded-lg text-[#9B9B9B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                            {renderMessages('max-w-[70%]')}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-[#E2E2E1] bg-white">
                            {/* Pending file preview */}
                            {pendingFile && (
                                <div className="flex items-center gap-2 mb-2 px-2.5 py-2 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg">
                                    <Paperclip className="w-3.5 h-3.5 text-[#9B9B9B] flex-shrink-0" />
                                    <span className="text-[12px] text-[#1A1A1A] truncate flex-1">{pendingFile.name}</span>
                                    <span className="text-[11px] text-[#9B9B9B]">{(pendingFile.size / 1024).toFixed(0)} KB</span>
                                    <button
                                        onClick={() => setPendingFile(null)}
                                        className="text-[#9B9B9B] hover:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 rounded"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 rounded-lg text-[#6B6B6B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Écrivez votre message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!messageInput.trim() && !pendingFile) || isUploading}
                                    className="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-[#1A1A1A] text-white transition-colors hover:bg-[#333333] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="hidden md:flex flex-1 bg-white border border-[#E2E2E1] rounded-xl items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-[#F4F4F3] border border-[#E2E2E1] flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="w-4 h-4 text-[#C4C4C3]" />
                        </div>
                        <p className="text-[13px] font-medium text-[#6B6B6B]">Sélectionnez une conversation</p>
                        <p className="mt-1 text-[12px] text-[#9B9B9B]">Vos échanges s&apos;afficheront ici.</p>
                    </div>
                </div>
            )}

            {/* Hidden file input shared by both mobile and desktop */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
            />
        </div>
    )
}
