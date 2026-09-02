'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { ChevronRight } from 'lucide-react'
import {
    Section,
    Eyebrow,
    Title,
    Lead,
    CtaPrimary,
    CtaSecondary,
    LandingHeader,
    LogoBand,
    AssetPlaceholder,
    Faq,
    LandingFooter,
} from '@/components/landing/shell'
import { BrandDemoScreen } from '@/components/landing/BrandDemoScreens'
import {
    BRAND_PAGE,
    CASE_FILTERS,
    CASE_STUDIES,
    CLIENT_LOGOS,
} from '@/lib/constants/landing'

/**
 * Public landing — brands.
 *
 * Every word on this page comes from BRAND_PAGE; the file holds layout only.
 * It is a client component because two blocks are genuinely interactive (the
 * product demo tab strip and the case filters), which is why the metadata and
 * the FAQ structured data sit in layout.tsx instead.
 */

// Declared once so every interactive element on the page keeps the same
// visible keyboard state.
const FOCUS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:ring-offset-2'

export default function BrandLandingPage() {
    return (
        <div className="bg-white">
            <LandingHeader links={BRAND_PAGE.nav} cta={BRAND_PAGE.ctaPrimary} />

            <main>
                <Hero />

                <LogoBand title={BRAND_PAGE.proof.title} logos={CLIENT_LOGOS} />

                <Demo />
                <Problem />
                <Method />
                <Cases />
                <Guarantee />
                <Automation />
                <Expertise />
                <FaqBlock />
                <FinalCta />
            </main>

            <LandingFooter />
        </div>
    )
}

// ── 01 · Hero ──────────────────────────────────────────────

function Hero() {
    const { hero, ctaPrimary, ctaSecondary } = BRAND_PAGE

    return (
        <Section>
            <div className="max-w-[46rem]">
                <Eyebrow>{hero.label}</Eyebrow>

                {/* The page's only h1. */}
                <h1 className="mt-6 text-[32px] md:text-[46px] lg:text-[52px] font-semibold leading-[1.06] tracking-[-0.03em] text-balance text-[#1A1A1A]">
                    {hero.title}
                </h1>

                <div className="mt-8 space-y-3">
                    <Lead>{hero.intro}</Lead>
                    <p className="text-[15px] md:text-[16px] leading-relaxed text-[#9B9B9B] max-w-[62ch]">
                        {hero.functional}
                    </p>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                    <CtaPrimary href={ctaPrimary.href}>{ctaPrimary.label}</CtaPrimary>
                    <CtaSecondary href={ctaSecondary.href}>{ctaSecondary.label}</CtaSecondary>
                </div>
            </div>
        </Section>
    )
}

// ── 02 · Product demo ──────────────────────────────────────

function Demo() {
    const tabs = BRAND_PAGE.demo.tabs
    const [active, setActive] = useState(0)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Roving focus: arrows move between tabs, Home/End jump to the ends.
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const last = tabs.length - 1
        let next: number | null = null

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = active === last ? 0 : active + 1
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = active === 0 ? last : active - 1
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = last

        if (next === null) return
        event.preventDefault()
        setActive(next)
        tabRefs.current[next]?.focus()
    }

    const current = tabs[active]

    return (
        <Section id="demonstration" tone="paper" className="scroll-mt-16">
            <div className="max-w-[42rem]">
                <Title size="lg">{BRAND_PAGE.demo.title}</Title>
                <div className="mt-6">
                    <Lead>{BRAND_PAGE.demo.body}</Lead>
                </div>
            </div>

            {/* Horizontally scrollable on small screens rather than wrapping
                into a ragged block of pills. */}
            <div className="mt-12 -mx-6 px-6 overflow-x-auto">
                <div
                    role="tablist"
                    aria-label="Étapes de la campagne"
                    onKeyDown={onKeyDown}
                    className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[#F4F4F3] whitespace-nowrap"
                >
                    {tabs.map((tab, index) => {
                        const on = index === active
                        return (
                            <button
                                key={tab.key}
                                ref={element => {
                                    tabRefs.current[index] = element
                                }}
                                type="button"
                                role="tab"
                                id={`demo-tab-${tab.key}`}
                                aria-selected={on}
                                aria-controls={`demo-panel-${tab.key}`}
                                tabIndex={on ? 0 : -1}
                                onClick={() => setActive(index)}
                                className={`inline-flex items-center h-10 px-4 rounded-full text-[14px] transition-colors ${FOCUS} focus-visible:ring-offset-[#F4F4F3] ${on
                                    ? 'bg-[#1A1A1A] text-white font-semibold'
                                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] font-medium'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div
                key={current.key}
                role="tabpanel"
                id={`demo-panel-${current.key}`}
                aria-labelledby={`demo-tab-${current.key}`}
                tabIndex={0}
                className={`mt-8 rounded-xl animate-in fade-in duration-300 motion-reduce:animate-none ${FOCUS}`}
            >
                <BrandDemoScreen tabKey={current.key} />
                <p className="mt-4 text-[15px] leading-relaxed text-[#6B6B6B] max-w-[62ch]">{current.caption}</p>
                <p className="mt-4 text-[13px] uppercase tracking-[0.14em] font-semibold text-[#9B9B9B]">
                    {current.label}
                </p>
            </div>
        </Section>
    )
}

// ── 03 · Problem ───────────────────────────────────────────

function Problem() {
    const { problem } = BRAND_PAGE

    return (
        <Section tone="muted">
            <div className="max-w-[42rem]">
                <Title size="lg">{problem.title}</Title>
                <div className="mt-6">
                    <Lead>{problem.body}</Lead>
                </div>
            </div>

            {/* The closing line carries the section: given its own rule and
                set at heading weight rather than buried in the paragraph. */}
            <p className="mt-12 pt-10 border-t border-[#E2E2E1] text-[22px] md:text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-balance text-[#1A1A1A] max-w-[34ch]">
                {problem.conclusion}
            </p>
        </Section>
    )
}

// ── 04 · Method ────────────────────────────────────────────

function Method() {
    const { method } = BRAND_PAGE

    return (
        <Section id="methode" tone="paper" className="scroll-mt-16">
            <div className="max-w-[42rem]">
                <Eyebrow>{method.label}</Eyebrow>
                <div className="mt-5">
                    <Title size="lg">{method.title}</Title>
                </div>
                <div className="mt-6">
                    <Lead>{method.intro}</Lead>
                </div>
            </div>

            {/* A real sequence, so it is numbered — and divided rather than
                stacked as six separate cards. */}
            <ol className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#E2E2E1]">
                {method.steps.map((step, index) => (
                    <li key={step.title} className="border-r border-b border-[#E2E2E1] p-6 md:p-8">
                        <span className="text-[12px] font-semibold tabular-nums tracking-[0.16em] text-[#9B9B9B]">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="mt-4 text-[18px] md:text-[19px] font-semibold leading-snug text-[#1A1A1A]">
                            {step.title}
                        </h3>
                        <p className="mt-2.5 text-[15px] leading-relaxed text-[#6B6B6B]">{step.body}</p>
                    </li>
                ))}
            </ol>
        </Section>
    )
}

// ── 05 · Cases ─────────────────────────────────────────────

function Cases() {
    const { cases } = BRAND_PAGE
    const [filter, setFilter] = useState<string | null>(null)

    const visible = filter ? CASE_STUDIES.filter(c => c.category === filter) : CASE_STUDIES

    return (
        <Section id="realisations" tone="muted" className="scroll-mt-16">
            <div className="max-w-[42rem]">
                <Title size="lg">{cases.title}</Title>
                <div className="mt-6">
                    <Lead>{cases.body}</Lead>
                </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filtrer les campagnes">
                {CASE_FILTERS.map(name => {
                    const on = filter === name
                    return (
                        <button
                            key={name}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setFilter(on ? null : name)}
                            className={`inline-flex items-center h-9 px-4 rounded-full border text-[13.5px] font-medium transition-colors ${FOCUS} focus-visible:ring-offset-[#F4F4F3] ${on
                                ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                                : 'bg-white border-[#E2E2E1] text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#C4C4C3]'
                                }`}
                        >
                            {name}
                        </button>
                    )
                })}
            </div>

            {visible.length > 0 ? (
                <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visible.map(study => (
                        <li key={`${study.brand}-${study.objective}`} className="min-w-0">
                            <AssetPlaceholder label={study.brand} ratio="aspect-[4/5]" />
                            <h3 className="mt-4 text-[16px] font-semibold text-[#1A1A1A]">{study.brand}</h3>
                            <p className="mt-1 text-[14px] leading-relaxed text-[#6B6B6B]">{study.objective}</p>
                            <p className="mt-2 text-[12px] uppercase tracking-[0.14em] font-semibold text-[#9B9B9B]">
                                {study.category}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                // Honest rather than broken: no skeleton grid, no fake tiles.
                <div className="mt-10 rounded-xl border border-dashed border-[#C4C4C3] bg-white px-6 py-16 text-center">
                    <p className="text-[15px] font-semibold text-[#1A1A1A]">
                        {'Les campagnes sont en cours de préparation.'}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#6B6B6B] max-w-[46ch] mx-auto">
                        {'Elles seront publiées ici dès que les marques concernées auront donné leur accord.'}
                    </p>
                </div>
            )}

            <div className="mt-10">
                <button
                    type="button"
                    onClick={() => setFilter(null)}
                    className={`inline-flex items-center justify-center h-12 px-6 rounded-full border border-[#E2E2E1] bg-white text-[15px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF9] transition-colors ${FOCUS} focus-visible:ring-offset-[#F4F4F3]`}
                >
                    {cases.cta}
                </button>
            </div>
        </Section>
    )
}

// ── 06 · Guarantee ─────────────────────────────────────────

function Guarantee() {
    const { guarantee } = BRAND_PAGE

    return (
        <Section tone="ink">
            <div className="max-w-[42rem]">
                <Eyebrow onInk>{guarantee.label}</Eyebrow>
                <div className="mt-5">
                    <Title size="lg" className="text-white">
                        {guarantee.title}
                    </Title>
                </div>
                <div className="mt-6">
                    <Lead onInk>{guarantee.body}</Lead>
                </div>
                <p className="mt-5 text-[15px] md:text-[16px] leading-relaxed text-white/50 max-w-[62ch]">
                    {guarantee.detail}
                </p>
            </div>

            {/* Horizontal progression: each condition leads to the next. */}
            <ol className="mt-14 flex flex-wrap items-center gap-y-3">
                {guarantee.steps.map((step, index) => (
                    <li key={step} className="flex items-center">
                        <span className="inline-flex items-center h-9 px-4 rounded-full border border-white/20 text-[13.5px] font-medium text-white">
                            {step}
                        </span>
                        {index < guarantee.steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 mx-1.5 text-white/30 shrink-0" aria-hidden="true" />
                        )}
                    </li>
                ))}
            </ol>
        </Section>
    )
}

// ── 07 · Automation ────────────────────────────────────────

function Automation() {
    const { automation } = BRAND_PAGE

    return (
        <Section tone="paper">
            <div className="max-w-[42rem]">
                <Title size="lg">{automation.title}</Title>
                <div className="mt-6">
                    <Lead>{automation.body}</Lead>
                </div>
            </div>

            <ul className="mt-14 grid sm:grid-cols-2 border-t border-l border-[#E2E2E1]">
                {automation.capabilities.map(capability => (
                    <li key={capability.label} className="border-r border-b border-[#E2E2E1] p-6 md:p-8">
                        <h3 className="text-[18px] font-semibold leading-snug text-[#1A1A1A]">{capability.label}</h3>
                        <p className="mt-2.5 text-[15px] leading-relaxed text-[#6B6B6B]">{capability.body}</p>
                    </li>
                ))}
            </ul>
        </Section>
    )
}

// ── 08 · Expertise ─────────────────────────────────────────

function Expertise() {
    const { expertise } = BRAND_PAGE

    return (
        <Section tone="muted">
            <div className="max-w-[42rem]">
                <Eyebrow>{expertise.label}</Eyebrow>
                <div className="mt-5">
                    <Title size="lg">{expertise.title}</Title>
                </div>
                <div className="mt-6">
                    <Lead>{expertise.body}</Lead>
                </div>
            </div>

            <p className="mt-12 text-[26px] md:text-[36px] font-semibold leading-[1.15] tracking-[-0.025em] text-balance text-[#1A1A1A] max-w-[24ch]">
                {expertise.punch}
            </p>

            <ul className="mt-12 grid sm:grid-cols-3 border-t border-[#E2E2E1]">
                {expertise.pillars.map(pillar => (
                    <li
                        key={pillar}
                        className="py-5 sm:py-6 sm:px-6 sm:first:pl-0 border-b sm:border-b-0 sm:border-r sm:last:border-r-0 border-[#E2E2E1] text-[16px] font-medium text-[#1A1A1A]"
                    >
                        {pillar}
                    </li>
                ))}
            </ul>
        </Section>
    )
}

// ── 09 · FAQ ───────────────────────────────────────────────

function FaqBlock() {
    return (
        <Section tone="paper">
            <div className="max-w-[42rem]">
                <Title>{'Questions fréquentes'}</Title>
            </div>
            <div className="mt-10">
                <Faq items={BRAND_PAGE.faq} />
            </div>
        </Section>
    )
}

// ── 10 · Final CTA ─────────────────────────────────────────

function FinalCta() {
    const { finalCta } = BRAND_PAGE

    return (
        <Section tone="ink">
            <div className="max-w-[42rem]">
                <Title size="lg" className="text-white">
                    {finalCta.title}
                </Title>
                <div className="mt-6">
                    <Lead onInk>{finalCta.body}</Lead>
                </div>
                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                    <CtaPrimary href={finalCta.primary.href} onInk>
                        {finalCta.primary.label}
                    </CtaPrimary>
                    <CtaSecondary href={finalCta.secondary.href} onInk>
                        {finalCta.secondary.label}
                    </CtaSecondary>
                </div>
            </div>
        </Section>
    )
}
