/**
 * Miniature reconstructions of the product, for the public brand landing.
 *
 * These are NOT screenshots. The live cockpit holds real client names, real
 * budgets and the agency's margin; publishing a capture of it would leak
 * confidential data onto an indexable page and go stale the day the product
 * changes. So each tab of the demo strip gets a hand-built miniature of the
 * real screen, filled with entirely invented data — an invented Swiss brand
 * (Sérac Cosmétiques) and invented creators, chosen so no mock can ever be
 * mistaken for one of the agency's actual campaigns.
 *
 * The workspace primitives are deliberately NOT imported: the landing must stay
 * self-contained and light, so their look is reproduced locally with the same
 * tokens. Everything here is presentational — no state, no data, no handlers —
 * and every frame is aria-hidden, because a screen reader has nothing to gain
 * from a fake interface. The caption next to the frame carries the meaning.
 */

import type { ComponentType, ReactNode } from 'react'

/* ── Local primitives ─────────────────────────────────────── */

const TONES = {
    progress: 'bg-[#1A1A1A] text-white',
    waiting: 'bg-[#FBF3E2] text-[#8A6100]',
    done: 'bg-[#E8F3EA] text-[#1A7F37]',
    alert: 'bg-[#FBEAE8] text-[#C0392B]',
    idle: 'bg-[#F4F4F3] text-[#6B6B6B] ring-1 ring-inset ring-[#E2E2E1]',
} as const

const LABEL = 'text-[10px] font-semibold uppercase tracking-wider text-[#9B9B9B]'

function Pill({ tone = 'idle', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONES[tone]}`}
        >
            {children}
        </span>
    )
}

function Chip({ on = false, children }: { on?: boolean; children: ReactNode }) {
    return (
        <span
            className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] ${on ? 'bg-[#1A1A1A] text-white' : 'border border-[#E2E2E1] bg-white text-[#1A1A1A]'
                }`}
        >
            {children}
        </span>
    )
}

/** The window: a header bar, then one dense surface. 16/10 on anything but phones. */
function Screen({
    app,
    crumb,
    badge,
    children,
}: {
    app: string
    crumb?: string
    badge?: ReactNode
    children: ReactNode
}) {
    return (
        <div
            aria-hidden="true"
            className="flex aspect-[4/3] w-full select-none flex-col overflow-hidden rounded-xl border border-[#E2E2E1] bg-white sm:aspect-[16/10]"
        >
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#E2E2E1] bg-[#FAFAF9] px-3">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] bg-[#1A1A1A] text-[9px] font-bold text-white">
                    M
                </span>
                <span className="truncate text-[11px] font-semibold text-[#1A1A1A]">{app}</span>
                {crumb && (
                    <span className="hidden min-w-0 items-center gap-1.5 text-[11px] text-[#9B9B9B] sm:flex">
                        <span className="text-[#C4C4C3]">›</span>
                        <span className="truncate">{crumb}</span>
                    </span>
                )}
                {badge && <span className="ml-auto shrink-0">{badge}</span>}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-[#F4F4F3] p-2.5 sm:p-4">{children}</div>
        </div>
    )
}

/** A bordered surface with a quiet caps header — the product's Panel, in miniature. */
function Panel({
    title,
    aside,
    padded = false,
    className = '',
    children,
}: {
    title?: string
    aside?: ReactNode
    padded?: boolean
    className?: string
    children: ReactNode
}) {
    return (
        <div className={`overflow-hidden rounded-lg border border-[#E2E2E1] bg-white ${className}`}>
            {(title || aside) && (
                <div className="flex h-7 items-center justify-between gap-2 border-b border-[#E2E2E1] px-2.5">
                    {title && <span className={`${LABEL} truncate`}>{title}</span>}
                    {aside && <span className="shrink-0 text-[10px] text-[#9B9B9B]">{aside}</span>}
                </div>
            )}
            <div className={padded ? 'p-2.5' : ''}>{children}</div>
        </div>
    )
}

/** A read-only form control, as the brief form renders one. */
function Field({ label, value, span = false }: { label: string; value: ReactNode; span?: boolean }) {
    return (
        <div className={span ? 'col-span-2' : 'min-w-0'}>
            <span className={`block ${LABEL}`}>{label}</span>
            <div className="mt-1 truncate rounded-lg border border-[#E2E2E1] bg-white px-2 py-1.5 text-[11px] text-[#1A1A1A]">
                {value}
            </div>
        </div>
    )
}

/** Completed tick / active ring / not-yet dot — the workflow's three states. */
function StepMark({ state }: { state: 'done' | 'active' | 'todo' }) {
    if (state === 'done') {
        return (
            <span className="grid h-3 w-3 shrink-0 place-items-center rounded-full bg-[#1A1A1A] text-[8px] leading-none text-white">
                ✓
            </span>
        )
    }
    if (state === 'active') {
        return <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[#1A1A1A]" />
    }
    return <span className="h-3 w-3 shrink-0 rounded-full border border-[#C4C4C3]" />
}

/* ── 01 · Objectifs — the brief form ──────────────────────── */

export function BrandDemoObjectifs() {
    return (
        <Screen app="Nouvelle campagne" crumb="Brief" badge={<Pill>Étape 1 sur 4</Pill>}>
            <Panel title="Brief de campagne" aside="Sérac Cosmétiques" padded className="h-full">
                <div className="grid grid-cols-2 gap-2.5">
                    <Field span label="Objectif de la campagne" value="Faire essayer la crème mains en pharmacie" />
                    <Field label="Produit / service" value="Crème mains Glacier 75 ml" />
                    <Field label="Livraison souhaitée" value="27 avril 2026" />

                    <div className="col-span-2">
                        <span className={`block ${LABEL}`}>Format</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                            <Chip on>9:16 vertical</Chip>
                            <Chip>1:1 carré</Chip>
                            <Chip>4:5 portrait</Chip>
                        </div>
                    </div>

                    <Field label="Créateurs souhaités" value="3" />
                    <Field label="Budget" value="CHF 4 800" />
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-[#E2E2E1] pt-2.5">
                    <span className="text-[11px] text-[#6B6B6B]">3 vidéos · date de livraison impérative</span>
                    <span className="ml-auto inline-flex h-7 items-center rounded-lg bg-[#1A1A1A] px-3 text-[11px] font-semibold text-white">
                        Envoyer le brief
                    </span>
                </div>
            </Panel>
        </Screen>
    )
}

/* ── 02 · Stratégie créative ──────────────────────────────── */

const ANGLES = [
    { title: 'Le geste de fin de journée', body: 'La crème comme rituel de réparation après le froid.' },
    { title: 'La preuve par la texture', body: "Gros plan sur l'absorption, sans film gras." },
    { title: 'Le conseil de comptoir', body: 'La recommandation en pharmacie, reprise par la créatrice.' },
]

export function BrandDemoStrategie() {
    return (
        <Screen app="Stratégie créative" crumb="Crème mains Glacier" badge={<Pill tone="done">Validée</Pill>}>
            <div className="flex h-full flex-col gap-2.5">
                <Panel title="Angles créatifs" aside="3 retenus">
                    <div className="divide-y divide-[#E2E2E1]">
                        {ANGLES.map((angle, index) => (
                            <div key={angle.title} className="flex min-w-0 items-start gap-2.5 px-2.5 py-2">
                                <span className="mt-0.5 shrink-0 text-[10px] font-semibold tabular-nums tracking-[0.16em] text-[#9B9B9B]">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-[12px] font-semibold text-[#1A1A1A]">{angle.title}</p>
                                    <p className="truncate text-[11px] text-[#6B6B6B]">{angle.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title="Public cible" padded>
                    <div className="flex flex-wrap gap-1.5">
                        <Chip on>Femmes 28–45</Chip>
                        <Chip on>Suisse romande</Chip>
                        <Chip>Peaux sèches</Chip>
                        <Chip>Achat en pharmacie</Chip>
                        <Chip>Instagram · TikTok</Chip>
                    </div>
                    <p className="mt-2.5 text-[11px] text-[#6B6B6B]">
                        <span className={LABEL}>Ton attendu</span>{' '}
                        <span className="text-[#1A1A1A]">chaleureux, factuel, sans promesse médicale.</span>
                    </p>
                </Panel>
            </div>
        </Screen>
    )
}

/* ── 03 · Concepts et scripts ─────────────────────────────── */

// The script travels as plain text everywhere (editor, studio, contract), so
// its hierarchy is typographic: a rule plus capitals for sections, an arrow for
// sub-sections. Shortened here to fit the miniature.
const RULE = '─'.repeat(34)

const SCRIPT = `${RULE}
1. CONTEXTE & OBJECTIF
${RULE}

Client / enseigne : Sérac Cosmétiques

Objectif de la vidéo :
Montrer la crème comme le geste de fin
de journée, pas comme un soin technique.

Public cible :
…

DATE DE TOURNAGE : mardi 14 avril 2026
LIVRAISON : lundi 27 avril 2026  ⚠ IMPÉRATIVE


${RULE}
2. STRATÉGIE & CONCEPT VIDÉO
${RULE}

➤ ANGLE & INTENTION

Message clé :
Réparer sans film gras.

Ton attendu :
…

➤ STRUCTURE RECOMMANDÉE

HOOKS SUGGÉRÉS
- « Mes mains ne tiennent pas l'hiver. »
- …`

export function BrandDemoScripts() {
    return (
        <Screen app="Script" crumb="Vidéo 1 · Témoignage" badge={<Pill tone="waiting">En rédaction</Pill>}>
            <Panel title="Script — modèle maison" aside="Enregistré" className="h-full">
                <pre className="h-full overflow-hidden whitespace-pre px-2.5 py-2 font-mono text-[10px] leading-[1.55] text-[#333333]">
                    {SCRIPT}
                </pre>
            </Panel>
        </Screen>
    )
}

/* ── 04 · Créateurs ───────────────────────────────────────── */

const CREATORS = [
    {
        initial: 'C',
        name: 'Camille Verdon',
        meta: 'Vaud · 27 ans',
        badges: ['Témoignage', 'Beauté'],
        rating: '4.8 ★ (12)',
        selected: true,
    },
    {
        initial: 'I',
        name: 'Ilona Grivel',
        meta: 'Fribourg · 31 ans',
        badges: ['Tutoriel', 'Soin'],
        rating: '4.9 ★ (21)',
        selected: true,
    },
    {
        initial: 'N',
        name: 'Noah Perrin',
        meta: 'Genève · 24 ans',
        badges: ['Lifestyle', 'Review'],
        rating: '4.6 ★ (8)',
        selected: false,
    },
]

export function BrandDemoCreateurs() {
    return (
        <Screen app="Sélection des créateurs" crumb="Proposition de profils" badge={<Pill>2 / 3 retenus</Pill>}>
            <div className="flex h-full flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex h-6 items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-2.5 text-[11px] font-semibold text-white">
                        Filtrer
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/20 px-1 text-[10px] tabular-nums text-white">
                            4
                        </span>
                    </span>
                    <Chip on>Témoignage</Chip>
                    <Chip on>Beauté</Chip>
                    <Chip>Vaud</Chip>
                    <Chip>Français</Chip>
                    <span className="text-[11px] tabular-nums text-[#9B9B9B]">12 créateurs sur 38</span>
                </div>

                <div className="grid min-h-0 grid-cols-2 gap-2 sm:grid-cols-3">
                    {CREATORS.map(creator => (
                        <div
                            key={creator.name}
                            className={`relative flex min-w-0 flex-col rounded-xl border p-2.5 ${creator.selected
                                ? 'border-[#1A1A1A] bg-[#F4F4F3] ring-1 ring-[#1A1A1A]'
                                : 'border-[#E2E2E1] bg-white'
                                }`}
                        >
                            {creator.selected && (
                                <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#1A1A1A] text-[9px] leading-none text-white">
                                    ✓
                                </span>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E2E2E1] bg-white text-[13px] font-medium text-[#6B6B6B]">
                                    {creator.initial}
                                </span>
                                <div className="min-w-0 pr-4">
                                    <p className="truncate text-[12px] font-medium text-[#1A1A1A]">{creator.name}</p>
                                    <p className="truncate text-[11px] text-[#9B9B9B]">{creator.meta}</p>
                                </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {creator.badges.map(badge => (
                                    <span
                                        key={badge}
                                        className="rounded-full border border-[#E2E2E1] bg-white px-2 py-0.5 text-[10px] text-[#1A1A1A]"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-2 border-t border-[#E2E2E1] pt-1.5 text-[11px] tabular-nums text-[#6B6B6B]">
                                {creator.rating}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Screen>
    )
}

/* ── 05 · Production — the mission workflow ───────────────── */

// Labels are the product's own, in the product's own order.
type StepState = 'done' | 'active' | 'todo'

const MOSH_STEPS: { label: string; state: StepState }[] = [
    { label: 'Analyse du brief', state: 'done' },
    { label: 'Proposition de profils', state: 'done' },
    { label: 'Rédaction du script', state: 'done' },
    { label: 'Envoi du script', state: 'done' },
    { label: 'Envoi de la mission', state: 'done' },
    { label: 'Contrôle qualité', state: 'todo' },
    { label: 'Envoi à la marque', state: 'todo' },
]

const BRAND_STEPS: { label: string; state: StepState }[] = [
    { label: 'Validation des créateurs', state: 'done' },
    { label: 'Validation du script', state: 'done' },
    { label: 'Review finale', state: 'todo' },
    { label: 'Validation finale', state: 'todo' },
]

const CREATOR_STEPS: { label: string; state: StepState }[] = [
    { label: 'Signature du contrat', state: 'done' },
    { label: 'Acceptation mission', state: 'done' },
    { label: 'Tournage', state: 'active' },
    { label: 'Livraison de la vidéo', state: 'todo' },
]

function WorkflowColumn({
    letter,
    title,
    steps,
    active = false,
}: {
    letter: string
    title: string
    steps: { label: string; state: StepState }[]
    active?: boolean
}) {
    return (
        <div
            className={`min-w-0 rounded-lg p-2 ${active ? 'border border-[#1A1A1A] bg-white' : 'border border-[#E2E2E1] bg-[#FAFAF9]'
                }`}
        >
            <div className="mb-1.5 flex items-center gap-1.5">
                <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] text-[10px] font-bold ${active ? 'bg-[#1A1A1A] text-white' : 'bg-[#F4F4F3] text-[#6B6B6B]'
                        }`}
                >
                    {letter}
                </span>
                <p className="truncate text-[11px] font-semibold text-[#1A1A1A]">{title}</p>
            </div>
            <div className="space-y-0.5">
                {steps.map(step => (
                    <div
                        key={step.label}
                        className={`flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] ${step.state === 'done'
                            ? 'bg-[#F4F4F3] text-[#6B6B6B]'
                            : step.state === 'active'
                                ? 'border border-[#E2E2E1] bg-white font-semibold text-[#1A1A1A]'
                                : 'text-[#9B9B9B]'
                            }`}
                    >
                        <StepMark state={step.state} />
                        <span className="truncate">{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function BrandDemoProduction() {
    return (
        <Screen app="Mission" crumb="Crème mains Glacier" badge={<Pill>Créateur : Tournage</Pill>}>
            <div className="flex h-full flex-col gap-2.5">
                <div className="flex items-center gap-2.5 rounded-lg border border-[#E2E2E1] bg-white px-2.5 py-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[4px] bg-[#1A1A1A] text-[10px] font-bold text-white">
                        P
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-[#1A1A1A]">Pipeline</p>
                        <p className="text-[10px] tabular-nums text-[#9B9B9B]">9/15 étapes</p>
                    </div>
                    <div className="ml-auto hidden w-32 items-center gap-2 sm:flex">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F4F4F3]">
                            <div className="h-full w-3/5 rounded-full bg-[#1A1A1A]" />
                        </div>
                        <span className="text-[10px] tabular-nums text-[#9B9B9B]">60%</span>
                    </div>
                </div>

                <div className="grid min-h-0 grid-cols-3 gap-1.5 sm:gap-2">
                    <WorkflowColumn letter="M" title="MOSH" steps={MOSH_STEPS} />
                    <WorkflowColumn letter="B" title="Marque" steps={BRAND_STEPS} />
                    <WorkflowColumn letter="C" title="Créateur" steps={CREATOR_STEPS} active />
                </div>
            </div>
        </Screen>
    )
}

/* ── 06 · Validations ─────────────────────────────────────── */

const VALIDATIONS: { label: string; date: string; state: 'done' | 'todo' }[] = [
    { label: 'Validation des créateurs', date: '12 mars 2026', state: 'done' },
    { label: 'Validation du script', date: '19 mars 2026', state: 'done' },
    { label: 'Contrôle qualité', date: '24 avril 2026', state: 'done' },
    { label: 'Review finale', date: 'En attente', state: 'todo' },
]

const RIGHTS: { label: string; value: string; tone: 'included' | 'excluded' }[] = [
    {
        label: 'Diffusion sur les canaux de la marque',
        value: 'Incluse, sans limite de durée, dans le monde entier',
        tone: 'included',
    },
    { label: 'Publicité payante', value: '6 mois, dès la première diffusion', tone: 'included' },
    { label: 'Montage et adaptations', value: 'Recadrage, sous-titres, versions courtes', tone: 'included' },
    { label: 'Publication sur le compte du créateur', value: 'Non demandée', tone: 'excluded' },
    { label: 'Exclusivité', value: 'Aucune', tone: 'excluded' },
]

export function BrandDemoValidations() {
    return (
        <Screen app="Validations" crumb="Crème mains Glacier" badge={<Pill tone="done">3 étapes validées</Pill>}>
            <div className="flex h-full flex-col gap-2.5">
                <Panel title="Étapes validées">
                    <div className="divide-y divide-[#E2E2E1]">
                        {VALIDATIONS.map(item => (
                            <div key={item.label} className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">
                                <StepMark state={item.state === 'done' ? 'done' : 'active'} />
                                <span className="truncate text-[11px] text-[#1A1A1A]">{item.label}</span>
                                <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[#9B9B9B]">
                                    {item.date}
                                </span>
                                {item.state === 'done' ? (
                                    <Pill tone="done">Validé</Pill>
                                ) : (
                                    <Pill tone="waiting">À valider</Pill>
                                )}
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel title="Droits accordés" aside="Contrat signé">
                    <div className="divide-y divide-[#E2E2E1]">
                        {RIGHTS.map(right => (
                            <div key={right.label} className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">
                                <span
                                    className={`w-3 shrink-0 text-center text-[11px] leading-none ${right.tone === 'included' ? 'text-[#1A7F37]' : 'text-[#9B9B9B]'
                                        }`}
                                >
                                    {right.tone === 'included' ? '✓' : '–'}
                                </span>
                                <span
                                    className={`truncate text-[11px] ${right.tone === 'included' ? 'text-[#6B6B6B]' : 'text-[#9B9B9B]'
                                        }`}
                                >
                                    {right.label}
                                </span>
                                <span
                                    className={`ml-auto hidden shrink-0 text-[11px] sm:inline ${right.tone === 'included' ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'
                                        }`}
                                >
                                    {right.value}
                                </span>
                                {right.tone === 'included' && <Pill tone="done">Inclus</Pill>}
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </Screen>
    )
}

/* ── 07 · Contenus livrés ─────────────────────────────────── */

const DELIVERIES: { title: string; meta: string; status: string; tone: keyof typeof TONES }[] = [
    { title: 'Vidéo 1 · Témoignage', meta: '9:16 · 0:28', status: 'Validée ✓', tone: 'done' },
    { title: 'Vidéo 2 · Tutoriel', meta: '9:16 · 0:34', status: 'Validée ✓', tone: 'done' },
    { title: 'Vidéo 3 · Unboxing', meta: '9:16 · 0:22', status: 'À valider', tone: 'waiting' },
]

export function BrandDemoLivres() {
    return (
        <Screen app="Contenus livrés" crumb="Crème mains Glacier" badge={<Pill tone="done">2 / 3 validées</Pill>}>
            <div className="flex h-full flex-col gap-2.5">
                <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
                    {DELIVERIES.map(item => (
                        <div key={item.title} className="flex min-h-0 min-w-0 flex-col">
                            <div className="grid min-h-0 flex-1 place-items-center rounded-lg border border-[#E2E2E1] bg-[#FAFAF9]">
                                <span className="h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-[#C4C4C3]" />
                            </div>
                            <p className="mt-1.5 truncate text-[11px] font-medium text-[#1A1A1A]">{item.title}</p>
                            <div className="mt-1 flex min-w-0 items-center gap-1.5">
                                <span className="shrink-0 text-[10px] tabular-nums text-[#9B9B9B]">{item.meta}</span>
                                <span className="ml-auto min-w-0">
                                    <Pill tone={item.tone}>{item.status}</Pill>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <Panel title="Droits cédés à la marque" padded>
                    <div className="flex flex-wrap gap-1.5">
                        <Chip>Canaux de la marque · illimité</Chip>
                        <Chip>Publicité payante · 6 mois</Chip>
                        <Chip>Montage et adaptations</Chip>
                    </div>
                </Panel>
            </div>
        </Screen>
    )
}

/* ── Dispatcher ───────────────────────────────────────────── */

const SCREENS: Record<string, ComponentType> = {
    objectifs: BrandDemoObjectifs,
    strategie: BrandDemoStrategie,
    scripts: BrandDemoScripts,
    createurs: BrandDemoCreateurs,
    production: BrandDemoProduction,
    validations: BrandDemoValidations,
    livres: BrandDemoLivres,
}

/** Renders the miniature for a demo tab; unknown keys render nothing. */
export function BrandDemoScreen({ tabKey }: { tabKey: string }) {
    const Component = SCREENS[tabKey]
    return Component ? <Component /> : null
}
