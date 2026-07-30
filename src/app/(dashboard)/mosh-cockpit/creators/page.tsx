'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, Users, Star, Plus, LinkIcon, Copy, Check, Trash2, ArrowRight, X, Loader2, MessageCircle, Mail } from 'lucide-react'
import { getAllCreators, getInvitations, createInvitation, revokeInvitation, type CreatorWithProfile, type InvitationData } from '@/lib/services/adminService'
import { toast } from 'sonner'
import { PageHeader, Tabs, StatusPill, EmptyState } from '@/components/ui/workspace'

type Tab = 'registered' | 'invitations'

const TH = 'text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5'
const ICON_BTN = 'w-8 h-8 rounded-lg border border-[#E2E2E1] bg-white flex items-center justify-center text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors'

export default function AdminCreatorsPage() {
    const router = useRouter()
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
            await navigator.clipboard.writeText(inviteLink(result.code))
            toast.success('Lien copié ! Partage-le via Copier, WhatsApp ou Email.')
            setInviteEmail('')
        } else {
            toast.error(result.error || 'Erreur lors de la création')
        }
        setIsCreating(false)
    }

    const inviteLink = (code: string) => `${window.location.origin}/signup?role=creator&invite=${code}`

    const inviteMessage = (code: string) =>
        `Bonjour,\n\nVous êtes invité(e) à rejoindre MOSH en tant que créateur UGC.\n\nCréez votre compte ici :\n${inviteLink(code)}\n\nCe lien est valable 30 jours.\n\nÀ bientôt,\nL'équipe MOSH`

    const handleCopyLink = async (code: string) => {
        await navigator.clipboard.writeText(inviteLink(code))
        setCopiedCode(code)
        toast.success('Lien copié !')
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const handleShareWhatsApp = (code: string) => {
        window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage(code))}`, '_blank')
    }

    const handleShareEmail = (code: string) => {
        const subject = encodeURIComponent('Invitation à rejoindre MOSH')
        window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(inviteMessage(code))}`, '_blank')
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
    const orderedInvites = [...pendingInvites, ...usedInvites]

    const resultCount = activeTab === 'registered' ? filteredCreators.length : invitations.length

    const generateButton = (
        <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors shrink-0"
        >
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Générer un lien
        </button>
    )

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Créateurs"
                description={`${creators.length} créateur${creators.length > 1 ? 's' : ''} inscrit${creators.length > 1 ? 's' : ''} · ${pendingInvites.length} invitation${pendingInvites.length > 1 ? 's' : ''} en attente`}
                actions={activeTab === 'invitations' ? generateButton : undefined}
            >
                <Tabs
                    tabs={[
                        { id: 'registered', label: 'Créateurs', count: creators.length },
                        { id: 'invitations', label: 'Invitations', count: pendingInvites.length },
                    ]}
                    active={activeTab}
                    onChange={(id) => setActiveTab(id as Tab)}
                />
            </PageHeader>

            {/* Toolbar — bare controls above the surface */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {activeTab === 'registered' && (
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" strokeWidth={1.8} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, canton, spécialité…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/15 transition-colors"
                        />
                    </div>
                )}
                <span className="text-[12px] text-[#9B9B9B] tabular-nums ml-auto">
                    {activeTab === 'registered'
                        ? `${resultCount} créateur${resultCount > 1 ? 's' : ''}`
                        : `${resultCount} invitation${resultCount > 1 ? 's' : ''}`}
                </span>
            </div>

            {/* One dense surface */}
            <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="divide-y divide-[#E2E2E1]">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/4" />
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/6 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'registered' ? (
                    filteredCreators.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="Aucun créateur"
                            description={searchQuery ? 'Aucun résultat pour cette recherche.' : 'Les créateurs inscrits apparaîtront ici.'}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-[#E2E2E1]">
                                        <th className={TH}>Créateur</th>
                                        <th className={`${TH} hidden md:table-cell`}>Canton</th>
                                        <th className={`${TH} hidden lg:table-cell`}>Spécialités</th>
                                        <th className={`${TH} hidden xl:table-cell`}>Langues</th>
                                        <th className={TH}>Statut</th>
                                        <th className={`${TH} text-right hidden sm:table-cell`}>Note</th>
                                        <th className={`${TH} hidden xl:table-cell`}>Inscription</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E2E1]">
                                    {filteredCreators.map((creator) => {
                                        const p = creator.profiles_creator
                                        return (
                                            <tr
                                                key={creator.id}
                                                onClick={() => router.push(`/mosh-cockpit/creators/${creator.id}`)}
                                                className="hover:bg-[#FAFAF9] cursor-pointer transition-colors group"
                                            >
                                                <td className="px-4 py-2.5 max-w-[280px]">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-[#EDEDEC] text-[#1A1A1A] text-[12px] font-semibold flex items-center justify-center shrink-0">
                                                            {creator.full_name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block font-medium text-[#1A1A1A] truncate">{creator.full_name}</span>
                                                            <span className="block text-[12px] text-[#9B9B9B] truncate">{creator.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden md:table-cell whitespace-nowrap">
                                                    {p?.location_canton || '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden lg:table-cell max-w-[220px]">
                                                    <span className="block truncate">
                                                        {p?.specialties?.length ? p.specialties.slice(0, 3).join(' · ') : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden xl:table-cell max-w-[160px]">
                                                    <span className="block truncate">{p?.languages?.length ? p.languages.join(', ') : '—'}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {p?.is_available
                                                        ? <StatusPill tone="done">Disponible</StatusPill>
                                                        : <StatusPill tone="idle">Indisponible</StatusPill>}
                                                </td>
                                                <td className="px-4 py-2.5 text-right hidden sm:table-cell whitespace-nowrap tabular-nums text-[#1A1A1A]">
                                                    {p?.rating_avg ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-[#1A1A1A] text-[#1A1A1A]" />
                                                            {p.rating_avg.toFixed(1)}
                                                        </span>
                                                    ) : <span className="text-[#9B9B9B]">—</span>}
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden xl:table-cell whitespace-nowrap tabular-nums">
                                                    {new Date(creator.created_at).toLocaleDateString('fr-CH')}
                                                </td>
                                                <td className="pr-3">
                                                    <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors" strokeWidth={2} />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    invitations.length === 0 ? (
                        <EmptyState
                            icon={LinkIcon}
                            title="Aucune invitation"
                            description="Générez des liens d'invitation pour que les créateurs puissent s'inscrire sur la plateforme."
                            action={generateButton}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-[#E2E2E1]">
                                        <th className={TH}>Code</th>
                                        <th className={`${TH} hidden md:table-cell`}>Étiquette</th>
                                        <th className={TH}>Statut</th>
                                        <th className={`${TH} hidden lg:table-cell`}>Créée</th>
                                        <th className={`${TH} hidden xl:table-cell`}>Expire</th>
                                        <th className={`${TH} text-right`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E2E1]">
                                    {orderedInvites.map((invite) => {
                                        const isUsed = !!invite.used_at
                                        const isExpired = !isUsed && !!invite.expires_at && new Date(invite.expires_at) < new Date()
                                        return (
                                            <tr key={invite.id} className="hover:bg-[#FAFAF9] transition-colors">
                                                <td className="px-4 py-2.5">
                                                    <code className="font-mono font-semibold text-[#1A1A1A] tracking-wider">{invite.code}</code>
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden md:table-cell max-w-[240px]">
                                                    <span className="block truncate">
                                                        {isUsed
                                                            ? `Utilisée par ${invite.used_by_user?.full_name || 'Inconnu'}`
                                                            : invite.label || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {isUsed ? <StatusPill tone="done">Utilisée</StatusPill>
                                                        : isExpired ? <StatusPill tone="alert">Expirée</StatusPill>
                                                            : <StatusPill tone="waiting">En attente</StatusPill>}
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden lg:table-cell whitespace-nowrap tabular-nums">
                                                    {new Date(invite.created_at).toLocaleDateString('fr-CH')}
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B6B6B] hidden xl:table-cell whitespace-nowrap tabular-nums">
                                                    {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString('fr-CH') : '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {!isUsed && !isExpired && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleCopyLink(invite.code)}
                                                                    className={ICON_BTN}
                                                                    title="Copier le lien"
                                                                >
                                                                    {copiedCode === invite.code
                                                                        ? <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />
                                                                        : <Copy className="w-3.5 h-3.5" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleShareWhatsApp(invite.code)}
                                                                    className={ICON_BTN}
                                                                    title="Partager sur WhatsApp"
                                                                >
                                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleShareEmail(invite.code)}
                                                                    className={ICON_BTN}
                                                                    title="Envoyer par email"
                                                                >
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {!isUsed && (
                                                            <button
                                                                onClick={() => handleRevoke(invite.id)}
                                                                className={ICON_BTN}
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

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
                            initial={{ opacity: 0, scale: 0.98, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl border border-[#E2E2E1] shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-4 h-11 border-b border-[#E2E2E1]">
                                <h2 className="text-[13px] font-semibold text-[#1A1A1A]">Nouveau lien d&apos;invitation</h2>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9B9B9B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4">
                                <label className="text-[12px] font-medium text-[#6B6B6B] mb-1.5 block">Nom ou email (étiquette, optionnel)</label>
                                <input
                                    type="text"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Ex : Marie Dupont"
                                    className="w-full h-9 px-3 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/15 transition-colors"
                                />
                                <p className="text-[12px] text-[#9B9B9B] mt-1.5">Sert juste à identifier l&apos;invitation. Le lien (valide 30 jours, à usage unique) sera copié — partage-le via Copier / WhatsApp / Email.</p>
                            </div>

                            <div className="px-4 py-3 border-t border-[#E2E2E1] flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-3 h-9 text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateInvitation}
                                    disabled={isCreating}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white font-medium rounded-lg hover:bg-[#333333] transition-colors disabled:opacity-50 text-[13px]"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                                    Générer le lien
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
