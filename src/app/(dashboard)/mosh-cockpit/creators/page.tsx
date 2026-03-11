'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Search, MapPin, Sparkles, Star, Plus, LinkIcon, Copy, Check, Trash2, Clock, CheckCircle2, X, Loader2 } from 'lucide-react'
import { getAllCreators, getInvitations, createInvitation, revokeInvitation, type CreatorWithProfile, type InvitationData } from '@/lib/services/adminService'
import { toast } from 'sonner'

type Tab = 'registered' | 'invitations'

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<CreatorWithProfile[]>([])
    const [invitations, setInvitations] = useState<InvitationData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState<Tab>('registered')
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            const [registered, invites] = await Promise.all([
                getAllCreators(),
                getInvitations(),
            ])
            setCreators(registered)
            setInvitations(invites)
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

    const handleCreateInvitation = async () => {
        setIsCreating(true)
        const result = await createInvitation(inviteEmail.trim() || undefined)
        if (result.success && result.code) {
            const updated = await getInvitations()
            setInvitations(updated)
            setShowInviteModal(false)
            const link = `${window.location.origin}/signup?role=creator&invite=${result.code}`
            await navigator.clipboard.writeText(link)

            if (inviteEmail.trim()) {
                // Open email client with pre-filled invitation
                const subject = encodeURIComponent('Invitation à rejoindre Mosh')
                const body = encodeURIComponent(
                    `Bonjour,\n\nVous êtes invité(e) à rejoindre Mosh en tant que créateur UGC.\n\nCliquez sur ce lien pour créer votre compte :\n${link}\n\nCe lien est valide pendant 30 jours.\n\nÀ bientôt,\nL'équipe Mosh`
                )
                window.open(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`, '_blank')
                toast.success('Lien copié et email ouvert !')
            } else {
                toast.success('Lien d\'invitation copié !')
            }
            setInviteEmail('')
        } else {
            toast.error(result.error || 'Erreur lors de la création')
        }
        setIsCreating(false)
    }

    const handleCopyLink = async (code: string) => {
        const link = `${window.location.origin}/signup?role=creator&invite=${code}`
        await navigator.clipboard.writeText(link)
        setCopiedCode(code)
        toast.success('Lien copié !')
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const handleRevoke = async (id: string) => {
        const result = await revokeInvitation(id)
        if (result.success) {
            setInvitations(prev => prev.filter(i => i.id !== id))
            toast.success('Invitation supprimée')
        }
    }

    const pendingInvites = invitations.filter(i => !i.used_at)
    const usedInvites = invitations.filter(i => i.used_at)

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Répertoire créateurs</h1>
                    <p className="text-[#71717A] mt-1">
                        {creators.length} créateur{creators.length > 1 ? 's' : ''} inscrit{creators.length > 1 ? 's' : ''} · {pendingInvites.length} invitation{pendingInvites.length > 1 ? 's' : ''} en attente
                    </p>
                </div>
                {activeTab === 'invitations' && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Générer un lien
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
                    Créateurs
                    <span className="ml-2 text-xs bg-[#C4F042]/20 text-[#18181B] px-1.5 py-0.5 rounded-full">{creators.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('invitations')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'invitations'
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#71717A] hover:text-[#18181B]'
                    }`}
                >
                    Invitations
                    {pendingInvites.length > 0 && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{pendingInvites.length}</span>
                    )}
                </button>
            </div>

            {/* Search (only for registered) */}
            {activeTab === 'registered' && (
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
            )}

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
                                            <h3 className="text-[#18181B] font-semibold truncate">{creator.full_name}</h3>
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
                /* ─── Invitations ─── */
                <div className="space-y-6">
                    {/* Pending invitations */}
                    {pendingInvites.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-[#71717A] uppercase tracking-wider">En attente</h2>
                            {pendingInvites.map((invite, i) => {
                                const isExpired = invite.expires_at && new Date(invite.expires_at) < new Date()
                                return (
                                    <motion.div
                                        key={invite.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5 flex items-center gap-4"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-50' : 'bg-amber-50'}`}>
                                            {isExpired ? (
                                                <Clock className="w-5 h-5 text-red-400" />
                                            ) : (
                                                <LinkIcon className="w-5 h-5 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm font-mono font-semibold text-[#18181B] tracking-wider">{invite.code}</code>
                                                {isExpired && (
                                                    <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-red-50 text-red-500">Expiré</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#A1A1AA] mt-0.5">
                                                {invite.label && <span className="text-[#71717A]">{invite.label} · </span>}
                                                Créé le {new Date(invite.created_at).toLocaleDateString('fr-CH')}
                                                {invite.expires_at && ` · Expire le ${new Date(invite.expires_at).toLocaleDateString('fr-CH')}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!isExpired && (
                                                <button
                                                    onClick={() => handleCopyLink(invite.code)}
                                                    className="w-9 h-9 rounded-lg bg-[#F4F3EF] flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#C4F042]/20 transition-all"
                                                    title="Copier le lien"
                                                >
                                                    {copiedCode === invite.code ? (
                                                        <Check className="w-4 h-4 text-[#C4F042]" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRevoke(invite.id)}
                                                className="w-9 h-9 rounded-lg bg-[#F4F3EF] flex items-center justify-center text-[#A1A1AA] hover:bg-red-50 hover:text-red-500 transition-all"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}

                    {/* Used invitations */}
                    {usedInvites.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-[#71717A] uppercase tracking-wider">Utilisées</h2>
                            {usedInvites.map((invite, i) => (
                                <motion.div
                                    key={invite.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[20px] p-5 flex items-center gap-4 opacity-70"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#C4F042]/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-[#C4F042]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono font-semibold text-[#18181B] tracking-wider">{invite.code}</code>
                                            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-[#C4F042]/10 text-[#18181B]">Utilisée</span>
                                        </div>
                                        <p className="text-xs text-[#A1A1AA] mt-0.5">
                                            {invite.label && <span className="text-[#71717A]">{invite.label} · </span>}
                                            Utilisée par <span className="text-[#18181B] font-medium">{invite.used_by_user?.full_name || 'Inconnu'}</span>
                                            {invite.used_at && ` le ${new Date(invite.used_at).toLocaleDateString('fr-CH')}`}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {invitations.length === 0 && (
                        <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#F4F3EF] flex items-center justify-center mx-auto mb-4">
                                <LinkIcon className="w-7 h-7 text-[#A1A1AA]" strokeWidth={1.5} />
                            </div>
                            <p className="text-[#71717A] font-medium">Aucune invitation</p>
                            <p className="text-[#A1A1AA] text-sm mt-1 max-w-[300px] mx-auto">
                                Générez des liens d&apos;invitation pour que les créateurs puissent s&apos;inscrire sur la plateforme
                            </p>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="mt-4 px-4 py-2 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Générer un lien
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Generate Invitation Modal ─── */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowInviteModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-md"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04]">
                                <h2 className="text-lg font-semibold text-[#18181B]">Nouveau lien d&apos;invitation</h2>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-8 h-8 rounded-lg bg-[#F4F3EF] flex items-center justify-center text-[#A1A1AA] hover:text-[#18181B] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Email du créateur</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="createur@email.com"
                                        className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/50"
                                    />
                                    <p className="text-xs text-[#A1A1AA] mt-1.5">Le lien sera valide 30 jours et utilisable une seule fois</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-black/[0.04] flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2.5 text-sm text-[#71717A] hover:text-[#18181B] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateInvitation}
                                    disabled={isCreating}
                                    className="px-5 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                                    {inviteEmail.trim() ? 'Générer et envoyer' : 'Générer le lien'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
