'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import {
    Play,
    Upload,
    Video,
    Loader2,
    Trash2,
    ExternalLink
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

export default function CreatorPortfolioPage() {
    const { user, profile, isLoading } = useAuth()
    const userId = user?.id
    const [videos, setVideos] = useState<string[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [playingIndex, setPlayingIndex] = useState<number | null>(null)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        if (!userId) return
        if (!user) return

        async function fetchPortfolio() {
            setIsDataLoading(true)
            const supabase = createClient()
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

    const handleDeleteVideo = async (index: number) => {
        const updated = videos.filter((_, i) => i !== index)
        setVideos(updated)
        const supabase = createClient()
        await (supabase.from('profiles_creator') as ReturnType<typeof supabase.from>)
            .update({ portfolio_video_urls: updated })
            .eq('user_id', userId!)
    }

    // Check if a URL is a direct video file (from Supabase storage)
    const isDirectVideo = (url: string) => {
        return url.includes('supabase') || /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
    }

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1A1A1A] tracking-[-0.02em]">Portfolio</h1>
                    <p className="text-[#6B6B6B] mt-1">Vos créations UGC</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E2E2E1] rounded-xl p-5"
                >
                    <p className="text-sm text-[#6B6B6B] mb-1">Vidéos</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">{videos.length}</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white border border-[#E2E2E1] rounded-xl p-5"
                >
                    <p className="text-sm text-[#6B6B6B] mb-1">Sources</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">
                        {new Set(videos.map(v => {
                            if (v.includes('tiktok')) return 'TikTok'
                            if (v.includes('instagram')) return 'Instagram'
                            if (v.includes('youtube')) return 'YouTube'
                            if (v.includes('supabase')) return 'MOSH'
                            return 'Autre'
                        })).size}
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-[#E2E2E1] rounded-xl p-5"
                >
                    <p className="text-sm text-[#6B6B6B] mb-1">Statut</p>
                    <p className="text-xl font-bold text-[#1A1A1A]">
                        {videos.length > 0 ? 'Actif' : 'À compléter'}
                    </p>
                </motion.div>
            </div>

            {/* Portfolio Content — Phone Mockup Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-6">Mes vidéos</h2>

                {videos.length === 0 ? (
                    <div className="bg-white border border-[#E2E2E1] rounded-xl p-6">
                        <div className="text-center py-12 text-[#9B9B9B]">
                            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune vidéo dans votre portfolio</p>
                            <p className="text-sm mt-2">Vos vidéos livrées apparaîtront automatiquement ici</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {videos.map((url, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                className="group relative"
                            >
                                {/* Video Container */}
                                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-lg shadow-black/10">
                                        {isDirectVideo(url) ? (
                                            <>
                                                <video
                                                    src={url}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    playsInline
                                                    loop
                                                    autoPlay={playingIndex === index}
                                                    onMouseEnter={(e) => {
                                                        setPlayingIndex(index)
                                                        e.currentTarget.play().catch(() => {})
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        setPlayingIndex(null)
                                                        e.currentTarget.pause()
                                                        e.currentTarget.currentTime = 0
                                                    }}
                                                />
                                                {/* Play icon overlay when not playing */}
                                                {playingIndex !== index && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                                            <Play className="w-5 h-5 text-white ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* External URL — show placeholder with link */
                                            <a href={url} target="_blank" rel="noopener noreferrer"
                                               className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#1A1A1A] hover:from-[#333333] hover:to-[#1A1A1A] transition-colors">
                                                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                                    <Play className="w-6 h-6 text-white ml-0.5" />
                                                </div>
                                                <span className="text-white/70 text-xs px-3 text-center truncate max-w-full">
                                                    {url.includes('tiktok') ? '🎵 TikTok' :
                                                     url.includes('instagram') ? '📸 Instagram' :
                                                     url.includes('youtube') ? '▶️ YouTube' : '🔗 Lien'}
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-white/40 mt-2" />
                                            </a>
                                        )}
                                </div>

                                {/* Delete button — appears on hover */}
                                <button
                                    onClick={() => handleDeleteVideo(index)}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-[#C0392B] z-30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Video index badge */}
                                <div className="absolute top-3 left-3 z-20">
                                    <span className="text-[10px] font-bold text-white/60 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                        #{index + 1}
                                    </span>
                                </div>
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
                className="bg-[#EDEDEC] border border-[#1A1A1A]/25 rounded-xl p-6"
            >
                <h3 className="font-semibold text-[#1A1A1A] mb-2">💡 Conseil</h3>
                <p className="text-[#6B6B6B] text-sm">
                    Votre portfolio se remplit automatiquement lorsque vous livrez des vidéos via le Studio.
                    Plus votre portfolio est riche, plus vos chances d&apos;être sélectionné augmentent.
                </p>
            </motion.div>
        </div>
    )
}
