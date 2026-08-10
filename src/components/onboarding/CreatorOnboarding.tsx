'use client'

import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import {
    User,
    Sparkles,
    Globe,
    Video,
    Camera,
    Ruler,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
    NICHES,
    SHOOT_SETTINGS,
    EQUIPMENT,
    HAIR_COLORS,
    EYE_COLORS,
    GENDERS,
    BIRTH_YEARS,
    EXPERIENCE_LEVELS,
    DELIVERY_DELAYS,
    SKIN_TONES,
    FOLLOWER_RANGES,
    EXCLUDED_TOPICS,
} from "@/lib/constants/creatorCasting"
import { SWISS_CANTONS } from "@/lib/validations/swiss"
import { CastingChips, CastingToggle, CastingField, castingControlClass, normalizeHandle, toNullableInt } from "@/components/creators/CastingInputs"

interface CreatorOnboardingProps {
    userId: string
    userName: string
    onComplete: () => void
}

const specialties = [
    { label: 'Témoignage', value: 'testimonial', emoji: '🎤' },
    { label: 'Unboxing', value: 'unboxing', emoji: '📦' },
    { label: 'Review', value: 'review', emoji: '⭐' },
    { label: 'Lifestyle', value: 'lifestyle', emoji: '✨' },
    { label: 'Tutoriel', value: 'tutorial', emoji: '📚' },
    { label: 'ASMR', value: 'asmr', emoji: '🎧' },
]

const languages = [
    { label: 'Français', value: 'fr' },
    { label: 'Allemand', value: 'de' },
    { label: 'Italien', value: 'it' },
    { label: 'Anglais', value: 'en' },
]

const steps = [
    { icon: User, title: 'Votre profil', desc: 'Bio et présentation' },
    { icon: Sparkles, title: 'Spécialités', desc: 'Vos formats préférés' },
    { icon: Globe, title: 'Langues', desc: 'Langues disponibles' },
    { icon: Video, title: 'Portfolio', desc: 'Montrez votre travail' },
    { icon: Camera, title: 'Thématiques', desc: 'Univers et tournages' },
    { icon: Ruler, title: 'Casting', desc: 'Votre profil physique' },
]


const makeChipToggle = (setter: Dispatch<SetStateAction<string[]>>) => (value: string) =>
    setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))

export function CreatorOnboarding({ userId, userName, onComplete }: CreatorOnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSaving, setIsSaving] = useState(false)

    // Form data
    const [bio, setBio] = useState('')
    const [locationCanton, setLocationCanton] = useState('')
    const [hourlyRateChf, setHourlyRateChf] = useState('')
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
    const [experienceLevel, setExperienceLevel] = useState('')
    const [deliveryDelayDays, setDeliveryDelayDays] = useState('')
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['fr'])
    const [portfolioUrl, setPortfolioUrl] = useState('')
    const [portfolioUrls, setPortfolioUrls] = useState<string[]>([])
    const [instagramHandle, setInstagramHandle] = useState('')
    const [tiktokHandle, setTiktokHandle] = useState('')
    const [followerRange, setFollowerRange] = useState('')

    // Casting attributes — self-declared, all optional
    const [niches, setNiches] = useState<string[]>([])
    const [excludedTopics, setExcludedTopics] = useState<string[]>([])
    const [shootSettings, setShootSettings] = useState<string[]>([])
    const [equipment, setEquipment] = useState<string[]>([])
    const [canTravel, setCanTravel] = useState(false)
    const [hasVehicle, setHasVehicle] = useState(false)
    const [doesVoiceover, setDoesVoiceover] = useState(false)
    const [birthYear, setBirthYear] = useState('')
    const [gender, setGender] = useState('')
    const [heightCm, setHeightCm] = useState('')
    const [hairColor, setHairColor] = useState('')
    const [eyeColor, setEyeColor] = useState('')
    const [skinTone, setSkinTone] = useState('')
    const [hasVisibleTattoos, setHasVisibleTattoos] = useState(false)
    const [hasChildren, setHasChildren] = useState(false)
    const [hasPets, setHasPets] = useState(false)

    const canProceed = () => {
        switch (currentStep) {
            case 0: return bio.trim().length >= 10
            case 1: return selectedSpecialties.length >= 1
            case 2: return selectedLanguages.length >= 1
            case 3: return true // Portfolio is optional
            case 4: return true // Casting attributes are optional
            case 5: return true // Casting attributes are optional
            default: return false
        }
    }

    const handleAddPortfolioUrl = () => {
        const trimmed = portfolioUrl.trim()
        if (trimmed && !portfolioUrls.includes(trimmed)) {
            setPortfolioUrls([...portfolioUrls, trimmed])
            setPortfolioUrl('')
        }
    }

    const handleRemoveUrl = (index: number) => {
        setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index))
    }

    const handleComplete = async () => {
        setIsSaving(true)
        const supabase = createClient()

        const { error } = await (supabase as any)
            .from('profiles_creator')
            .upsert({
                user_id: userId,
                bio,
                location_canton: locationCanton || null,
                hourly_rate_chf: toNullableInt(hourlyRateChf),
                specialties: selectedSpecialties,
                experience_level: experienceLevel || null,
                delivery_delay_days: toNullableInt(deliveryDelayDays),
                languages: selectedLanguages,
                portfolio_video_urls: portfolioUrls,
                instagram_handle: normalizeHandle(instagramHandle),
                tiktok_handle: normalizeHandle(tiktokHandle),
                follower_range: followerRange || null,
                niches,
                excluded_topics: excludedTopics,
                shoot_settings: shootSettings,
                equipment,
                can_travel: canTravel,
                has_vehicle: hasVehicle,
                does_voiceover: doesVoiceover,
                birth_year: toNullableInt(birthYear),
                gender: gender || null,
                height_cm: toNullableInt(heightCm),
                hair_color: hairColor || null,
                eye_color: eyeColor || null,
                skin_tone: skinTone || null,
                has_visible_tattoos: hasVisibleTattoos,
                has_children: hasChildren,
                has_pets: hasPets,
            }, { onConflict: 'user_id' })

        if (error) {
            console.error('Error saving onboarding:', error)
        }

        setIsSaving(false)
        onComplete()
    }

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleComplete()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1)
    }

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-16 h-16 rounded-lg bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4"
                    >
                        <span className="text-2xl font-black text-white">M</span>
                    </motion.div>
                    <h1 className="text-[28px] font-semibold text-[#1A1A1A] tracking-[-0.02em]">
                        Bienvenue, {userName.split(' ')[0]} ! 👋
                    </h1>
                    <p className="text-[#6B6B6B] mt-2">
                        Complétez votre profil pour recevoir vos premières missions
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className={`
                                w-full h-1.5 rounded-full transition-all duration-500
                                ${index <= currentStep ? 'bg-[#1A1A1A]' : 'bg-[#F2F2F1]'}
                            `} />
                            <span className={`text-[10px] font-medium transition-colors ${
                                index <= currentStep ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white border border-[#E2E2E1] rounded-xl p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Step 0: Bio */}
                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Présentez-vous</h2>
                                        <p className="text-sm text-[#6B6B6B]">Décrivez votre style, votre expérience et ce qui vous rend unique</p>
                                    </div>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={5}
                                        placeholder="Ex : Créatrice de contenu spécialisée dans le lifestyle et la beauté. 3 ans d'expérience en UGC avec un style authentique et dynamique..."
                                        className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 resize-none placeholder:text-[#9B9B9B]"
                                    />
                                    <p className={`text-xs ${bio.trim().length >= 10 ? 'text-[#6B6B6B]' : 'text-[#9B9B9B]'}`}>
                                        {bio.trim().length}/10 caractères minimum
                                    </p>
                                    <div className="pt-4 border-t border-[#F2F2F1] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CastingField label="Canton">
                                            <select
                                                value={locationCanton}
                                                onChange={(e) => setLocationCanton(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {SWISS_CANTONS.map(canton => (
                                                    <option key={canton.code} value={canton.code}>{canton.name}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                        <CastingField label="Tarif indicatif par vidéo (CHF)">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                step={10}
                                                value={hourlyRateChf}
                                                onChange={(e) => setHourlyRateChf(e.target.value)}
                                                placeholder="Ex : 250"
                                                className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                            />
                                        </CastingField>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Specialties */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Vos spécialités</h2>
                                        <p className="text-sm text-[#6B6B6B]">Sélectionnez les formats que vous maîtrisez</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {specialties.map(spec => {
                                            const isSelected = selectedSpecialties.includes(spec.value)
                                            return (
                                                <button
                                                    key={spec.value}
                                                    onClick={() => {
                                                        setSelectedSpecialties(prev =>
                                                            isSelected
                                                                ? prev.filter(s => s !== spec.value)
                                                                : [...prev, spec.value]
                                                        )
                                                    }}
                                                    className={`
                                                        flex items-center gap-3 p-4 rounded-lg text-left transition-all
                                                        ${isSelected
                                                            ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A]'
                                                            : 'bg-[#F4F4F3] text-[#6B6B6B] hover:bg-[#F2F2F1]'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-xl">{spec.emoji}</span>
                                                    <span className="font-medium text-sm">{spec.label}</span>
                                                    {isSelected && <Check className="w-4 h-4 ml-auto" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="pt-4 border-t border-[#F2F2F1] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CastingField label="Niveau d'expérience">
                                            <select
                                                value={experienceLevel}
                                                onChange={(e) => setExperienceLevel(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {EXPERIENCE_LEVELS.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                        <CastingField label="Délai de livraison habituel">
                                            <select
                                                value={deliveryDelayDays}
                                                onChange={(e) => setDeliveryDelayDays(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {DELIVERY_DELAYS.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Languages */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Langues parlées</h2>
                                        <p className="text-sm text-[#6B6B6B]">Dans quelles langues pouvez-vous créer du contenu ?</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {languages.map(lang => {
                                            const isSelected = selectedLanguages.includes(lang.value)
                                            return (
                                                <button
                                                    key={lang.value}
                                                    onClick={() => {
                                                        setSelectedLanguages(prev =>
                                                            isSelected
                                                                ? prev.filter(l => l !== lang.value)
                                                                : [...prev, lang.value]
                                                        )
                                                    }}
                                                    className={`
                                                        px-5 py-3 rounded-full font-medium text-sm transition-all
                                                        ${isSelected
                                                            ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A]'
                                                            : 'bg-[#F4F4F3] text-[#6B6B6B] hover:bg-[#F2F2F1]'
                                                        }
                                                    `}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 inline mr-2" />}
                                                    {lang.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Portfolio */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Votre portfolio</h2>
                                        <p className="text-sm text-[#6B6B6B]">Ajoutez des liens vers vos vidéos (TikTok, Instagram, YouTube...)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddPortfolioUrl()}
                                            placeholder="https://www.tiktok.com/@votre-video"
                                            className="flex-1 bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 placeholder:text-[#9B9B9B]"
                                        />
                                        <Button
                                            onClick={handleAddPortfolioUrl}
                                            disabled={!portfolioUrl.trim()}
                                            className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-lg px-4"
                                        >
                                            Ajouter
                                        </Button>
                                    </div>
                                    {portfolioUrls.length > 0 && (
                                        <div className="space-y-2">
                                            {portfolioUrls.map((url, index) => (
                                                <div key={index} className="flex items-center gap-2 p-3 bg-[#F4F4F3] rounded-lg">
                                                    <Video className="w-4 h-4 text-[#6B6B6B] flex-shrink-0" />
                                                    <span className="text-sm text-[#1A1A1A] truncate flex-1">{url}</span>
                                                    <button
                                                        onClick={() => handleRemoveUrl(index)}
                                                        className="text-[#9B9B9B] hover:text-[#C0392B] transition-colors text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-[#9B9B9B]">
                                        Vous pourrez aussi en ajouter plus tard depuis votre portfolio
                                    </p>
                                    <div className="pt-4 border-t border-[#F2F2F1] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CastingField label="Instagram">
                                            <input
                                                type="text"
                                                value={instagramHandle}
                                                onChange={(e) => setInstagramHandle(e.target.value)}
                                                placeholder="@votrecompte"
                                                className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                            />
                                        </CastingField>
                                        <CastingField label="TikTok">
                                            <input
                                                type="text"
                                                value={tiktokHandle}
                                                onChange={(e) => setTiktokHandle(e.target.value)}
                                                placeholder="@votrecompte"
                                                className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                            />
                                        </CastingField>
                                        <div className="sm:col-span-2">
                                            <CastingField label="Nombre d'abonnés">
                                                <select
                                                    value={followerRange}
                                                    onChange={(e) => setFollowerRange(e.target.value)}
                                                    className={castingControlClass}
                                                >
                                                    <option value="">Non précisé</option>
                                                    {FOLLOWER_RANGES.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            </CastingField>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Niches, shoot settings, equipment (all optional) */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Vos thématiques et tournages</h2>
                                        <p className="text-sm text-[#6B6B6B]">
                                            Facultatif — ça nous aide à vous proposer les bonnes missions
                                        </p>
                                    </div>
                                    <div className="space-y-2.5">
                                        <p className="text-[12px] font-medium text-[#6B6B6B]">Thématiques</p>
                                        <CastingChips
                                            options={NICHES}
                                            selected={niches}
                                            onToggle={makeChipToggle(setNiches)}
                                        />
                                    </div>
                                    <div className="space-y-2.5 pt-5 border-t border-[#F2F2F1]">
                                        <div>
                                            <p className="text-[12px] font-medium text-[#6B6B6B]">Sujets que vous ne souhaitez pas traiter</p>
                                            <p className="text-[12px] text-[#9B9B9B] mt-0.5">
                                                Nous ne vous proposerons aucune mission sur ces sujets
                                            </p>
                                        </div>
                                        <CastingChips
                                            options={EXCLUDED_TOPICS}
                                            selected={excludedTopics}
                                            onToggle={makeChipToggle(setExcludedTopics)}
                                        />
                                    </div>
                                    <div className="space-y-2.5 pt-5 border-t border-[#F2F2F1]">
                                        <p className="text-[12px] font-medium text-[#6B6B6B]">Lieux de tournage</p>
                                        <CastingChips
                                            options={SHOOT_SETTINGS}
                                            selected={shootSettings}
                                            onToggle={makeChipToggle(setShootSettings)}
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <p className="text-[12px] font-medium text-[#6B6B6B]">Matériel</p>
                                        <CastingChips
                                            options={EQUIPMENT}
                                            selected={equipment}
                                            onToggle={makeChipToggle(setEquipment)}
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <p className="text-[12px] font-medium text-[#6B6B6B]">Disponibilité</p>
                                        <div className="flex flex-wrap gap-2">
                                            <CastingToggle label="Je peux me déplacer" checked={canTravel} onChange={setCanTravel} />
                                            <CastingToggle label="J'ai un véhicule" checked={hasVehicle} onChange={setHasVehicle} />
                                            <CastingToggle label="Je fais de la voix off" checked={doesVoiceover} onChange={setDoesVoiceover} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Physical casting profile (all optional) */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Votre profil</h2>
                                        <p className="text-sm text-[#6B6B6B]">
                                            Déclaratif, à remplir seulement si vous le souhaitez
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <CastingField label="Année de naissance">
                                            <select
                                                value={birthYear}
                                                onChange={(e) => setBirthYear(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {BIRTH_YEARS.map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                        <CastingField label="Genre">
                                            <select
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {GENDERS.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                        <CastingField label="Taille (cm)">
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={100}
                                                max={230}
                                                value={heightCm}
                                                onChange={(e) => setHeightCm(e.target.value)}
                                                placeholder="Ex : 170"
                                                className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                            />
                                        </CastingField>
                                        <CastingField label="Couleur de cheveux">
                                            <select
                                                value={hairColor}
                                                onChange={(e) => setHairColor(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {HAIR_COLORS.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                        <CastingField label="Couleur des yeux">
                                            <select
                                                value={eyeColor}
                                                onChange={(e) => setEyeColor(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {EYE_COLORS.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                        <CastingField label="Carnation">
                                            <select
                                                value={skinTone}
                                                onChange={(e) => setSkinTone(e.target.value)}
                                                className={castingControlClass}
                                            >
                                                <option value="">Non précisé</option>
                                                {SKIN_TONES.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </CastingField>
                                    </div>
                                    <div className="space-y-2.5 pt-5 border-t border-[#F2F2F1]">
                                        <p className="text-[12px] font-medium text-[#6B6B6B]">Signes particuliers</p>
                                        <div className="flex flex-wrap gap-2">
                                            <CastingToggle label="Tatouages visibles" checked={hasVisibleTattoos} onChange={setHasVisibleTattoos} />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5 pt-5 border-t border-[#F2F2F1]">
                                        <p className="text-[12px] font-medium text-[#6B6B6B]">Votre foyer</p>
                                        <div className="flex flex-wrap gap-2">
                                            <CastingToggle label="Enfants au foyer" checked={hasChildren} onChange={setHasChildren} />
                                            <CastingToggle label="Animaux au foyer" checked={hasPets} onChange={setHasPets} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#F2F2F1]">
                        {currentStep > 0 ? (
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                className="text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F3] rounded-full"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Retour
                            </Button>
                        ) : (
                            <div />
                        )}
                        <Button
                            onClick={nextStep}
                            disabled={!canProceed() || isSaving}
                            className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full px-6"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {currentStep === steps.length - 1 ? (
                                <>
                                    Terminer
                                    <Check className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    Continuer
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Skip link */}
                <div className="text-center mt-4">
                    <button
                        onClick={onComplete}
                        className="text-sm text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
                    >
                        Compléter plus tard
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
