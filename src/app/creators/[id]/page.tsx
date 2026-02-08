'use client'

import { use, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthGateModal } from '@/components/auth/AuthGateModal'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import {
    Star,
    MapPin,
    Clock,
    CheckCircle2,
    Play,
    MessageCircle,
    Heart,
    Share2,
    ChevronLeft,
    Instagram,
    Youtube,
    Loader2
} from 'lucide-react'

// Type for creator data
interface CreatorData {
    id: string
    name: string
    location: string
    canton: string
    rating: number
    reviewCount: number
    specialties: string[]
    imageUrl: string
    responseTime: string
    bio: string
    languages: string[]
    completedMissions: number
    memberSince: string
    portfolio: { type: 'image' | 'video'; url: string; thumbnail: string; title: string }[]
    stats: { label: string; value: string }[]
    reviews: { author: string; rating: number; comment: string; date: string }[]
}

// Default fallback data
const DEFAULT_CREATOR: CreatorData = {
    id: '',
    name: 'Créateur',
    location: 'Suisse',
    canton: 'CH',
    rating: 0,
    reviewCount: 0,
    specialties: [],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    responseTime: '24 heures',
    bio: '',
    languages: ['Français'],
    completedMissions: 0,
    memberSince: '',
    portfolio: [],
    stats: [
        { label: 'Missions complétées', value: '0' },
        { label: 'Taux de satisfaction', value: '-' },
        { label: 'Temps de livraison moyen', value: '-' },
        { label: 'Révisions moyennes', value: '-' },
    ],
    reviews: []
}

export default function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const pathname = usePathname()
    const [creator, setCreator] = useState<CreatorData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showAuthGate, setShowAuthGate] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const { isAuthenticated } = useAuth()

    // Fetch real creator data
    useEffect(() => {
        async function loadCreator() {
            const supabase = createClient()

            // Get user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, avatar_url, created_at')
                .eq('id', id)
                .single()

            if (userError || !userData) {
                console.error('Error fetching creator:', userError)
                setCreator({ ...DEFAULT_CREATOR, id })
                setIsLoading(false)
                return
            }

            // Get creator profile
            const { data: creatorProfile } = await supabase
                .from('profiles_creator')
                .select('bio, location, languages, specialties, portfolio_video_urls')
                .eq('user_id', id)
                .single()

            // Count completed missions (accepted applications)
            const { count: missionsCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', id)
                .eq('status', 'accepted')

            // Build creator data
            const creatorData: CreatorData = {
                id: (userData as any).id,
                name: (userData as any).full_name || 'Créateur',
                location: (creatorProfile as any)?.location || 'Suisse',
                canton: 'CH',
                rating: 5.0,
                reviewCount: 0,
                specialties: (creatorProfile as any)?.specialties || [],
                imageUrl: (userData as any).avatar_url || DEFAULT_CREATOR.imageUrl,
                responseTime: '24 heures',
                bio: (creatorProfile as any)?.bio || 'Créateur de contenu UGC passionné.',
                languages: (creatorProfile as any)?.languages || ['Français'],
                completedMissions: missionsCount || 0,
                memberSince: new Date((userData as any).created_at).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' }),
                portfolio: ((creatorProfile as any)?.portfolio_video_urls || []).map((url: string, i: number) => ({
                    type: 'video' as const,
                    url: url,
                    thumbnail: url,
                    title: `Vidéo ${i + 1}`
                })),
                stats: [
                    { label: 'Missions complétées', value: String(missionsCount || 0) },
                    { label: 'Taux de satisfaction', value: missionsCount ? '100%' : '-' },
                    { label: 'Temps de livraison moyen', value: missionsCount ? '3 jours' : '-' },
                    { label: 'Révisions moyennes', value: missionsCount ? '0' : '-' },
                ],
                reviews: []
            }

            setCreator(creatorData)
            setIsLoading(false)
        }

        loadCreator()
    }, [id])

    const handleContactClick = () => {
        if (isAuthenticated) {
            setShowContactModal(true)
        } else {
            setShowAuthGate(true)
        }
    }

    if (isLoading || !creator) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <Navbar />

            {/* Back Button */}
            <div className="pt-24 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Retour
                    </button>
                </div>
            </div>

            {/* Profile Header */}
            <section className="py-8 md:py-12 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                        {/* Profile Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full lg:w-80 aspect-[3/4] rounded-2xl overflow-hidden flex-shrink-0"
                        >
                            <Image
                                src={creator.imageUrl}
                                alt={creator.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={() => setIsSaved(!isSaved)}
                                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-accent text-accent' : 'text-white'}`} />
                                </button>
                                <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                                    <Share2 className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </motion.div>

                        {/* Profile Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex-1"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl lg:text-4xl font-bold text-white">{creator.name}</h1>
                                <CheckCircle2 className="w-6 h-6 text-accent" />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base text-white/60 mb-4">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {creator.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    {creator.rating} ({creator.reviewCount} avis)
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Répond en {creator.responseTime}
                                </span>
                            </div>

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {creator.specialties.map((specialty) => (
                                    <Badge key={specialty} className="bg-white/10 text-white hover:bg-white/20">
                                        {specialty}
                                    </Badge>
                                ))}
                            </div>

                            {/* Bio */}
                            <p className="text-white/70 mb-6 leading-relaxed">
                                {creator.bio}
                            </p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {creator.stats.map((stat) => (
                                    <div key={stat.label} className="bg-white/5 rounded-xl p-4">
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-white/50">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 md:gap-4">
                                <Button
                                    className="btn-primary flex-1 lg:flex-none"
                                    onClick={handleContactClick}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Contacter
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                    <Instagram className="w-4 h-4 mr-2" />
                                    Instagram
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                    <Youtube className="w-4 h-4 mr-2" />
                                    YouTube
                                </Button>
                            </div>

                            {/* Languages & Member info */}
                            <div className="mt-6 flex items-center gap-6 text-sm text-white/50">
                                <span>🗣️ {creator.languages.join(', ')}</span>
                                <span>📅 Membre depuis {creator.memberSince}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Portfolio Section */}
            <section className="py-8 md:py-12 px-4 md:px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-8">Portfolio</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {creator.portfolio.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
                            >
                                <Image
                                    src={item.thumbnail}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {item.type === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-accent transition-colors">
                                            <Play className="w-5 h-5 text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white font-medium">{item.title}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-8 md:py-12 px-4 md:px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-8">
                        Avis clients ({creator.reviewCount})
                    </h2>
                    <div className="space-y-6">
                        {creator.reviews.map((review, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 rounded-xl p-6"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                            <span className="text-accent font-medium">
                                                {review.author.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{review.author}</p>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: review.rating }).map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-white/40">{review.date}</span>
                                </div>
                                <p className="text-white/70">{review.comment}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-lg"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">
                            Contacter {creator.name}
                        </h3>
                        <p className="text-white/60 text-sm mb-6">
                            Décrivez votre projet et vos attentes. {creator.name} vous répondra dans les {creator.responseTime}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/80 mb-2">Sujet</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Collaboration pour campagne beauté"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-2">Message</label>
                                <textarea
                                    rows={4}
                                    placeholder="Décrivez votre projet, le type de contenu souhaité, le budget estimé..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/80 mb-2">Budget estimé (CHF)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: 500 - 1'000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1 border-white/20 text-white hover:bg-white/10"
                                onClick={() => setShowContactModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 btn-primary"
                                onClick={() => {
                                    setShowContactModal(false)
                                    // Would send message in real implementation
                                }}
                            >
                                Envoyer
                            </Button>
                        </div>

                        <p className="text-xs text-white/40 text-center mt-4">
                            Mode démo - les messages ne sont pas réellement envoyés
                        </p>
                    </motion.div>
                </div>
            )}

            {/* Sticky CTA (mobile) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 lg:hidden">
                <Button
                    className="w-full btn-primary"
                    onClick={handleContactClick}
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contacter {creator.name}
                </Button>
            </div>

            {/* Auth Gate Modal */}
            <AuthGateModal
                isOpen={showAuthGate}
                onClose={() => setShowAuthGate(false)}
                action="contact"
                redirectTo={pathname}
            />
        </div>
    )
}
