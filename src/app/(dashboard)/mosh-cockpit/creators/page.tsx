'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search, MapPin, Sparkles, Star, Plus, Phone, Mail, Instagram, X, Loader2, Trash2, FileText } from 'lucide-react'
import { getAllCreators, getDirectoryCreators, addDirectoryCreator, deleteDirectoryCreator, type CreatorWithProfile, type DirectoryCreator } from '@/lib/services/adminService'

type Tab = 'registered' | 'directory'


export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<CreatorWithProfile[]>([])
    const [directoryCreators, setDirectoryCreators] = useState<DirectoryCreator[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<Tab>('registered')
    const [showAddModal, setShowAddModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        nationality: '',
        video_rate_chf: '',
        specialties: '' as string,
        languages: '' as string,
        instagram_url: '',
        tiktok_url: '',
        notes: '',
    })

    useEffect(() => {
        async function load() {
            const [registered, directory] = await Promise.all([
                getAllCreators(),
                getDirectoryCreators(),
            ])
            setCreators(registered)
            setDirectoryCreators(directory)
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

    const filteredDirectory = directoryCreators.filter(c =>
        !searchQuery ||
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nationality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const handleSubmit = async () => {
        if (!formData.full_name.trim()) return
        setIsSubmitting(true)
        const result = await addDirectoryCreator({
            full_name: formData.full_name.trim(),
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            nationality: formData.nationality.trim() || undefined,
            video_rate_chf: formData.video_rate_chf ? parseFloat(formData.video_rate_chf) : undefined,
            specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            instagram_url: formData.instagram_url.trim() || undefined,
            tiktok_url: formData.tiktok_url.trim() || undefined,
            notes: formData.notes.trim() || undefined,
        })
        if (result.success) {
            const updated = await getDirectoryCreators()
            setDirectoryCreators(updated)
            setShowAddModal(false)
            setFormData({ full_name: '', email: '', phone: '', nationality: '', video_rate_chf: '', specialties: '', languages: '', instagram_url: '', tiktok_url: '', notes: '' })
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        const result = await deleteDirectoryCreator(id)
        if (result.success) {
            setDirectoryCreators(prev => prev.filter(c => c.id !== id))
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Répertoire créateurs</h1>
                    <p className="text-[#71717A] mt-1">
                        {creators.length} inscrit{creators.length > 1 ? 's' : ''} · {directoryCreators.length} répertoire
                    </p>
                </div>
                {activeTab === 'directory' && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Ajouter un créateur
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#F4F3EF] rounded-2xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('registered')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'registered'
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                >
                    Inscrits
                    <span className="ml-2 text-xs bg-[#C4F042]/20 text-[#18181B] px-1.5 py-0.5 rounded-full">{creators.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('directory')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'directory'
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                >
                    Répertoire Mosh
                    <span className="ml-2 text-xs bg-[#18181B]/10 text-[#71717A] px-1.5 py-0.5 rounded-full">{directoryCreators.length}</span>
                </button>
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

            {/* Content */}
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
            ) : activeTab === 'registered' ? (
                /* ─── Registered Creators ─── */
                filteredCreators.length === 0 ? (
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
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[#18181B] font-semibold truncate">{creator.full_name}</h3>
                                                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-[#C4F042]/20 text-[#18181B]">
                                                    Inscrit
                                                </span>
                                            </div>
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
                )
            ) : (
                /* ─── Directory Creators ─── */
                filteredDirectory.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#F4F3EF] flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-7 h-7 text-[#A1A1AA]" strokeWidth={1.5} />
                        </div>
                        <p className="text-[#71717A] font-medium">Aucun créateur dans le répertoire</p>
                        <p className="text-[#A1A1AA] text-sm mt-1 max-w-[280px] mx-auto">
                            Ajoutez vos créateurs externes pour les retrouver facilement
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 px-4 py-2 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un créateur
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredDirectory.map((creator, i) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <div className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-6 hover:shadow-md transition-all group relative">
                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDelete(creator.id)}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#F4F3EF] flex items-center justify-center text-[#A1A1AA] hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#18181B]/5 flex items-center justify-center text-[#71717A] text-lg font-bold shrink-0">
                                            {creator.full_name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[#18181B] font-semibold truncate">{creator.full_name}</h3>
                                                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-[#18181B]/5 text-[#71717A]">
                                                    Répertoire
                                                </span>
                                            </div>
                                            {creator.email && (
                                                <p className="text-[#A1A1AA] text-sm truncate">{creator.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2 text-sm">
                                        {creator.phone && (
                                            <div className="flex items-center gap-2 text-[#71717A]">
                                                <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                {creator.phone}
                                            </div>
                                        )}
                                        {creator.nationality && (
                                            <div className="flex items-center gap-2 text-[#71717A]">
                                                <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                {creator.nationality}
                                            </div>
                                        )}
                                        {creator.video_rate_chf && (
                                            <div className="flex items-center gap-2 text-[#71717A]">
                                                <span className="text-xs font-medium">💰 CHF {creator.video_rate_chf} / vidéo</span>
                                            </div>
                                        )}
                                        {creator.specialties?.length ? (
                                            <div className="flex items-center gap-2 text-[#71717A]">
                                                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                <div className="flex flex-wrap gap-1">
                                                    {creator.specialties.slice(0, 3).map(s => (
                                                        <span key={s} className="px-2 py-0.5 bg-[#F4F3EF] rounded-full text-xs text-[#18181B]">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                        {(creator.instagram_url || creator.tiktok_url) && (
                                            <div className="flex items-center gap-3 text-[#71717A]">
                                                {creator.instagram_url && (
                                                    <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs hover:text-[#18181B] transition-colors">
                                                        <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                        Instagram
                                                    </a>
                                                )}
                                                {creator.tiktok_url && (
                                                    <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs hover:text-[#18181B] transition-colors">
                                                        🎵 TikTok
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {creator.notes && (
                                            <div className="flex items-start gap-2 text-[#A1A1AA]">
                                                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
                                                <p className="text-xs line-clamp-2">{creator.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-black/[0.04]">
                                        <span className="text-xs text-[#A1A1AA]">
                                            Ajouté le {new Date(creator.created_at).toLocaleDateString('fr-CH')}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            )}

            {/* ─── Add Creator Modal ─── */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04]">
                                <h2 className="text-lg font-semibold text-[#18181B]">Ajouter un créateur</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="w-8 h-8 rounded-lg bg-[#F4F3EF] flex items-center justify-center text-[#A1A1AA] hover:text-[#18181B] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="px-6 py-5 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Nom complet *</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        placeholder="Prénom Nom"
                                        className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                    />
                                </div>

                                {/* Email + Phone */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1AA]" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="email@..."
                                                className="w-full pl-9 pr-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1AA]" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="+41..."
                                                className="w-full pl-9 pr-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Nationality + Video Rate */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Nationalité</label>
                                        <input
                                            type="text"
                                            value={formData.nationality}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                                            placeholder="Suisse, Française..."
                                            className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Prix par vidéo (CHF)</label>
                                        <input
                                            type="number"
                                            value={formData.video_rate_chf}
                                            onChange={(e) => setFormData(prev => ({ ...prev, video_rate_chf: e.target.value }))}
                                            placeholder="250"
                                            className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                        />
                                    </div>
                                </div>

                                {/* Specialties + Languages */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Spécialités</label>
                                        <input
                                            type="text"
                                            value={formData.specialties}
                                            onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                                            placeholder="unboxing, asmr..."
                                            className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Langues</label>
                                        <input
                                            type="text"
                                            value={formData.languages}
                                            onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
                                            placeholder="FR, EN, DE..."
                                            className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                        />
                                    </div>
                                </div>

                                {/* Social links */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Instagram</label>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1AA]" />
                                            <input
                                                type="url"
                                                value={formData.instagram_url}
                                                onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                                                placeholder="https://instagram.com/..."
                                                className="w-full pl-9 pr-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">TikTok</label>
                                        <input
                                            type="url"
                                            value={formData.tiktok_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tiktok_url: e.target.value }))}
                                            placeholder="https://tiktok.com/@..."
                                            className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Notes internes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Notes pour l'équipe Mosh..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 border-t border-black/[0.04] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2.5 text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.full_name.trim() || isSubmitting}
                                    className="px-5 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Ajouter
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
