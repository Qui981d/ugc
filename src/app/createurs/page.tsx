'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
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
import { CREATOR_PAGE, CLIENT_LOGOS, SHOWREEL } from '@/lib/constants/landing'

/**
 * Public creator landing.
 *
 * Composition follows the invitation landing (/rejoindre/[code]) rather than
 * SaaS convention: monochrome, alternating white and #F4F4F3 grounds with ink
 * reserved for the two emotional peaks, contrast doing the work colour usually
 * does, and sequences rendered as numbered divided rows instead of stacked
 * cards. Every word comes from CREATOR_PAGE — the copy is client-approved and
 * addresses the creator as "tu" throughout.
 *
 * Client component because the product demo is a real tab strip; the metadata
 * and the FAQPage structured data therefore live in ./layout.tsx.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]'

/**
 * Reports the viewer's motion preference.
 *
 * Starts at `true` so the server-rendered markup never carries `autoplay`:
 * motion is opted into once the client has actually read the media query,
 * rather than started and then apologised for.
 */
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(true)

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const apply = () => setReduced(query.matches)
        apply()
        query.addEventListener('change', apply)
        return () => query.removeEventListener('change', apply)
    }, [])

    return reduced
}

export default function CreatorsLandingPage() {
    const reducedMotion = usePrefersReducedMotion()

    // ── Product demo tabs ──────────────────────────────────
    const tabs = CREATOR_PAGE.demo.tabs
    const [active, setActive] = useState(0)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
    const activeTab = tabs[active]
    // `as const` makes each tab's `items` its own tuple type; widening once here
    // keeps the union from swallowing the call signature of `.map`.
    const activeItems: readonly string[] = activeTab.items

    // Roving focus, as an ARIA tablist is expected to behave.
    const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const last = tabs.length - 1
        let next = -1

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = active === last ? 0 : active + 1
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = active === 0 ? last : active - 1
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = last

        if (next < 0) return
        event.preventDefault()
        setActive(next)
        tabRefs.current[next]?.focus()
    }

    return (
        <div className="bg-white">
            <LandingHeader links={CREATOR_PAGE.nav} cta={CREATOR_PAGE.ctaPrimary} />

            {/* ── 01 · Hero — one statement, given the room to land ── */}
            <Section>
                <div className="grid md:grid-cols-12 gap-y-8 gap-x-10">
                    <div className="md:col-span-8">
                        <Eyebrow>{CREATOR_PAGE.hero.label}</Eyebrow>
                        <h1 className="mt-5 text-[34px] md:text-[56px] font-semibold leading-[1.02] tracking-[-0.03em] text-balance text-[#1A1A1A]">
                            {CREATOR_PAGE.hero.title}
                        </h1>
                    </div>
                    <div className="md:col-span-4 md:pt-[4.75rem]">
                        <p className="text-[16px] md:text-[17px] leading-relaxed text-[#6B6B6B]">
                            {CREATOR_PAGE.hero.intro}
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3">
                    <CtaPrimary href={CREATOR_PAGE.ctaPrimary.href}>{CREATOR_PAGE.ctaPrimary.label}</CtaPrimary>
                    <CtaSecondary href={CREATOR_PAGE.ctaSecondary.href}>{CREATOR_PAGE.ctaSecondary.label}</CtaSecondary>
                </div>

                <ul className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13.5px] text-[#6B6B6B]">
                    {CREATOR_PAGE.hero.reassurance.map((item, i) => (
                        <li key={item} className="flex items-center gap-3">
                            {i > 0 && <span aria-hidden="true" className="w-1 h-1 rounded-full bg-[#C4C4C3]" />}
                            {item}
                        </li>
                    ))}
                </ul>
            </Section>

            {/* ── 02 · Product demo — the promise, shown immediately ── */}
            <Section tone="muted">
                <div className="max-w-[62ch]">
                    <Title>{CREATOR_PAGE.demo.title}</Title>
                    <div className="mt-4">
                        <Lead>{CREATOR_PAGE.demo.body}</Lead>
                    </div>
                </div>

                <div
                    role="tablist"
                    aria-label={CREATOR_PAGE.demo.title}
                    onKeyDown={onTabKeyDown}
                    className="mt-10 flex flex-wrap gap-2"
                >
                    {tabs.map((tab, i) => {
                        const selected = i === active
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                id={`demo-tab-${tab.key}`}
                                aria-selected={selected}
                                aria-controls={`demo-panel-${tab.key}`}
                                tabIndex={selected ? 0 : -1}
                                ref={el => { tabRefs.current[i] = el }}
                                onClick={() => setActive(i)}
                                className={`inline-flex items-center h-10 px-4 rounded-full border text-[14px] font-medium transition-colors ${FOCUS} ${selected
                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                    : 'bg-white text-[#6B6B6B] border-[#E2E2E1] hover:text-[#1A1A1A] hover:border-[#C4C4C3]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                <div
                    role="tabpanel"
                    id={`demo-panel-${activeTab.key}`}
                    aria-labelledby={`demo-tab-${activeTab.key}`}
                    tabIndex={0}
                    className={`mt-6 grid md:grid-cols-12 gap-6 md:gap-8 rounded-xl ${FOCUS}`}
                >
                    {/* What the screen contains, as a divided list rather than bullets. */}
                    <div className="md:col-span-4">
                        <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden">
                            <p className="px-4 h-11 flex items-center text-[13px] font-semibold text-[#1A1A1A] border-b border-[#E2E2E1]">
                                {activeTab.label}
                            </p>
                            <ul className="divide-y divide-[#E2E2E1]">
                                {activeItems.map(item => (
                                    <li key={item} className="px-4 py-3 text-[14px] text-[#1A1A1A] leading-snug">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="md:col-span-8">
                        <AssetPlaceholder label={`Capture — ${activeTab.label}`} />
                    </div>
                </div>
            </Section>

            {/* ── 03 · Proof ── */}
            <LogoBand title={CREATOR_PAGE.proof.title} logos={CLIENT_LOGOS} tone="paper" />

            {/* ── 04 · Showreel — vertical, large, and honest while empty ── */}
            <Section tone="muted">
                <Title>{CREATOR_PAGE.showreel.title}</Title>

                {SHOWREEL.length > 0 ? (
                    <ul className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {SHOWREEL.map((video, i) => (
                            <li key={video.src ?? i}>
                                {/*
                                    Muted autoplay with visible controls, a poster standing in
                                    until the file is actually wanted (preload="none"), and no
                                    autoplay at all when the viewer asks for less motion.
                                */}
                                <video
                                    ref={el => { if (el) el.muted = true }}
                                    src={video.src}
                                    poster={video.poster}
                                    preload="none"
                                    controls
                                    loop
                                    muted
                                    playsInline
                                    autoPlay={!reducedMotion}
                                    aria-label={[video.creator, video.brand].filter(Boolean).join(' — ') || undefined}
                                    className="w-full aspect-[9/16] object-cover rounded-xl bg-[#E2E2E1]"
                                />
                                {(video.creator || video.brand) && (
                                    <p className="mt-2.5 text-[12.5px] text-[#9B9B9B] truncate">
                                        {[video.creator, video.brand].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    // The films are not supplied yet. A held grid of empty 9:16
                    // frames says so plainly, rather than collapsing the block.
                    <ul className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {[0, 1, 2, 3].map(i => (
                            <li key={i}>
                                <AssetPlaceholder label="Contenu en préparation" ratio="aspect-[9/16]" />
                            </li>
                        ))}
                    </ul>
                )}
            </Section>

            {/* ── 05 · Agency value — the brief, as a progression ── */}
            <Section>
                <div className="grid md:grid-cols-12 gap-y-6 gap-x-10">
                    <div className="md:col-span-5">
                        <Title>{CREATOR_PAGE.agency.title}</Title>
                    </div>
                    <div className="md:col-span-7 md:pt-1 space-y-4">
                        <Lead>{CREATOR_PAGE.agency.body}</Lead>
                        <p className="text-[15px] leading-relaxed text-[#6B6B6B] max-w-[62ch]">
                            {CREATOR_PAGE.agency.detail}
                        </p>
                    </div>
                </div>

                <ol className="mt-12 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                    {CREATOR_PAGE.agency.sequence.map((step, i) => (
                        <li key={step} className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2.5 h-11 px-5 rounded-full border border-[#E2E2E1] bg-[#FAFAF9] text-[15px] font-medium text-[#1A1A1A] whitespace-nowrap">
                                <span className="font-mono text-[11px] text-[#9B9B9B] tabular-nums">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                {step}
                            </span>
                            {i < CREATOR_PAGE.agency.sequence.length - 1 && (
                                <ArrowRight
                                    aria-hidden="true"
                                    className="w-4 h-4 shrink-0 text-[#C4C4C3] rotate-90 sm:rotate-0"
                                />
                            )}
                        </li>
                    ))}
                </ol>
            </Section>

            {/* ── 06 · Benefits ── */}
            <Section tone="muted">
                <div className="grid md:grid-cols-12 gap-y-8 gap-x-10">
                    <div className="md:col-span-4">
                        <Title>{CREATOR_PAGE.benefits.title}</Title>
                    </div>
                    <div className="md:col-span-8">
                        <ul className="bg-white border border-[#E2E2E1] rounded-xl divide-y divide-[#E2E2E1] overflow-hidden">
                            {CREATOR_PAGE.benefits.items.map(item => (
                                <li key={item} className="flex items-start gap-3.5 px-5 py-4">
                                    <Check aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-[#1A1A1A]" strokeWidth={2.5} />
                                    <span className="text-[15px] leading-relaxed text-[#1A1A1A]">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            {/* ── 07 · How it works — a real sequence, so numbered ── */}
            <Section id="comment">
                <Title>{CREATOR_PAGE.how.title}</Title>

                <ol className="mt-10 border-t border-[#E2E2E1]">
                    {CREATOR_PAGE.how.steps.map((step, i) => (
                        <li key={step.title} className="grid md:grid-cols-12 gap-y-1.5 gap-x-6 py-6 border-b border-[#E2E2E1]">
                            <span className="md:col-span-1 font-mono text-[13px] text-[#9B9B9B] tabular-nums pt-0.5">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <h3 className="md:col-span-4 text-[16px] md:text-[17px] font-semibold text-[#1A1A1A] leading-snug">
                                {step.title}
                            </h3>
                            <p className="md:col-span-7 text-[15px] text-[#6B6B6B] leading-relaxed">
                                {step.body}
                            </p>
                        </li>
                    ))}
                </ol>
            </Section>

            {/* ── 08 · Guarantee — the emotional centre, so it goes to ink ── */}
            <Section tone="ink">
                <div className="grid md:grid-cols-12 gap-y-10 gap-x-12">
                    <div className="md:col-span-6">
                        <Eyebrow onInk>{CREATOR_PAGE.guarantee.label}</Eyebrow>
                        <Title size="lg" className="mt-5">{CREATOR_PAGE.guarantee.title}</Title>
                        <div className="mt-6 space-y-4">
                            <Lead onInk>{CREATOR_PAGE.guarantee.body}</Lead>
                            <p className="text-[15px] leading-relaxed text-white/50 max-w-[62ch]">
                                {CREATOR_PAGE.guarantee.detail}
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-6">
                        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-6 md:p-7">
                            <h3 className="text-[16px] font-semibold text-white">
                                {CREATOR_PAGE.guarantee.listTitle}
                            </h3>
                            <ul className="mt-5 space-y-3.5">
                                {CREATOR_PAGE.guarantee.items.map(item => (
                                    <li key={item} className="flex items-start gap-3">
                                        <Check aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0 text-white" strokeWidth={2.5} />
                                        <span className="text-[15px] leading-snug text-white/75">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <p className="mt-10 pt-8 border-t border-white/10 text-[16px] md:text-[17px] leading-relaxed text-white/65 max-w-[68ch]">
                    {CREATOR_PAGE.guarantee.closing}
                </p>
            </Section>

            {/* ── 09 · FAQ ── */}
            <Section>
                <div className="grid md:grid-cols-12 gap-y-8 gap-x-10">
                    <div className="md:col-span-4">
                        <Title size="sm">Questions fréquentes</Title>
                    </div>
                    <div className="md:col-span-8">
                        <Faq items={CREATOR_PAGE.faq} />
                    </div>
                </div>
            </Section>

            {/* ── 10 · Final CTA ── */}
            <Section tone="ink">
                <div className="grid md:grid-cols-12 gap-y-8 gap-x-10 md:items-end">
                    <div className="md:col-span-7">
                        <Title size="lg">{CREATOR_PAGE.finalCta.title}</Title>
                        <div className="mt-5">
                            <Lead onInk>{CREATOR_PAGE.finalCta.body}</Lead>
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <div className="flex flex-col sm:flex-row md:justify-end gap-3">
                            <CtaPrimary href={CREATOR_PAGE.finalCta.primary.href} onInk>
                                {CREATOR_PAGE.finalCta.primary.label}
                            </CtaPrimary>
                            <CtaSecondary href={CREATOR_PAGE.finalCta.secondary.href} onInk>
                                {CREATOR_PAGE.finalCta.secondary.label}
                            </CtaSecondary>
                        </div>

                        <ul className="mt-6 flex flex-wrap md:justify-end items-center gap-x-3 gap-y-2 text-[12.5px] text-white/40">
                            {CREATOR_PAGE.finalCta.reassurance.map((item, i) => (
                                <li key={item} className="flex items-center gap-3">
                                    {i > 0 && <span aria-hidden="true" className="w-1 h-1 rounded-full bg-white/25" />}
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            <LandingFooter />
        </div>
    )
}
