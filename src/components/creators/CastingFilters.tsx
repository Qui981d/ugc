'use client'

/**
 * Casting filters — one component for the creators directory and the mission
 * creator selector, so MOSH narrows a roster with the same vocabulary the
 * creators used to describe themselves.
 *
 * Rules of the game:
 *  - AND across categories, OR inside a category.
 *  - An undeclared field only ever excludes a creator when a filter on that
 *    field is actually active. (One deliberate exception: refused topics — see
 *    the comment on that filter below.)
 */

import { useState } from 'react'
import { SlidersHorizontal, X, ChevronUp } from 'lucide-react'
import {
    NICHES,
    SHOOT_SETTINGS,
    EQUIPMENT,
    HAIR_COLORS,
    EYE_COLORS,
    GENDERS,
    SKIN_TONES,
    EXPERIENCE_LEVELS,
    FOLLOWER_RANGES,
    EXCLUDED_TOPICS,
    DELIVERY_DELAYS,
    ageFromBirthYear,
} from '@/lib/constants/creatorCasting'
import { SWISS_CANTONS, cantonLabel } from '@/lib/validations/swiss'
import type { ProfileCreator } from '@/types/database'

/** Mirrors the onboarding vocabulary — specialties and languages are stored as codes. */
export const SPECIALTY_OPTIONS = [
    { value: 'testimonial', label: 'Témoignage' },
    { value: 'unboxing', label: 'Unboxing' },
    { value: 'review', label: 'Review' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'tutorial', label: 'Tutoriel' },
    { value: 'asmr', label: 'ASMR' },
]

/** Specialties are stored as codes; nobody wants to read "testimonial" on a card. */
export function specialtyLabel(code: string): string {
    return SPECIALTY_OPTIONS.find(o => o.value === code)?.label || code
}

const LANGUAGE_OPTIONS = [
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Allemand' },
    { value: 'it', label: 'Italien' },
    { value: 'en', label: 'Anglais' },
]

const BOOLEAN_FILTERS = [
    { key: 'canTravel', field: 'can_travel', label: 'Peut se déplacer' },
    { key: 'hasVehicle', field: 'has_vehicle', label: 'Véhicule' },
    { key: 'doesVoiceover', field: 'does_voiceover', label: 'Voix off' },
    { key: 'hasChildren', field: 'has_children', label: 'Enfants' },
    { key: 'hasPets', field: 'has_pets', label: 'Animaux' },
    { key: 'hasVisibleTattoos', field: 'has_visible_tattoos', label: 'Tatouages visibles' },
] as const

export interface CastingFilterState {
    niches: string[]
    shootSettings: string[]
    equipment: string[]
    specialties: string[]
    languages: string[]
    experienceLevels: string[]
    skinTones: string[]
    followerRanges: string[]
    /** Topics the brief needs — a creator who refuses any of them is filtered out. */
    mustNotRefuse: string[]
    canton: string
    ageMin: string
    ageMax: string
    gender: string
    hairColor: string
    eyeColor: string
    heightMin: string
    heightMax: string
    /** Upper bound in days; a creator passes when their declared delay is ≤ this. */
    maxDeliveryDays: string
    /** Upper bound in CHF/hour. */
    maxRateChf: string
    canTravel: boolean
    hasVehicle: boolean
    doesVoiceover: boolean
    hasChildren: boolean
    hasPets: boolean
    hasVisibleTattoos: boolean
}

export const EMPTY_CASTING_FILTERS: CastingFilterState = {
    niches: [],
    shootSettings: [],
    equipment: [],
    specialties: [],
    languages: [],
    experienceLevels: [],
    skinTones: [],
    followerRanges: [],
    mustNotRefuse: [],
    canton: '',
    ageMin: '',
    ageMax: '',
    gender: '',
    hairColor: '',
    eyeColor: '',
    heightMin: '',
    heightMax: '',
    maxDeliveryDays: '',
    maxRateChf: '',
    canTravel: false,
    hasVehicle: false,
    doesVoiceover: false,
    hasChildren: false,
    hasPets: false,
    hasVisibleTattoos: false,
}

const toNum = (v: string): number | null => {
    const n = Number(v)
    return v.trim() !== '' && Number.isFinite(n) ? n : null
}

/** How many constraints the user has actually asked for. */
export function countActiveCastingFilters(f: CastingFilterState): number {
    let n =
        f.niches.length +
        f.shootSettings.length +
        f.equipment.length +
        f.specialties.length +
        f.languages.length +
        f.experienceLevels.length +
        f.skinTones.length +
        f.followerRanges.length +
        f.mustNotRefuse.length
    if (f.canton.trim()) n++
    if (toNum(f.ageMin) !== null || toNum(f.ageMax) !== null) n++
    if (f.gender) n++
    if (f.hairColor) n++
    if (f.eyeColor) n++
    if (toNum(f.heightMin) !== null || toNum(f.heightMax) !== null) n++
    if (toNum(f.maxDeliveryDays) !== null) n++
    if (toNum(f.maxRateChf) !== null) n++
    for (const b of BOOLEAN_FILTERS) if (f[b.key]) n++
    return n
}

export function matchesCastingFilters(
    profile: ProfileCreator | null | undefined,
    f: CastingFilterState
): boolean {
    if (countActiveCastingFilters(f) === 0) return true
    // Nothing declared at all: any active filter is a filter this creator cannot answer.
    if (!profile) return false

    const anyOf = (declared: string[] | null | undefined, wanted: string[]) =>
        wanted.length === 0 || (declared?.some(d => wanted.includes(d)) ?? false)

    /** Single declared value against a multi-select: undeclared never passes. */
    const oneOf = (declared: string | null | undefined, wanted: string[]) =>
        wanted.length === 0 || (!!declared && wanted.includes(declared))

    if (!anyOf(profile.niches, f.niches)) return false
    if (!anyOf(profile.shoot_settings, f.shootSettings)) return false
    if (!anyOf(profile.equipment, f.equipment)) return false
    if (!anyOf(profile.specialties, f.specialties)) return false
    if (!anyOf(profile.languages, f.languages)) return false

    if (!oneOf(profile.experience_level, f.experienceLevels)) return false
    if (!oneOf(profile.skin_tone, f.skinTones)) return false
    if (!oneOf(profile.follower_range, f.followerRanges)) return false

    const canton = f.canton.trim().toLowerCase()
    if (canton && (profile.location_canton ?? '').trim().toLowerCase() !== canton) return false

    if (f.gender && profile.gender !== f.gender) return false
    if (f.hairColor && profile.hair_color !== f.hairColor) return false
    if (f.eyeColor && profile.eye_color !== f.eyeColor) return false

    const ageMin = toNum(f.ageMin)
    const ageMax = toNum(f.ageMax)
    if (ageMin !== null || ageMax !== null) {
        const age = ageFromBirthYear(profile.birth_year)
        if (age === null) return false
        if (ageMin !== null && age < ageMin) return false
        if (ageMax !== null && age > ageMax) return false
    }

    const hMin = toNum(f.heightMin)
    const hMax = toNum(f.heightMax)
    if (hMin !== null || hMax !== null) {
        const h = profile.height_cm
        if (h === null || h === undefined) return false
        if (hMin !== null && h < hMin) return false
        if (hMax !== null && h > hMax) return false
    }

    const maxDelay = toNum(f.maxDeliveryDays)
    if (maxDelay !== null) {
        const delay = profile.delivery_delay_days
        if (delay === null || delay === undefined) return false
        if (delay > maxDelay) return false
    }

    const maxRate = toNum(f.maxRateChf)
    if (maxRate !== null) {
        const rate = profile.hourly_rate_chf
        if (rate === null || rate === undefined) return false
        if (rate > maxRate) return false
    }

    // Refused topics run backwards from every other filter: MOSH picks the subjects
    // the brief needs, and a creator passes only when none of them sit in their
    // refusals. So an EMPTY excluded_topics is the best possible answer here —
    // declining nothing must never be penalised — and the usual
    // "undeclared field excludes the creator" rule deliberately does not apply.
    if (f.mustNotRefuse.length > 0) {
        const refused = profile.excluded_topics ?? []
        if (f.mustNotRefuse.some(topic => refused.includes(topic))) return false
    }

    for (const b of BOOLEAN_FILTERS) {
        if (f[b.key] && !profile[b.field]) return false
    }

    return true
}

/* ─── UI ─── */

const LABEL = 'block text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-1.5'
const SECTION_LABEL = 'block text-[11px] uppercase tracking-wider text-[#6B6B6B] font-semibold mb-3'
const CHIP_ON = 'bg-[#1A1A1A] text-white'
const CHIP_OFF = 'bg-white border border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3]'
const CHIP = 'px-2.5 h-7 rounded-full text-[12px] leading-none transition-colors'
const CONTROL =
    'h-9 px-2.5 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/15 transition-colors'

type Option = { value: string; label: string }

const asOptions = (values: readonly string[]): Option[] =>
    values.map(v => ({ value: v, label: v }))

const DELIVERY_OPTIONS: Option[] = DELIVERY_DELAYS.map(d => ({
    value: String(d.value),
    label: d.label,
}))

/** A quiet heading so a long panel stays scannable. */
function Section({
    title,
    hint,
    children,
}: {
    title: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <section className="border-t border-[#E2E2E1] pt-4 first:border-t-0 first:pt-0">
            <span className={SECTION_LABEL}>{title}</span>
            {hint && <p className="text-[12px] text-[#9B9B9B] -mt-2 mb-3">{hint}</p>}
            <div className="space-y-4">{children}</div>
        </section>
    )
}

function ChipGroup({
    label,
    options,
    selected,
    onToggle,
}: {
    label: string
    options: Option[]
    selected: string[]
    onToggle: (value: string) => void
}) {
    return (
        <div>
            <span className={LABEL}>{label}</span>
            <div className="flex flex-wrap gap-1.5">
                {options.map(o => (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onToggle(o.value)}
                        className={`${CHIP} ${selected.includes(o.value) ? CHIP_ON : CHIP_OFF}`}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

function SelectField({
    label,
    value,
    options,
    placeholder,
    onChange,
}: {
    label: string
    value: string
    options: Option[]
    placeholder: string
    onChange: (value: string) => void
}) {
    return (
        <div>
            <span className={LABEL}>{label}</span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`${CONTROL} w-full`}
            >
                <option value="">{placeholder}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    )
}

function NumberField({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string
    value: string
    placeholder: string
    onChange: (value: string) => void
}) {
    return (
        <div>
            <span className={LABEL}>{label}</span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${CONTROL} w-full tabular-nums`}
            />
        </div>
    )
}

function RangeField({
    label,
    min,
    max,
    suffix,
    onMin,
    onMax,
}: {
    label: string
    min: string
    max: string
    suffix?: string
    onMin: (v: string) => void
    onMax: (v: string) => void
}) {
    return (
        <div>
            <span className={LABEL}>{label}</span>
            <div className="flex items-center gap-1.5">
                <input
                    type="number"
                    inputMode="numeric"
                    value={min}
                    onChange={e => onMin(e.target.value)}
                    placeholder="min"
                    className={`${CONTROL} w-full min-w-0 tabular-nums`}
                />
                <span className="text-[12px] text-[#C4C4C3]">–</span>
                <input
                    type="number"
                    inputMode="numeric"
                    value={max}
                    onChange={e => onMax(e.target.value)}
                    placeholder="max"
                    className={`${CONTROL} w-full min-w-0 tabular-nums`}
                />
                {suffix && <span className="text-[12px] text-[#9B9B9B] shrink-0">{suffix}</span>}
            </div>
        </div>
    )
}

export interface CastingFiltersProps {
    value: CastingFilterState
    onChange: (next: CastingFilterState) => void
    /** Cantons actually declared by the roster, so the list never offers dead ends. */
    cantonOptions?: string[]
    /** Rendered next to the toggle, e.g. "12 créateurs". */
    resultLabel?: string
    className?: string
}

/** Every filter key holding a multi-select list. */
type ListFilterKey = {
    [K in keyof CastingFilterState]: CastingFilterState[K] extends string[] ? K : never
}[keyof CastingFilterState]

export function CastingFilters({
    value,
    onChange,
    cantonOptions = [],
    resultLabel,
    className = '',
}: CastingFiltersProps) {
    const [isOpen, setIsOpen] = useState(false)
    const activeCount = countActiveCastingFilters(value)

    const set = <K extends keyof CastingFilterState>(key: K, v: CastingFilterState[K]) =>
        onChange({ ...value, [key]: v } as CastingFilterState)

    const toggleIn = (key: ListFilterKey) =>
        (option: string) => {
            const current = value[key]
            set(key, current.includes(option)
                ? current.filter(o => o !== option)
                : [...current, option])
        }

    return (
        <div className={className}>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(o => !o)}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors ${activeCount > 0
                        ? 'bg-[#1A1A1A] text-white hover:bg-[#333333]'
                        : 'bg-white border border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3]'
                        }`}
                >
                    {isOpen
                        ? <ChevronUp className="w-4 h-4" strokeWidth={1.8} />
                        : <SlidersHorizontal className="w-4 h-4" strokeWidth={1.8} />}
                    Filtrer
                    {activeCount > 0 && (
                        <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white/20 text-white text-[11px] font-semibold tabular-nums flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </button>

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={() => onChange(EMPTY_CASTING_FILTERS)}
                        className="inline-flex items-center gap-1 h-9 px-2 text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                    >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                        Réinitialiser
                    </button>
                )}

                {resultLabel && (
                    <span className="text-[12px] text-[#9B9B9B] tabular-nums">{resultLabel}</span>
                )}
            </div>

            {isOpen && (
                <div className="mt-2 bg-white border border-[#E2E2E1] rounded-xl p-4 space-y-4">
                    <Section title="Contenu">
                        <ChipGroup
                            label="Niches"
                            options={asOptions(NICHES)}
                            selected={value.niches}
                            onToggle={toggleIn('niches')}
                        />
                        <ChipGroup
                            label="Lieux de tournage"
                            options={asOptions(SHOOT_SETTINGS)}
                            selected={value.shootSettings}
                            onToggle={toggleIn('shootSettings')}
                        />
                        <ChipGroup
                            label="Spécialités"
                            options={SPECIALTY_OPTIONS}
                            selected={value.specialties}
                            onToggle={toggleIn('specialties')}
                        />
                        <ChipGroup
                            label="Langues"
                            options={LANGUAGE_OPTIONS}
                            selected={value.languages}
                            onToggle={toggleIn('languages')}
                        />
                        <ChipGroup
                            label="Équipement"
                            options={asOptions(EQUIPMENT)}
                            selected={value.equipment}
                            onToggle={toggleIn('equipment')}
                        />
                    </Section>

                    <Section title="Collaboration">
                        <ChipGroup
                            label="Expérience"
                            options={asOptions(EXPERIENCE_LEVELS)}
                            selected={value.experienceLevels}
                            onToggle={toggleIn('experienceLevels')}
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <SelectField
                                label="Délai de livraison max"
                                value={value.maxDeliveryDays}
                                options={DELIVERY_OPTIONS}
                                placeholder="Peu importe"
                                onChange={v => set('maxDeliveryDays', v)}
                            />
                            <NumberField
                                label="Tarif max (CHF)"
                                value={value.maxRateChf}
                                placeholder="Peu importe"
                                onChange={v => set('maxRateChf', v)}
                            />
                        </div>
                    </Section>

                    <Section title="Réseaux">
                        <ChipGroup
                            label="Communauté"
                            options={asOptions(FOLLOWER_RANGES)}
                            selected={value.followerRanges}
                            onToggle={toggleIn('followerRanges')}
                        />
                    </Section>

                    <Section title="Profil">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                            {/* Cantons are stored as codes; offer only the ones the roster
                                declares, but show them by name. */}
                            <SelectField
                                label="Canton"
                                value={value.canton}
                                options={(cantonOptions.length > 0
                                    ? cantonOptions
                                    : SWISS_CANTONS.map(c => c.code)
                                ).map(code => ({ value: code, label: cantonLabel(code) || code }))}
                                placeholder="Tous"
                                onChange={v => set('canton', v)}
                            />
                            <SelectField
                                label="Genre"
                                value={value.gender}
                                options={asOptions(GENDERS)}
                                placeholder="Tous"
                                onChange={v => set('gender', v)}
                            />
                            <SelectField
                                label="Cheveux"
                                value={value.hairColor}
                                options={asOptions(HAIR_COLORS)}
                                placeholder="Tous"
                                onChange={v => set('hairColor', v)}
                            />
                            <SelectField
                                label="Yeux"
                                value={value.eyeColor}
                                options={asOptions(EYE_COLORS)}
                                placeholder="Tous"
                                onChange={v => set('eyeColor', v)}
                            />
                            <RangeField
                                label="Âge"
                                min={value.ageMin}
                                max={value.ageMax}
                                onMin={v => set('ageMin', v)}
                                onMax={v => set('ageMax', v)}
                            />
                            <RangeField
                                label="Taille"
                                min={value.heightMin}
                                max={value.heightMax}
                                suffix="cm"
                                onMin={v => set('heightMin', v)}
                                onMax={v => set('heightMax', v)}
                            />
                        </div>
                        <ChipGroup
                            label="Carnation"
                            options={asOptions(SKIN_TONES)}
                            selected={value.skinTones}
                            onToggle={toggleIn('skinTones')}
                        />
                        <div>
                            <span className={LABEL}>Critères pratiques</span>
                            <div className="flex flex-wrap gap-1.5">
                                {BOOLEAN_FILTERS.map(b => (
                                    <button
                                        key={b.key}
                                        type="button"
                                        onClick={() => set(b.key, !value[b.key])}
                                        className={`${CHIP} ${value[b.key] ? CHIP_ON : CHIP_OFF}`}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section
                        title="Ne refuse pas"
                        hint="Sélectionnez les sujets du brief : les créateurs qui les refusent sont écartés."
                    >
                        <ChipGroup
                            label="Sujets à accepter"
                            options={asOptions(EXCLUDED_TOPICS)}
                            selected={value.mustNotRefuse}
                            onToggle={toggleIn('mustNotRefuse')}
                        />
                    </Section>
                </div>
            )}
        </div>
    )
}
