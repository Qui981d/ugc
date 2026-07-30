'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/* ============================================================
   Workspace primitives

   The app used to stack independent white cards down the page,
   which reads as a template rather than a tool. These primitives
   impose the structure modern admin UIs use: one page header,
   one dense surface, dividers instead of gaps.
   ============================================================ */

interface Crumb { label: string; href?: string }

/**
 * Page header — title, optional breadcrumb/description, and the page's actions.
 * It is a divider-bounded band, not a floating card.
 */
export function PageHeader({
    title,
    description,
    breadcrumb,
    actions,
    children,
}: {
    title: string
    description?: string
    breadcrumb?: Crumb[]
    actions?: ReactNode
    /** Tabs or filters that belong to the header band. */
    children?: ReactNode
}) {
    return (
        <div className="border-b border-[#E2E2E1] pb-4 mb-6">
            {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-1.5 text-[12px] text-[#9B9B9B] mb-2">
                    {breadcrumb.map((c, i) => (
                        <span key={i} className="flex items-center gap-1.5 min-w-0">
                            {c.href ? (
                                <Link href={c.href} className="hover:text-[#1A1A1A] transition-colors truncate">
                                    {c.label}
                                </Link>
                            ) : (
                                <span className="text-[#6B6B6B] truncate">{c.label}</span>
                            )}
                            {i < breadcrumb.length - 1 && <ChevronRight className="w-3 h-3 shrink-0" />}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-[20px] font-semibold text-[#1A1A1A] tracking-[-0.01em] leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-[13px] text-[#6B6B6B] mt-0.5">{description}</p>
                    )}
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
            {children && <div className="mt-4">{children}</div>}
        </div>
    )
}

/**
 * Metric strip — one surface split by dividers, instead of N floating stat cards.
 */
export function MetricStrip({
    metrics,
}: {
    metrics: { label: string; value: string; hint?: string; tone?: 'default' | 'accent' }[]
}) {
    return (
        <div className="bg-white border border-[#E2E2E1] rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#E2E2E1] overflow-hidden">
            {metrics.map((m) => (
                <div key={m.label} className="px-4 py-3.5 min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#9B9B9B] truncate">
                        {m.label}
                    </p>
                    {/* Monochrome has no accent hue to spend, so emphasis is weight. */}
                    <p className={`text-[22px] tabular-nums leading-tight mt-1 text-[#1A1A1A] ${m.tone === 'accent' ? 'font-bold' : 'font-semibold'
                        }`}>
                        {m.value}
                    </p>
                    {m.hint && <p className="text-[11.5px] text-[#9B9B9B] truncate mt-0.5">{m.hint}</p>}
                </div>
            ))}
        </div>
    )
}

/**
 * Panel — the single bordered surface a page's content lives in.
 * Rows inside are separated by dividers, never by gaps.
 */
export function Panel({
    title,
    actions,
    children,
    padded = false,
}: {
    title?: string
    actions?: ReactNode
    children: ReactNode
    /** Set for prose/forms; leave off for tables and divided lists. */
    padded?: boolean
}) {
    return (
        <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden">
            {(title || actions) && (
                <div className="flex items-center justify-between gap-3 px-4 h-11 border-b border-[#E2E2E1]">
                    {title && <h2 className="text-[13px] font-semibold text-[#1A1A1A] truncate">{title}</h2>}
                    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                </div>
            )}
            <div className={padded ? 'p-4' : ''}>{children}</div>
        </div>
    )
}

/** A divided list of rows inside a Panel. */
export function PanelList({ children }: { children: ReactNode }) {
    return <div className="divide-y divide-[#E2E2E1]">{children}</div>
}

/** A single row: 40px-ish, hover-highlighted, optionally a link. */
export function PanelRow({ href, children }: { href?: string; children: ReactNode }) {
    const cls = 'flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAF9] transition-colors min-w-0'
    return href ? (
        <Link href={href} className={`${cls} group`}>{children}</Link>
    ) : (
        <div className={cls}>{children}</div>
    )
}

/** Segmented tabs — quiet chrome, underline rather than filled pills. */
export function Tabs({
    tabs,
    active,
    onChange,
}: {
    tabs: { id: string; label: string; count?: number }[]
    active: string
    onChange: (id: string) => void
}) {
    return (
        <div className="flex items-center gap-1 -mb-4 overflow-x-auto">
            {tabs.map((t) => {
                const on = t.id === active
                return (
                    <button
                        key={t.id}
                        onClick={() => onChange(t.id)}
                        className={`
                            relative px-3 h-9 text-[13px] whitespace-nowrap transition-colors
                            border-b-2 -mb-px
                            ${on
                                ? 'border-[#1A1A1A] text-[#1A1A1A] font-semibold'
                                : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] font-medium'
                            }
                        `}
                    >
                        {t.label}
                        {typeof t.count === 'number' && (
                            <span className={`ml-1.5 text-[11px] tabular-nums ${on ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'}`}>
                                {t.count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

/**
 * Status pill. In a monochrome system the brand ink is the loudest thing
 * available, so "happening now" gets the solid fill; the states that need a
 * human decision keep real colour, because grey cannot say waiting or done.
 */
const TONES = {
    progress: 'bg-[#1A1A1A] text-white',
    waiting: 'bg-[#FBF3E2] text-[#8A6100]',
    done: 'bg-[#E8F3EA] text-[#1A7F37]',
    idle: 'bg-[#F4F4F3] text-[#6B6B6B] ring-1 ring-inset ring-[#E2E2E1]',
    alert: 'bg-[#FBEAE8] text-[#C0392B]',
} as const

export function StatusPill({
    tone = 'idle',
    children,
}: {
    tone?: keyof typeof TONES
    children: ReactNode
}) {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap ${TONES[tone]}`}>
            {children}
        </span>
    )
}

/** Empty state — states the situation and offers the next action. */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
    title: string
    description?: string
    action?: ReactNode
}) {
    return (
        <div className="flex flex-col items-center text-center py-14 px-6">
            {Icon && (
                <div className="w-10 h-10 rounded-lg bg-[#F4F4F3] grid place-items-center mb-3">
                    <Icon className="w-5 h-5 text-[#9B9B9B]" strokeWidth={1.8} />
                </div>
            )}
            <p className="text-[14px] font-semibold text-[#1A1A1A]">{title}</p>
            {description && <p className="text-[13px] text-[#6B6B6B] mt-1 max-w-sm">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
