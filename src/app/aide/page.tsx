'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import {
    ChevronDown,
    Search,
    Send,
    ArrowRight,
    MessageCircle,
    Camera,
    Briefcase,
    CheckCircle2,
    HelpCircle,
    BookOpen,
    CreditCard,
    Shield,
    Building2,
} from 'lucide-react'

// ============ SEO STRUCTURED DATA ============
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
    category: string
}

const FAQ_ITEMS: FAQItem[] = [
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
        question: "Quelle est la différence entre UGC et le marketing d'influence ?",
        answer: "Le marketing d'influence repose sur la portée personnelle d'un influenceur (nombre d'abonnés, visibilité). Le UGC, en revanche, se concentre sur la création de contenu authentique que la marque peut utiliser sur ses propres canaux (site web, publicités, réseaux sociaux). Un créateur UGC n'a pas besoin d'avoir des milliers d'abonnés — c'est la qualité et l'authenticité du contenu qui comptent.",
        category: 'general'
    },
    {
        question: "UGC Suisse est-il disponible dans toute la Suisse ?",
        answer: "Oui ! UGC Suisse est disponible dans toute la Suisse romande et nous nous étendons progressivement à la Suisse alémanique et au Tessin. Nos créateurs sont basés à Genève, Lausanne, Fribourg, Neuchâtel, Sion, et dans tout le reste de la Suisse.",
        category: 'general'
    },
    {
        question: "Comment devenir créateur UGC en Suisse ?",
        answer: "C'est simple et gratuit ! Inscrivez-vous sur UGC Suisse, complétez votre profil avec vos spécialités (témoignage, unboxing, review, etc.), ajoutez des exemples de votre travail, puis parcourez les campagnes disponibles et postulez. Aucune expérience préalable n'est requise — si vous savez créer du contenu engageant avec votre smartphone, vous pouvez devenir créateur UGC.",
        category: 'creators'
    },
    {
        question: "Combien peut gagner un créateur UGC ?",
        answer: "Les revenus varient selon le type de contenu et la complexité de la campagne. En Suisse, les budgets par vidéo UGC vont généralement de CHF 200 à CHF 1'500+. Les créateurs expérimentés avec un portfolio solide peuvent obtenir des missions récurrentes et augmenter progressivement leurs tarifs.",
        category: 'creators'
    },
    {
        question: "De quel équipement ai-je besoin ?",
        answer: "Un smartphone récent avec une bonne caméra suffit pour commencer ! La plupart du contenu UGC est tourné au smartphone pour garder un aspect naturel et authentique. Un bon éclairage naturel, un trépied basique et un environnement calme pour l'audio sont vos meilleurs alliés.",
        category: 'creators'
    },
    {
        question: "Puis-je postuler à plusieurs campagnes en même temps ?",
        answer: "Absolument ! Vous pouvez postuler à autant de campagnes que vous le souhaitez. Nous vous recommandons de ne postuler qu'aux campagnes qui correspondent vraiment à votre profil et vos compétences pour maximiser vos chances d'être sélectionné.",
        category: 'creators'
    },
    {
        question: "Comment publier une campagne UGC ?",
        answer: "Créez votre compte marque gratuitement, puis cliquez sur 'Nouvelle campagne' depuis votre dashboard. Décrivez vos besoins (type de contenu, brief créatif, délai), définissez votre budget en CHF, et publiez. Les créateurs qualifiés postuleront à votre campagne et vous pourrez sélectionner ceux qui correspondent le mieux à votre vision.",
        category: 'brands'
    },
    {
        question: "Comment choisir le bon créateur ?",
        answer: "Chaque créateur dispose d'un profil détaillé avec son portfolio, ses spécialités, ses évaluations et ses statistiques. Nous vous recommandons de regarder attentivement les exemples de travail précédents, de vérifier les avis d'autres marques, et de contacter directement les créateurs via notre messagerie intégrée.",
        category: 'brands'
    },
    {
        question: "Quels types de contenu puis-je commander ?",
        answer: "UGC Suisse couvre tous les formats populaires : témoignages vidéo, unboxings, reviews produits, tutoriels, contenu lifestyle, ASMR, et bien plus. Vous pouvez spécifier le format (vertical 9:16 pour TikTok/Reels/Shorts, horizontal 16:9 pour YouTube, carré 1:1 pour Instagram), la durée, et fournir un brief détaillé.",
        category: 'brands'
    },
    {
        question: "Combien coûte UGC Suisse ?",
        answer: "L'inscription et l'utilisation de la plateforme sont 100% gratuites, tant pour les créateurs que pour les marques. Les marques définissent librement leur budget pour chaque campagne. Il n'y a aucun frais caché, aucun abonnement, et aucune commission sur les paiements.",
        category: 'payments'
    },
    {
        question: "Comment les paiements sont-ils gérés ?",
        answer: "Les budgets sont définis en CHF par les marques pour chaque campagne. Le paiement est convenu directement entre la marque et le créateur lors de la validation de la collaboration. UGC Suisse facilite la mise en relation et la gestion de projet, mais ne gère pas les transactions financières directement.",
        category: 'payments'
    },
    {
        question: "Comment mes données sont-elles protégées ?",
        answer: "UGC Suisse prend la protection des données très au sérieux. Nous sommes conformes à la Loi fédérale suisse sur la protection des données (LPD) et au RGPD européen. Vos données personnelles sont stockées sur des serveurs sécurisés, les communications sont chiffrées, et nous ne partageons jamais vos informations avec des tiers.",
        category: 'security'
    },
    {
        question: "Que faire en cas de litige ?",
        answer: "En cas de désaccord, nous vous encourageons d'abord à utiliser notre messagerie intégrée pour résoudre le problème directement. Si le conflit persiste, vous pouvez contacter notre équipe support qui servira de médiateur. Nous examinons chaque cas individuellement et cherchons une résolution équitable.",
        category: 'security'
    },
]

const FAQ_CATEGORIES = [
    { id: 'all', label: 'Tout', icon: BookOpen },
    { id: 'general', label: 'Général', icon: HelpCircle },
    { id: 'creators', label: 'Créateurs', icon: Camera },
    { id: 'brands', label: 'Marques', icon: Building2 },
    { id: 'payments', label: 'Paiements', icon: CreditCard },
    { id: 'security', label: 'Sécurité', icon: Shield },
]

// ============ MAIN PAGE ============

export default function AidePage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [openFAQ, setOpenFAQ] = useState<number | null>(null)
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
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsSubmitting(false)
        setIsSubmitted(true)
        setContactForm({ name: '', email: '', subject: '', message: '' })
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />

            <div className="min-h-screen bg-background overflow-x-hidden">
                <Navbar />

                {/* ===== HERO — Editorial, text-forward ===== */}
                <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
                    {/* Subtle grid pattern like homepage */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/6 rounded-full blur-[130px]" />

                    <div className="max-w-5xl mx-auto relative">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center"
                        >
                            <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold leading-[1.05] mb-8">
                                <span className="text-white">On répond à</span>
                                <br />
                                <span className="relative inline-block">
                                    <span className="gradient-text">toutes vos questions.</span>
                                    <svg className="absolute -bottom-3 left-0 w-full" height="10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                        <path d="M0 8 Q 25 2, 50 8 T 100 8" stroke="url(#helpGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
                                        <defs>
                                            <linearGradient id="helpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#FF6B6B" />
                                                <stop offset="100%" stopColor="#A855F7" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </span>
                            </h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="text-lg md:text-xl text-white/50 max-w-xl mx-auto"
                            >
                                Guide complet, FAQ et support pour créateurs et marques sur UGC Suisse.
                            </motion.p>
                        </motion.div>

                        {/* Search — floating */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="mt-12 max-w-lg mx-auto"
                        >
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-accent/60 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher une question..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-white/[0.15] transition-all text-base"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ===== HOW IT WORKS — Timeline-style, no cards ===== */}
                <section className="py-24 md:py-32 px-6 relative">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-24"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                Simple comme <span className="italic">1, 2, 3.</span>
                            </h2>
                        </motion.div>

                        {/* Two Columns — Brands & Creators side by side */}
                        <div className="grid md:grid-cols-2 gap-16 md:gap-24">
                            {/* Brands Column */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="flex items-center gap-3 mb-12">
                                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/30">Pour les</span>
                                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-accent">Marques</span>
                                </div>

                                <div className="space-y-12">
                                    {[
                                        { num: '01', title: 'Publiez', desc: 'Décrivez votre besoin en contenu et fixez votre budget en CHF. Ça prend 5 minutes.' },
                                        { num: '02', title: 'Sélectionnez', desc: 'Les créateurs postulent. Parcourez les portfolios, les notes, et choisissez le talent idéal.' },
                                        { num: '03', title: 'Recevez', desc: 'Le créateur produit votre contenu. Validez, demandez des révisions si besoin, et utilisez-le partout.' },
                                    ].map((step, i) => (
                                        <motion.div
                                            key={step.num}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15 }}
                                            className="relative pl-16"
                                        >
                                            <span className="absolute left-0 top-0 text-4xl font-black text-white/[0.06]">{step.num}</span>
                                            <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                                            <p className="text-white/50 leading-relaxed">{step.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="mt-12 pl-16"
                                >
                                    <Link href="/signup?role=brand" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium">
                                        Créer un compte marque <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            </motion.div>

                            {/* Creators Column */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-12">
                                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/30">Pour les</span>
                                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-accent">Créateurs</span>
                                </div>

                                <div className="space-y-12">
                                    {[
                                        { num: '01', title: 'Inscrivez-vous', desc: "Créez votre profil gratuit, ajoutez vos spécialités et montrez votre meilleur contenu." },
                                        { num: '02', title: 'Postulez', desc: 'Parcourez le marketplace, trouvez des campagnes qui vous inspirent, et postulez en un clic.' },
                                        { num: '03', title: 'Créez & gagnez', desc: 'Produisez du contenu authentique, livrez à temps, et recevez votre rémunération en CHF.' },
                                    ].map((step, i) => (
                                        <motion.div
                                            key={step.num}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 + i * 0.15 }}
                                            className="relative pl-16"
                                        >
                                            <span className="absolute left-0 top-0 text-4xl font-black text-white/[0.06]">{step.num}</span>
                                            <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                                            <p className="text-white/50 leading-relaxed">{step.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="mt-12 pl-16"
                                >
                                    <Link href="/signup?role=creator" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium">
                                        Créer un compte créateur <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== KEY NUMBERS — Raw typography, no boxes ===== */}
                <section className="py-24 md:py-32 px-6 border-t border-white/5">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                Pourquoi <span className="gradient-text">UGC Suisse</span> ?
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                            {[
                                {
                                    headline: '0 CHF',
                                    text: <>L&apos;inscription est <span className="text-white">100% gratuite</span> pour les créateurs et les marques. Pas d&apos;abonnement, pas de commission.</>
                                },
                                {
                                    headline: '100% suisse',
                                    text: <>Conçue pour le marché suisse, avec des <span className="text-white">créateurs locaux</span> et des paiements en francs suisses.</>
                                },
                                {
                                    headline: 'LPD & RGPD',
                                    text: <>Vos données sont <span className="text-white">protégées et chiffrées</span>. Conforme à la loi suisse et aux normes européennes.</>
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                >
                                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">{item.headline}</h3>
                                    <p className="text-white/50 leading-relaxed">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Second row — more editorial */}
                        <div className="grid md:grid-cols-3 gap-12 md:gap-16 mt-16 pt-16 border-t border-white/[0.04]">
                            {[
                                {
                                    headline: 'Messagerie',
                                    text: <>Communiquez <span className="text-white">en temps réel</span> avec vos collaborateurs, directement dans la plateforme.</>
                                },
                                {
                                    headline: 'Transparence',
                                    text: <>Les budgets sont <span className="text-white">visibles et publics</span>. Chaque créateur a un profil détaillé avec portfolio et évaluations.</>
                                },
                                {
                                    headline: '< 24h',
                                    text: <>Notre équipe <span className="text-white">répond sous 24 heures</span> à toutes vos questions et demandes de support.</>
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                >
                                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">{item.headline}</h3>
                                    <p className="text-white/50 leading-relaxed">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== FAQ — Clean, minimal accordion ===== */}
                <section className="py-24 md:py-32 px-6 border-t border-white/5" id="faq">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                                FAQ
                            </h2>
                            <p className="text-white/40 text-lg">Les réponses aux questions les plus posées</p>
                        </motion.div>

                        {/* Category Pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="flex flex-wrap justify-center gap-2 mb-12"
                        >
                            {FAQ_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setActiveCategory(cat.id); setOpenFAQ(null) }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === cat.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </motion.div>

                        {/* Accordion */}
                        <div className="divide-y divide-white/[0.06]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCategory + searchQuery}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="divide-y divide-white/[0.06]"
                                >
                                    {filteredFAQ.length > 0 ? (
                                        filteredFAQ.map((item, index) => (
                                            <motion.div
                                                key={item.question}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <button
                                                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                                    className="w-full py-6 flex items-start justify-between gap-4 text-left group"
                                                >
                                                    <span className={`text-base md:text-lg font-medium transition-colors ${openFAQ === index ? 'text-white' : 'text-white/70 group-hover:text-white'
                                                        }`}>
                                                        {item.question}
                                                    </span>
                                                    <motion.div
                                                        animate={{ rotate: openFAQ === index ? 180 : 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="flex-shrink-0 mt-1"
                                                    >
                                                        <ChevronDown className={`w-5 h-5 ${openFAQ === index ? 'text-accent' : 'text-white/20'}`} />
                                                    </motion.div>
                                                </button>
                                                <AnimatePresence>
                                                    {openFAQ === index && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <p className="pb-6 text-white/45 leading-relaxed text-[15px] pr-8">
                                                                {item.answer}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-16 text-white/30">
                                            <p className="text-lg">Aucun résultat pour &quot;{searchQuery}&quot;</p>
                                            <p className="text-sm mt-2">Essayez d&apos;autres termes ou contactez-nous</p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                {/* ===== CONTACT — Two-column editorial ===== */}
                <section className="py-24 md:py-32 px-6 border-t border-white/5" id="contact">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
                            {/* Left — Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                                    Besoin d&apos;aide<br />
                                    <span className="text-white/40">supplémentaire ?</span>
                                </h2>
                                <p className="text-white/50 leading-relaxed mb-10 text-lg">
                                    Notre équipe est là pour vous accompagner. Envoyez-nous un message et nous vous répondrons dans les 24 heures.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-8 bg-accent/40" />
                                        <div>
                                            <p className="text-sm text-white/30">Email</p>
                                            <a href="mailto:contact@ugcsuisse.ch" className="text-white hover:text-accent transition-colors">
                                                contact@ugcsuisse.ch
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-8 bg-accent/40" />
                                        <div>
                                            <p className="text-sm text-white/30">Localisation</p>
                                            <p className="text-white">Suisse romande</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-8 bg-accent/40" />
                                        <div>
                                            <p className="text-sm text-white/30">Temps de réponse</p>
                                            <p className="text-white">Sous 24 heures</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick links */}
                                <div className="mt-12 pt-8 border-t border-white/[0.06] space-y-3">
                                    {[
                                        { label: 'Explorer le marketplace', href: '/marketplace' },
                                        { label: "S'inscrire comme créateur", href: '/signup?role=creator' },
                                        { label: "S'inscrire comme marque", href: '/signup?role=brand' },
                                    ].map((link) => (
                                        <Link key={link.href} href={link.href} className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group text-sm">
                                            <ArrowRight className="w-3. h-3.5 group-hover:translate-x-1 transition-transform" />
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right — Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.15 }}
                            >
                                {isSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-20"
                                    >
                                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                                        <h3 className="text-2xl font-bold text-white mb-3">Message envoyé</h3>
                                        <p className="text-white/50 mb-8">
                                            Nous vous répondrons dans les 24 heures.
                                        </p>
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className="text-accent hover:text-accent/80 transition-colors font-medium inline-flex items-center gap-2"
                                        >
                                            Envoyer un autre message <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-white/30 mb-2 uppercase tracking-wider">Nom</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={contactForm.name}
                                                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                                                    placeholder="Votre nom"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-white/30 mb-2 uppercase tracking-wider">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={contactForm.email}
                                                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors"
                                                    placeholder="votre@email.ch"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-white/30 mb-2 uppercase tracking-wider">Sujet</label>
                                            <select
                                                required
                                                value={contactForm.subject}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                                className="w-full bg-transparent border-b border-white/10 pb-3 text-white focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-[#111]">Sélectionnez un sujet</option>
                                                <option value="general" className="bg-[#111]">Question générale</option>
                                                <option value="creator" className="bg-[#111]">Aide créateur</option>
                                                <option value="brand" className="bg-[#111]">Aide marque</option>
                                                <option value="technical" className="bg-[#111]">Problème technique</option>
                                                <option value="partnership" className="bg-[#111]">Partenariat</option>
                                                <option value="other" className="bg-[#111]">Autre</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-white/30 mb-2 uppercase tracking-wider">Message</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={contactForm.message}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                                className="w-full bg-transparent border-b border-white/10 pb-3 text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors resize-none"
                                                placeholder="Décrivez votre question..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== CTA — Minimal, impactful ===== */}
                <section className="py-24 md:py-32 px-6 border-t border-white/5">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                                Prêt à commencer ?
                            </h2>
                            <p className="text-white/40 text-lg mb-10 max-w-lg mx-auto">
                                Rejoignez la première plateforme UGC 100% suisse. Inscription gratuite.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/signup?role=creator" className="btn-primary inline-flex items-center justify-center gap-2 px-8">
                                    <Camera className="w-4 h-4" />
                                    Je suis créateur
                                </Link>
                                <Link href="/signup?role=brand" className="btn-secondary inline-flex items-center justify-center gap-2 px-8">
                                    <Briefcase className="w-4 h-4" />
                                    Je suis une marque
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <div className="h-20 md:h-0" />
            </div>
        </>
    )
}
