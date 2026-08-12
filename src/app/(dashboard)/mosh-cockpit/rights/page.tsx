'use client'

/**
 * Which advertising rights are about to run out.
 *
 * An action list, not a report: a lapsed window is either an extension MOSH
 * failed to sell or an ad the client is running out of contract. The date
 * maths lives in lib/contracts/paidWindow.ts and the prose comes from
 * describePaidWindow(), so this screen can never contradict the mission page.
 */

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Copyright } from 'lucide-react'
import { PageHeader, MetricStrip, Panel, PanelList, PanelRow, StatusPill, EmptyState } from '@/components/ui/workspace'
import { getPaidRightsWatchlist, type PaidRightsWatchItem } from '@/lib/services/adminService'
import {
    computePaidWindow,
    describePaidWindow,
    formatPaidDate,
    type PaidWindow,
    type PaidWindowStatus,
} from '@/lib/contracts/paidWindow'

interface WatchRow extends PaidRightsWatchItem {
    window: PaidWindow
}

const STATUS_LABEL: Record<PaidWindowStatus, string> = {
    not_applicable: 'Sans objet',
    awaiting_activation: 'Départ non déclaré',
    active: 'En cours',
    expiring_soon: 'Expire bientôt',
    expired: 'Expiré',
    shutdown_overdue: 'Hors contrat',
}

const STATUS_TONE: Record<PaidWindowStatus, 'progress' | 'waiting' | 'done' | 'idle' | 'alert'> = {
    not_applicable: 'idle',
    awaiting_activation: 'idle',
    active: 'done',
    expiring_soon: 'waiting',
    expired: 'waiting',
    shutdown_overdue: 'alert',
}

/** Days remaining, read out loud. Negative days are a delay, not a countdown. */
function daysLabel(days: number | null): string {
    if (days === null) return '—'
    if (days > 1) return `${days} jours restants`
    if (days === 1) return 'dernier jour'
    if (days === 0) return "expire aujourd'hui"
    return `${Math.abs(days)} jours de retard`
}

/**
 * A declared start and a fallback start carry different legal weight, so the
 * difference is on the row rather than one click away.
 */
function StartSource({ window: w }: { window: PaidWindow }) {
    if (w.startSource === 'declared') {
        return (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-[#F4F4F3] text-[#6B6B6B] ring-1 ring-inset ring-[#E2E2E1] whitespace-nowrap">
                Départ déclaré
            </span>
        )
    }
    return (
        <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-medium bg-[#FBF3E2] text-[#8A6100] whitespace-nowrap">
            Départ par défaut
        </span>
    )
}

function RightsRow({ row, dateMode }: { row: WatchRow; dateMode: 'expiry' | 'start' }) {
    const w = row.window
    const overdue = w.status === 'shutdown_overdue'
    const date = dateMode === 'start' ? w.startsAt : w.expiresAt

    return (
        <PanelRow href={`/mosh-cockpit/missions/${row.campaignId}`}>
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 min-w-0">
                    {overdue && <AlertTriangle className="w-3.5 h-3.5 text-[#C0392B] shrink-0 self-center" strokeWidth={2.2} />}
                    <span className="text-[13px] font-medium text-[#1A1A1A] truncate">{row.title}</span>
                    <span className="text-[12px] text-[#9B9B9B] truncate">{row.clientName}</span>
                </div>
                <p className={`text-[12px] mt-0.5 truncate ${overdue ? 'text-[#C0392B]' : 'text-[#6B6B6B]'}`}>
                    {describePaidWindow(w)}
                </p>
            </div>

            <div className="hidden sm:flex flex-col items-end shrink-0 w-[150px]">
                <span className="text-[13px] tabular-nums text-[#1A1A1A]">{formatPaidDate(date)}</span>
                <span className="text-[11.5px] tabular-nums text-[#9B9B9B]">
                    {dateMode === 'start' ? 'départ automatique' : daysLabel(w.daysRemaining)}
                </span>
            </div>

            <StartSource window={w} />
            <StatusPill tone={STATUS_TONE[w.status]}>{STATUS_LABEL[w.status]}</StatusPill>
            <ArrowRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors shrink-0" strokeWidth={2} />
        </PanelRow>
    )
}

function Section({
    title,
    rows,
    note,
    dateMode = 'expiry',
}: {
    title: string
    rows: WatchRow[]
    note?: string
    dateMode?: 'expiry' | 'start'
}) {
    if (rows.length === 0) return null
    return (
        <Panel title={`${title} · ${rows.length}`}>
            {note && (
                <p className="px-4 py-2.5 text-[12px] text-[#6B6B6B] border-b border-[#E2E2E1] bg-[#FAFAF9]">
                    {note}
                </p>
            )}
            <PanelList>
                {rows.map((r) => (
                    <RightsRow key={r.campaignId} row={r} dateMode={dateMode} />
                ))}
            </PanelList>
        </Panel>
    )
}

export default function AdminRightsPage() {
    const [items, setItems] = useState<PaidRightsWatchItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let alive = true
        getPaidRightsWatchlist().then((data) => {
            if (!alive) return
            setItems(data)
            setIsLoading(false)
        })
        return () => { alive = false }
    }, [])

    const rows = useMemo<WatchRow[]>(() => {
        // One clock for the whole render, so two rows can never disagree.
        const now = new Date()
        return items
            .map((item) => ({
                ...item,
                window: computePaidWindow({
                    rights: item.rights,
                    finalAcceptedAt: item.finalAcceptedAt,
                    activatedAt: item.activatedAt,
                    now,
                }),
            }))
            .filter((r) => r.window.status !== 'not_applicable')
    }, [items])

    const byExpiry = (a: WatchRow, b: WatchRow) =>
        (a.window.expiresAt?.getTime() ?? 0) - (b.window.expiresAt?.getTime() ?? 0)

    const expiringSoon = rows.filter((r) => r.window.status === 'expiring_soon').sort(byExpiry)
    // Overdue first: it is the only group where an ad is live without a right.
    const outOfTime = rows
        .filter((r) => r.window.status === 'expired' || r.window.status === 'shutdown_overdue')
        .sort((a, b) => {
            const rank = (s: PaidWindowStatus) => (s === 'shutdown_overdue' ? 0 : 1)
            return rank(a.window.status) - rank(b.window.status) || byExpiry(a, b)
        })
    const active = rows.filter((r) => r.window.status === 'active').sort(byExpiry)
    const awaiting = rows
        .filter((r) => r.window.status === 'awaiting_activation')
        .sort((a, b) => (a.window.startsAt?.getTime() ?? 0) - (b.window.startsAt?.getTime() ?? 0))

    return (
        <div className="max-w-[1400px] mx-auto">
            <PageHeader
                title="Droits publicitaires"
                description="Les six mois de publicité payante vendus avec chaque mission — ce qui arrive à terme, et ce qui aurait déjà dû être arrêté."
            />

            <div className="mb-4">
                <MetricStrip
                    metrics={[
                        {
                            label: 'À relancer sous 30 j',
                            value: String(expiringSoon.length),
                            hint: 'extension à proposer',
                            tone: expiringSoon.length > 0 ? 'accent' : 'default',
                        },
                        {
                            label: 'Hors délai',
                            value: String(outOfTime.length),
                            hint: 'publicité à arrêter',
                            tone: outOfTime.length > 0 ? 'accent' : 'default',
                        },
                        { label: 'En cours', value: String(active.length), hint: 'droits valides' },
                        { label: 'Départ non déclaré', value: String(awaiting.length), hint: 'aucune diffusion enregistrée' },
                    ]}
                />
            </div>

            {isLoading ? (
                <Panel>
                    <div className="divide-y divide-[#E2E2E1]">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/3" />
                                <div className="h-4 bg-[#F4F4F3] rounded w-24 ml-auto" />
                            </div>
                        ))}
                    </div>
                </Panel>
            ) : rows.length === 0 ? (
                <Panel>
                    <EmptyState
                        icon={Copyright}
                        title="Aucun droit publicitaire suivi"
                        description="Une mission apparaît ici dès que la marque a validé la vidéo finale et que la publicité payante fait partie des droits vendus."
                    />
                </Panel>
            ) : (
                <div className="flex flex-col gap-4">
                    <Section
                        title="À relancer"
                        rows={expiringSoon}
                        note="Ces droits expirent dans moins de 30 jours. C'est la fenêtre pour vendre une extension — après, le client doit couper."
                    />
                    <Section
                        title="Hors délai"
                        rows={outOfTime}
                        note="Ces publicités auraient dû être arrêtées. Les missions marquées « Hors contrat » ont aussi dépassé le délai d'arrêt : toute annonce encore en ligne engage MOSH."
                    />
                    <Section title="En cours" rows={active} />
                    <Section
                        title="Départ non déclaré"
                        rows={awaiting}
                        dateMode="start"
                        note="Personne n'a enregistré de première diffusion. Sans déclaration, la période de publicité s'ouvre d'elle-même à la date indiquée, que quelqu'un agisse ou non."
                    />
                </div>
            )}
        </div>
    )
}
