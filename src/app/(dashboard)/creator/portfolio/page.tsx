'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Play,
    Eye,
    Heart,
    Calendar,
    Filter,
    Grid3X3,
    List,
    Upload,
    MoreVertical,
    Video,
    Loader2
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

interface PortfolioVideo {
    id: string
    url: string
    title: string
    category: string
}

export default function CreatorPortfolioPage() {
    const { user, profile, isLoading } = useAuth()
    const userId = user?.id
    const [videos, setVideos] = useState<string[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        // Don't do anything while auth is loading
        if (!userId) return

        // No user = nothing to load
        if (!user) return

        async function fetchPortfolio() {
            setIsDataLoading(true)
            const supabase = createClient()

            // Fetch creator profile with portfolio URLs
            const { data, error } = await supabase
                .from('profiles_creator')
                .select('portfolio_video_urls')
                .eq('user_id', userId!)
                .single()

            if (error) {
                console.error('Error fetching portfolio:', error)
            } else if (data && 'portfolio_video_urls' in data) {
                setVideos((data as { portfolio_video_urls: string[] }).portfolio_video_urls || [])
            }
            setIsDataLoading(false)
        }

        fetchPortfolio()
    }, [userId])

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#A1A1AA]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#18181B] tracking-[-0.02em]">Portfolio</h1>
                    <p className="text-[#71717A] mt-1">Vos créations et performances</p>
                </div>
                <Button className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter une vidéo
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">Vidéos</p>
                    <p className="text-3xl font-bold text-[#18181B]">{videos.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">Plateformes</p>
                    <p className="text-3xl font-bold text-[#18181B]">
                        {new Set(videos.map(v => {
                            if (v.includes('tiktok')) return 'TikTok'
                            if (v.includes('instagram')) return 'Instagram'
                            if (v.includes('youtube')) return 'YouTube'
                            return 'Autre'
                        })).size}
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5"
                >
                    <p className="text-sm text-[#71717A] mb-1">Statut</p>
                    <p className="text-xl font-bold text-[#18181B]">
                        {videos.length > 0 ? 'Actif' : 'À compléter'}
                    </p>
                </motion.div>
            </div>

            {/* Portfolio Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6"
            >
                <h2 className="text-lg font-semibold text-[#18181B] mb-6">Mes liens portfolio</h2>

                {videos.length === 0 ? (
                    <div className="text-center py-12 text-[#A1A1AA]">
                        <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune vidéo dans votre portfolio</p>
                        <p className="text-sm mt-2">Ajoutez des liens vers vos meilleures créations</p>
                        <Button className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full mt-6">
                            <Upload className="w-4 h-4 mr-2" />
                            Ajouter un lien
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {videos.map((url, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.05 }}
                                className="flex items-center gap-4 p-4 bg-[#F4F3EF]/60 rounded-2xl hover:bg-[#F4F3EF] transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#C4F042]/20 flex items-center justify-center">
                                    <Play className="w-5 h-5 text-[#18181B]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#18181B] truncate">{url}</p>
                                    <p className="text-xs text-[#A1A1AA]">
                                        {url.includes('tiktok') && 'TikTok'}
                                        {url.includes('instagram') && 'Instagram'}
                                        {url.includes('youtube') && 'YouTube'}
                                        {!url.includes('tiktok') && !url.includes('instagram') && !url.includes('youtube') && 'Lien'}
                                    </p>
                                </div>
                                <Button size="sm" variant="ghost" className="text-[#71717A] hover:text-[#18181B] hover:bg-[#E8E6DF] rounded-full" asChild>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4" />
                                    </a>
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Tips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-[#C4F042]/10 border border-[#C4F042]/25 rounded-[20px] p-6"
            >
                <h3 className="font-semibold text-[#18181B] mb-2">💡 Conseil</h3>
                <p className="text-[#52525B] text-sm">
                    Un portfolio riche augmente vos chances d'être sélectionné. Ajoutez vos meilleures créations
                    TikTok, Instagram Reels ou YouTube Shorts pour montrer votre style aux marques.
                </p>
            </motion.div>
        </div>
    )
}
