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
                "text": "Le User Generated Content (UGC) est du contenu authentique créé par de vrais utilisateurs pour promouvoir une marque. Contrairement au marketing traditionnel, le UGC génère jusqu'à 9.8x plus d'engagement car il est perçu comme plus crédible."
            }
        },
        {
            "@type": "Question",
            "name": "Comment fonctionne MOSH ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "MOSH est une agence UGC suisse. Vous nous transmettez votre brief, nous sélectionnons le créateur idéal dans notre réseau, nous gérons la production, les contrats et la livraison. Vous recevez vos vidéos prêtes à l'emploi."
            }
        },
        {
            "@type": "Question",
            "name": "Combien coûte une vidéo UGC avec MOSH ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Le tarif dépend du type de contenu, de la complexité et du nombre de vidéos. Nous établissons un devis personnalisé pour chaque mission. Contactez-nous pour recevoir une offre adaptée à votre projet."
            }
        },
        {
            "@type": "Question",
            "name": "Qui sont vos créateurs ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Notre réseau regroupe des créateurs UGC professionnels basés en Suisse romande. Chaque créateur est vérifié et sélectionné par notre équipe pour garantir un niveau de qualité premium."
            }
        },
        {
            "@type": "Question",
            "name": "Comment les paiements sont-ils gérés ?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "MOSH gère l'intégralité des transactions. Vous payez MOSH directement en CHF, et nous rémunérons les créateurs. Contrats, factures et TVA suisse (8.1%) sont gérés automatiquement."
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
        answer: "Le User Generated Content (UGC) est du contenu authentique créé par de vrais utilisateurs pour promouvoir une marque ou un produit. Contrairement aux publicités traditionnelles en studio, le UGC génère jusqu'à 9.8x plus d'engagement car il est perçu comme plus crédible et naturel par les consommateurs. C'est le format publicitaire le plus performant en 2026.",
        category: 'general'
    },
    {
        question: "Comment fonctionne MOSH ?",
        answer: "MOSH est une agence UGC basée en Suisse. Contrairement aux plateformes marketplace, nous gérons tout pour vous : vous nous envoyez votre brief, notre équipe sélectionne le créateur idéal dans notre réseau, nous gérons la production, les contrats juridiques (conformes au CO suisse), les révisions et la livraison. Vous recevez vos vidéos prêtes à être diffusées.",
        category: 'general'
    },
    {
        question: "Quelle est la différence entre MOSH et une plateforme marketplace ?",
        answer: "Sur une marketplace, vous devez chercher, négocier et gérer les créateurs vous-même. Chez MOSH, notre équipe s'occupe de tout : sélection du créateur, rédaction du contrat, suivi de la production, contrôle qualité et livraison. Vous gagnez du temps et bénéficiez de notre expertise pour garantir un résultat professionnel.",
        category: 'general'
    },
    {
        question: "MOSH est-il disponible dans toute la Suisse ?",
        answer: "Oui ! Notre réseau de créateurs couvre toute la Suisse romande — Genève, Lausanne, Fribourg, Neuchâtel, Sion et bien d'autres villes. Nous nous étendons progressivement à la Suisse alémanique et au Tessin.",
        category: 'general'
    },
    {
        question: "Comment rejoindre le réseau de créateurs MOSH ?",
        answer: "Inscrivez-vous sur notre plateforme et complétez votre profil avec vos spécialités (témoignage, unboxing, review, etc.) et exemples de contenu. Notre équipe évalue chaque candidature pour maintenir un niveau de qualité premium. Si votre profil correspond à nos standards, vous serez intégré à notre réseau et recevrez des missions.",
        category: 'creators'
    },
    {
        question: "Combien peut gagner un créateur avec MOSH ?",
        answer: "Les rémunérations varient selon le type de contenu et la complexité de la mission. En Suisse, les budgets par vidéo UGC vont généralement de CHF 200 à CHF 1'500+. MOSH gère les contrats et les paiements de manière transparente — vous recevez votre rémunération en CHF après validation de la livraison.",
        category: 'creators'
    },
    {
        question: "De quel équipement ai-je besoin ?",
        answer: "Un smartphone récent avec une bonne caméra suffit pour commencer ! La plupart du contenu UGC est tourné au smartphone pour garder un aspect naturel et authentique. Un bon éclairage naturel, un trépied basique et un environnement calme pour l'audio sont vos meilleurs alliés.",
        category: 'creators'
    },
    {
        question: "Comment se passe une mission avec MOSH ?",
        answer: "MOSH vous contacte avec un brief détaillé. Vous recevez un contrat de mandat (conforme au CO suisse, art. 394 ss) à signer électroniquement. Vous produisez le contenu selon les spécifications, le soumettez pour validation via la plateforme, et recevez votre paiement après approbation. Des révisions sont incluses dans chaque mission.",
        category: 'creators'
    },
    {
        question: "Comment lancer ma première campagne UGC ?",
        answer: "Contactez-nous avec votre brief : décrivez votre marque, le type de contenu souhaité, votre budget et vos délais. Notre équipe vous accompagne pour affiner le brief, sélectionner le créateur idéal et lancer la production. Vous n'avez rien d'autre à gérer.",
        category: 'brands'
    },
    {
        question: "Comment MOSH choisit-il le bon créateur pour ma marque ?",
        answer: "Notre équipe analyse votre brief, votre univers de marque et votre audience cible pour sélectionner le profil le plus adapté dans notre réseau vérifié. Nous vous proposons un ou plusieurs créateurs avec leur portfolio. Vous validez notre recommandation avant le lancement de la production.",
        category: 'brands'
    },
    {
        question: "Quels types de contenu puis-je commander ?",
        answer: "MOSH couvre tous les formats populaires : témoignages vidéo, unboxings, reviews produits, tutoriels, contenu lifestyle, ASMR, et bien plus. Nous gérons tous les formats (vertical 9:16 pour TikTok/Reels/Shorts, horizontal 16:9 pour YouTube, carré 1:1 pour Instagram). Vous recevez les fichiers source prêts à être publiés.",
        category: 'brands'
    },
    {
        question: "Combien coûte une campagne avec MOSH ?",
        answer: "Le tarif dépend du nombre de vidéos, du type de contenu et de la complexité du brief. Nous établissons un devis personnalisé et transparent pour chaque projet, avec le détail des coûts (HT, TVA 8.1%, TTC). Contactez-nous pour recevoir une offre adaptée à votre budget.",
        category: 'payments'
    },
    {
        question: "Comment les paiements sont-ils gérés ?",
        answer: "MOSH gère l'intégralité de la facturation. Vous payez MOSH en CHF sur facture, et nous rémunérons les créateurs directement. Les contrats de mandat, les factures avec TVA suisse (8.1%) et les cessions de droits sont générés automatiquement par notre plateforme. Tout est conforme au droit suisse.",
        category: 'payments'
    },
    {
        question: "Comment mes données sont-elles protégées ?",
        answer: "MOSH prend la protection des données très au sérieux. Nous sommes conformes à la Loi fédérale suisse sur la protection des données (LPD) et au RGPD européen. Vos données et celles de vos briefs sont stockées sur des serveurs sécurisés en Suisse. Les communications sont chiffrées et nous ne partageons jamais vos informations avec des tiers.",
        category: 'security'
    },
    {
        question: "Que se passe-t-il si le contenu ne me convient pas ?",
        answer: "Chaque mission inclut un nombre défini de révisions (précisé dans le contrat). Si le contenu ne correspond pas au brief après les révisions incluses, notre équipe intervient pour trouver une solution. MOSH agit comme médiateur et garant de la qualité pour chaque livraison.",
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
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
                    <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#6C3FA0]/8 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-[130px]" />

                    <div className="max-w-5xl mx-auto relative">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center"
                        >
                            <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold leading-[1.05] mb-8">
                                <span className="text-gray-900">On répond à</span>
                                <br />
                                <span className="relative inline-block">
                                    <span className="bg-gradient-to-r from-[#6C3FA0] via-[#A855F7] to-[#6C3FA0] bg-clip-text text-transparent">toutes vos questions.</span>
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
                                className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto"
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
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#6C3FA0]/60 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher une question..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-14 pr-6 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-gray-50 focus:border-gray-300 transition-all text-base"
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
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
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
                                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400">Pour les</span>
                                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#6C3FA0]">Marques</span>
                                </div>

                                <div className="space-y-12">
                                    {[
                                        { num: '01', title: 'Briefez-nous', desc: 'Décrivez votre besoin en contenu, votre marque et vos objectifs. Notre équipe vous rappelle sous 24h.' },
                                        { num: '02', title: 'On s\'occupe de tout', desc: 'MOSH sélectionne le créateur idéal, rédige le contrat et lance la production. Vous n\'avez rien à gérer.' },
                                        { num: '03', title: 'Recevez vos vidéos', desc: 'Validez le contenu, demandez des révisions si nécessaire, et recevez vos fichiers prêts à diffuser.' },
                                    ].map((step, i) => (
                                        <motion.div
                                            key={step.num}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15 }}
                                            className="relative pl-16"
                                        >
                                            <span className="absolute left-0 top-0 text-4xl font-black text-gray-200">{step.num}</span>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                            <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="mt-12 pl-16"
                                >
                                    <Link href="/signup?role=brand" className="inline-flex items-center gap-2 text-[#6C3FA0] hover:text-[#6C3FA0]/80 transition-colors font-medium">
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
                                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400">Pour les</span>
                                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#6C3FA0]">Créateurs</span>
                                </div>

                                <div className="space-y-12">
                                    {[
                                        { num: '01', title: 'Inscrivez-vous', desc: "Créez votre profil, ajoutez vos spécialités et montrez votre meilleur contenu pour rejoindre le réseau MOSH." },
                                        { num: '02', title: 'Recevez des missions', desc: 'MOSH vous contacte avec des briefs adaptés à votre profil. Vous signez un contrat clair et commencez à créer.' },
                                        { num: '03', title: 'Créez & gagnez', desc: 'Produisez du contenu authentique, livrez via la plateforme, et recevez votre rémunération en CHF.' },
                                    ].map((step, i) => (
                                        <motion.div
                                            key={step.num}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 + i * 0.15 }}
                                            className="relative pl-16"
                                        >
                                            <span className="absolute left-0 top-0 text-4xl font-black text-gray-200">{step.num}</span>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                            <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="mt-12 pl-16"
                                >
                                    <Link href="/signup?role=creator" className="inline-flex items-center gap-2 text-[#6C3FA0] hover:text-[#6C3FA0]/80 transition-colors font-medium">
                                        Créer un compte créateur <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== KEY NUMBERS — Raw typography, no boxes ===== */}
                <section className="py-24 md:py-32 px-6 border-t border-gray-200">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Pourquoi <span className="bg-gradient-to-r from-[#6C3FA0] via-[#A855F7] to-[#6C3FA0] bg-clip-text text-transparent">UGC Suisse</span> ?
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
                            {[
                                {
                                    headline: 'Clé en main',
                                    text: <>MOSH gère <span className="text-gray-900">tout de A à Z</span> : sélection du créateur, contrats, production, révisions et livraison. Zéro charge pour vous.</>
                                },
                                {
                                    headline: '100% suisse',
                                    text: <>Agence basée en Suisse, créateurs locaux, contrats conformes au <span className="text-gray-900">Code des Obligations</span> et paiements en CHF.</>
                                },
                                {
                                    headline: 'LPD & RGPD',
                                    text: <>Vos données et briefs sont <span className="text-gray-900">protégés et chiffrés</span>. Conforme à la loi suisse et aux normes européennes.</>
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                >
                                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{item.headline}</h3>
                                    <p className="text-gray-500 leading-relaxed">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Second row — more editorial */}
                        <div className="grid md:grid-cols-3 gap-12 md:gap-16 mt-16 pt-16 border-t border-gray-100">
                            {[
                                {
                                    headline: 'Contrats auto',
                                    text: <>Contrats de mandat et factures <span className="text-gray-900">générés automatiquement</span> avec TVA suisse (8.1%) et cession de droits.</>
                                },
                                {
                                    headline: 'Qualité garantie',
                                    text: <>Chaque créateur est <span className="text-gray-900">vérifié par notre équipe</span>. Révisions incluses dans chaque mission pour un résultat parfait.</>
                                },
                                {
                                    headline: '< 24h',
                                    text: <>Notre équipe <span className="text-gray-900">répond sous 24 heures</span> et vous accompagne à chaque étape de votre projet.</>
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.12 }}
                                >
                                    <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{item.headline}</h3>
                                    <p className="text-gray-500 leading-relaxed">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== FAQ — Clean, minimal accordion ===== */}
                <section className="py-24 md:py-32 px-6 border-t border-gray-200" id="faq">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
                                FAQ
                            </h2>
                            <p className="text-gray-400 text-lg">Les réponses aux questions les plus posées</p>
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
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </motion.div>

                        {/* Accordion */}
                        <div className="divide-y divide-gray-200">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeCategory + searchQuery}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="divide-y divide-gray-200"
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
                                                    <span className={`text-base md:text-lg font-medium transition-colors ${openFAQ === index ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                                                        }`}>
                                                        {item.question}
                                                    </span>
                                                    <motion.div
                                                        animate={{ rotate: openFAQ === index ? 180 : 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="flex-shrink-0 mt-1"
                                                    >
                                                        <ChevronDown className={`w-5 h-5 ${openFAQ === index ? 'text-[#6C3FA0]' : 'text-gray-300'}`} />
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
                                                            <p className="pb-6 text-gray-500 leading-relaxed text-[15px] pr-8">
                                                                {item.answer}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-16 text-gray-400">
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
                <section className="py-24 md:py-32 px-6 border-t border-gray-200" id="contact">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
                            {/* Left — Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                                    Besoin d&apos;aide<br />
                                    <span className="text-gray-400">supplémentaire ?</span>
                                </h2>
                                <p className="text-gray-500 leading-relaxed mb-10 text-lg">
                                    Notre équipe est là pour vous accompagner. Envoyez-nous un message et nous vous répondrons dans les 24 heures.
                                </p>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-8 bg-[#6C3FA0]/40" />
                                        <div>
                                            <p className="text-sm text-gray-400">Email</p>
                                            <a href="mailto:contact@ugcsuisse.ch" className="text-gray-900 hover:text-[#6C3FA0] transition-colors">
                                                contact@ugcsuisse.ch
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-8 bg-[#6C3FA0]/40" />
                                        <div>
                                            <p className="text-sm text-gray-400">Localisation</p>
                                            <p className="text-gray-900">Suisse romande</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-8 bg-[#6C3FA0]/40" />
                                        <div>
                                            <p className="text-sm text-gray-400">Temps de réponse</p>
                                            <p className="text-gray-900">Sous 24 heures</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick links */}
                                <div className="mt-12 pt-8 border-t border-gray-200 space-y-3">
                                    {[
                                        { label: 'Demander un devis', href: '/signup?role=brand' },
                                        { label: 'Rejoindre le réseau créateurs', href: '/signup?role=creator' },
                                    ].map((link) => (
                                        <Link key={link.href} href={link.href} className="flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-colors group text-sm">
                                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Message envoyé</h3>
                                        <p className="text-gray-500 mb-8">
                                            Nous vous répondrons dans les 24 heures.
                                        </p>
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className="text-[#6C3FA0] hover:text-[#6C3FA0]/80 transition-colors font-medium inline-flex items-center gap-2"
                                        >
                                            Envoyer un autre message <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Nom</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={contactForm.name}
                                                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                                    className="w-full bg-transparent border-b border-gray-200 pb-3 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#6C3FA0]/50 transition-colors"
                                                    placeholder="Votre nom"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={contactForm.email}
                                                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full bg-transparent border-b border-gray-200 pb-3 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#6C3FA0]/50 transition-colors"
                                                    placeholder="votre@email.ch"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Sujet</label>
                                            <select
                                                required
                                                value={contactForm.subject}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                                                className="w-full bg-transparent border-b border-gray-200 pb-3 text-gray-900 focus:outline-none focus:border-[#6C3FA0]/50 transition-colors appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-white">Sélectionnez un sujet</option>
                                                <option value="general" className="bg-white">Question générale</option>
                                                <option value="creator" className="bg-white">Aide créateur</option>
                                                <option value="brand" className="bg-white">Aide marque</option>
                                                <option value="technical" className="bg-white">Problème technique</option>
                                                <option value="partnership" className="bg-white">Partenariat</option>
                                                <option value="other" className="bg-white">Autre</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Message</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={contactForm.message}
                                                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                                className="w-full bg-transparent border-b border-gray-200 pb-3 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#6C3FA0]/50 transition-colors resize-none"
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
                <section className="py-24 md:py-32 px-6 border-t border-gray-200">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Prêt à commencer ?
                            </h2>
                            <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
                                Confiez votre contenu UGC à l&apos;agence de référence en Suisse romande.
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
