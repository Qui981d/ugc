'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, Sparkles } from 'lucide-react'
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
            <div>
                <h1 className="text-3xl font-bold text-white">Répertoire créateurs</h1>
                <p className="text-white/50 mt-1">{creators.length} créateur{creators.length > 1 ? 's' : ''} inscrits</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    placeholder="Rechercher par nom, canton, spécialité..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                />
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-white/40">Chargement...</div>
            ) : filteredCreators.length === 0 ? (
                <div className="text-center py-12 text-white/40">Aucun créateur trouvé</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCreators.map((creator, i) => (
                        <motion.div
                            key={creator.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-5 hover:border-white/20 transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/30 to-purple-500/30 flex items-center justify-center text-white text-lg font-bold shrink-0">
                                    {creator.full_name?.[0] || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold truncate">{creator.full_name}</h3>
                                    <p className="text-white/40 text-sm truncate">{creator.email}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                                {creator.profiles_creator?.location_canton && (
                                    <div className="flex items-center gap-2 text-white/50">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {creator.profiles_creator.location_canton}
                                    </div>
                                )}
                                {creator.profiles_creator?.specialties?.length ? (
                                    <div className="flex items-center gap-2 text-white/50">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <div className="flex flex-wrap gap-1">
                                            {creator.profiles_creator.specialties.slice(0, 3).map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-white/5 rounded-full text-xs">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {creator.profiles_creator?.languages?.length ? (
                                    <div className="flex items-center gap-2 text-white/50">
                                        <span className="text-xs">🌐</span>
                                        <span className="text-xs">{creator.profiles_creator.languages.join(', ')}</span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white/30">
                                    Inscrit le {new Date(creator.created_at).toLocaleDateString('fr-CH')}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
