'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Film, Send, Building2 } from 'lucide-react'
import { getAllCreators, getAllBrands, createInternalMission, type CreatorWithProfile, type BrandWithProfile } from '@/lib/services/adminService'
import { createClient } from '@/lib/supabase/client'
import type { VideoFormat, ScriptType } from '@/types/database'

const FORMATS: { value: VideoFormat; label: string }[] = [
    { value: '9_16', label: '9:16 (vertical)' },
    { value: '1_1', label: '1:1 (carré)' },
    { value: '4_5', label: '4:5' },
    { value: '16_9', label: '16:9 (paysage)' },
]

const SCRIPT_TYPES: { value: ScriptType; label: string }[] = [
    { value: 'testimonial', label: 'Témoignage' },
    { value: 'unboxing', label: 'Unboxing' },
    { value: 'asmr', label: 'ASMR' },
    { value: 'tutorial', label: 'Tutoriel' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'review', label: 'Review' },
]

function NewMissionForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const brandId = searchParams.get('brand') || undefined
    const [brandName, setBrandName] = useState<string | null>(null)
    const [creators, setCreators] = useState<CreatorWithProfile[]>([])
    const [loadingCreators, setLoadingCreators] = useState(true)
    const [brands, setBrands] = useState<BrandWithProfile[]>([])
    const [loadingBrands, setLoadingBrands] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ClickUp client lists (optional integration)
    const [clickupGroups, setClickupGroups] = useState<{ folder: string; lists: { id: string; name: string }[] }[]>([])
    const [clickupConfigured, setClickupConfigured] = useState<boolean | null>(null)

    const [form, setForm] = useState({
        clientName: '',
        title: '',
        creatorId: '',
        scriptContent: '',
        creatorAmountChf: '',
        isAds: false,
        format: '9_16' as VideoFormat,
        scriptType: 'testimonial' as ScriptType,
        shootingDate: '',
        shootingDateFixed: false,
        deliveryDate: '',
        deliveryDateFixed: false,
        clickupListId: '',
        selectedBrandId: '',
    })

    useEffect(() => {
        getAllCreators().then(list => {
            setCreators(list)
            setLoadingCreators(false)
        })
        if (!brandId) {
            getAllBrands().then(list => {
                setBrands(list)
                setLoadingBrands(false)
            }).catch(() => setLoadingBrands(false))
        } else {
            setLoadingBrands(false)
        }
        // Brand mode: prefill client + ClickUp list from the managed brand
        if (brandId) {
            const supabase = createClient()
            supabase
                .from('profiles_brand')
                .select('company_name, clickup_list_id')
                .eq('user_id', brandId)
                .single()
                .then(({ data }) => {
                    const b = data as any
                    if (b) {
                        setBrandName(b.company_name)
                        setForm(f => ({ ...f, clientName: b.company_name, clickupListId: b.clickup_list_id || '' }))
                    }
                })
        } else {
            // Legacy internal mode: offer the ClickUp list dropdown
            fetch('/api/clickup/lists')
                .then(r => r.json())
                .then(d => {
                    setClickupGroups(d.groups || [])
                    setClickupConfigured(!!d.configured)
                })
                .catch(() => setClickupConfigured(false))
        }
    }, [brandId])

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleSubmit = async () => {
        setError(null)

        if (!brandId && !form.selectedBrandId) return setError('Sélectionnez la marque cliente.')
        if (!form.title.trim()) return setError('Le titre de la vidéo est requis.')
        if (!form.creatorId) return setError('Sélectionnez un créateur.')
        if (!form.scriptContent.trim()) return setError('Le script est requis.')
        const amount = parseFloat(form.creatorAmountChf)
        if (!amount || amount <= 0) return setError('Indiquez un prix valide pour le créateur.')

        setSubmitting(true)
        const res = await createInternalMission({
            clientName: form.clientName.trim(),
            title: form.title.trim(),
            scriptContent: form.scriptContent.trim(),
            creatorAmountChf: amount,
            isAds: form.isAds,
            format: form.format,
            scriptType: form.scriptType,
            shootingDate: form.shootingDate || null,
            shootingDateFixed: form.shootingDateFixed,
            deliveryDate: form.deliveryDate || null,
            deliveryDateFixed: form.deliveryDateFixed,
            creatorId: form.creatorId,
            clickupListId: form.clickupListId || undefined,
            brandId: brandId || form.selectedBrandId,
        })
        setSubmitting(false)

        if (res.success && res.campaignId) {
            router.push(`/mosh-cockpit/missions/${res.campaignId}`)
        } else {
            setError(res.error || 'Une erreur est survenue.')
        }
    }

    const inputClass = 'w-full px-4 py-2.5 bg-white border border-[#E2E2E1] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15'
    const labelClass = 'block text-sm font-medium text-[#1A1A1A] mb-1.5'

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/mosh-cockpit/missions"
                    className="w-10 h-10 rounded-lg bg-white border border-[#E2E2E1] flex items-center justify-center hover:bg-[#F4F4F3] transition-colors">
                    <ArrowLeft className="w-4 h-4 text-[#6B6B6B]" />
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-[#1A1A1A] flex items-center gap-2">
                        <Film className="w-5 h-5 text-[#1A1A1A]" />
                        Nouvelle mission
                    </h1>
                    <p className="text-sm text-[#6B6B6B]">Créez une mission et proposez-la directement à un créateur</p>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#E2E2E1] rounded-xl p-6 space-y-5">

                {/* Client + title */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Client</label>
                        {brandId ? (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg text-sm text-[#1A1A1A]">
                                <Building2 className="w-4 h-4 text-[#6B6B6B]" />
                                {brandName || 'Marque…'}
                                <span className="ml-auto text-xs text-[#9B9B9B]">compte géré</span>
                            </div>
                        ) : (
                            /* A real brand, not free text: the campaign's brand_id decides
                               whether the client can ever see the mission in their space. */
                            <select className={inputClass} value={form.selectedBrandId}
                                onChange={e => {
                                    const id = e.target.value
                                    const b = brands.find(x => x.id === id)
                                    setForm(f => ({
                                        ...f,
                                        selectedBrandId: id,
                                        clientName: b?.profiles_brand?.company_name || b?.full_name || '',
                                        clickupListId: (b?.profiles_brand as any)?.clickup_list_id || '',
                                    }))
                                }}
                                disabled={loadingBrands}>
                                <option value="">{loadingBrands ? 'Chargement…' : 'Sélectionnez une marque'}</option>
                                {brands.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.profiles_brand?.company_name || b.full_name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {!brandId && !loadingBrands && brands.length === 0 && (
                            <p className="text-xs text-[#8A6100] mt-1">
                                Aucune marque enregistrée.{' '}
                                <Link href="/mosh-cockpit/brands" className="underline font-medium">
                                    Créez-en une
                                </Link>{' '}
                                pour que le client puisse suivre sa mission.
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Titre de la vidéo</label>
                        <input className={inputClass} value={form.title}
                            onChange={e => set('title', e.target.value)} placeholder="Ex : Test produit" />
                    </div>
                </div>

                {/* Creator */}
                <div>
                    <label className={labelClass}>Créateur assigné</label>
                    <select className={inputClass} value={form.creatorId}
                        onChange={e => set('creatorId', e.target.value)} disabled={loadingCreators}>
                        <option value="">{loadingCreators ? 'Chargement…' : 'Sélectionnez un créateur'}</option>
                        {creators.map(c => (
                            <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                        ))}
                    </select>
                </div>

                {/* ClickUp client (optional) */}
                {clickupConfigured && clickupGroups.length > 0 && (
                    <div>
                        <label className={labelClass}>Client ClickUp <span className="text-[#9B9B9B] font-normal">(optionnel)</span></label>
                        <select className={inputClass} value={form.clickupListId}
                            onChange={e => set('clickupListId', e.target.value)}>
                            <option value="">Ne pas créer de carte ClickUp</option>
                            {clickupGroups.map(g => (
                                <optgroup key={g.folder} label={g.folder}>
                                    {g.lists.map(l => (
                                        <option key={l.id} value={l.id}>{g.folder} — {l.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <p className="text-xs text-[#9B9B9B] mt-1">Une carte + sous-tâches seront créées dans cette liste ClickUp.</p>
                    </div>
                )}
                {clickupConfigured === false && (
                    <p className="text-xs text-[#9B9B9B]">ClickUp non connecté (variable <code>CLICKUP_API_TOKEN</code> absente) — la mission sera créée sans carte ClickUp.</p>
                )}

                {/* Script */}
                <div>
                    <label className={labelClass}>Script</label>
                    <textarea className={`${inputClass} resize-none`} rows={6} value={form.scriptContent}
                        onChange={e => set('scriptContent', e.target.value)}
                        placeholder="Écrivez le script que le créateur devra suivre…" />
                </div>

                {/* Price + type usage */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Prix proposé au créateur (CHF)</label>
                        <input type="number" min="0" step="10" className={inputClass} value={form.creatorAmountChf}
                            onChange={e => set('creatorAmountChf', e.target.value)} placeholder="500" />
                        <p className="text-xs text-[#9B9B9B] mt-1">Le créateur pourra contre-proposer à la réception.</p>
                    </div>
                    <div>
                        <label className={labelClass}>Usage</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => set('isAds', false)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${!form.isAds ? 'bg-[#EDEDEC] border-[#1A1A1A]/40 text-[#1A1A1A]' : 'bg-white border-[#E2E2E1] text-[#6B6B6B] hover:bg-[#F4F4F3]'}`}>
                                Organique
                            </button>
                            <button type="button" onClick={() => set('isAds', true)}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${form.isAds ? 'bg-[#EDEDEC] border-[#1A1A1A]/40 text-[#1A1A1A]' : 'bg-white border-[#E2E2E1] text-[#6B6B6B] hover:bg-[#F4F4F3]'}`}>
                                Ads
                            </button>
                        </div>
                    </div>
                </div>

                {/* Format + script type */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Format</label>
                        <select className={inputClass} value={form.format}
                            onChange={e => set('format', e.target.value as VideoFormat)}>
                            {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Type de contenu</label>
                        <select className={inputClass} value={form.scriptType}
                            onChange={e => set('scriptType', e.target.value as ScriptType)}>
                            {SCRIPT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Shooting date */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Date de tournage</label>
                        <input type="date" className={inputClass} value={form.shootingDate}
                            onChange={e => set('shootingDate', e.target.value)} />
                        <label className="flex items-center gap-2 mt-2 text-xs text-[#6B6B6B] cursor-pointer">
                            <input type="checkbox" checked={form.shootingDateFixed}
                                onChange={e => set('shootingDateFixed', e.target.checked)}
                                className="accent-[#1A1A1A]" />
                            Date de tournage fixe (imposée)
                        </label>
                    </div>
                    <div>
                        <label className={labelClass}>Date de livraison</label>
                        <input type="date" className={inputClass} value={form.deliveryDate}
                            onChange={e => set('deliveryDate', e.target.value)} />
                        <label className="flex items-center gap-2 mt-2 text-xs text-[#6B6B6B] cursor-pointer">
                            <input type="checkbox" checked={form.deliveryDateFixed}
                                onChange={e => set('deliveryDateFixed', e.target.checked)}
                                className="accent-[#1A1A1A]" />
                            Date de livraison fixe (imposée)
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-[#FBEAE8] border border-[#F2CFCB] rounded-lg text-sm text-[#C0392B]">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/mosh-cockpit/missions"
                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-[#6B6B6B] hover:bg-[#F4F4F3] transition-colors">
                        Annuler
                    </Link>
                    <button onClick={handleSubmit} disabled={submitting}
                        className="px-5 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333333] transition-colors flex items-center gap-2 disabled:opacity-50">
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Création…</>
                        ) : (
                            <><Send className="w-4 h-4" /> Créer et envoyer au créateur</>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default function NewMissionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-6 h-6 animate-spin text-[#9B9B9B]" /></div>}>
            <NewMissionForm />
        </Suspense>
    )
}
