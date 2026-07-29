'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, ChevronRight, CalendarClock, Mail, Phone, MessageSquare, Clock, Plus, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAllBrands, getAllBrandRequests, updateBrandRequestStatus, type BrandWithProfile, type BrandRequest } from '@/lib/services/adminService'
import { toast } from 'sonner'

type Tab = 'inscrites' | 'rdv'

const STATUS_LABELS: Record<BrandRequest['status'], { label: string; color: string }> = {
    new: { label: 'Nouvelle', color: 'bg-blue-100 text-blue-700' },
    contacted: { label: 'Contactée', color: 'bg-yellow-100 text-yellow-700' },
    meeting_scheduled: { label: 'RDV planifié', color: 'bg-purple-100 text-purple-700' },
    closed: { label: 'Clôturée', color: 'bg-gray-100 text-gray-500' },
}

const STATUS_OPTIONS: BrandRequest['status'][] = ['new', 'contacted', 'meeting_scheduled', 'closed']

export default function AdminBrandsPage() {
    const [tab, setTab] = useState<Tab>('inscrites')
    const [brands, setBrands] = useState<BrandWithProfile[]>([])
    const [requests, setRequests] = useState<BrandRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const router = useRouter()

    // Create managed brand
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newBrand, setNewBrand] = useState({ companyName: '', contactName: '', contactEmail: '', clickupListId: '' })
    const [clickupGroups, setClickupGroups] = useState<{ folder: string; lists: { id: string; name: string }[] }[]>([])

    useEffect(() => {
        async function load() {
            const [brandsData, requestsData] = await Promise.all([
                getAllBrands(),
                getAllBrandRequests(),
            ])
            setBrands(brandsData)
            setRequests(requestsData)
            setIsLoading(false)
        }
        load()
        fetch('/api/clickup/lists').then(r => r.json()).then(d => setClickupGroups(d.groups || [])).catch(() => {})
    }, [])

    const handleCreateBrand = async () => {
        if (!newBrand.companyName.trim()) return
        setCreating(true)
        try {
            const res = await fetch('/api/brands/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBrand),
            })
            const data = await res.json()
            if (res.ok && data.brandId) {
                toast.success('Marque créée')
                router.push(`/mosh-cockpit/brands/${data.brandId}`)
            } else {
                toast.error(data.error || 'Échec de la création')
            }
        } catch {
            toast.error('Erreur réseau')
        }
        setCreating(false)
    }

    const filteredBrands = brands.filter(b =>
        !searchQuery ||
        b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.profiles_brand?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.profiles_brand?.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredRequests = requests.filter(r =>
        !searchQuery ||
        r.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleStatusChange = async (requestId: string, newStatus: BrandRequest['status']) => {
        const result = await updateBrandRequestStatus(requestId, newStatus)
        if (result.success) {
            setRequests(prev =>
                prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r)
            )
        }
    }

    const newRequestsCount = requests.filter(r => r.status === 'new').length

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Marques</h1>
                    <p className="text-[#71717A] mt-1">{brands.length} inscrite{brands.length > 1 ? 's' : ''} · {requests.length} demande{requests.length > 1 ? 's' : ''} de RDV</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#18181B] text-[#C4F042] rounded-xl text-sm font-medium hover:bg-[#18181B]/90 transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    Créer une marque
                </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-[#F4F3EF] rounded-2xl p-1 w-fit">
                <button
                    onClick={() => setTab('inscrites')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'inscrites' ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#18181B]'}`}
                >
                    Inscrites
                    <span className="ml-2 text-xs bg-[#D9D7D0] text-[#18181B] px-2 py-0.5 rounded-full">{brands.length}</span>
                </button>
                <button
                    onClick={() => setTab('rdv')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'rdv' ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#71717A] hover:text-[#18181B]'}`}
                >
                    Demandes de RDV
                    {newRequestsCount > 0 && (
                        <span className="ml-2 text-xs bg-[#C4F042] text-[#18181B] px-2 py-0.5 rounded-full font-bold">{newRequestsCount}</span>
                    )}
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A099]" strokeWidth={1.5} />
                <input
                    type="text"
                    placeholder={tab === 'inscrites' ? 'Rechercher par nom, entreprise, industrie...' : 'Rechercher par entreprise, contact, email...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#D9D7D0]/50 border border-[#C8C6BF]/40 rounded-2xl text-sm text-[#18181B] placeholder:text-[#A1A099] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/60 focus:bg-white/60 transition-all"
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-8 animate-pulse space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-[#F4F3EF] rounded-xl" />
                    ))}
                </div>
            ) : tab === 'inscrites' ? (
                /* ════════ INSCRITES TAB ════════ */
                filteredBrands.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                        <p className="text-[#71717A] font-medium">Aucune marque trouvée</p>
                        <p className="text-[#A1A1AA] text-sm mt-1">Essayez un autre terme de recherche</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] overflow-hidden"
                    >
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-black/[0.04]">
                                    <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Marque</th>
                                    <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Industrie</th>
                                    <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Contact</th>
                                    <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Inscription</th>
                                    <th className="w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBrands.map((brand, i) => (
                                    <motion.tr
                                        key={brand.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="border-b border-black/[0.03] last:border-0 hover:bg-[#F4F3EF]/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/mosh-cockpit/brands/${brand.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border border-black/[0.06] flex items-center justify-center text-[#71717A]">
                                                    <Building2 className="w-4 h-4" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[#18181B] font-medium text-sm">{brand.profiles_brand?.company_name || brand.full_name}</p>
                                                    {brand.profiles_brand?.company_name && (
                                                        <p className="text-[#A1A1AA] text-xs">{brand.full_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#71717A]">
                                            {brand.profiles_brand?.industry ? (
                                                <span className="px-2.5 py-1 bg-[#F4F3EF] rounded-full text-xs font-medium text-[#18181B]">
                                                    {brand.profiles_brand.industry}
                                                </span>
                                            ) : (
                                                <span className="text-[#A1A1AA]">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#71717A]">
                                            {brand.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#A1A1AA]">
                                            {new Date(brand.created_at).toLocaleDateString('fr-CH')}
                                        </td>
                                        <td className="pr-4 py-4">
                                            <ChevronRight className="w-4 h-4 text-[#D4D4D8]" strokeWidth={1.5} />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )
            ) : (
                /* ════════ DEMANDES DE RDV TAB ════════ */
                filteredRequests.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                        <CalendarClock className="w-8 h-8 text-[#A1A1AA] mx-auto mb-3" />
                        <p className="text-[#71717A] font-medium">Aucune demande de RDV</p>
                        <p className="text-[#A1A1AA] text-sm mt-1">Les demandes des marques apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRequests.map((req, i) => {
                            const statusInfo = STATUS_LABELS[req.status]
                            return (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-[20px] border border-black/[0.03] p-5 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#F4F3EF] flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-[#71717A]" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <p className="text-[#18181B] font-semibold text-sm">{req.company_name}</p>
                                                    <p className="text-[#A1A1AA] text-xs">{req.contact_name}</p>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-wrap gap-4 text-xs text-[#71717A]">
                                                <span className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                    {req.email}
                                                </span>
                                                {req.phone && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                        {req.phone}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                                                    {new Date(req.created_at).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Message */}
                                            {req.message && (
                                                <div className="mt-3 flex items-start gap-2 text-xs text-[#71717A] bg-[#F4F3EF] rounded-xl p-3">
                                                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                                                    <p className="line-clamp-2">{req.message}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status select */}
                                        <div className="flex-shrink-0">
                                            <select
                                                value={req.status}
                                                onChange={(e) => handleStatusChange(req.id, e.target.value as BrandRequest['status'])}
                                                className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 ${statusInfo.color}`}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )
            )}

            {/* Create managed brand modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => !creating && setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-md"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.04]">
                                <h2 className="text-lg font-semibold text-[#18181B]">Nouvelle marque (gérée par MOSH)</h2>
                                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg bg-[#F4F3EF] flex items-center justify-center text-[#A1A1AA] hover:text-[#18181B] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Nom de la marque *</label>
                                    <input value={newBrand.companyName} onChange={e => setNewBrand({ ...newBrand, companyName: e.target.value })}
                                        placeholder="Ex : La Combe"
                                        className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Nom du contact (optionnel)</label>
                                    <input value={newBrand.contactName} onChange={e => setNewBrand({ ...newBrand, contactName: e.target.value })}
                                        placeholder="Ex : Marie Dupont"
                                        className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Email du contact (optionnel)</label>
                                    <input type="email" value={newBrand.contactEmail} onChange={e => setNewBrand({ ...newBrand, contactEmail: e.target.value })}
                                        placeholder="contact@client.com"
                                        className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40" />
                                    <p className="text-xs text-[#A1A1AA] mt-1">Aucun email n&apos;est envoyé. Sert si le client veut se connecter plus tard.</p>
                                </div>
                                {clickupGroups.length > 0 && (
                                    <div>
                                        <label className="text-xs font-medium text-[#71717A] mb-1.5 block">Liste ClickUp (optionnel)</label>
                                        <select value={newBrand.clickupListId} onChange={e => setNewBrand({ ...newBrand, clickupListId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-[#F4F3EF]/50 border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40">
                                            <option value="">Aucune</option>
                                            {clickupGroups.map(g => (
                                                <optgroup key={g.folder} label={g.folder}>
                                                    {g.lists.map(l => <option key={l.id} value={l.id}>{g.folder} — {l.name}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-black/[0.04] flex items-center justify-end gap-3">
                                <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-[#71717A] hover:text-[#18181B] transition-colors">Annuler</button>
                                <button onClick={handleCreateBrand} disabled={creating || !newBrand.companyName.trim()}
                                    className="px-5 py-2.5 bg-[#C4F042] text-[#18181B] font-medium rounded-xl hover:bg-[#C4F042]/80 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Créer la marque
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
