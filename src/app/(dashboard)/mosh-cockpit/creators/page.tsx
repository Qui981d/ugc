'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, MapPin, Sparkles, Star, CheckCircle2, Clock } from 'lucide-react'
import { getAllCreators, type CreatorWithProfile } from '@/lib/services/adminService'

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<CreatorWithProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        async function load() {
            const data = await getAllCreators()
            setCreators(data)
            setIsLoading(false)
        }
        load()
    }, [])

    const filteredCreators = creators.filter(c =>
        !searchQuery ||
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profiles_creator?.location_canton?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profiles_creator?.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Répertoire créateurs</h1>
                <p className="text-[#71717A] mt-1">{creators.length} créateur{creators.length > 1 ? 's' : ''} inscrits</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A099]" strokeWidth={1.5} />
                <input
                    type="text"
                    placeholder="Rechercher par nom, canton, spécialité..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#D9D7D0]/50 border border-[#C8C6BF]/40 rounded-2xl text-sm text-[#18181B] placeholder:text-[#A1A099] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/60 focus:bg-white/60 transition-all"
                />
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-[24px] p-6 border border-black/[0.03] animate-pulse">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#F4F3EF]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-[#F4F3EF] rounded w-2/3" />
                                    <div className="h-3 bg-[#F4F3EF] rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCreators.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                    <p className="text-[#71717A] font-medium">Aucun créateur trouvé</p>
                    <p className="text-[#A1A1AA] text-sm mt-1">Essayez un autre terme de recherche</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCreators.map((creator, i) => (
                        <motion.div
                            key={creator.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Link
                                href={`/mosh-cockpit/creators/${creator.id}`}
                                className="block bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6 hover:shadow-md hover:border-[#C4F042]/30 transition-all group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#C4F042]/20 flex items-center justify-center text-[#18181B] text-lg font-bold shrink-0 group-hover:bg-[#C4F042]/30 transition-colors">
                                        {creator.full_name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[#18181B] font-semibold truncate group-hover:text-[#18181B]">{creator.full_name}</h3>
                                        <p className="text-[#A1A1AA] text-sm truncate">{creator.email}</p>
                                    </div>
                                    {creator.profiles_creator?.is_available && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#C4F042] ring-2 ring-[#C4F042]/20 flex-shrink-0 mt-1.5" />
                                    )}
                                </div>

                                <div className="mt-4 space-y-2 text-sm">
                                    {creator.profiles_creator?.location_canton && (
                                        <div className="flex items-center gap-2 text-[#71717A]">
                                            <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            {creator.profiles_creator.location_canton}
                                        </div>
                                    )}
                                    {creator.profiles_creator?.specialties?.length ? (
                                        <div className="flex items-center gap-2 text-[#71717A]">
                                            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            <div className="flex flex-wrap gap-1">
                                                {creator.profiles_creator.specialties.slice(0, 3).map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-[#F4F3EF] rounded-full text-xs text-[#18181B]">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {creator.profiles_creator?.languages?.length ? (
                                        <div className="flex items-center gap-2 text-[#71717A]">
                                            <span className="text-xs">🌐</span>
                                            <span className="text-xs">{creator.profiles_creator.languages.join(', ')}</span>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between">
                                    <span className="text-xs text-[#A1A1AA]">
                                        Inscrit le {new Date(creator.created_at).toLocaleDateString('fr-CH')}
                                    </span>
                                    {creator.profiles_creator?.rating_avg ? (
                                        <div className="flex items-center gap-1 text-xs text-[#71717A]">
                                            <Star className="w-3 h-3 fill-[#C4F042] text-[#C4F042]" />
                                            {creator.profiles_creator.rating_avg.toFixed(1)}
                                        </div>
                                    ) : null}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
