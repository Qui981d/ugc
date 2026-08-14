'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowRight,
    ExternalLink,
    FileText,
    LogIn,
    Loader2,
} from 'lucide-react'
import { getBrandById, type BrandWithProfile, type CampaignWithDetails } from '@/lib/services/adminService'
import { useActingBrandStore } from '@/stores/useActingBrandStore'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, MetricStrip, Panel, StatusPill, EmptyState } from '@/components/ui/workspace'

const STATUS_LABELS: Record<string, { label: string; tone: 'progress' | 'waiting' | 'done' | 'idle' | 'alert' }> = {
    draft: { label: 'Brief reçu', tone: 'idle' },
    open: { label: 'Profils proposés', tone: 'progress' },
    in_progress: { label: 'En production', tone: 'progress' },
    completed: { label: 'Terminée', tone: 'done' },
    cancelled: { label: 'Annulée', tone: 'idle' },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#9B9B9B]">{label}</p>
            <div className="text-[13px] text-[#1A1A1A] mt-0.5 break-words">{children}</div>
        </div>
    )
}

export default function BrandDetailPage() {
    const params = useParams()
    const router = useRouter()
    const brandId = params.id as string
    const setActingBrand = useActingBrandStore((s) => s.setActingBrand)

    const [brand, setBrand] = useState<BrandWithProfile | null>(null)
    const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [clickupGroups, setClickupGroups] = useState<{ folder: string; lists: { id: string; name: string }[] }[]>([])
    const [clickupListId, setClickupListId] = useState('')
    const [savingClickup, setSavingClickup] = useState(false)
    const [kdriveFolder, setKdriveFolder] = useState('')
    const [savingKdrive, setSavingKdrive] = useState(false)
    const [kdriveSaved, setKdriveSaved] = useState(false)
    const [kdriveError, setKdriveError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            const result = await getBrandById(brandId)
            setBrand(result.brand)
            setCampaigns(result.campaigns)
            setClickupListId(result.brand?.profiles_brand?.clickup_list_id || '')
            setKdriveFolder(result.brand?.profiles_brand?.kdrive_folder_path || '')
            setIsLoading(false)
            fetch('/api/clickup/lists')
                .then(r => r.json())
                .then(d => setClickupGroups(d.groups || []))
                .catch(() => { })
        }
        load()
    }, [brandId])

    const saveClickupList = async (value: string) => {
        setSavingClickup(true)
        setClickupListId(value)
        const supabase = createClient()
        await (supabase.from('profiles_brand') as ReturnType<typeof supabase.from>)
            .update({ clickup_list_id: value || null })
            .eq('user_id', brandId)
        setSavingClickup(false)
    }

    /**
     * The kDrive folder is typed, not picked: MOSH reads the path off kDrive's
     * own interface. Saving is explicit so a half-typed path is never stored.
     */
    const saveKdriveFolder = async () => {
        setSavingKdrive(true)
        setKdriveSaved(false)
        setKdriveError(null)
        const value = kdriveFolder.trim()
        const supabase = createClient()
        const { error } = await (supabase.from('profiles_brand') as ReturnType<typeof supabase.from>)
            .update({ kdrive_folder_path: value || null })
            .eq('user_id', brandId)
        if (error) {
            setKdriveError(error.message)
        } else {
            setKdriveFolder(value)
            setKdriveSaved(true)
            setTimeout(() => setKdriveSaved(false), 2500)
        }
        setSavingKdrive(false)
    }

    if (isLoading) {
        return (
            <div className="max-w-[1100px] mx-auto">
                <div className="border-b border-[#E2E2E1] pb-4 mb-6 space-y-2 animate-pulse">
                    <div className="h-3 bg-[#F4F4F3] rounded w-40" />
                    <div className="h-6 bg-[#F4F4F3] rounded w-1/3" />
                </div>
                <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden mb-3">
                    <div className="divide-y divide-[#E2E2E1]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/4" />
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/6 ml-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!brand) {
        return (
            <div className="max-w-[1100px] mx-auto">
                <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden">
                    <EmptyState
                        title="Marque introuvable"
                        description="Cette marque n'existe pas ou a été supprimée."
                        action={
                            <Link href="/mosh-cockpit/brands"
                                className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors">
                                Retour aux marques
                            </Link>
                        }
                    />
                </div>
            </div>
        )
    }

    const profile = brand.profiles_brand
    const companyName = profile?.company_name || brand.full_name
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length
    const activeCampaigns = campaigns.filter(c => c.status === 'in_progress' || c.status === 'open').length
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_chf || 0), 0)
    const website = profile?.website || null
    const websiteHref = website
        ? (website.startsWith('http') ? website : `https://${website}`)
        : null

    return (
        <div className="max-w-[1100px] mx-auto">
            <PageHeader
                title={companyName}
                description={brand.email}
                breadcrumb={[
                    { label: 'Marques', href: '/mosh-cockpit/brands' },
                    { label: companyName },
                ]}
                actions={
                    <button
                        onClick={() => {
                            setActingBrand(brand.id, profile?.company_name || brand.full_name)
                            router.push('/brand')
                        }}
                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors shrink-0"
                    >
                        <LogIn className="w-4 h-4" strokeWidth={2.2} />
                        Ouvrir l&apos;espace de la marque
                    </button>
                }
            />

            {/* Stats — one strip */}
            <div className="mb-3">
                <MetricStrip
                    metrics={[
                        { label: 'Missions', value: String(campaigns.length), hint: 'au total' },
                        { label: 'En cours', value: String(activeCampaigns), hint: 'en production ou en sélection' },
                        { label: 'Terminées', value: String(completedCampaigns), hint: 'missions livrées' },
                        { label: 'Budget cumulé', value: totalBudget > 0 ? totalBudget.toLocaleString('fr-CH') : '—', hint: 'CHF' },
                    ]}
                />
            </div>

            {/* Company info — definition layout, not a stack of grey boxes */}
            <div className="mb-3">
                <Panel title="Informations entreprise" padded>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        <Field label="Contact">{brand.full_name || '—'}</Field>
                        <Field label="Email">{brand.email || '—'}</Field>
                        <Field label="Secteur">{profile?.industry || '—'}</Field>
                        <Field label="Client depuis">
                            <span className="tabular-nums">{new Date(brand.created_at).toLocaleDateString('fr-CH')}</span>
                        </Field>
                        <Field label="Adresse">{profile?.address || '—'}</Field>
                        <Field label="Site web">
                            {websiteHref && website ? (
                                <a
                                    href={websiteHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#1A1A1A] hover:text-[#333333] transition-colors"
                                >
                                    {website.replace(/^https?:\/\//, '')}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ) : '—'}
                        </Field>
                        <Field label="Numéro IDE">
                            <span className="font-mono">{profile?.uid_number || '—'}</span>
                        </Field>
                        {profile?.description && (
                            <div className="sm:col-span-2">
                                <Field label="Description">
                                    <span className="block text-[#6B6B6B] leading-relaxed whitespace-pre-wrap">{profile.description}</span>
                                </Field>
                            </div>
                        )}
                    </div>
                </Panel>

                {/* Where this client's briefs land. Without it, a brief arrives in
                    MOSH but creates nothing in ClickUp — worth stating plainly. */}
                <Panel title="Espace ClickUp" padded>
                    <p className="text-[12px] text-[#6B6B6B] mb-2">
                        Les briefs de cette marque créeront une carte dans cette liste.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={clickupListId}
                            onChange={(e) => saveClickupList(e.target.value)}
                            disabled={savingClickup || clickupGroups.length === 0}
                            className="h-9 px-3 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] disabled:opacity-50 min-w-[240px]"
                        >
                            <option value="">Aucune liste — pas de synchronisation</option>
                            {clickupGroups.map(g => (
                                <optgroup key={g.folder} label={g.folder}>
                                    {g.lists.map(l => (
                                        <option key={l.id} value={l.id}>{g.folder} — {l.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {savingClickup && <Loader2 className="w-4 h-4 animate-spin text-[#9B9B9B]" />}
                    </div>
                    {clickupGroups.length === 0 && (
                        <p className="text-[12px] text-[#8A6100] mt-2">
                            ClickUp n&apos;est pas connecté (jeton absent), la liste ne peut pas être choisie.
                        </p>
                    )}
                    {!clickupListId && clickupGroups.length > 0 && (
                        <p className="text-[12px] text-[#8A6100] mt-2">
                            Aucune liste : les briefs de cette marque n&apos;apparaîtront pas dans ClickUp.
                        </p>
                    )}
                </Panel>

                {/* Where this client's finished videos are filed. Same precedent
                    as ClickUp above: say plainly what happens when it is empty. */}
                <Panel title="Dossier kDrive" padded>
                    <p className="text-[12px] text-[#6B6B6B] mb-2">
                        Chemin du dossier client dans kDrive, tel qu&apos;il apparaît dans kDrive
                        (exemple : <span className="font-mono">/Clients/La Combe</span>). Un sous-dossier
                        est créé par mission.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={kdriveFolder}
                            onChange={(e) => setKdriveFolder(e.target.value)}
                            placeholder="/Clients/Nom de la marque"
                            className="h-9 px-3 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] min-w-[280px] flex-1"
                        />
                        <button
                            onClick={saveKdriveFolder}
                            disabled={savingKdrive}
                            className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors disabled:opacity-50"
                        >
                            {savingKdrive && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enregistrer
                        </button>
                        {kdriveSaved && (
                            <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-[#E8F3EA] text-[#1A7F37]">
                                Enregistré
                            </span>
                        )}
                    </div>
                    {kdriveError && (
                        <p className="text-[12px] text-[#C0392B] mt-2">{kdriveError}</p>
                    )}
                    {!kdriveFolder.trim() && (
                        <p className="text-[12px] text-[#8A6100] mt-2">
                            Sans dossier renseigné, aucune vidéo de cette marque n&apos;est exportée vers kDrive.
                        </p>
                    )}
                </Panel>
            </div>

            {/* Mission history — dense table */}
            <Panel
                title="Historique des missions"
                actions={
                    <span className="text-[12px] text-[#9B9B9B] tabular-nums">
                        {campaigns.length} mission{campaigns.length > 1 ? 's' : ''}
                        {activeCampaigns > 0 && ` · ${activeCampaigns} en cours`}
                    </span>
                }
            >
                {campaigns.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Aucune mission"
                        description="Cette marque n'a pas encore de mission."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-[#E2E2E1]">
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Mission</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden md:table-cell">Format</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden lg:table-cell">Créateur</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Statut</th>
                                    <th className="text-right font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden sm:table-cell">Budget</th>
                                    <th className="w-8" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E2E1]">
                                {campaigns.map((campaign) => {
                                    const statusCfg = STATUS_LABELS[campaign.status] || STATUS_LABELS.draft
                                    return (
                                        <tr
                                            key={campaign.id}
                                            onClick={() => router.push(`/mosh-cockpit/missions/${campaign.id}`)}
                                            className="hover:bg-[#FAFAF9] cursor-pointer transition-colors group"
                                        >
                                            <td className="px-4 py-2.5 max-w-[280px]">
                                                <span className="block font-medium text-[#1A1A1A] truncate">{campaign.title}</span>
                                                <span className="block text-[12px] text-[#9B9B9B] truncate md:hidden">{campaign.script_type}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#6B6B6B] hidden md:table-cell max-w-[160px]">
                                                <span className="block truncate">{campaign.script_type}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-[#6B6B6B] hidden lg:table-cell max-w-[160px]">
                                                <span className="block truncate">
                                                    {campaign.selected_creator?.full_name || <span className="text-[#9B9B9B]">Non assigné</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
                                            </td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-[#1A1A1A] hidden sm:table-cell whitespace-nowrap">
                                                {campaign.budget_chf ? campaign.budget_chf.toLocaleString('fr-CH') : '—'}
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
                )}
            </Panel>
        </div>
    )
}
