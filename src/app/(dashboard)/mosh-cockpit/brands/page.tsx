'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, ArrowRight, CalendarClock, Plus, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAllBrands, getAllBrandRequests, updateBrandRequestStatus, type BrandWithProfile, type BrandRequest } from '@/lib/services/adminService'
import { toast } from 'sonner'
import { PageHeader, Tabs, EmptyState } from '@/components/ui/workspace'

type Tab = 'inscrites' | 'rdv'

const STATUS_LABELS: Record<BrandRequest['status'], string> = {
    new: 'Nouvelle',
    contacted: 'Contactée',
    meeting_scheduled: 'RDV planifié',
    closed: 'Clôturée',
}

const STATUS_OPTIONS: BrandRequest['status'][] = ['new', 'contacted', 'meeting_scheduled', 'closed']

const TH = 'text-left font-medium text-[11px] uppercase tracking-wider text-[#8A8D91] px-4 py-2.5'

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
    const resultCount = tab === 'inscrites' ? filteredBrands.length : filteredRequests.length

    const createButton = (
        <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0866FF] text-white rounded-lg text-[13px] font-medium hover:bg-[#0653CC] transition-colors shrink-0"
        >
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            Créer une marque
        </button>
    )

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Marques"
                description={`${brands.length} inscrite${brands.length > 1 ? 's' : ''} · ${requests.length} demande${requests.length > 1 ? 's' : ''} de RDV${newRequestsCount > 0 ? ` · ${newRequestsCount} nouvelle${newRequestsCount > 1 ? 's' : ''}` : ''}`}
                actions={createButton}
            >
                <Tabs
                    tabs={[
                        { id: 'inscrites', label: 'Inscrites', count: brands.length },
                        { id: 'rdv', label: 'Demandes de RDV', count: newRequestsCount > 0 ? newRequestsCount : requests.length },
                    ]}
                    active={tab}
                    onChange={(id) => setTab(id as Tab)}
                />
            </PageHeader>

            {/* Toolbar — bare controls above the surface */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8D91]" strokeWidth={1.8} />
                    <input
                        type="text"
                        placeholder={tab === 'inscrites' ? 'Rechercher par nom, entreprise, industrie…' : 'Rechercher par entreprise, contact, email…'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors"
                    />
                </div>
                <span className="text-[12px] text-[#8A8D91] tabular-nums ml-auto">
                    {tab === 'inscrites'
                        ? `${resultCount} marque${resultCount > 1 ? 's' : ''}`
                        : `${resultCount} demande${resultCount > 1 ? 's' : ''}`}
                </span>
            </div>

            {/* One dense surface */}
            <div className="bg-white border border-[#DADDE1] rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="divide-y divide-[#DADDE1]">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-4 bg-[#F0F2F5] rounded w-1/4" />
                                <div className="h-4 bg-[#F0F2F5] rounded w-1/6 ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : tab === 'inscrites' ? (
                    filteredBrands.length === 0 ? (
                        <EmptyState
                            icon={Building2}
                            title="Aucune marque"
                            description={searchQuery ? 'Aucun résultat pour cette recherche.' : 'Créez une marque pour la voir apparaître ici.'}
                            action={createButton}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-[#DADDE1]">
                                        <th className={TH}>Marque</th>
                                        <th className={`${TH} hidden md:table-cell`}>Industrie</th>
                                        <th className={`${TH} hidden lg:table-cell`}>Contact</th>
                                        <th className={`${TH} hidden sm:table-cell`}>Inscription</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#DADDE1]">
                                    {filteredBrands.map((brand) => (
                                        <tr
                                            key={brand.id}
                                            onClick={() => router.push(`/mosh-cockpit/brands/${brand.id}`)}
                                            className="hover:bg-[#F7F8FA] cursor-pointer transition-colors group"
                                        >
                                            <td className="px-4 py-2.5 max-w-[280px]">
                                                <span className="block font-medium text-[#1C1E21] truncate">
                                                    {brand.profiles_brand?.company_name || brand.full_name}
                                                </span>
                                                {brand.profiles_brand?.company_name && (
                                                    <span className="block text-[12px] text-[#8A8D91] truncate">{brand.full_name}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden md:table-cell max-w-[180px]">
                                                <span className="block truncate">{brand.profiles_brand?.industry || '—'}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden lg:table-cell max-w-[220px]">
                                                <span className="block truncate">{brand.email}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden sm:table-cell whitespace-nowrap tabular-nums">
                                                {new Date(brand.created_at).toLocaleDateString('fr-CH')}
                                            </td>
                                            <td className="pr-3">
                                                <ArrowRight className="w-4 h-4 text-[#BCC0C4] group-hover:text-[#0866FF] transition-colors" strokeWidth={2} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    filteredRequests.length === 0 ? (
                        <EmptyState
                            icon={CalendarClock}
                            title="Aucune demande de RDV"
                            description={searchQuery ? 'Aucun résultat pour cette recherche.' : 'Les demandes des marques apparaîtront ici.'}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-[#DADDE1]">
                                        <th className={TH}>Entreprise</th>
                                        <th className={`${TH} hidden md:table-cell`}>Contact</th>
                                        <th className={`${TH} hidden xl:table-cell`}>Message</th>
                                        <th className={`${TH} hidden sm:table-cell`}>Reçue</th>
                                        <th className={`${TH} text-right`}>Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#DADDE1]">
                                    {filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-[#F7F8FA] transition-colors">
                                            <td className="px-4 py-2.5 max-w-[240px]">
                                                <span className="block font-medium text-[#1C1E21] truncate">{req.company_name}</span>
                                                <span className="block text-[12px] text-[#8A8D91] truncate md:hidden">{req.contact_name}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden md:table-cell max-w-[240px]">
                                                <span className="block truncate">{req.contact_name}</span>
                                                <span className="block text-[12px] text-[#8A8D91] truncate">
                                                    {req.email}{req.phone ? ` · ${req.phone}` : ''}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden xl:table-cell max-w-[260px]">
                                                <span className="block truncate">{req.message || '—'}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#65676B] hidden sm:table-cell whitespace-nowrap tabular-nums">
                                                {new Date(req.created_at).toLocaleDateString('fr-CH')}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <select
                                                    value={req.status}
                                                    onChange={(e) => handleStatusChange(req.id, e.target.value as BrandRequest['status'])}
                                                    className="h-8 pl-2 pr-7 bg-white border border-[#DADDE1] rounded-lg text-[12.5px] text-[#1C1E21] cursor-pointer focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors"
                                                >
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Create managed brand modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => !creating && setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl border border-[#DADDE1] shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-4 h-11 border-b border-[#DADDE1]">
                                <h2 className="text-[13px] font-semibold text-[#1C1E21]">Nouvelle marque (gérée par MOSH)</h2>
                                <button onClick={() => setShowCreate(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8A8D91] hover:bg-[#F0F2F5] hover:text-[#1C1E21] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4 space-y-3.5">
                                <div>
                                    <label className="text-[12px] font-medium text-[#65676B] mb-1.5 block">Nom de la marque *</label>
                                    <input value={newBrand.companyName} onChange={e => setNewBrand({ ...newBrand, companyName: e.target.value })}
                                        placeholder="Ex : La Combe"
                                        className="w-full h-9 px-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-[#65676B] mb-1.5 block">Nom du contact (optionnel)</label>
                                    <input value={newBrand.contactName} onChange={e => setNewBrand({ ...newBrand, contactName: e.target.value })}
                                        placeholder="Ex : Marie Dupont"
                                        className="w-full h-9 px-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[12px] font-medium text-[#65676B] mb-1.5 block">Email du contact (optionnel)</label>
                                    <input type="email" value={newBrand.contactEmail} onChange={e => setNewBrand({ ...newBrand, contactEmail: e.target.value })}
                                        placeholder="contact@client.com"
                                        className="w-full h-9 px-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] placeholder:text-[#8A8D91] focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors" />
                                    <p className="text-[12px] text-[#8A8D91] mt-1">Aucun email n&apos;est envoyé. Sert si le client veut se connecter plus tard.</p>
                                </div>
                                {clickupGroups.length > 0 && (
                                    <div>
                                        <label className="text-[12px] font-medium text-[#65676B] mb-1.5 block">Liste ClickUp (optionnel)</label>
                                        <select value={newBrand.clickupListId} onChange={e => setNewBrand({ ...newBrand, clickupListId: e.target.value })}
                                            className="w-full h-9 px-3 bg-white border border-[#DADDE1] rounded-lg text-[13px] text-[#1C1E21] cursor-pointer focus:outline-none focus:border-[#0866FF] focus:ring-2 focus:ring-[#0866FF]/20 transition-colors">
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
                            <div className="px-4 py-3 border-t border-[#DADDE1] flex items-center justify-end gap-2">
                                <button onClick={() => setShowCreate(false)} className="px-3 h-9 text-[13px] text-[#65676B] hover:text-[#1C1E21] transition-colors">Annuler</button>
                                <button onClick={handleCreateBrand} disabled={creating || !newBrand.companyName.trim()}
                                    className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#0866FF] text-white font-medium rounded-lg hover:bg-[#0653CC] transition-colors disabled:opacity-50 text-[13px]">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.2} />}
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
