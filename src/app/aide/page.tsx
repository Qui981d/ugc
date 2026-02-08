'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import {
    HelpCircle,
    ChevronDown,
    Search,
    Users,
    Briefcase,
    MessageCircle,
    Shield,
    Zap,
    Star,
    CheckCircle2,
    ArrowRight,
    Send,
    BookOpen,
    Handshake,
    Camera,
    CreditCard,
    FileText,
    Globe,
    Mail,
    Phone,
    MapPin,
    Clock,
    TrendingUp,
    Award,
    Lock,
    Eye,
    Building2
} from 'lucide-react'

// ============ SEO FAQ STRUCTURED DATA ============
const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Qu'est-ce que le contenu UGC ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Le User Generated Content (UGC) est du contenu créé par des utilisateurs réels pour promouvoir une marque. Contrairement au marketing traditionnel, le UGC offre une authenticité qui génère jusqu'à 9.8x plus d'engagement que le contenu de marque classique."
            }
        },
        {
            "@type": "Question",
            "name": "Comment fonctionne UGC Suisse ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "UGC Suisse connecte les marques suisses avec des créateurs de contenu locaux. Les marques publient des campagnes, les créateurs postulent, et une fois acceptés, ils produisent du contenu authentique. Tout est géré via notre plateforme sécurisée."
            }
        },
        {
            "@type": "Question",
            "name": "Combien coûte UGC Suisse ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "L'inscription sur UGC Suisse est 100% gratuite pour les créateurs et les marques. Les marques définissent leur propre budget pour chaque campagne. Il n'y a aucun frais caché ni commission sur les paiements."
            }
        },
        {
            "@type": "Question",
            "name": "Comment devenir créateur UGC en Suisse ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Inscrivez-vous gratuitement, complétez votre profil avec vos spécialités et exemples de contenu, puis parcourez les campagnes disponibles et postulez. Aucune expérience préalable n'est requise."
            }
        },
        {
            "@type": "Question",
            "name": "Comment les paiements sont-ils gérés ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Les budgets sont définis en CHF par les marques pour chaque campagne. Le paiement est convenu entre la marque et le créateur. UGC Suisse ne prélève aucune commission sur les transactions."
            }
        }
    ]
}

// ============ FAQ DATA ============
interface FAQItem {
    question: string
    answer: string
    category: 'general' | 'creators' | 'brands' | 'payments' | 'security'
}

const FAQ_ITEMS: FAQItem[] = [
    // Général
    {
        question: "Qu'est-ce que le contenu UGC ?",
        answer: "Le User Generated Content (UGC) est du contenu authentique créé par de vrais utilisateurs pour promouvoir une marque ou un produit. Contrairement aux publicités traditionnelles, le UGC génère jusqu'à 9.8x plus d'engagement car il est perçu comme plus authentique et digne de confiance par les consommateurs. En Suisse, le marché du UGC est en pleine expansion avec une demande croissante pour du contenu en français, allemand et italien.",
        category: 'general'
    },
    {
        question: "Comment fonctionne UGC Suisse ?",
        answer: "UGC Suisse est une plateforme qui connecte les marques suisses avec des créateurs de contenu locaux. Le processus est simple : les marques publient des campagnes avec leurs besoins et leur budget, les créateurs parcourent les opportunités et postulent à celles qui les intéressent, une fois accepté, le créateur produit le contenu demandé. Tout est géré via notre plateforme sécurisée, de la candidature à la livraison du contenu.",
        category: 'general'
    },
    {
        question: "UGC Suisse est-il disponible dans toute la Suisse ?",
        answer: "Oui ! UGC Suisse est disponible dans toute la Suisse romande et nous nous étendons progressivement à la Suisse alémanique et au Tessin. Nos créateurs sont basés à Genève, Lausanne, Fribourg, Neuchâtel, Sion, et dans tout le reste de la Suisse. Les marques de toute la Suisse peuvent publier des campagnes sur notre plateforme.",
        category: 'general'
    },
    {
        question: "Quelle est la différence entre UGC et le marketing d'influence ?",
        answer: "Le marketing d'influence repose sur la portée personnelle d'un influenceur (nombre d'abonnés, visibilité). Le UGC, en revanche, se concentre sur la création de contenu authentique que la marque peut utiliser sur ses propres canaux (site web, publicités, réseaux sociaux). Un créateur UGC n'a pas besoin d'avoir des milliers d'abonnés — c'est la qualité et l'authenticité du contenu qui comptent.",
        category: 'general'
    },
    // Créateurs
    {
        question: "Comment devenir créateur UGC en Suisse ?",
        answer: "C'est simple et gratuit ! Inscrivez-vous sur UGC Suisse, complétez votre profil avec vos spécialités (témoignage, unboxing, review, etc.), ajoutez des exemples de votre travail, puis parcourez les campagnes disponibles et postulez. Aucune expérience préalable n'est requise — si vous savez créer du contenu engageant avec votre smartphone, vous pouvez devenir créateur UGC.",
        category: 'creators'
    },
    {
        question: "Combien peut gagner un créateur UGC ?",
        answer: "Les revenus varient selon le type de contenu et la complexité de la campagne. En Suisse, les budgets par vidéo UGC vont généralement de CHF 200 à CHF 1'500+. Les créateurs expérimentés avec un portfolio solide peuvent obtenir des missions récurrentes et augmenter progressivement leurs tarifs. La clé est de construire un portfolio diversifié et d'obtenir de bonnes évaluations.",
        category: 'creators'
    },
    {
        question: "De quel équipement ai-je besoin ?",
        answer: "Un smartphone récent avec une bonne caméra suffit pour commencer ! La plupart du contenu UGC est tourné au smartphone pour garder un aspect naturel et authentique. Un bon éclairage naturel, un trépied basique et un environnement calme pour l'audio sont vos meilleurs alliés. Au fur et à mesure, vous pourrez investir dans un micro-cravate et un ring light.",
        category: 'creators'
    },
    {
        question: "Puis-je postuler à plusieurs campagnes en même temps ?",
        answer: "Absolument ! Vous pouvez postuler à autant de campagnes que vous le souhaitez. Nous vous recommandons de ne postuler qu'aux campagnes qui correspondent vraiment à votre profil et vos compétences pour maximiser vos chances d'être sélectionné. Assurez-vous simplement de pouvoir respecter les délais de chaque mission acceptée.",
        category: 'creators'
    },
    // Marques
    {
        question: "Comment publier une campagne UGC ?",
        answer: "Créez votre compte marque gratuitement, puis cliquez sur 'Nouvelle campagne' depuis votre dashboard. Décrivez vos besoins (type de contenu, brief créatif, délai), définissez votre budget en CHF, et publiez. Les créateurs qualifiés postuleront à votre campagne et vous pourrez sélectionner ceux qui correspondent le mieux à votre vision. Le processus prend généralement moins de 5 minutes.",
        category: 'brands'
    },
    {
        question: "Comment choisir le bon créateur ?",
        answer: "Chaque créateur dispose d'un profil détaillé avec son portfolio, ses spécialités, ses évaluations et ses statistiques. Nous vous recommandons de regarder attentivement les exemples de travail précédents, de vérifier les avis d'autres marques, et de contacter directement les créateurs via notre messagerie intégrée pour discuter de votre projet avant de valider une collaboration.",
        category: 'brands'
    },
    {
        question: "Quels types de contenu puis-je commander ?",
        answer: "UGC Suisse couvre tous les formats populaires : témoignages vidéo, unboxings, reviews produits, tutoriels, contenu lifestyle, ASMR, et bien plus. Vous pouvez spécifier le format (vertical 9:16 pour TikTok/Reels/Shorts, horizontal 16:9 pour YouTube, carré 1:1 pour Instagram), la durée, et fournir un brief détaillé pour guider le créateur.",
        category: 'brands'
    },
    // Paiements
    {
        question: "Combien coûte UGC Suisse ?",
        answer: "L'inscription et l'utilisation de la plateforme sont 100% gratuites, tant pour les créateurs que pour les marques. Les marques définissent librement leur budget pour chaque campagne. Il n'y a aucun frais caché, aucun abonnement, et aucune commission sur les paiements. Nous croyons que la transparence est la clé d'un écosystème sain.",
        category: 'payments'
    },
    {
        question: "Comment les paiements sont-ils gérés ?",
        answer: "Les budgets sont définis en CHF par les marques pour chaque campagne. Le paiement est convenu directement entre la marque et le créateur lors de la validation de la collaboration. UGC Suisse facilite la mise en relation et la gestion de projet, mais ne gère pas les transactions financières directement. Nous recommandons d'utiliser des méthodes de paiement sécurisées comme les virements bancaires IBAN.",
        category: 'payments'
    },
    // Sécurité
    {
        question: "Comment mes données sont-elles protégées ?",
        answer: "UGC Suisse prend la protection des données très au sérieux. Nous sommes conformes à la Loi fédérale suisse sur la protection des données (LPD) et au RGPD européen. Vos données personnelles sont stockées sur des serveurs sécurisés, les communications sont chiffrées, et nous ne partageons jamais vos informations avec des tiers sans votre consentement explicite.",
        category: 'security'
    },
    {
        question: "Que faire en cas de litige avec un créateur ou une marque ?",
        answer: "En cas de désaccord, nous vous encourageons d'abord à utiliser notre messagerie intégrée pour résoudre le problème directement. Si le conflit persiste, vous pouvez contacter notre équipe support qui servira de médiateur. Nous examinons chaque cas individuellement et cherchons une résolution équitable pour les deux parties. Les utilisations abusives sont signalées et traitées selon nos conditions d'utilisation.",
        category: 'security'
    },
]

const FAQ_CATEGORIES = [
    { id: 'all', label: 'Toutes', icon: BookOpen },
    { id: 'general', label: 'Général', icon: HelpCircle },
    { id: 'creators', label: 'Créateurs', icon: Camera },
    { id: 'brands', label: 'Marques', icon: Building2 },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'security', label: 'Sécurité', icon: Shield },
]


// ============ COMPONENTS ============

function FAQAccordion({ item, index }: { item: FAQItem; index: number }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left group"
            >
                <div className={`p-5 md:p-6 rounded-2xl border transition-all duration-300 ${isOpen
                    ? 'bg-white/[0.08] border-accent/30 shadow-lg shadow-accent/5'
                    : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
                    }`}>
                    <div className="flex items-start justify-between gap-4">
                        <h3 className={`text-base md:text-lg font-medium transition-colors ${isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'
                            }`}>
                            {item.question}
                        </h3>
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex-shrink-0 mt-1"
                        >
                            <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-accent' : 'text-white/40'
                                }`} />
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <p className="mt-4 text-white/60 leading-relaxed text-sm md:text-base">
                                    {item.answer}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </button>
        </motion.div>
    )
}

// ============ MAIN PAGE ============

export default function AidePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const filteredFAQ = FAQ_ITEMS.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory
        const matchesSearch = searchQuery === '' ||
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSubmitting(false)
        setIsSubmitted(true)
        setContactForm({ name: '', email: '', subject: '', message: '' })
    }

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />

            <div className="min-h-screen bg-background overflow-x-hidden">
                <Navbar />

                {/* ===== HERO SECTION ===== */}
                <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-4 md:px-6">
                    {/* Background Glow */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
                        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
                    </div>

                    <div className="max-w-4xl mx-auto text-center relative">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-medium mb-6">
                                <HelpCircle className="w-4 h-4" />
                                Centre d&apos;aide
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
                        >
                            <span className="text-white">Comment pouvons-nous</span>
                            <br />
                            <span className="gradient-text">vous aider ?</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10"
                        >
                            Trouvez rapidement des réponses à vos questions sur la plateforme UGC Suisse.
                            Créateurs et marques, tout est expliqué ici.
                        </motion.p>

                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="max-w-xl mx-auto"
                        >
                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Rechercher dans la FAQ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.06] border border-white/[0.12] rounded-full pl-14 pr-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-base"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ===== HOW IT WORKS ===== */}
                <section className="py-16 md:py-24 px-4 md:px-6 border-t border-white/5">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Comment ça fonctionne
                            </h2>
                            <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg">
                                UGC Suisse simplifie la création de contenu authentique en 3 étapes
                            </p>
                        </motion.div>

                        {/* For Brands */}
                        <div className="mb-20">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-3 mb-8"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Pour les marques</h3>
                            </motion.div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    {
                                        step: '01',
                                        title: 'Publiez votre campagne',
                                        description: 'Décrivez vos besoins en contenu, définissez votre budget en CHF et publiez votre campagne en quelques minutes.',
                                        icon: FileText,
                                        color: 'from-blue-500/20 to-blue-600/20'
                                    },
                                    {
                                        step: '02',
                                        title: 'Sélectionnez vos créateurs',
                                        description: 'Parcourez les candidatures, consultez les portfolios et sélectionnez les créateurs qui correspondent à votre marque.',
                                        icon: Users,
                                        color: 'from-violet-500/20 to-violet-600/20'
                                    },
                                    {
                                        step: '03',
                                        title: 'Recevez votre contenu',
                                        description: 'Les créateurs produisent du contenu authentique. Validez les livrables et utilisez-les sur vos canaux marketing.',
                                        icon: CheckCircle2,
                                        color: 'from-emerald-500/20 to-emerald-600/20'
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.step}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.15 }}
                                        className="relative group"
                                    >
                                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 md:p-8 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-500 h-full">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}>
                                                <item.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-accent/60 tracking-widest uppercase">Étape {item.step}</span>
                                            <h4 className="text-lg font-semibold text-white mt-2 mb-3">{item.title}</h4>
                                            <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* For Creators */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-3 mb-8"
                            >
                                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                                    <Camera className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Pour les créateurs</h3>
                            </motion.div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    {
                                        step: '01',
                                        title: 'Créez votre profil',
                                        description: 'Inscrivez-vous gratuitement, ajoutez vos spécialités et présentez vos meilleurs exemples de contenu.',
                                        icon: Users,
                                        color: 'from-accent/20 to-orange-500/20'
                                    },
                                    {
                                        step: '02',
                                        title: 'Postulez aux campagnes',
                                        description: 'Parcourez les campagnes disponibles sur le marketplace et postulez à celles qui vous intéressent.',
                                        icon: Briefcase,
                                        color: 'from-pink-500/20 to-rose-600/20'
                                    },
                                    {
                                        step: '03',
                                        title: 'Créez et gagnez',
                                        description: 'Produisez du contenu UGC de qualité, livrez à temps, et recevez votre rémunération en CHF.',
                                        icon: TrendingUp,
                                        color: 'from-amber-500/20 to-yellow-500/20'
                                    },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.step}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.15 }}
                                        className="relative group"
                                    >
                                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 md:p-8 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-500 h-full">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}>
                                                <item.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-accent/60 tracking-widest uppercase">Étape {item.step}</span>
                                            <h4 className="text-lg font-semibold text-white mt-2 mb-3">{item.title}</h4>
                                            <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== KEY ADVANTAGES ===== */}
                <section className="py-16 md:py-24 px-4 md:px-6 border-t border-white/5">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Pourquoi choisir UGC Suisse ?
                            </h2>
                            <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg">
                                La première plateforme 100% suisse dédiée au contenu créatif authentique
                            </p>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                { icon: Globe, title: '100% Suisse', description: 'Plateforme conçue pour le marché suisse, avec des créateurs locaux et des paiements en CHF.' },
                                { icon: Zap, title: 'Gratuit', description: "Aucun frais d'inscription, aucun abonnement et aucune commission sur les transactions." },
                                { icon: Shield, title: 'Sécurisé', description: 'Conforme à la LPD suisse et au RGPD. Vos données sont protégées et chiffrées.' },
                                { icon: MessageCircle, title: 'Messagerie intégrée', description: 'Communiquez directement avec vos collaborateurs via notre messagerie en temps réel.' },
                                { icon: Award, title: 'Créateurs vérifiés', description: 'Chaque créateur dispose d\'un profil détaillé avec portfolio, évaluations et statistiques.' },
                                { icon: Lock, title: 'Transparent', description: "Pas de frais cachés. Les budgets sont visibles et définis librement par les marques." },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.08 }}
                                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-500"
                                >
                                    <item.icon className="w-8 h-8 text-accent mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== FAQ SECTION ===== */}
                <section className="py-16 md:py-24 px-4 md:px-6 border-t border-white/5" id="faq">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Questions fréquentes
                            </h2>
                            <p className="text-white/60 max-w-xl mx-auto">
                                Les réponses aux questions les plus posées par nos utilisateurs
                            </p>
                        </motion.div>

                        {/* Category Filter */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-wrap justify-center gap-2 mb-10"
                        >
                            {FAQ_CATEGORIES.map((cat) => {
                                const CatIcon = cat.icon
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat.id
                                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                            : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white'
                                            }`}
                                    >
                                        <CatIcon className="w-3.5 h-3.5" />
                                        {cat.label}
                                    </button>
                                )
                            })}
                        </motion.div>

                        {/* FAQ Items */}
                        <div className="space-y-3">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCategory + searchQuery}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    {filteredFAQ.length > 0 ? (
                                        filteredFAQ.map((item, index) => (
                                            <FAQAccordion key={item.question} item={item} index={index} />
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-white/40">
                                            <Search className="w-10 h-10 mx-auto mb-4 opacity-40" />
                                            <p>Aucun résultat pour &quot;{searchQuery}&quot;</p>
                                            <p className="text-sm mt-2">Essayez avec d&apos;autres termes ou contactez-nous</p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                {/* ===== CONTACT SECTION ===== */}
                <section className="py-16 md:py-24 px-4 md:px-6 border-t border-white/5" id="contact">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Besoin d&apos;aide supplémentaire ?
                            </h2>
                            <p className="text-white/60 max-w-xl mx-auto">
                                Notre équipe est là pour vous accompagner. Contactez-nous et nous vous répondrons dans les 24 heures.
                            </p>
                        </motion.div>

                        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
                            {/* Contact Info */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="lg:col-span-2 space-y-6"
                            >
                                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-6">
                                    <h3 className="text-lg font-semibold text-white">Nos coordonnées</h3>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                                <Mail className="w-4 h-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/50 mb-1">Email</p>
                                                <a href="mailto:contact@ugcsuisse.ch" className="text-white hover:text-accent transition-colors">
                                                    contact@ugcsuisse.ch
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/50 mb-1">Localisation</p>
                                                <p className="text-white">Suisse romande</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-4 h-4 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/50 mb-1">Temps de réponse</p>
                                                <p className="text-white">Sous 24 heures</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Liens rapides</h3>
                                    <div className="space-y-3">
                                        <Link href="/marketplace" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            Explorer le marketplace
                                        </Link>
                                        <Link href="/signup?role=creator" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            S&apos;inscrire comme créateur
                                        </Link>
                                        <Link href="/signup?role=brand" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            S&apos;inscrire comme marque
                                        </Link>
                                        <Link href="/login" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            Se connecter
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Contact Form */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="lg:col-span-3"
                            >
                                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 md:p-8">
                                    {isSubmitted ? (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-12"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">Message envoyé !</h3>
                                            <p className="text-white/60 mb-6">
                                                Nous avons bien reçu votre message et nous vous répondrons dans les 24 heures.
                                            </p>
                                            <Button
                                                onClick={() => setIsSubmitted(false)}
                                                className="btn-primary"
                                            >
                                                Envoyer un autre message
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <h3 className="text-lg font-semibold text-white mb-2">Envoyez-nous un message</h3>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Nom complet</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={contactForm.name}
                                                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Votre nom"
                                                        className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={contactForm.email}
                                                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                                        placeholder="votre@email.ch"
                                                        className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-white/60 mb-2">Sujet</label>
                                                <select
                                                    required
                                                    value={contactForm.subject}
                                                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm appearance-none"
                                                >
                                                    <option value="" className="bg-[#1A1A1A]">Sélectionnez un sujet</option>
                                                    <option value="general" className="bg-[#1A1A1A]">Question générale</option>
                                                    <option value="creator" className="bg-[#1A1A1A]">Aide créateur</option>
                                                    <option value="brand" className="bg-[#1A1A1A]">Aide marque</option>
                                                    <option value="technical" className="bg-[#1A1A1A]">Problème technique</option>
                                                    <option value="partnership" className="bg-[#1A1A1A]">Partenariat</option>
                                                    <option value="other" className="bg-[#1A1A1A]">Autre</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-white/60 mb-2">Message</label>
                                                <textarea
                                                    required
                                                    rows={5}
                                                    value={contactForm.message}
                                                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                                    placeholder="Décrivez votre question ou problème en détail..."
                                                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all text-sm resize-none"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                className="btn-primary w-full"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </motion.div>
                                                        Envoi en cours...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Send className="w-4 h-4" />
                                                        Envoyer le message
                                                    </span>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== TRUST SECTION ===== */}
                <section className="py-16 md:py-20 px-4 md:px-6 border-t border-white/5">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/15 rounded-3xl p-8 md:p-12 text-center"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                Prêt à commencer ?
                            </h2>
                            <p className="text-white/60 max-w-lg mx-auto mb-8">
                                Rejoignez UGC Suisse et connectez-vous avec les meilleurs créateurs et marques de Suisse romande.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/signup?role=creator">
                                    <Button className="btn-primary w-full sm:w-auto px-8">
                                        <Camera className="w-4 h-4 mr-2" />
                                        Je suis créateur
                                    </Button>
                                </Link>
                                <Link href="/signup?role=brand">
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto px-8">
                                        <Briefcase className="w-4 h-4 mr-2" />
                                        Je suis une marque
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { value: '100%', label: 'Gratuit' },
                                    { value: '24h', label: 'Temps de réponse' },
                                    { value: 'LPD', label: 'Conforme' },
                                    { value: 'CHF', label: 'Paiements suisses' },
                                ].map((stat) => (
                                    <div key={stat.label}>
                                        <p className="text-2xl font-bold text-accent">{stat.value}</p>
                                        <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Bottom Padding for mobile nav */}
                <div className="h-20 md:h-0" />
            </div>
        </>
    )
}
