'use client'

/**
 * Casting filters — one component for the creators directory and the mission
 * creator selector, so MOSH narrows a roster with the same vocabulary the
 * creators used to describe themselves.
 *
 * Rules of the game:
 *  - AND across categories, OR inside a category.
 *  - An undeclared field only ever excludes a creator when a filter on that
 *    field is actually active.
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
    ageFromBirthYear,
} from '@/lib/constants/creatorCasting'
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
] as const

export interface CastingFilterState {
    niches: string[]
    shootSettings: string[]
    equipment: string[]
    specialties: string[]
    languages: string[]
    canton: string
    ageMin: string
    ageMax: string
    gender: string
    hairColor: string
    eyeColor: string
    heightMin: string
    heightMax: string
    canTravel: boolean
    hasVehicle: boolean
    doesVoiceover: boolean
    hasChildren: boolean
    hasPets: boolean
}

export const EMPTY_CASTING_FILTERS: CastingFilterState = {
    niches: [],
    shootSettings: [],
    equipment: [],
    specialties: [],
    languages: [],
    canton: '',
    ageMin: '',
    ageMax: '',
    gender: '',
    hairColor: '',
    eyeColor: '',
    heightMin: '',
    heightMax: '',
    canTravel: false,
    hasVehicle: false,
    doesVoiceover: false,
    hasChildren: false,
    hasPets: false,
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
        f.languages.length
    if (f.canton.trim()) n++
    if (toNum(f.ageMin) !== null || toNum(f.ageMax) !== null) n++
    if (f.gender) n++
    if (f.hairColor) n++
    if (f.eyeColor) n++
    if (toNum(f.heightMin) !== null || toNum(f.heightMax) !== null) n++
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

    if (!anyOf(profile.niches, f.niches)) return false
    if (!anyOf(profile.shoot_settings, f.shootSettings)) return false
    if (!anyOf(profile.equipment, f.equipment)) return false
    if (!anyOf(profile.specialties, f.specialties)) return false
    if (!anyOf(profile.languages, f.languages)) return false

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

    for (const b of BOOLEAN_FILTERS) {
        if (f[b.key] && !profile[b.field]) return false
    }

    return true
}

/* ─── UI ─── */

const LABEL = 'block text-[11px] uppercase tracking-wider text-[#9B9B9B] mb-1.5'
const CHIP_ON = 'bg-[#1A1A1A] text-white'
const CHIP_OFF = 'bg-white border border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3]'
const CHIP = 'px-2.5 h-7 rounded-full text-[12px] leading-none transition-colors'
const CONTROL =
    'h-9 px-2.5 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/15 transition-colors'

type Option = { value: string; label: string }

const asOptions = (values: readonly string[]): Option[] =>
    values.map(v => ({ value: v, label: v }))

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

    const toggleIn = (key: 'niches' | 'shootSettings' | 'equipment' | 'specialties' | 'languages') =>
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

                    <div className="border-t border-[#E2E2E1] pt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {cantonOptions.length > 0 ? (
                            <SelectField
                                label="Canton"
                                value={value.canton}
                                options={asOptions(cantonOptions)}
                                placeholder="Tous"
                                onChange={v => set('canton', v)}
                            />
                        ) : (
                            <div>
                                <span className={LABEL}>Canton</span>
                                <input
                                    type="text"
                                    value={value.canton}
                                    onChange={e => set('canton', e.target.value)}
                                    placeholder="Tous"
                                    className={`${CONTROL} w-full`}
                                />
                            </div>
                        )}
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

                    <div className="border-t border-[#E2E2E1] pt-4">
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
                </div>
            )}
        </div>
    )
}
