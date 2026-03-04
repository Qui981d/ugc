'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
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
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    // Shared message bubble renderer
    const renderMessages = (maxWidth: string) => (
        <>
            {messages.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-white/40">
                    <p>Aucun message. Commencez la conversation!</p>
                </div>
            ) : (
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`${maxWidth} ${msg.sender_id === user?.id
                                ? 'bg-accent text-white rounded-2xl rounded-br-md'
                                : 'bg-white/10 text-white rounded-2xl rounded-bl-md'
                                } px-4 py-2.5`}>
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
                                            className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-xs truncate flex-1">{msg.attachment_name || 'Fichier'}</span>
                                            <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                                        </a>
                                    )
                                )}
                                {msg.content && <p className="text-sm">{msg.content}</p>}
                                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender_id === user?.id ? 'text-white/70' : 'text-white/40'
                                    }`}>
                                    <span className="text-[10px]">
                                        {new Date(msg.created_at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
        </>
    )

    // Shared partner avatar renderer
    const renderAvatar = (conv: Conversation, size: number) => (
        <div className={`w-${size === 48 ? 12 : 10} h-${size === 48 ? 12 : 10} rounded-full overflow-hidden bg-white/10 flex items-center justify-center`}>
            {conv.partnerAvatar ? (
                <Image
                    src={conv.partnerAvatar}
                    alt={conv.partnerName}
                    width={size}
                    height={size}
                    className="object-cover"
                />
            ) : (
                <span className="text-white/50 font-bold">{conv.partnerName.charAt(0)}</span>
            )}
        </div>
    )

    return (
        <div className="h-[calc(100vh-120px)] flex gap-0 md:gap-6 -mx-4 md:mx-0 -mt-4 md:mt-0">
            {/* Conversations List — visible on desktop always, on mobile only when no conversation selected */}
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 md:bg-white/[0.08] md:backdrop-blur-xl md:border md:border-white/[0.15] md:rounded-2xl overflow-hidden flex-col`}>
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/25"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-white/40">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune conversation</p>
                            <p className="text-sm mt-2">
                                {userRole === 'creator'
                                    ? 'Vos échanges avec les marques apparaîtront ici dès qu\'une mission vous sera attribuée'
                                    : 'Les conversations avec vos créateurs apparaîtront ici'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/[0.05] active:bg-white/10 ${selectedConversation === conv.id ? 'bg-white/10' : ''
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                                    {conv.partnerAvatar ? (
                                        <Image
                                            src={conv.partnerAvatar}
                                            alt={conv.partnerName}
                                            width={48}
                                            height={48}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-white/50 font-bold">{conv.partnerName.charAt(0)}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 text-left">
                                    <span className="font-medium text-white truncate block">{conv.partnerName}</span>
                                    <p className="text-sm text-white/50 truncate">{conv.campaignTitle}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedConv ? (
                <>
                    {/* ===== MOBILE: fixed full-screen chat ===== */}
                    <div className={`${selectedConversation ? 'flex' : 'hidden'} md:hidden fixed inset-0 z-40 flex-col bg-[#0A0A0A]`}>
                        {/* Chat Header — pinned top */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 active:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                                    {selectedConv.partnerAvatar ? (
                                        <Image
                                            src={selectedConv.partnerAvatar}
                                            alt={selectedConv.partnerName}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-white/50 font-bold">{selectedConv.partnerName.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-white">{selectedConv.partnerName}</h2>
                                    <p className="text-xs text-white/40">{selectedConv.campaignTitle}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages — fills remaining space, messages pushed to bottom */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                            <div className="flex-1" />
                            {renderMessages('max-w-[80%]')}
                        </div>

                        {/* Input — pinned just above bottom nav */}
                        <div className="flex-shrink-0 p-3 border-t border-white/10 bg-[#0A0A0A] mb-16">
                            {/* Pending file preview */}
                            {pendingFile && (
                                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-white/5 rounded-lg">
                                    <Paperclip className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                                    <span className="text-xs text-white/70 truncate flex-1">{pendingFile.name}</span>
                                    <span className="text-[10px] text-white/40">{(pendingFile.size / 1024).toFixed(0)} KB</span>
                                    <button onClick={() => setPendingFile(null)} className="text-white/40 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="text-white/50 hover:text-white p-2">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Écrivez votre message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/25"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={(!messageInput.trim() && !pendingFile) || isUploading}
                                    className="btn-primary"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ===== DESKTOP: normal flex layout with glass card ===== */}
                    <div className="hidden md:flex flex-1 bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl overflow-hidden flex-col">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                                    {selectedConv.partnerAvatar ? (
                                        <Image
                                            src={selectedConv.partnerAvatar}
                                            alt={selectedConv.partnerName}
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-white/50 font-bold">{selectedConv.partnerName.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-white">{selectedConv.partnerName}</h2>
                                    <p className="text-xs text-white/40">{selectedConv.campaignTitle}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {renderMessages('max-w-[70%]')}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            {/* Pending file preview */}
                            {pendingFile && (
                                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white/5 rounded-lg">
                                    <Paperclip className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                                    <span className="text-xs text-white/70 truncate flex-1">{pendingFile.name}</span>
                                    <span className="text-[10px] text-white/40">{(pendingFile.size / 1024).toFixed(0)} KB</span>
                                    <button onClick={() => setPendingFile(null)} className="text-white/40 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Button size="sm" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <input
                                    type="text"
                                    placeholder="Écrivez votre message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/25"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={(!messageInput.trim() && !pendingFile) || isUploading}
                                    className="btn-primary"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="hidden md:flex flex-1 bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl items-center justify-center">
                    <div className="text-center text-white/40">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Send className="w-8 h-8" />
                        </div>
                        <p>Sélectionnez une conversation</p>
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
