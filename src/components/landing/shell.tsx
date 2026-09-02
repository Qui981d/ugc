'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { MoshLogo } from '@/components/brand/MoshLogo'
import { AUDIENCE_TABS, type ClientLogo } from '@/lib/constants/landing'

/**
 * Shared furniture for the two public landings.
 *
 * The audience toggle navigates between two real routes rather than swapping
 * content in place: the brief requires both to be separately indexable, and a
 * client-side switch would leave search engines with a single page.
 *
 * Palette and type come from the platform's own system, so the site and the
 * product do not look like two different companies.
 */

export const INK = '#1A1A1A'

// ── Layout ─────────────────────────────────────────────────

export function Section({
    id,
    children,
    tone = 'paper',
    className = '',
}: {
    id?: string
    children: ReactNode
    tone?: 'paper' | 'muted' | 'ink'
    className?: string
}) {
    const tones = {
        paper: 'bg-white text-[#1A1A1A]',
        muted: 'bg-[#F4F4F3] text-[#1A1A1A]',
        ink: 'bg-[#1A1A1A] text-white',
    }
    return (
        <section id={id} className={`${tones[tone]} py-20 md:py-28 ${className}`}>
            <div className="max-w-[1120px] mx-auto px-6">{children}</div>
        </section>
    )
}

export function Eyebrow({ children, onInk = false }: { children: ReactNode; onInk?: boolean }) {
    return (
        <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${onInk ? 'text-white/45' : 'text-[#9B9B9B]'}`}>
            {children}
        </p>
    )
}

export function Title({
    children,
    size = 'md',
    className = '',
}: {
    children: ReactNode
    size?: 'sm' | 'md' | 'lg'
    className?: string
}) {
    const sizes = {
        sm: 'text-[24px] md:text-[30px]',
        md: 'text-[28px] md:text-[38px]',
        lg: 'text-[34px] md:text-[54px]',
    }
    return (
        <h2 className={`${sizes[size]} font-semibold leading-[1.08] tracking-[-0.028em] text-balance ${className}`}>
            {children}
        </h2>
    )
}

export function Lead({ children, onInk = false }: { children: ReactNode; onInk?: boolean }) {
    return (
        <p className={`text-[16px] md:text-[17px] leading-relaxed max-w-[62ch] ${onInk ? 'text-white/65' : 'text-[#6B6B6B]'}`}>
            {children}
        </p>
    )
}

// ── Buttons ────────────────────────────────────────────────

export function CtaPrimary({ href, children, onInk = false }: { href: string; children: ReactNode; onInk?: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center h-12 px-6 rounded-full text-[15px] font-semibold transition-colors ${onInk
                ? 'bg-white text-[#1A1A1A] hover:bg-[#F4F4F3]'
                : 'bg-[#1A1A1A] text-white hover:bg-[#333333]'
                }`}
        >
            {children}
        </Link>
    )
}

export function CtaSecondary({ href, children, onInk = false }: { href: string; children: ReactNode; onInk?: boolean }) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center h-12 px-6 rounded-full text-[15px] font-medium border transition-colors ${onInk
                ? 'border-white/25 text-white hover:bg-white/10'
                : 'border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3]'
                }`}
        >
            {children}
        </Link>
    )
}

// ── Header ─────────────────────────────────────────────────

export function LandingHeader({
    links,
    cta,
}: {
    links: readonly { label: string; href: string }[]
    cta: { label: string; href: string }
}) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E2E2E1]">
            <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center gap-6">
                <Link href="/marques" aria-label="MOSH — accueil" className="shrink-0">
                    <MoshLogo className="h-5 w-auto text-[#1A1A1A]" />
                </Link>

                <AudienceToggle pathname={pathname} className="hidden md:flex" />

                <nav className="hidden md:flex items-center gap-6 ml-auto" aria-label="Navigation principale">
                    {links.map(l => (
                        <Link key={l.href} href={l.href} className="text-[14px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                            {l.label}
                        </Link>
                    ))}
                    <Link href="/login" className="text-[14px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                        Connexion
                    </Link>
                    <Link
                        href={cta.href}
                        className="inline-flex items-center h-9 px-4 rounded-full bg-[#1A1A1A] text-white text-[14px] font-semibold hover:bg-[#333333] transition-colors"
                    >
                        {cta.label}
                    </Link>
                </nav>

                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    aria-expanded={open}
                    aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                    className="md:hidden ml-auto p-2 -mr-2 text-[#1A1A1A]"
                >
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {open && (
                <div className="md:hidden border-t border-[#E2E2E1] bg-white px-6 py-5 flex flex-col gap-4">
                    <AudienceToggle pathname={pathname} />
                    {links.map(l => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-[15px] text-[#1A1A1A]">
                            {l.label}
                        </Link>
                    ))}
                    <Link href="/login" onClick={() => setOpen(false)} className="text-[15px] text-[#1A1A1A]">
                        Connexion
                    </Link>
                    <CtaPrimary href={cta.href}>{cta.label}</CtaPrimary>
                </div>
            )}
        </header>
    )
}

function AudienceToggle({ pathname, className = '' }: { pathname: string; className?: string }) {
    return (
        <div className={`p-1 bg-[#F4F4F3] rounded-full ${className}`} role="group" aria-label="Choisir votre profil">
            {AUDIENCE_TABS.map(tab => {
                const active = pathname === tab.href
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex items-center h-8 px-4 rounded-full text-[13px] font-medium transition-colors ${active ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                            }`}
                    >
                        {tab.label}
                    </Link>
                )
            })}
        </div>
    )
}

// ── Client logos ───────────────────────────────────────────

export function LogoBand({ title, logos, tone = 'muted' }: { title: string; logos: ClientLogo[]; tone?: 'paper' | 'muted' }) {
    return (
        <Section tone={tone} className="py-14 md:py-16">
            <p className="text-[15px] text-[#6B6B6B] text-center">{title}</p>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                {logos.map(logo => (
                    <li key={logo.name}>
                        {logo.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo.src} alt={logo.name} loading="lazy" className="h-7 md:h-8 w-auto object-contain opacity-70" />
                        ) : (
                            // Visible on purpose: a missing logo should show up on
                            // the page rather than quietly shrink the band.
                            <span className="inline-flex items-center h-8 px-4 rounded-md border border-dashed border-[#C4C4C3] text-[13px] font-medium text-[#9B9B9B]">
                                {logo.name}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </Section>
    )
}

/** Stands in for artwork that has not been supplied yet. */
export function AssetPlaceholder({ label, ratio = 'aspect-[16/10]' }: { label: string; ratio?: string }) {
    return (
        <div className={`${ratio} w-full rounded-xl border border-dashed border-[#C4C4C3] bg-[#F4F4F3] grid place-items-center px-6 text-center`}>
            <span className="text-[13px] text-[#9B9B9B]">{label}</span>
        </div>
    )
}

// ── FAQ ────────────────────────────────────────────────────

/**
 * Native details/summary: answers stay in the HTML for search engines and work
 * without JavaScript, which the brief asks for explicitly.
 */
export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
    return (
        <div className="border-t border-[#E2E2E1]">
            {items.map(item => (
                <details key={item.q} className="group border-b border-[#E2E2E1]">
                    <summary className="flex items-start gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <h3 className="flex-1 text-[16px] md:text-[17px] font-medium text-[#1A1A1A]">{item.q}</h3>
                        <ChevronDown className="w-4 h-4 mt-1 text-[#9B9B9B] shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pb-5 pr-8 text-[15px] leading-relaxed text-[#6B6B6B] max-w-[68ch]">{item.a}</p>
                </details>
            ))}
        </div>
    )
}

// ── Footer ─────────────────────────────────────────────────

export function LandingFooter() {
    return (
        <footer className="bg-[#1A1A1A] text-white">
            <div className="max-w-[1120px] mx-auto px-6 py-14">
                <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-6">
                    <MoshLogo className="h-5 w-auto text-white" />
                    <nav className="flex flex-wrap gap-x-8 gap-y-3 md:ml-auto" aria-label="Pied de page">
                        {AUDIENCE_TABS.map(t => (
                            <Link key={t.href} href={t.href} className="text-[14px] text-white/60 hover:text-white transition-colors">
                                {t.label}
                            </Link>
                        ))}
                        <Link href="/aide" className="text-[14px] text-white/60 hover:text-white transition-colors">Aide</Link>
                        <Link href="/login" className="text-[14px] text-white/60 hover:text-white transition-colors">Connexion</Link>
                    </nav>
                </div>
                <p className="mt-10 pt-6 border-t border-white/10 text-[12.5px] text-white/35">
                    MOSH — LGMA SA, Route de Champ-Colin 12, 1260 Nyon, Suisse
                </p>
            </div>
        </footer>
    )
}
