'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowRight, ChevronDown, Send, CheckCircle2 } from 'lucide-react'

// ================================================
// MOSH — YOO-Inspired Landing Page
// Lavender palette, floating images, animated badges,
// massive italic typography, scroll-driven energy
// ================================================

type Persona = 'creator' | 'brand'

// Floating creator images
const CREATOR_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face', alt: 'Créatrice mode', style: 'rounded-3xl', w: 220, h: 280 },
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', alt: 'Créateur lifestyle', style: 'rounded-full', w: 160, h: 160 },
  { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face', alt: 'Créatrice beauté', style: 'rounded-3xl', w: 200, h: 260 },
  { src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face', alt: 'Créateur food', style: 'rounded-full', w: 140, h: 140 },
  { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face', alt: 'Créatrice sport', style: 'rounded-3xl', w: 180, h: 240 },
]

// Category badges à la YOO
const CATEGORY_BADGES = [
  { label: 'BEAUTÉ', bg: '#B5E550', text: '#1a1a1a', rotate: -8 },
  { label: 'MODE', bg: '#FF6B35', text: '#fff', rotate: 5 },
  { label: 'FOOD', bg: '#FFFFFF', text: '#1a1a1a', rotate: -3 },
  { label: 'SPORT', bg: '#B5E550', text: '#1a1a1a', rotate: 12 },
  { label: 'ART & CULTURE', bg: '#E84393', text: '#fff', rotate: -6 },
  { label: 'TECHNO', bg: '#E84393', text: '#fff', rotate: 8 },
  { label: 'VOYAGE', bg: '#FFFFFF', text: '#1a1a1a', rotate: -10 },
  { label: 'SANTÉ', bg: '#FF6B35', text: '#fff', rotate: 4 },
  { label: 'FAMILLE', bg: '#B5E550', text: '#1a1a1a', rotate: -5 },
]

const HOW_IT_WORKS = {
  creator: [
    { step: '01', title: 'Inscris-toi', desc: 'Crée ton profil en 30 secondes, ajoute tes réseaux et spécialités.' },
    { step: '02', title: 'Reçois des missions', desc: 'MOSH te propose des collabs adaptées à ton profil.' },
    { step: '03', title: 'Crée ton contenu', desc: 'Suis le brief, produis du contenu authentique.' },
    { step: '04', title: 'Sois payé·e', desc: 'Paiement rapide en CHF, contrats gérés par MOSH.' },
  ],
  brand: [
    { step: '01', title: 'Briefez-nous', desc: 'Décrivez votre produit et vos objectifs.' },
    { step: '02', title: 'On sélectionne', desc: 'MOSH choisit les créateurs parfaits pour vous.' },
    { step: '03', title: 'Production', desc: 'Contenu authentique produit selon votre brief.' },
    { step: '04', title: 'Livraison', desc: 'Recevez vos contenus clé en main. Droits inclus.' },
  ],
}

const FAQ_ITEMS = [
  { q: 'Comment fonctionne MOSH ?', a: 'MOSH est une agence UGC suisse. Briefez-nous, on gère tout : sélection créateurs, production, livraison.' },
  { q: 'Combien ça coûte ?', a: 'Chaque projet est unique. Contactez-nous pour un devis personnalisé.' },
  { q: 'Comment devenir créateur ?', a: 'Inscrivez-vous depuis cette page. Notre équipe vous proposera des missions adaptées.' },
  { q: 'Faut-il beaucoup d\'abonnés ?', a: 'Non ! On cherche de l\'authenticité, pas des millions de followers.' },
]

export default function HomePage() {
  const [persona, setPersona] = useState<Persona>('creator')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #F0E6F6 0%, #EDE4F3 30%, #F5F0FA 60%, #FFFFFF 100%)' }}>
      {/* Navbar */}
      <Navbar />

      {/* Hero — Massive typography + floating images */}
      <HeroSection persona={persona} setPersona={setPersona} />

      {/* Category Badges — Floating animated */}
      <CategoryBadgesSection />

      {/* Stats */}
      <StatsSection />

      {/* How it Works */}
      <HowItWorksSection persona={persona} setPersona={setPersona} />

      {/* Forms — Creator signup / Brand RDV */}
      <FormSection persona={persona} setPersona={setPersona} />

      {/* FAQ */}
      <FaqSection openFaq={openFaq} setOpenFaq={setOpenFaq} />

      {/* Footer */}
      <Footer />
    </div>
  )
}

// ================================================
// NAVBAR — Dark purple like YOO
// ================================================
function Navbar() {
  const { isAuthenticated, user } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl font-black text-gray-900 tracking-tight">
          MOSH
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 px-1 py-1">
          <a href="#form-section" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-gray-900 shadow-sm">
            Créateur
          </a>
          <a href="#form-section" className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Marque
          </a>
          <Link href="/aide" className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Aide
          </Link>
        </div>

        {/* CTA */}
        {mounted && isAuthenticated ? (
          <Link
            href={user?.role === 'admin' ? '/mosh-cockpit' : user?.role === 'brand' ? '/brand/campaigns' : '/creator/missions'}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#6C3FA0] hover:bg-[#5A2D8C] transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#6C3FA0] hover:bg-[#5A2D8C] transition-colors"
          >
            Connexion
          </Link>
        )}
      </div>
    </motion.nav>
  )
}

// ================================================
// HERO SECTION — Massive text + Floating images
// ================================================
function HeroSection({ persona, setPersona }: { persona: Persona; setPersona: (p: Persona) => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -60])

  return (
    <section ref={ref} className="relative pt-32 pb-16 md:pt-44 md:pb-24 px-6 min-h-[90vh] flex flex-col justify-center">
      {/* Floating Creator Images — scattered like YOO */}
      <div className="hidden lg:block">
        {/* Top-left image */}
        <motion.div
          style={{ y: y1 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-[15%] left-[3%] z-20"
        >
          <div className="w-[180px] h-[230px] rounded-3xl overflow-hidden shadow-2xl" style={{ animation: 'floatA 6s ease-in-out infinite' }}>
            <Image src={CREATOR_IMAGES[0].src} alt={CREATOR_IMAGES[0].alt} width={180} height={230} className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Top-right image */}
        <motion.div
          style={{ y: y2 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute top-[10%] right-[5%] z-20"
        >
          <div className="w-[200px] h-[260px] rounded-3xl overflow-hidden shadow-2xl" style={{ animation: 'floatB 7s ease-in-out infinite' }}>
            <Image src={CREATOR_IMAGES[2].src} alt={CREATOR_IMAGES[2].alt} width={200} height={260} className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Middle-left — small round */}
        <motion.div
          style={{ y: y3 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="absolute top-[55%] left-[8%] z-20"
        >
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden shadow-xl" style={{ animation: 'floatC 5s ease-in-out infinite' }}>
            <Image src={CREATOR_IMAGES[1].src} alt={CREATOR_IMAGES[1].alt} width={120} height={120} className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Bottom-right — tall */}
        <motion.div
          style={{ y: y1 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="absolute top-[50%] right-[3%] z-20"
        >
          <div className="w-[160px] h-[200px] rounded-[40px] overflow-hidden shadow-2xl" style={{ animation: 'floatD 8s ease-in-out infinite' }}>
            <Image src={CREATOR_IMAGES[4].src} alt={CREATOR_IMAGES[4].alt} width={160} height={200} className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Center-right small circle */}
        <motion.div
          style={{ y: y2 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="absolute top-[30%] right-[20%] z-10"
        >
          <div className="w-[110px] h-[110px] rounded-full overflow-hidden shadow-lg" style={{ animation: 'floatE 6.5s ease-in-out infinite' }}>
            <Image src={CREATOR_IMAGES[3].src} alt={CREATOR_IMAGES[3].alt} width={110} height={110} className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>

      {/* Text Content — Centered, massive */}
      <div className="relative z-30 text-center max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-[clamp(3rem,8vw,7rem)] font-black leading-[0.95] text-gray-900 mb-6"
        >
          La plateforme{' '}
          <em className="not-italic font-black" style={{ fontStyle: 'italic', color: '#6C3FA0' }}>UGC</em>
        </motion.h1>

        {/* Toggle Switch — YOO style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <span className={`text-lg font-semibold transition-colors ${persona === 'creator' ? 'text-gray-900' : 'text-gray-400'}`}>
            Je suis créateur·rice
          </span>
          <button
            onClick={() => setPersona(persona === 'creator' ? 'brand' : 'creator')}
            className="relative w-14 h-8 rounded-full transition-colors duration-300"
            style={{ backgroundColor: persona === 'creator' ? '#B5E550' : '#6C3FA0' }}
          >
            <motion.div
              layout
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
              style={{ left: persona === 'creator' ? 4 : 'auto', right: persona === 'brand' ? 4 : 'auto' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-lg font-semibold transition-colors ${persona === 'brand' ? 'text-gray-900' : 'text-gray-400'}`}>
            Je suis une marque
          </span>
        </motion.div>

        {/* Subtitle with animation */}
        <motion.h2
          key={persona}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-[clamp(2rem,6vw,5rem)] font-black leading-[1] text-gray-900 mb-8"
        >
          {persona === 'creator' ? (
            <>Pour collaborer avec{' '}
              <em className="not-italic" style={{ fontStyle: 'italic', color: '#6C3FA0' }}>des marques</em>
            </>
          ) : (
            <>Du contenu{' '}
              <em className="not-italic" style={{ fontStyle: 'italic', color: '#6C3FA0' }}>authentique</em>
            </>
          )}
        </motion.h2>

        {/* CTA Button — Purple arrow like YOO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a
            href="#form-section"
            className="inline-flex items-center gap-3 group"
          >
            <span className="w-14 h-14 rounded-full bg-[#6C3FA0] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <ArrowRight className="w-6 h-6 text-white" />
            </span>
            <span className="text-2xl md:text-3xl font-bold text-[#6C3FA0] group-hover:translate-x-1 transition-transform">
              {persona === 'creator' ? 'Rejoins-nous' : 'Prendre rendez-vous'}
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ================================================
// CATEGORY BADGES — Floating, colorful, scattered
// ================================================
function CategoryBadgesSection() {
  return (
    <section className="relative py-24 md:py-36 px-6 overflow-hidden">
      {/* Scattered badges */}
      <div className="absolute inset-0 pointer-events-none">
        {CATEGORY_BADGES.map((badge, i) => {
          // Semi-random positions
          const positions = [
            { top: '8%', left: '12%' },
            { top: '15%', right: '18%' },
            { top: '35%', right: '8%' },
            { top: '55%', right: '15%' },
            { top: '5%', left: '35%' },
            { top: '65%', left: '5%' },
            { top: '75%', left: '30%' },
            { top: '45%', left: '2%' },
            { top: '80%', right: '25%' },
          ]
          const pos = positions[i % positions.length]

          return (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, scale: 0, rotate: badge.rotate * 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: badge.rotate }}
              viewport={{ margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.08, type: 'spring', stiffness: 200 }}
              className="absolute hidden md:block"
              style={pos}
            >
              <div
                className="px-5 py-2.5 rounded-full text-sm font-bold shadow-lg whitespace-nowrap"
                style={{
                  backgroundColor: badge.bg,
                  color: badge.text,
                  transform: `rotate(${badge.rotate}deg)`,
                  border: badge.bg === '#FFFFFF' ? '2px solid #e5e7eb' : 'none',
                  animation: `badgeFloat ${4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
                }}
              >
                {badge.label}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile badges - horizontal scroll */}
      <div className="md:hidden flex flex-wrap justify-center gap-3 mb-10">
        {CATEGORY_BADGES.map((badge, i) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ margin: '-20px' }}
            transition={{ delay: i * 0.05, type: 'spring' }}
          >
            <div
              className="px-4 py-2 rounded-full text-xs font-bold shadow-md"
              style={{
                backgroundColor: badge.bg,
                color: badge.text,
                transform: `rotate(${badge.rotate}deg)`,
                border: badge.bg === '#FFFFFF' ? '2px solid #e5e7eb' : 'none',
              }}
            >
              {badge.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Big text */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ margin: '-80px' }}
        transition={{ duration: 0.7 }}
        className="relative z-10 text-center max-w-5xl mx-auto"
      >
        <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[1] text-gray-900">
          Dans ton secteur{' '}
          <em className="not-italic" style={{ fontStyle: 'italic', color: '#6C3FA0' }}>d&apos;activité</em>
        </h2>
      </motion.div>
    </section>
  )
}

// ================================================
// STATS SECTION — "+250 créateurs" like YOO's +100K
// ================================================
function StatsSection() {
  return (
    <section className="py-20 md:py-28 px-6 relative">
      {/* Floating images alongside stats */}
      <div className="hidden lg:block">
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="absolute right-[5%] top-[10%]"
        >
          <div className="w-[200px] h-[260px] rounded-[40px] overflow-hidden shadow-2xl">
            <Image src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face" alt="Créatrice" width={200} height={260} className="w-full h-full object-cover" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 80, y: 40 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute right-[15%] top-[50%]"
        >
          <div className="w-[150px] h-[150px] rounded-full overflow-hidden shadow-xl">
            <Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face" alt="Créateur" width={150} height={150} className="w-full h-full object-cover" />
          </div>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-black text-gray-900 leading-tight mb-4">
            On est déjà{' '}
            <span className="text-[#6C3FA0]">+250</span>
            <br />
            créateurs de contenu
          </h2>
          <a
            href="#form-section"
            className="inline-flex items-center gap-3 group mt-4"
          >
            <span className="w-12 h-12 rounded-full bg-[#6C3FA0] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl md:text-2xl font-bold text-[#6C3FA0] group-hover:translate-x-1 transition-transform">
              Rejoins-nous
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ================================================
// HOW IT WORKS — Steps per persona
// ================================================
function HowItWorksSection({ persona, setPersona }: { persona: Persona; setPersona: (p: Persona) => void }) {
  const steps = HOW_IT_WORKS[persona]

  return (
    <section className="py-24 md:py-32 px-6" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 20%)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-80px' }}
          className="mb-16"
        >
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black text-gray-900 mb-6">
            Comment ça{' '}
            <em style={{ fontStyle: 'italic', color: '#6C3FA0' }}>marche ?</em>
          </h2>

          {/* Toggle */}
          <div className="flex items-center gap-4">
            <span className={`text-base font-semibold transition-colors ${persona === 'creator' ? 'text-gray-900' : 'text-gray-400'}`}>
              Créateur
            </span>
            <button
              onClick={() => setPersona(persona === 'creator' ? 'brand' : 'creator')}
              className="relative w-12 h-7 rounded-full transition-colors duration-300"
              style={{ backgroundColor: persona === 'creator' ? '#B5E550' : '#6C3FA0' }}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                style={{ left: persona === 'creator' ? 2 : 'auto', right: persona === 'brand' ? 2 : 'auto' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-base font-semibold transition-colors ${persona === 'brand' ? 'text-gray-900' : 'text-gray-400'}`}>
              Marque
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={`${persona}-${step.step}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative"
            >
              <div className="text-6xl font-black text-[#6C3FA0]/10 mb-3">{step.step}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ================================================
// FORM SECTION — Creator signup / Brand RDV
// ================================================
function FormSection({ persona, setPersona }: { persona: Persona; setPersona: (p: Persona) => void }) {
  return (
    <section id="form-section" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ margin: '-80px' }}
          className="text-center mb-12"
        >
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black text-gray-900 mb-4">
            {persona === 'creator' ? (
              <>Prêt·e à <em style={{ fontStyle: 'italic', color: '#6C3FA0' }}>créer</em> ?</>
            ) : (
              <>Parlons de votre <em style={{ fontStyle: 'italic', color: '#6C3FA0' }}>projet</em></>
            )}
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-semibold transition-colors ${persona === 'creator' ? 'text-gray-900' : 'text-gray-400'}`}>
              Créateur
            </span>
            <button
              onClick={() => setPersona(persona === 'creator' ? 'brand' : 'creator')}
              className="relative w-12 h-7 rounded-full transition-colors duration-300"
              style={{ backgroundColor: persona === 'creator' ? '#B5E550' : '#6C3FA0' }}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                style={{ left: persona === 'creator' ? 2 : 'auto', right: persona === 'brand' ? 2 : 'auto' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-semibold transition-colors ${persona === 'brand' ? 'text-gray-900' : 'text-gray-400'}`}>
              Marque
            </span>
          </div>
        </motion.div>

        {persona === 'creator' ? <CreatorSignupForm /> : <BrandContactForm />}
      </div>
    </section>
  )
}

// ================================================
// CREATOR SIGNUP FORM
// ================================================
function CreatorSignupForm() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signUp(form.email, form.password, form.fullName, 'creator')
      if (result.error) { setError(result.error) }
      else { router.push('/creator/missions') }
    } catch { setError('Erreur. Réessayez.') }
    finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl border-2 border-gray-100 p-8 md:p-12 shadow-xl max-w-lg mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Nom complet</label>
          <input
            type="text" required value={form.fullName}
            onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors text-base"
            placeholder="Ton nom et prénom"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors text-base"
            placeholder="ton@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Mot de passe</label>
          <input
            type="password" required minLength={6} value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors text-base"
            placeholder="Minimum 6 caractères"
          />
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-4 rounded-full text-white font-bold text-lg bg-[#6C3FA0] hover:bg-[#5A2D8C] transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Créer mon compte <ArrowRight className="w-5 h-5" /></>}
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-6">
        Déjà inscrit ? <Link href="/login" className="text-[#6C3FA0] font-semibold hover:underline">Se connecter</Link>
      </p>
    </motion.div>
  )
}

// ================================================
// BRAND CONTACT FORM
// ================================================
function BrandContactForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ company: '', fullName: '', email: '', phone: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      await (supabase.from('brand_requests') as ReturnType<typeof supabase.from>).insert({
        company_name: form.company,
        contact_name: form.fullName,
        email: form.email,
        phone: form.phone || null,
        message: form.message || null,
        status: 'new',
      })

      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin')
      if (admins && admins.length > 0) {
        const { createNotification } = await import('@/lib/services/notificationService')
        for (const admin of admins as { id: string }[]) {
          await createNotification(admin.id, 'new_application', 'Nouvelle demande marque', `${form.company} (${form.fullName}) souhaite prendre RDV`, undefined, 'brand_request')
        }
      }
      setSent(true)
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border-2 border-gray-100 p-8 md:p-12 shadow-xl max-w-lg mx-auto text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyée !</h3>
        <p className="text-gray-500">Notre équipe vous contacte dans les 24h.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl border-2 border-gray-100 p-8 md:p-12 shadow-xl max-w-lg mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Entreprise</label>
            <input type="text" required value={form.company}
              onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors"
              placeholder="Votre entreprise" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Nom complet</label>
            <input type="text" required value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors"
              placeholder="Votre nom" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors"
              placeholder="email@entreprise.ch" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Téléphone</label>
            <input type="tel" value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors"
              placeholder="+41 79 ..." />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Votre projet</label>
          <textarea rows={3} value={form.message}
            onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6C3FA0] transition-colors resize-none"
            placeholder="Décrivez votre besoin en contenu UGC..." />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-4 rounded-full text-white font-bold text-lg bg-[#6C3FA0] hover:bg-[#5A2D8C] transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5" /> Envoyer ma demande</>}
        </button>
      </form>
    </motion.div>
  )
}

// ================================================
// FAQ
// ================================================
function FaqSection({ openFaq, setOpenFaq }: { openFaq: number | null; setOpenFaq: (i: number | null) => void }) {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[clamp(2rem,4vw,3.5rem)] font-black text-gray-900 mb-12"
        >
          Questions <em style={{ fontStyle: 'italic', color: '#6C3FA0' }}>fréquentes</em>
        </motion.h2>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span className="font-bold text-gray-900 pr-4">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                  <p className="px-5 py-4 text-gray-500 leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ================================================
// FOOTER
// ================================================
function Footer() {
  return (
    <footer className="py-12 px-6 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="text-xl font-black">MOSH</span>
        <div className="flex gap-8 text-sm text-white/60">
          <Link href="/aide" className="hover:text-white transition-colors">Aide</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/terms" className="hover:text-white transition-colors">CGV</Link>
        </div>
        <p className="text-sm text-white/40">© 2026 MOSH · Suisse</p>
      </div>
    </footer>
  )
}
