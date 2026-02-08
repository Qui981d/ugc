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
import { getCampaignById, type CampaignWithBrand } from '@/lib/services/campaignService'
import { applyToCampaign, hasApplied as checkHasApplied } from '@/lib/services/applicationService'
import {
    Building2,
    MapPin,
    Clock,
    DollarSign,
    Calendar,
    Users,
    ChevronLeft,
    CheckCircle2,
    FileText,
    Send,
    Heart,
    Share2,
    Star,
    TrendingUp,
    Loader2
} from 'lucide-react'

// Mock campaign detail data - for demo campaigns
const MOCK_CAMPAIGNS_DATA: Record<string, {
    id: string
    title: string
    brand: {
        name: string
        logo: string
        verified: boolean
        description: string
        website: string
        totalCampaigns: number
        rating: number
    }
    budget: { min: number; max: number }
    deadline: string
    location: string
    category: string
    description: string
    fullDescription: string
    requirements: string[]
    deliverables: string[]
    applicants: number
    status: string
    postedAt: string
    urgent: boolean
}> = {
    '1': {
        id: '1',
        title: 'Témoignage vidéo pour montre de luxe',
        brand: {
            name: 'SwissWatch SA',
            logo: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=200&h=200&fit=crop',
            verified: true,
            description: 'Maison horlogère suisse fondée en 1892, spécialisée dans les montres de prestige alliant tradition et innovation.',
            website: 'www.swisswatch.ch',
            totalCampaigns: 12,
            rating: 4.8,
        },
        budget: { min: 600, max: 800 },
        deadline: '15 février 2026',
        location: 'Suisse romande',
        category: 'Témoignage',
        description: 'Nous recherchons un créateur pour réaliser une vidéo témoignage authentique de notre nouvelle collection.',
        fullDescription: `SwissWatch SA recherche un créateur de contenu talentueux pour mettre en valeur notre nouvelle collection "Alpine Heritage".

Nous souhaitons une vidéo témoignage authentique qui capture l'essence de notre marque : l'excellence suisse, le savoir-faire artisanal et l'élégance intemporelle.

Le contenu doit être filmé dans un cadre premium (appartement design, café haut de gamme, ou extérieur pittoresque suisse) et montrer le créateur portant et utilisant la montre de manière naturelle.

Nous fournirons la montre (valeur CHF 3'500) qui vous sera envoyée et que vous pourrez conserver après la mission.`,
        requirements: [
            'Expérience en contenu luxe ou lifestyle premium',
            'Excellent équipement vidéo (4K minimum)',
            'Capacité à créer une ambiance haut de gamme',
            'Audience majoritairement 25-45 ans',
            'Minimum 5\'000 abonnés sur Instagram ou TikTok',
        ],
        deliverables: [
            '1 vidéo principale (30-60 secondes) format vertical',
            '2-3 stories/clips courts (15 secondes)',
            'Droits d\'utilisation pour nos réseaux sociaux (1 an)',
            'Révisions illimitées jusqu\'à validation',
        ],
        applicants: 8,
        status: 'open',
        postedAt: 'Il y a 2 jours',
        urgent: false,
    },
    '2': {
        id: '2',
        title: 'Unboxing produits cosmétiques bio',
        brand: {
            name: 'BioBeauty Genève',
            logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
            verified: true,
            description: 'Marque genevoise de cosmétiques naturels et bio, certifiée Ecocert.',
            website: 'www.biobeauty.ch',
            totalCampaigns: 8,
            rating: 4.9,
        },
        budget: { min: 400, max: 550 },
        deadline: '20 février 2026',
        location: 'Genève, Vaud',
        category: 'Unboxing',
        description: 'Créez un unboxing naturel et engageant pour notre nouvelle gamme de soins bio.',
        fullDescription: `BioBeauty Genève lance sa nouvelle gamme "Pure Alpine" et recherche un créateur pour un unboxing authentique.

Le contenu doit mettre en avant le packaging éco-responsable, la texture des produits et leurs bienfaits naturels. Nous privilégions un style frais et naturel.

Les produits vous seront envoyés (coffret complet valeur CHF 280) et vous les conserverez.`,
        requirements: [
            'Style naturel et authentique',
            'Expérience en contenu beauté/skincare',
            'Bonne lumière naturelle',
            'Audience féminine 20-40 ans',
        ],
        deliverables: [
            '1 vidéo unboxing (2-3 minutes) format vertical',
            '3-5 photos produits haute qualité',
            'Musique libre de droits incluse',
        ],
        applicants: 12,
        status: 'open',
        postedAt: 'Il y a 1 jour',
        urgent: true,
    },
}

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

// Transform real campaign to display format
function transformCampaign(campaign: CampaignWithBrand) {
    return {
        id: campaign.id,
        title: campaign.title,
        brand: {
            name: campaign.brand?.full_name || 'Marque',
            logo: campaign.brand?.profiles_brand?.logo_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
            verified: true,
            description: campaign.brand?.profiles_brand?.company_name || 'Une marque suisse de qualité.',
            website: campaign.brand?.profiles_brand?.website || '',
            totalCampaigns: 1,
            rating: 5.0,
        },
        budget: { min: campaign.budget_chf, max: campaign.budget_chf },
        deadline: campaign.deadline
            ? new Date(campaign.deadline).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Flexible',
        location: 'Suisse romande',
        category: campaign.script_type
            ? campaign.script_type.charAt(0).toUpperCase() + campaign.script_type.slice(1)
            : 'UGC',
        description: campaign.description || 'Créez du contenu authentique pour notre marque.',
        fullDescription: campaign.description || 'Description complète de la campagne.',
        requirements: [
            'Créateur vérifié',
            'Bon équipement vidéo',
            'Contenu de qualité',
        ],
        deliverables: [
            `1 vidéo ${campaign.format || 'vertical'}`,
            'Droits d\'utilisation inclus',
        ],
        applicants: 0,
        status: campaign.status,
        postedAt: getRelativeTime(campaign.created_at),
        urgent: false,
    }
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const pathname = usePathname()
    const [campaign, setCampaign] = useState<ReturnType<typeof transformCampaign> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [showAuthGate, setShowAuthGate] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [pitchMessage, setPitchMessage] = useState('')
    const [proposedRate, setProposedRate] = useState('')
    const { isAuthenticated, user } = useAuth()

    // Check if user already applied
    useEffect(() => {
        async function checkApplication() {
            if (isAuthenticated && id && user?.role === 'creator') {
                const alreadyApplied = await checkHasApplied(id)
                setHasApplied(alreadyApplied)
            }
        }
        checkApplication()
    }, [isAuthenticated, id, user])

    const handleSubmitApplication = async () => {
        if (!campaign) return

        setIsSubmitting(true)
        console.log('[Application] Submitting application for campaign:', id)

        const result = await applyToCampaign(id, {
            pitch_message: pitchMessage || undefined,
            proposed_rate_chf: proposedRate ? parseFloat(proposedRate) : undefined,
        })

        console.log('[Application] Result:', result)

        if (result.error) {
            alert('Erreur: ' + result.error)
            setIsSubmitting(false)
            return
        }

        setShowApplyModal(false)
        setHasApplied(true)
        setIsSubmitting(false)
        setPitchMessage('')
        setProposedRate('')
    }

    useEffect(() => {
        async function loadCampaign() {
            console.log('[CampaignDetail] Loading campaign:', id)

            try {
                // First check if it's a mock campaign (simple numeric IDs like "1", "2")
                if (MOCK_CAMPAIGNS_DATA[id]) {
                    console.log('[CampaignDetail] Found mock campaign')
                    setCampaign(MOCK_CAMPAIGNS_DATA[id] as any)
                    setIsLoading(false)
                    return
                }

                // Otherwise, try to load from database (UUID format)
                console.log('[CampaignDetail] Fetching from database...')
                const realCampaign = await getCampaignById(id)
                console.log('[CampaignDetail] API result:', realCampaign)

                if (realCampaign) {
                    setCampaign(transformCampaign(realCampaign))
                } else {
                    console.log('[CampaignDetail] No campaign found, using fallback')
                    // Fallback to default
                    setCampaign({
                        id: id,
                        title: 'Campagne UGC',
                        brand: {
                            name: 'Marque Suisse',
                            logo: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=200&h=200&fit=crop',
                            verified: false,
                            description: 'Une marque suisse de qualité.',
                            website: 'www.example.ch',
                            totalCampaigns: 5,
                            rating: 4.5,
                        },
                        budget: { min: 400, max: 600 },
                        deadline: '1 mars 2026',
                        location: 'Suisse',
                        category: 'Contenu',
                        description: 'Créez du contenu authentique pour notre marque.',
                        fullDescription: 'Description complète de la campagne.',
                        requirements: ['Créateur vérifié', 'Bon équipement'],
                        deliverables: ['1 vidéo', 'Photos'],
                        applicants: 5,
                        status: 'open',
                        postedAt: 'Récemment',
                        urgent: false,
                    })
                }
            } catch (error) {
                console.error('[CampaignDetail] Error loading campaign:', error)
                // Set a fallback even on error
                setCampaign({
                    id: id,
                    title: 'Campagne UGC',
                    brand: {
                        name: 'Marque Suisse',
                        logo: 'https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?w=200&h=200&fit=crop',
                        verified: false,
                        description: 'Une marque suisse de qualité.',
                        website: 'www.example.ch',
                        totalCampaigns: 5,
                        rating: 4.5,
                    },
                    budget: { min: 400, max: 600 },
                    deadline: '1 mars 2026',
                    location: 'Suisse',
                    category: 'Contenu',
                    description: 'Créez du contenu authentique pour notre marque.',
                    fullDescription: 'Description complète de la campagne.',
                    requirements: ['Créateur vérifié', 'Bon équipement'],
                    deliverables: ['1 vidéo', 'Photos'],
                    applicants: 5,
                    status: 'open',
                    postedAt: 'Récemment',
                    urgent: false,
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadCampaign()
    }, [id])

    const handleApplyClick = () => {
        if (isAuthenticated) {
            setShowApplyModal(true)
        } else {
            setShowAuthGate(true)
        }
    }

    if (isLoading || !campaign) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Navbar />
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <p className="text-white/60">Chargement de la campagne...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-0">
            <Navbar />

            {/* Back Button */}
            <div className="pt-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <Link
                        href="/campaigns"
                        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Retour aux campagnes
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <section className="py-8 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column - Campaign Details */}
                        <div className="flex-1">
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    {campaign.urgent && (
                                        <Badge className="bg-orange-500/20 text-orange-400">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            Urgent
                                        </Badge>
                                    )}
                                    <Badge className="bg-white/10 text-white/70">
                                        {campaign.category}
                                    </Badge>
                                    <Badge className="bg-green-500/20 text-green-400">
                                        Ouverte
                                    </Badge>
                                </div>

                                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                    {campaign.title}
                                </h1>

                                {/* Quick Info */}
                                <div className="flex flex-wrap items-center gap-4 text-white/60">
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        CHF {campaign.budget.min}{campaign.budget.min !== campaign.budget.max ? ` - ${campaign.budget.max}` : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {campaign.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        Deadline: {campaign.deadline}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {campaign.applicants} candidatures
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Publié {campaign.postedAt}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/5 rounded-2xl p-6 mb-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-accent" />
                                    Description du projet
                                </h2>
                                <div className="text-white/70 leading-relaxed whitespace-pre-line">
                                    {campaign.fullDescription}
                                </div>
                            </motion.div>

                            {/* Requirements */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/5 rounded-2xl p-6 mb-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Critères recherchés
                                </h2>
                                <ul className="space-y-3">
                                    {campaign.requirements.map((req, index) => (
                                        <li key={index} className="flex items-start gap-3 text-white/70">
                                            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Deliverables */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/5 rounded-2xl p-6"
                            >
                                <h2 className="text-lg font-semibold text-white mb-4">
                                    Livrables attendus
                                </h2>
                                <ul className="space-y-3">
                                    {campaign.deliverables.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3 text-white/70">
                                            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-accent text-xs font-bold">{index + 1}</span>
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>

                        {/* Right Column - Brand Card & Actions */}
                        <div className="lg:w-80 flex-shrink-0">
                            <div className="lg:sticky lg:top-24 space-y-6">
                                {/* Brand Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                                            <Image
                                                src={campaign.brand.logo}
                                                alt={campaign.brand.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white">{campaign.brand.name}</h3>
                                                {campaign.brand.verified && (
                                                    <CheckCircle2 className="w-4 h-4 text-accent" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-white/50">
                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                {campaign.brand.rating} • {campaign.brand.totalCampaigns} campagnes
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/60 mb-4">
                                        {campaign.brand.description}
                                    </p>

                                    {campaign.brand.website && (
                                        <div className="flex items-center gap-2 text-sm text-white/50">
                                            <Building2 className="w-4 h-4" />
                                            {campaign.brand.website}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Budget Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 rounded-2xl p-6 text-center"
                                >
                                    <p className="text-sm text-white/60 mb-1">Budget</p>
                                    <p className="text-3xl font-bold text-white">
                                        CHF {campaign.budget.min}{campaign.budget.min !== campaign.budget.max ? ` - ${campaign.budget.max}` : ''}
                                    </p>
                                </motion.div>

                                {/* Actions */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="space-y-3"
                                >
                                    {hasApplied ? (
                                        <Button className="w-full bg-green-500/20 text-green-400 border border-green-500/30" disabled>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Candidature envoyée
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full btn-primary"
                                            onClick={handleApplyClick}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Postuler
                                        </Button>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className={`flex-1 border-white/20 hover:bg-white/10 ${isSaved ? 'text-accent border-accent' : 'text-white/70'}`}
                                            onClick={() => setIsSaved(!isSaved)}
                                        >
                                            <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-accent' : ''}`} />
                                            {isSaved ? 'Sauvegardée' : 'Sauvegarder'}
                                        </Button>
                                        <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/10">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">
                            Postuler à cette campagne
                        </h3>
                        <p className="text-white/60 text-sm mb-6">
                            Montrez pourquoi vous êtes le créateur idéal pour {campaign.brand.name}.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/80 mb-2">
                                    Message de candidature
                                </label>
                                <textarea
                                    rows={4}
                                    value={pitchMessage}
                                    onChange={(e) => setPitchMessage(e.target.value)}
                                    placeholder="Présentez-vous et décrivez comment vous aborderiez ce projet..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-white/80 mb-2">
                                    Votre proposition tarifaire (CHF)
                                </label>
                                <input
                                    type="number"
                                    value={proposedRate}
                                    onChange={(e) => setProposedRate(e.target.value)}
                                    placeholder={`Entre ${campaign.budget.min} et ${campaign.budget.max}`}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1 border-white/20 text-white hover:bg-white/10"
                                onClick={() => setShowApplyModal(false)}
                                disabled={isSubmitting}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 btn-primary"
                                onClick={handleSubmitApplication}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                {isSubmitting ? 'Envoi...' : 'Envoyer ma candidature'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Sticky CTA (mobile) */}
            {!hasApplied && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 lg:hidden">
                    <Button
                        className="w-full btn-primary"
                        onClick={handleApplyClick}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Postuler - CHF {campaign.budget.min}{campaign.budget.min !== campaign.budget.max ? `-${campaign.budget.max}` : ''}
                    </Button>
                </div>
            )}

            {/* Auth Gate Modal */}
            <AuthGateModal
                isOpen={showAuthGate}
                onClose={() => setShowAuthGate(false)}
                action="apply"
                redirectTo={pathname}
            />
        </div>
    )
}
