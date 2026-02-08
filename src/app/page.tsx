'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowRight, Play, Star, Clock } from 'lucide-react'

// Featured creators for the hero grid
const FEATURED_CREATORS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop', name: 'Marie' },
  { id: 2, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', name: 'Lucas' },
  { id: 3, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop', name: 'Sophie' },
  { id: 4, image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop', name: 'Emma' },
  { id: 5, image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop', name: 'Thomas' },
]


const WORKFLOW_STEPS = [
  { step: '01', title: 'Trouvez', description: 'Parcourez notre catalogue de créateurs' },
  { step: '02', title: 'Briefez', description: 'Décrivez votre projet et vos attentes' },
  { step: '03', title: 'Recevez', description: 'Validez et téléchargez vos vidéos' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-white/70">250+ créateurs disponibles</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
                <span className="text-white">Le contenu UGC</span>
                <br />
                <span className="gradient-text">qui convertit</span>
              </h1>

              <p className="text-xl text-white/60 mb-10 max-w-lg">
                Connectez-vous aux meilleurs créateurs de contenu de Suisse romande.
                Des vidéos authentiques pour vos campagnes publicitaires.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/creators" className="btn-primary inline-flex items-center justify-center gap-2">
                  Découvrir les créateurs
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="btn-secondary inline-flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" />
                  Voir la démo
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 mt-12 pt-12 border-t border-white/10">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-white/10 overflow-hidden">
                      <Image
                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                        alt=""
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/50">+500 marques satisfaites</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Creator Grid */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Floating Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {FEATURED_CREATORS.map((creator, index) => (
                    <motion.div
                      key={creator.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      className={`relative aspect-[3/4] rounded-2xl overflow-hidden ${index === 2 ? 'col-span-1 row-span-2' : ''
                        }`}
                      style={{
                        transform: `translateY(${index % 2 === 0 ? '0' : '2rem'})`,
                      }}
                    >
                      <Image
                        src={creator.image}
                        alt={creator.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-medium text-sm">{creator.name}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Floating Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute -bottom-6 -left-6 glass-card px-6 py-4"
                >
                  <p className="text-3xl font-bold text-white">4.9</p>
                  <p className="text-sm text-white/60">Note moyenne</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Clean & Minimal */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              L&apos;UGC est <span className="italic">le</span> format pub
              <br />
              <span className="relative inline-block">
                en 2026.
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 7 Q 50 0, 100 7" stroke="url(#gradient)" strokeWidth="2" fill="none" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF6B6B" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h2>
          </motion.div>

          {/* Stats Grid - No boxes, just text */}
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">93%</h3>
              <p className="text-white/60 leading-relaxed">
                des consommateurs consultent les avis et recommandations de{' '}
                <span className="text-white">vraies personnes</span> avant d&apos;acheter un produit ou service.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">10× plus de vues</h3>
              <p className="text-white/60 leading-relaxed">
                Les contenus UGC attirent <span className="text-white">10 fois plus de vues</span> que les vidéos
                produites en studio par les marques.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">9.8× plus d&apos;impact</h3>
              <p className="text-white/60 leading-relaxed">
                Les consommateurs trouvent le contenu UGC <span className="text-white">9.8× plus percutant</span>{' '}
                que le contenu d&apos;influenceurs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Top Creators of the Month */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Top 4 créateurs du mois
            </h2>
            <p className="text-lg text-white/50">
              Chaque mois, découvrez une sélection de nos talents les plus remarquables.
            </p>
          </motion.div>

          {/* Creators Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Marie D.',
                rating: 4.9,
                reviews: 42,
                location: 'Genève',
                canton: 'GE',
                responseTime: '2h',
                images: [
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=200&fit=crop',
                ],
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Sophie L.',
                rating: 5.0,
                reviews: 56,
                location: 'Lausanne',
                canton: 'VD',
                responseTime: '3h',
                images: [
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=200&fit=crop',
                ],
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Emma R.',
                rating: 5.0,
                reviews: 67,
                location: 'Montreux',
                canton: 'VD',
                responseTime: '2h',
                images: [
                  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=200&fit=crop',
                ],
                avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
              },
              {
                name: 'Léa B.',
                rating: 5.0,
                reviews: 31,
                location: 'Fribourg',
                canton: 'FR',
                responseTime: '4h',
                images: [
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=200&fit=crop',
                ],
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
              },
            ].map((creator, index) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                {/* Image Collage */}
                <div className="relative mb-4">
                  <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden">
                    {/* Main large image */}
                    <div className="col-span-1 row-span-2 relative aspect-[3/4]">
                      <Image
                        src={creator.images[0]}
                        alt={creator.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    {/* Two smaller images */}
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={creator.images[1]}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={creator.images[2]}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10">
                    <Image
                      src={creator.avatar}
                      alt={creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{creator.name}</h3>
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-white">{creator.rating}</span>
                        <span className="text-xs text-white/40">({creator.reviews})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/50 mt-0.5">
                      <span>{creator.location}, {creator.canton}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/40 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Répond en {creator.responseTime}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/creators" className="btn-secondary inline-flex items-center gap-2">
              Voir tous les créateurs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple comme 1, 2, 3
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {WORKFLOW_STEPS.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-8xl font-bold text-white/5 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>

                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 right-0 translate-x-1/2">
                    <ArrowRight className="h-8 w-8 text-white/20" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Clean with floating portraits */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Floating Creator Portraits - Left Side */}
        <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-20 h-28 rounded-2xl overflow-hidden opacity-60 hover:opacity-100 transition-opacity"
          >
            <Image
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=280&fit=crop"
              alt=""
              width={80}
              height={112}
              className="object-cover w-full h-full"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="w-24 h-32 rounded-2xl overflow-hidden opacity-40 hover:opacity-100 transition-opacity ml-8"
          >
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=280&fit=crop"
              alt=""
              width={96}
              height={128}
              className="object-cover w-full h-full"
            />
          </motion.div>
        </div>

        {/* Floating Creator Portraits - Right Side */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="w-24 h-32 rounded-2xl overflow-hidden opacity-40 hover:opacity-100 transition-opacity"
          >
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=280&fit=crop"
              alt=""
              width={96}
              height={128}
              className="object-cover w-full h-full"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="w-20 h-28 rounded-2xl overflow-hidden opacity-60 hover:opacity-100 transition-opacity mr-8"
          >
            <Image
              src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=280&fit=crop"
              alt=""
              width={80}
              height={112}
              className="object-cover w-full h-full"
            />
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Prêt à booster
              <br />
              vos conversions ?
            </h2>
            <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto">
              Rejoignez les marques suisses qui font confiance à nos créateurs
              pour leur contenu publicitaire.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?role=brand" className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4">
                Créer un compte marque
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/signup?role=creator" className="btn-secondary inline-flex items-center justify-center text-lg px-8 py-4">
                Devenir créateur
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">UGC</span>
              <span className="font-bold text-accent">Suisse</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/50">
              <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/terms" className="hover:text-white transition-colors">CGV</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-white/30">
              © 2026 UGC Suisse. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
