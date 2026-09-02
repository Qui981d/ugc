import type { ReactElement, ReactNode } from 'react'
import { Check, Plus, Minus } from 'lucide-react'
import { CREATOR_PAGE } from '@/lib/constants/landing'

/**
 * Miniature reconstructions of the creator workspace, for the public landing.
 *
 * They are drawn, not screenshotted. The live product holds real client names,
 * real budgets and real creator fees; a capture would publish confidential data
 * on an indexable page and would go stale on the next release. Everything below
 * is invented — the brands are plausible Swiss names that appear nowhere in the
 * client list, and every amount is a *creator fee*, never a client budget: the
 * platform deliberately never shows one to the other.
 *
 * The workspace primitives are reproduced locally rather than imported from
 * @/components/ui/workspace, so the landing stays self-contained and light.
 * The frames are aria-hidden: a screen reader is not read a fake interface —
 * the list of features beside them carries the meaning.
 */

// ── Local echoes of the workspace primitives ───────────────

type Tone = 'progress' | 'waiting' | 'done' | 'idle' | 'alert'

const TONES: Record<Tone, string> = {
    // Never ink text on an ink fill.
    progress: 'bg-[#1A1A1A] text-white',
    waiting: 'bg-[#FBF3E2] text-[#8A6100]',
    done: 'bg-[#E8F3EA] text-[#1A7F37]',
    idle: 'bg-[#F4F4F3] text-[#6B6B6B] ring-1 ring-inset ring-[#E2E2E1]',
    alert: 'bg-[#FBEAE8] text-[#C0392B]',
}

function Pill({ tone = 'idle', children }: { tone?: Tone; children: ReactNode }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-semibold whitespace-nowrap ${TONES[tone]}`}
        >
            {children}
        </span>
    )
}

/** The product's browser-less window: chrome bar, page header, content. */
function Frame({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
    return (
        <div
            aria-hidden="true"
            className="w-full overflow-hidden rounded-xl border border-[#E2E2E1] bg-[#FAFAF9] sm:aspect-[4/3] lg:aspect-[16/10]"
        >
            <div className="flex h-7 items-center gap-2 border-b border-[#E2E2E1] bg-white px-2.5">
                <span className="text-[10px] font-semibold tracking-[0.16em] text-[#1A1A1A]">MOSH</span>
                <span className="h-3 w-px bg-[#E2E2E1]" />
                <span className="truncate text-[10px] text-[#9B9B9B]">Espace créateur</span>
                <span className="ml-auto flex items-center gap-1.5">
                    <span className="truncate text-[10px] text-[#9B9B9B]">Elina R.</span>
                    <span className="h-3.5 w-3.5 rounded-full bg-[#F4F4F3] ring-1 ring-inset ring-[#E2E2E1]" />
                </span>
            </div>

            <div className="flex flex-col gap-2 p-2.5 sm:h-[calc(100%-1.75rem)] sm:overflow-hidden">
                <div className="flex items-baseline gap-2 border-b border-[#E2E2E1] pb-1.5">
                    <p className="truncate text-[12px] font-semibold text-[#1A1A1A] sm:text-[13px]">{title}</p>
                    {meta && <p className="truncate text-[10px] text-[#9B9B9B]">{meta}</p>}
                </div>
                {children}
            </div>
        </div>
    )
}

/** One surface split by dividers, rather than N floating stat cards. */
function Metrics({ items }: { items: { label: string; value: string; hint?: string }[] }) {
    return (
        <div className="grid grid-cols-2 divide-x divide-y divide-[#E2E2E1] overflow-hidden rounded-lg border border-[#E2E2E1] bg-white sm:grid-cols-4 sm:divide-y-0">
            {items.map(m => (
                <div key={m.label} className="min-w-0 px-2 py-1.5">
                    <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                        {m.label}
                    </p>
                    <p className="truncate text-[13px] font-semibold tabular-nums text-[#1A1A1A]">{m.value}</p>
                    {m.hint && <p className="truncate text-[10px] text-[#9B9B9B]">{m.hint}</p>}
                </div>
            ))}
        </div>
    )
}

function Box({ label, action, children }: { label: string; action?: string; children: ReactNode }) {
    return (
        <div className="overflow-hidden rounded-lg border border-[#E2E2E1] bg-white">
            <div className="flex h-6 items-center justify-between gap-2 border-b border-[#E2E2E1] px-2.5">
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">{label}</p>
                {action && <span className="shrink-0 text-[10px] text-[#6B6B6B]">{action}</span>}
            </div>
            {children}
        </div>
    )
}

function Rows({ children }: { children: ReactNode }) {
    return <div className="divide-y divide-[#E2E2E1]">{children}</div>
}

function Row({ children }: { children: ReactNode }) {
    return <div className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">{children}</div>
}

/** Title + subtitle, the left-hand block of every list row. */
function RowText({ title, meta }: { title: string; meta: string }) {
    return (
        <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#1A1A1A] sm:text-[12px]">{title}</p>
            <p className="truncate text-[10px] text-[#9B9B9B]">{meta}</p>
        </div>
    )
}

/** The creator's fee. Never a client budget. */
function Fee({ children }: { children: ReactNode }) {
    return (
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#1A1A1A] sm:text-[12px]">
            {children}
        </span>
    )
}

function Progress({ done, total }: { done: number; total: number }) {
    return (
        <div className="mt-1 flex max-w-[160px] items-center gap-1.5">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#F4F4F3]">
                <span
                    className="block h-full rounded-full bg-[#1A1A1A]"
                    style={{ width: `${(done / total) * 100}%` }}
                />
            </span>
            <span className="text-[10px] tabular-nums text-[#9B9B9B]">
                {done}/{total}
            </span>
        </div>
    )
}

/** A definition line: label above, value below. */
function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-wider text-[#9B9B9B]">{label}</p>
            <p className="truncate text-[11px] text-[#1A1A1A] sm:text-[12px]">{value}</p>
        </div>
    )
}

// ── 01 · Tableau de bord ───────────────────────────────────

export function DashboardScreen() {
    return (
        <Frame title="Vue d'ensemble" meta="Bienvenue, Elina">
            <Metrics
                items={[
                    { label: 'Actions à réaliser', value: '2', hint: 'À traiter' },
                    { label: 'Prochaine échéance', value: '18 sept.', hint: 'Alpiflor' },
                    { label: 'Campagnes en cours', value: '3', hint: 'En production' },
                    { label: 'Paiement attendu', value: 'CHF 750.00', hint: 'À venir' },
                ]}
            />

            <Box label="Actions à réaliser">
                <Rows>
                    <Row>
                        <RowText title="Signer le contrat" meta="Maison Vaudaire · Collection automne" />
                        <Pill tone="waiting">À toi</Pill>
                        <Fee>CHF 750.00</Fee>
                    </Row>
                    <Row>
                        <RowText title="Livrer la vidéo 2 sur 3" meta="Alpiflor · Routine hydratation" />
                        <Pill tone="waiting">À toi</Pill>
                        <Fee>18 sept.</Fee>
                    </Row>
                </Rows>
            </Box>

            <Box label="Campagnes en cours" action="Voir tout">
                <Rows>
                    <Row>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-[#1A1A1A] sm:text-[12px]">
                                Routine hydratation
                            </p>
                            <p className="truncate text-[10px] text-[#9B9B9B]">Alpiflor · UGC vertical · 18.09.2026</p>
                            <Progress done={3} total={5} />
                        </div>
                        <Pill tone="progress">Tournage</Pill>
                        <Fee>CHF 900.00</Fee>
                    </Row>
                    <Row>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-[#1A1A1A] sm:text-[12px]">
                                Collection automne
                            </p>
                            <p className="truncate text-[10px] text-[#9B9B9B]">
                                Maison Vaudaire · UGC vertical · 26.09.2026
                            </p>
                            <Progress done={1} total={5} />
                        </div>
                        <Pill tone="waiting">Contrat à signer</Pill>
                        <Fee>CHF 750.00</Fee>
                    </Row>
                </Rows>
            </Box>
        </Frame>
    )
}

// ── 02 · Opportunités ──────────────────────────────────────

const RIGHTS: { tone: 'included' | 'extra' | 'excluded'; label: string; value: string }[] = [
    { tone: 'included', label: 'Réseaux de la marque', value: '6 mois' },
    { tone: 'extra', label: 'Publicité payante', value: '3 mois' },
    { tone: 'excluded', label: 'Publication sur ton compte', value: 'Non demandée' },
]

export function OpportunitesScreen() {
    return (
        <Frame title="Proposition de mission" meta="Reçue le 02.09.2026">
            <div className="overflow-hidden rounded-lg border border-[#E2E2E1] bg-white">
                <div className="flex items-center gap-2 border-b border-[#E2E2E1] px-2.5 py-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#F4F4F3] text-[10px] font-semibold text-[#6B6B6B]">
                        SG
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-[#1A1A1A]">Sérac Genève</p>
                        <p className="truncate text-[10px] text-[#9B9B9B]">Genève · Soins et bien-être</p>
                    </div>
                    <Pill tone="waiting">Nouvelle proposition</Pill>
                </div>

                <div className="px-2.5 py-2">
                    <p className="text-[12px] font-semibold text-[#1A1A1A] sm:text-[13px]">
                        2 vidéos UGC — rituel du matin
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                        <div className="min-w-0">
                            <p className="truncate text-[10px] uppercase tracking-wider text-[#9B9B9B]">Rémunération</p>
                            <p className="truncate text-[13px] font-semibold tabular-nums text-[#1A1A1A]">
                                CHF 640.00
                            </p>
                        </div>
                        <Field label="Livrables" value="2 vidéos 9:16, 30 s" />
                        <Field label="Tournage" value="15 – 19 sept." />
                        <Field label="Livraison" value="22 sept." />
                    </div>
                </div>

                <div className="border-t border-[#E2E2E1] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">Droits</p>
                    <div className="mt-1 divide-y divide-[#E2E2E1]">
                        {RIGHTS.map(line => (
                            <div key={line.label} className="flex items-center justify-between gap-2 py-1">
                                <span className="flex min-w-0 items-center gap-1.5">
                                    {line.tone === 'included' && (
                                        <Check className="h-3 w-3 shrink-0 text-[#1A7F37]" strokeWidth={2.2} />
                                    )}
                                    {line.tone === 'extra' && (
                                        <Plus className="h-3 w-3 shrink-0 text-[#8A6100]" strokeWidth={2.2} />
                                    )}
                                    {line.tone === 'excluded' && (
                                        <Minus className="h-3 w-3 shrink-0 text-[#9B9B9B]" strokeWidth={2.2} />
                                    )}
                                    <span
                                        className={`truncate text-[11px] ${line.tone === 'excluded' ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}
                                    >
                                        {line.label}
                                    </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                    <span
                                        className={`text-[11px] ${line.tone === 'excluded' ? 'text-[#9B9B9B]' : 'text-[#1A1A1A]'}`}
                                    >
                                        {line.value}
                                    </span>
                                    {line.tone === 'included' && <Pill tone="done">Inclus</Pill>}
                                    {line.tone === 'extra' && <Pill tone="waiting">Option payée</Pill>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 border-t border-[#E2E2E1] px-2.5 py-2">
                    <span className="inline-flex h-7 items-center rounded-lg bg-[#1A1A1A] px-2.5 text-[11px] font-semibold text-white">
                        Accepter la mission
                    </span>
                    <span className="inline-flex h-7 items-center rounded-lg border border-[#E2E2E1] bg-white px-2.5 text-[11px] font-medium text-[#1A1A1A]">
                        Refuser
                    </span>
                    <span className="text-[10px] text-[#9B9B9B]">Demander un autre tarif</span>
                </div>
            </div>
        </Frame>
    )
}

// ── 03 · Campagne ──────────────────────────────────────────

/**
 * Verbatim from WORKFLOW_STEPS — the labels the product actually shows,
 * in their real order. Only the steps a creator sees are kept.
 */
const STEPS: { label: string; state: 'done' | 'current' | 'todo' }[] = [
    { label: 'Analyse du brief', state: 'done' },
    { label: 'Rédaction du script', state: 'done' },
    { label: 'Validation du script', state: 'done' },
    { label: 'Signature du contrat', state: 'done' },
    { label: 'Tournage', state: 'current' },
    { label: 'Livraison de la vidéo', state: 'todo' },
    { label: 'Contrôle qualité', state: 'todo' },
    { label: 'Validation finale', state: 'todo' },
]

export function CampagneScreen() {
    return (
        <Frame title="Routine hydratation" meta="Alpiflor · UGC vertical">
            <div className="grid gap-2 sm:grid-cols-5">
                <div className="flex flex-col gap-2 sm:col-span-3">
                    <Box label="Brief">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-2.5 py-2">
                            <Field label="Produit" value="Sérum hydratant 30 ml" />
                            <Field label="Format" value="9:16 · 30 secondes" />
                            <Field label="Objectif" value="Faire essayer le sérum" />
                            <Field label="Retours inclus" value="2 révisions" />
                        </div>
                    </Box>

                    <Box label="Script" action="Validé">
                        <div className="px-2.5 py-2">
                            <p className="rounded-lg bg-[#F4F4F3] px-2 py-1.5 text-[11px] leading-snug text-[#1A1A1A]">
                                Hook — « Trois gouttes le matin, et ma peau tient toute la journée. »
                                <span className="block text-[#6B6B6B]">
                                    Plan 1 · salle de bain, lumière naturelle, application face caméra.
                                </span>
                            </p>
                        </div>
                    </Box>

                    <div className="rounded-lg border border-[#FBF3E2] bg-[#FBF3E2] px-2.5 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6100]">
                            Retour de la marque · révision 1 sur 2
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-[#8A6100]">
                            Garde le plan 1, raccourcis l&apos;intro de deux secondes.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                    <Box label="Planning">
                        <Rows>
                            <Row>
                                <span className="flex-1 truncate text-[11px] text-[#6B6B6B]">Tournage</span>
                                <span className="text-[11px] tabular-nums text-[#1A1A1A]">15 – 16 sept.</span>
                            </Row>
                            <Row>
                                <span className="flex-1 truncate text-[11px] text-[#6B6B6B]">Livraison</span>
                                <span className="text-[11px] tabular-nums text-[#1A1A1A]">18 sept.</span>
                            </Row>
                        </Rows>
                    </Box>

                    <Box label="Livrables" action="1 / 3">
                        <Rows>
                            <Row>
                                <span className="flex-1 truncate text-[11px] text-[#1A1A1A]">Vidéo 1</span>
                                <Pill tone="done">QC validé</Pill>
                            </Row>
                            <Row>
                                <span className="flex-1 truncate text-[11px] text-[#1A1A1A]">Vidéo 2</span>
                                <Pill tone="waiting">À livrer</Pill>
                            </Row>
                            <Row>
                                <span className="flex-1 truncate text-[11px] text-[#1A1A1A]">Vidéo 3</span>
                                <Pill tone="idle">À livrer</Pill>
                            </Row>
                        </Rows>
                    </Box>

                    <Box label="Suivi de la mission">
                        <ol className="px-2.5 py-1.5">
                            {STEPS.map(step => (
                                <li key={step.label} className="flex items-center gap-1.5 py-0.5">
                                    <span
                                        className={`grid h-3 w-3 shrink-0 place-items-center rounded-full ${step.state === 'done'
                                            ? 'bg-[#E8F3EA] text-[#1A7F37]'
                                            : step.state === 'current'
                                                ? 'bg-[#1A1A1A] text-white'
                                                : 'bg-white ring-1 ring-inset ring-[#E2E2E1]'
                                            }`}
                                    >
                                        {step.state === 'done' && <Check className="h-2 w-2" strokeWidth={3} />}
                                        {step.state === 'current' && (
                                            <span className="h-1 w-1 rounded-full bg-white" />
                                        )}
                                    </span>
                                    <span
                                        className={`truncate text-[11px] ${step.state === 'todo' ? 'text-[#C4C4C3]' : 'text-[#1A1A1A]'}`}
                                    >
                                        {step.label}
                                    </span>
                                    {step.state === 'current' && (
                                        <span className="ml-auto shrink-0 text-[10px] text-[#9B9B9B]">En cours</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </Box>
                </div>
            </div>
        </Frame>
    )
}

// ── 04 · Contrats et paiements ─────────────────────────────

export function PaiementsScreen() {
    return (
        <Frame title="Contrats et paiements" meta="Année 2026">
            <Metrics
                items={[
                    { label: 'Total perçu', value: 'CHF 1 380.00', hint: '2 missions' },
                    { label: 'En attente', value: 'CHF 750.00', hint: '1 facture' },
                    { label: 'Contrats signés', value: '4', hint: 'Tous consultables' },
                    { label: 'Prochain paiement', value: '30 sept.', hint: 'Rive Cinq' },
                ]}
            />

            <Box label="Contrats signés" action="Voir tout">
                <Rows>
                    <Row>
                        <RowText title="Contrat MOSH · Collection automne" meta="Maison Vaudaire" />
                        <Pill tone="done">Signé le 02.09</Pill>
                        <Fee>CHF 750.00</Fee>
                    </Row>
                    <Row>
                        <RowText title="Contrat MOSH · Routine hydratation" meta="Alpiflor" />
                        <Pill tone="done">Signé le 21.08</Pill>
                        <Fee>CHF 900.00</Fee>
                    </Row>
                </Rows>
            </Box>

            <Box label="Factures et paiements">
                <Rows>
                    <Row>
                        <RowText title="Facture 2026-041" meta="Alpiflor · Routine hydratation" />
                        <Pill tone="done">Payé</Pill>
                        <Fee>CHF 900.00</Fee>
                    </Row>
                    <Row>
                        <RowText title="Facture 2026-047" meta="Maison Vaudaire · Collection automne" />
                        <Pill tone="waiting">En attente</Pill>
                        <Fee>CHF 750.00</Fee>
                    </Row>
                    <Row>
                        <RowText title="Paiement prévu" meta="Rive Cinq · Terrasse d'automne" />
                        <Pill tone="idle">Prévu le 30.09</Pill>
                        <Fee>CHF 480.00</Fee>
                    </Row>
                </Rows>
            </Box>
        </Frame>
    )
}

// ── Dispatcher, keyed to CREATOR_PAGE.demo.tabs ────────────

type DemoTabKey = (typeof CREATOR_PAGE.demo.tabs)[number]['key']

/** Keyed by tab, so a new tab cannot ship without its screen. */
const SCREENS: Record<DemoTabKey, () => ReactElement> = {
    dashboard: DashboardScreen,
    opportunites: OpportunitesScreen,
    campagne: CampagneScreen,
    paiements: PaiementsScreen,
}

export function CreatorDemoScreen({ tabKey }: { tabKey: DemoTabKey }) {
    const Screen = SCREENS[tabKey]
    return <Screen />
}
