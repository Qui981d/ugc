'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Briefcase,
    Star,
    MapPin,
    Clock,
    DollarSign,
    Calendar,
    ChevronRight,
    Search,
    SlidersHorizontal,
    TrendingUp,
    CheckCircle2,
    Building2,
    Loader2
} from 'lucide-react'
import { getOpenCampaigns, type CampaignWithBrand } from '@/lib/services/campaignService'
import { getCreators } from '@/lib/services/profileService'
import type { User, ProfileCreator } from '@/types/database'

// ============ MOCK DATA ============

const MOCK_CREATORS = [
    {
        id: '1',
        name: 'Marie Dubois',
        location: 'Genève',
        canton: 'GE',
        rating: 4.9,
        reviewCount: 42,
        specialties: ['Témoignage', 'Lifestyle', 'Beauté'],
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
        responseTime: '2 heures',
        verified: true,
    },
    {
        id: '2',
        name: 'Lucas Martin',
        location: 'Lausanne',
        canton: 'VD',
        rating: 5.0,
        reviewCount: 28,
        specialties: ['Unboxing', 'Tech', 'Gaming'],
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
        responseTime: '4 heures',
        verified: true,
    },
    {
        id: '3',
        name: 'Anna Schmidt',
        location: 'Sion',
        canton: 'VS',
        rating: 4.8,
        reviewCount: 35,
        specialties: ['ASMR', 'Food', 'Wellness'],
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
        responseTime: '1 jour',
        verified: true,
    },
    {
        id: '4',
        name: 'Pierre Favre',
        location: 'Fribourg',
        canton: 'FR',
        rating: 4.9,
        reviewCount: 19,
        specialties: ['Tutoriel', 'Sport', 'Outdoor'],
        imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
        responseTime: '6 heures',
        verified: false,
    },
    {
        id: '5',
        name: 'Sophie Laurent',
        location: 'Neuchâtel',
        canton: 'NE',
        rating: 5.0,
        reviewCount: 56,
        specialties: ['Mode', 'Lifestyle', 'Voyage'],
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
        responseTime: '3 heures',
        verified: true,
    },
    {
        id: '6',
        name: 'Nicolas Blanc',
        location: 'Genève',
        canton: 'GE',
        rating: 4.7,
        reviewCount: 23,
        specialties: ['Review', 'Auto', 'Luxe'],
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
        responseTime: '1 jour',
        verified: true,
    },
    {
        id: '7',
        name: 'Emma Rochat',
        location: 'Montreux',
        canton: 'VD',
        rating: 4.9,
        reviewCount: 67,
        specialties: ['Beauté', 'Skincare', 'Wellness'],
        imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
        responseTime: '2 heures',
        verified: true,
    },
    {
        id: '8',
        name: 'Thomas Muller',
        location: 'Sion',
        canton: 'VS',
        rating: 4.6,
        reviewCount: 14,
        specialties: ['Sport', 'Fitness', 'Nutrition'],
        imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop',
        responseTime: '12 heures',
        verified: false,
    },
]

const MOCK_CAMPAIGNS = [
    {
        id: '1',
        title: 'Témoignage vidéo pour montre de luxe',
        brand: {
            name: 'SwissWatch SA',
            logo: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=100&h=100&fit=crop',
            verified: true,
        },
        budget: { min: 600, max: 800 },
        deadline: '15 février',
        location: 'Suisse romande',
        category: 'Témoignage',
        applicants: 8,
        urgent: false,
        postedAt: 'Il y a 2 jours',
    },
    {
        id: '2',
        title: 'Unboxing produits cosmétiques bio',
        brand: {
            name: 'BioBeauty Genève',
            logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop',
            verified: true,
        },
        budget: { min: 400, max: 550 },
        deadline: '20 février',
        location: 'Genève, Vaud',
        category: 'Unboxing',
        applicants: 12,
        urgent: true,
        postedAt: 'Il y a 1 jour',
    },
    {
        id: '3',
        title: 'Review café artisanal suisse',
        brand: {
            name: 'CaféAlpin',
            logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&h=100&fit=crop',
            verified: false,
        },
        budget: { min: 300, max: 450 },
        deadline: '28 février',
        location: 'Toute la Suisse',
        category: 'Review',
        applicants: 5,
        urgent: false,
        postedAt: 'Il y a 3 jours',
    },
    {
        id: '4',
        title: 'Lifestyle weekend wellness spa',
        brand: {
            name: 'AlpineSpa Resort',
            logo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop',
            verified: true,
        },
        budget: { min: 800, max: 1200 },
        deadline: '10 mars',
        location: 'Valais',
        category: 'Lifestyle',
        applicants: 23,
        urgent: false,
        postedAt: 'Il y a 5 jours',
    },
    {
        id: '5',
        title: 'Tutoriel application mobile fintech',
        brand: {
            name: 'SwissBank Digital',
            logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
            verified: true,
        },
        budget: { min: 500, max: 700 },
        deadline: '1 mars',
        location: 'Suisse romande',
        category: 'Tutoriel',
        applicants: 7,
        urgent: false,
        postedAt: 'Il y a 1 semaine',
    },
    {
        id: '6',
        title: 'ASMR chocolat suisse premium',
        brand: {
            name: 'Chocolaterie Vaudoise',
            logo: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=100&h=100&fit=crop',
            verified: true,
        },
        budget: { min: 350, max: 500 },
        deadline: '25 février',
        location: 'Vaud, Fribourg',
        category: 'ASMR',
        applicants: 4,
        urgent: false,
        postedAt: 'Il y a 4 jours',
    },
]

const CREATOR_CATEGORIES = ['Tous', 'Témoignage', 'Unboxing', 'Lifestyle', 'ASMR', 'Tutoriel', 'Review']
const CAMPAIGN_CATEGORIES = ['Toutes', 'Témoignage', 'Unboxing', 'Lifestyle', 'ASMR', 'Tutoriel', 'Review']

// Helper function for relative time
function getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Il y a 1 jour"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 14) return "Il y a 1 semaine"
    return `Il y a ${Math.floor(diffDays / 7)} semaines`
}

// ============ COMPONENT ============

function MarketplaceContent() {
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'creators'
    const [activeTab, setActiveTab] = useState<'creators' | 'campaigns'>(defaultTab as 'creators' | 'campaigns')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Tous')
    const [realCampaigns, setRealCampaigns] = useState<CampaignWithBrand[]>([])
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
    const [realCreators, setRealCreators] = useState<(User & { profile: ProfileCreator })[]>([])

    // Fetch real campaigns from database
    useEffect(() => {
        async function loadRealCampaigns() {
            const campaigns = await getOpenCampaigns()
            setRealCampaigns(campaigns)
            setIsLoadingCampaigns(false)
        }
        loadRealCampaigns()
    }, [])

    // Fetch real creators from database
    useEffect(() => {
        async function loadRealCreators() {
            const creators = await getCreators()
            setRealCreators(creators)
        }
        loadRealCreators()
    }, [])

    // Reset category when switching tabs
    useEffect(() => {
        setActiveCategory(activeTab === 'creators' ? 'Tous' : 'Toutes')
    }, [activeTab])

    // Transform real campaigns to match mock format
    const transformedRealCampaigns = realCampaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        brand: {
            name: campaign.brand?.full_name || 'Marque',
            logo: campaign.brand?.profiles_brand?.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
            verified: true, // Real campaigns are from verified brands
        },
        budget: { min: campaign.budget_chf, max: campaign.budget_chf },
        deadline: campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long' }) : 'Flexible',
        location: 'Suisse romande',
        category: campaign.script_type ? campaign.script_type.charAt(0).toUpperCase() + campaign.script_type.slice(1) : 'UGC',
        applicants: 0, // We could count applications here
        urgent: false,
        postedAt: getRelativeTime(campaign.created_at),
        isReal: true, // Flag to identify real campaigns
    }))

    // Combine mock and real campaigns (mocks first to avoid layout shift, real appended)
    const allCampaigns = [...MOCK_CAMPAIGNS, ...transformedRealCampaigns]

    const categories = activeTab === 'creators' ? CREATOR_CATEGORIES : CAMPAIGN_CATEGORIES

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-8 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold mb-4"
                    >
                        <span className="gradient-text">Marketplace</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-white/60 max-w-2xl mx-auto"
                    >
                        L&apos;endroit où marques et créateurs se rencontrent
                    </motion.p>
                </div>
            </section>

            {/* Main Tabs */}
            <section className="px-4 md:px-6 pb-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-center">
                        <div className="inline-flex p-1 bg-white/5 rounded-full border border-white/10">
                            <button
                                onClick={() => setActiveTab('creators')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-medium transition-all duration-300 ${activeTab === 'creators'
                                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                                    : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                Créateurs
                                <Badge className="bg-white/20 text-white text-xs ml-1">
                                    {MOCK_CREATORS.length}
                                </Badge>
                            </button>
                            <button
                                onClick={() => setActiveTab('campaigns')}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-full font-medium transition-all duration-300 ${activeTab === 'campaigns'
                                    ? 'bg-accent text-white shadow-lg shadow-accent/25'
                                    : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                <Briefcase className="w-4 h-4" />
                                Campagnes
                                <Badge className="bg-white/20 text-white text-xs ml-1">
                                    {allCampaigns.length}
                                </Badge>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search & Filters */}
            <section className="sticky top-0 z-40 py-4 bg-background/80 backdrop-blur-xl border-y border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                placeholder={activeTab === 'creators' ? 'Rechercher un créateur...' : 'Rechercher une campagne...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeCategory === category
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                            <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:bg-white/10 ml-2">
                                <SlidersHorizontal className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-8 px-6">
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'creators' ? (
                            <motion.div
                                key="creators"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Creators Grid — mocks shown immediately, real creators blend in */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {/* Real creators from database */}
                                    {realCreators.map((creator, index) => {
                                        const specialties = (creator.profile as any)?.specialties || []
                                        const specialtyLabels = specialties.map((s: string) => {
                                            const map: Record<string, string> = {
                                                testimonial: 'Témoignage',
                                                unboxing: 'Unboxing',
                                                review: 'Review',
                                                lifestyle: 'Lifestyle',
                                                tutorial: 'Tutoriel',
                                                asmr: 'ASMR',
                                            }
                                            return map[s] || s
                                        })
                                        const rating = Number(creator.profile?.rating_avg) || 0
                                        const ratingCount = creator.profile?.rating_count || 0
                                        const isVerified = ratingCount > 0
                                        const location = (creator.profile as any)?.location_canton || ''

                                        // Filter by category
                                        if (activeCategory !== 'Tous' && !specialtyLabels.includes(activeCategory)) return null
                                        // Filter by search
                                        if (searchQuery && !creator.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && !location.toLowerCase().includes(searchQuery.toLowerCase())) return null

                                        return (
                                            <div
                                                key={creator.id}
                                            >
                                                <Link href={`/creators/${creator.id}`}>
                                                    <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer">
                                                        {creator.avatar_url ? (
                                                            <Image
                                                                src={creator.avatar_url}
                                                                alt={creator.full_name}
                                                                fill
                                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-purple-600/30 flex items-center justify-center">
                                                                <span className="text-5xl text-white/60 font-bold">{creator.full_name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                        {/* Gradient Overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                                        {/* Rating Badge */}
                                                        {rating > 0 && (
                                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                                                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                                <span className="text-xs font-medium text-white">{rating.toFixed(1)}</span>
                                                            </div>
                                                        )}

                                                        {/* Verified Badge */}
                                                        {isVerified && (
                                                            <div className="absolute top-3 left-3">
                                                                <CheckCircle2 className="w-5 h-5 text-accent" />
                                                            </div>
                                                        )}

                                                        {/* "Nouveau" badge for creators without ratings */}
                                                        {!isVerified && (
                                                            <div className="absolute top-3 left-3">
                                                                <Badge className="bg-accent/80 text-white text-[10px] border-0">Nouveau</Badge>
                                                            </div>
                                                        )}

                                                        {/* Content */}
                                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                                            <h3 className="text-lg font-semibold text-white mb-1">{creator.full_name}</h3>
                                                            {location && (
                                                                <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span>{location}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-1">
                                                                {specialtyLabels.slice(0, 2).map((s: string) => (
                                                                    <span key={s} className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/80">
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        )
                                    })}

                                    {/* Mock creators as fallback if few real ones */}
                                    {realCreators.length < 4 && MOCK_CREATORS.filter(creator => {
                                        if (activeCategory !== 'Tous' && !creator.specialties.includes(activeCategory)) return false
                                        if (searchQuery && !creator.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
                                        return true
                                    }).map((creator, index) => (
                                        <div
                                            key={`mock-${creator.id}`}
                                        >
                                            <Link href={`/creators/${creator.id}`}>
                                                <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer">
                                                    <Image
                                                        src={creator.imageUrl}
                                                        alt={creator.name}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                                                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-xs font-medium text-white">{creator.rating}</span>
                                                    </div>
                                                    {creator.verified && (
                                                        <div className="absolute top-3 left-3">
                                                            <CheckCircle2 className="w-5 h-5 text-accent" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                                        <h3 className="text-lg font-semibold text-white mb-1">{creator.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{creator.location}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {creator.specialties.slice(0, 2).map((s) => (
                                                                <span key={s} className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] text-white/80">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>


                                {/* Load More */}
                                <div className="mt-12 text-center">
                                    <Button className="btn-secondary">
                                        Voir plus de créateurs
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="campaigns"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Campaigns Grid - Monochrome Premium Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allCampaigns.map((campaign, index) => (
                                        <div
                                            key={campaign.id}
                                            className="group hover:-translate-y-1.5 transition-transform duration-200"
                                        >
                                            <Link href={`/campaigns/${campaign.id}`}>
                                                <div className="relative bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] hover:border-white/30 hover:bg-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/30">

                                                    {/* Header */}
                                                    <div className="p-6 pb-4">
                                                        {/* Brand Row */}
                                                        <div className="flex items-center gap-3 mb-5">
                                                            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                                                <Image
                                                                    src={campaign.brand.logo}
                                                                    alt={campaign.brand.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-white truncate">{campaign.brand.name}</span>
                                                                    {campaign.brand.verified && (
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-white/40">{campaign.postedAt}</span>
                                                            </div>
                                                            {campaign.urgent && (
                                                                <span className="px-2 py-1 text-[10px] font-medium text-white/70 bg-white/10 rounded-md">
                                                                    Urgent
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Title */}
                                                        <h3 className="text-lg font-semibold text-white leading-snug line-clamp-2 min-h-[3.25rem] group-hover:text-white/90 transition-colors">
                                                            {campaign.title}
                                                        </h3>

                                                        {/* Category Tag */}
                                                        <div className="mt-3">
                                                            <span className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-md">
                                                                {campaign.category}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="h-px bg-white/[0.06] mx-6" />

                                                    {/* Footer */}
                                                    <div className="p-6 pt-4">
                                                        {/* Budget - Clean Typography */}
                                                        <div className="mb-4">
                                                            <p className="text-2xl font-bold text-white tracking-tight">
                                                                CHF {campaign.budget.min.toLocaleString('fr-CH')}–{campaign.budget.max.toLocaleString('fr-CH')}
                                                            </p>
                                                        </div>

                                                        {/* Meta Row */}
                                                        <div className="flex items-center justify-between text-sm text-white/40">
                                                            <div className="flex items-center gap-4">
                                                                <span>{campaign.location}</span>
                                                                <span className="text-white/20">•</span>
                                                                <span>{campaign.deadline}</span>
                                                            </div>
                                                            <span className="text-white/50">{campaign.applicants} candidats</span>
                                                        </div>
                                                    </div>

                                                    {/* Hover Indicator */}
                                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ChevronRight className="w-5 h-5 text-white/40" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More */}
                                <div className="mt-12 text-center">
                                    <Button className="btn-secondary">
                                        Voir plus de campagnes
                                    </Button>
                                </div>

                                {/* CTA for Brands */}
                                <div className="mt-16 p-8 bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 rounded-2xl text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Vous êtes une marque ?
                                    </h3>
                                    <p className="text-white/60 mb-4">
                                        Publiez votre campagne et recevez des candidatures de créateurs qualifiés.
                                    </p>
                                    <Link href="/signup?role=brand">
                                        <Button className="btn-primary">
                                            Publier une campagne
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    )
}

export default function MarketplacePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-white">Chargement...</div>}>
            <MarketplaceContent />
        </Suspense>
    )
}
