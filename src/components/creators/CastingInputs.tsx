'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

/**
 * Shared controls for the casting attributes.
 *
 * A creator declares these twice — once in the signup wizard, once in their
 * settings — and MOSH filters on the result. Keeping one implementation stops
 * the two forms from drifting apart, the same reason the vocabulary itself
 * lives in a single constants file.
 */

export function CastingChips({
    options,
    selected,
    onToggle,
}: {
    options: readonly string[]
    selected: string[]
    onToggle: (value: string) => void
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(option => {
                const isSelected = selected.includes(option)
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onToggle(option)}
                        className={`
                            px-3.5 py-1.5 rounded-full text-[13px] transition-colors
                            ${isSelected
                                ? 'bg-[#1A1A1A] text-white'
                                : 'bg-white border border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3]'
                            }
                        `}
                    >
                        {option}
                    </button>
                )
            })}
        </div>
    )
}

export function CastingToggle({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (value: boolean) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`
                flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] transition-colors
                ${checked
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-white border border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3]'
                }
            `}
        >
            {checked
                ? <Check className="w-3.5 h-3.5 text-white" />
                : <span className="w-3.5 h-3.5 rounded-full border border-[#9B9B9B]" />
            }
            {label}
        </button>
    )
}

export function CastingField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="block text-[12px] font-medium text-[#6B6B6B] mb-1.5">{label}</span>
            {children}
        </label>
    )
}

export const castingControlClass = 'w-full h-9 px-3 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/15'

/**
 * Handles are stored bare, without the leading @ — profile links are built by
 * appending to a base URL, so one form storing "@nom" and another storing "nom"
 * produces a dead link from one of them.
 */
export function normalizeHandle(value: string): string | null {
    return value.trim().replace(/^@+/, '') || null
}

/** Optional casting fields go to the DB as null / [] — never as empty strings. */
export function toNullableInt(value: string): number | null {
    const parsed = parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
}
