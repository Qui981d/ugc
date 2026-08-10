'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    User,
    Bell,
    CreditCard,
    Shield,
    Trash2,
    Download,
    Camera,
    Save,
    Eye,
    EyeOff,
    ChevronRight,
    AlertTriangle,
    Smartphone,
    Check,
    Loader2
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
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
import { CastingChips, CastingToggle, CastingField, castingControlClass, normalizeHandle, toNullableInt } from "@/components/creators/CastingInputs"

const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'account', label: 'Compte', icon: Trash2 },
]

const specialties = ['Témoignage', 'Unboxing', 'Review', 'Lifestyle', 'Tutoriel', 'ASMR']

// Map French labels <-> DB enum values
const specialtyLabelToEnum: Record<string, string> = {
    'Témoignage': 'testimonial',
    'Unboxing': 'unboxing',
    'Review': 'review',
    'Lifestyle': 'lifestyle',
    'Tutoriel': 'tutorial',
    'ASMR': 'asmr',
}
const specialtyEnumToLabel: Record<string, string> = Object.fromEntries(
    Object.entries(specialtyLabelToEnum).map(([k, v]) => [v, k])
)


export default function CreatorSettingsPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])
    const [showPassword, setShowPassword] = useState(false)
    const [isDataLoading, setIsDataLoading] = useState(false)

    // Profile state
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        bio: '',
        location: '',
        languages: [] as string[],
        selectedSpecialties: [] as string[],
        avatarUrl: '',
        // Casting attributes — all optional, self-declared
        niches: [] as string[],
        shootSettings: [] as string[],
        equipment: [] as string[],
        canTravel: false,
        hasVehicle: false,
        doesVoiceover: false,
        birthYear: '',
        gender: '',
        heightCm: '',
        hairColor: '',
        eyeColor: '',
        hasChildren: false,
        hasPets: false,
        experienceLevel: '',
        deliveryDelayDays: '',
        hourlyRateChf: '',
        skinTone: '',
        hasVisibleTattoos: false,
        instagramHandle: '',
        tiktokHandle: '',
        followerRange: '',
        excludedTopics: [] as string[],
    })

    /** Toggles one value inside a string[] field of profileData. */
    const toggleCastingChip = (key: 'niches' | 'shootSettings' | 'equipment' | 'excludedTopics') => (value: string) =>
        setProfileData(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(v => v !== value)
                : [...prev[key], value],
        }))

    // Load real user data
    useEffect(() => {
        // Don't do anything while auth is loading
        if (!userId) return

        // No user = nothing to load
        if (!user) return

        async function loadProfile() {
            setIsDataLoading(true)
            const supabase = createClient()

            // Get creator profile
            const { data: creatorProfile } = await supabase
                .from('profiles_creator')
                .select('*')
                .eq('user_id', userId!)
                .single()

            // Map DB enum specialties back to French labels
            const dbSpecialties: string[] = (creatorProfile as any)?.specialties || []
            const labeledSpecialties = dbSpecialties.map((s: string) => specialtyEnumToLabel[s] || s)

            setProfileData({
                name: user!.full_name || '',
                email: user!.email || '',
                bio: (creatorProfile as any)?.bio || '',
                location: (creatorProfile as any)?.location_canton || '',
                languages: (creatorProfile as any)?.languages || [],
                selectedSpecialties: labeledSpecialties,
                avatarUrl: user!.avatar_url || '',
                niches: (creatorProfile as any)?.niches || [],
                shootSettings: (creatorProfile as any)?.shoot_settings || [],
                equipment: (creatorProfile as any)?.equipment || [],
                canTravel: (creatorProfile as any)?.can_travel ?? false,
                hasVehicle: (creatorProfile as any)?.has_vehicle ?? false,
                doesVoiceover: (creatorProfile as any)?.does_voiceover ?? false,
                birthYear: (creatorProfile as any)?.birth_year?.toString() || '',
                gender: (creatorProfile as any)?.gender || '',
                heightCm: (creatorProfile as any)?.height_cm?.toString() || '',
                hairColor: (creatorProfile as any)?.hair_color || '',
                eyeColor: (creatorProfile as any)?.eye_color || '',
                hasChildren: (creatorProfile as any)?.has_children ?? false,
                hasPets: (creatorProfile as any)?.has_pets ?? false,
                experienceLevel: (creatorProfile as any)?.experience_level || '',
                deliveryDelayDays: (creatorProfile as any)?.delivery_delay_days?.toString() || '',
                hourlyRateChf: (creatorProfile as any)?.hourly_rate_chf?.toString() || '',
                skinTone: (creatorProfile as any)?.skin_tone || '',
                hasVisibleTattoos: (creatorProfile as any)?.has_visible_tattoos ?? false,
                instagramHandle: (creatorProfile as any)?.instagram_handle || '',
                tiktokHandle: (creatorProfile as any)?.tiktok_handle || '',
                followerRange: (creatorProfile as any)?.follower_range || '',
                excludedTopics: (creatorProfile as any)?.excluded_topics || [],
            })
            setIsDataLoading(false)
        }

        loadProfile()
    }, [userId])

    // Notifications state
    const [notifications, setNotifications] = useState({
        emailNewMission: true,
        emailMessages: true,
        emailPayments: true,
        emailMarketing: false,
        pushNewMission: true,
        pushMessages: true,
        pushPayments: false,
    })

    // Security state
    const [security, setSecurity] = useState({
        twoFactor: false,
    })

    const handleSaveProfile = async () => {
        if (!user) return
        setIsSaving(true)

        const supabase = createClient()

        // Update user table
        const { error: userErr } = await (supabase as any)
            .from('users')
            .update({ full_name: profileData.name })
            .eq('id', user!.id)

        if (userErr) console.error('Error updating user:', userErr)

        // Map French specialty labels to DB enum values
        const enumSpecialties = profileData.selectedSpecialties.map(
            (s: string) => specialtyLabelToEnum[s] || s
        )

        // Upsert creator profile (creates row if it doesn't exist)
        const { error: profileErr } = await (supabase as any)
            .from('profiles_creator')
            .upsert({
                user_id: user!.id,
                bio: profileData.bio,
                location_canton: profileData.location,
                languages: profileData.languages,
                specialties: enumSpecialties,
                niches: profileData.niches,
                shoot_settings: profileData.shootSettings,
                equipment: profileData.equipment,
                can_travel: profileData.canTravel,
                has_vehicle: profileData.hasVehicle,
                does_voiceover: profileData.doesVoiceover,
                birth_year: toNullableInt(profileData.birthYear),
                gender: profileData.gender || null,
                height_cm: toNullableInt(profileData.heightCm),
                hair_color: profileData.hairColor || null,
                eye_color: profileData.eyeColor || null,
                has_children: profileData.hasChildren,
                has_pets: profileData.hasPets,
                experience_level: profileData.experienceLevel || null,
                delivery_delay_days: toNullableInt(profileData.deliveryDelayDays),
                hourly_rate_chf: toNullableInt(profileData.hourlyRateChf),
                skin_tone: profileData.skinTone || null,
                has_visible_tattoos: profileData.hasVisibleTattoos,
                instagram_handle: normalizeHandle(profileData.instagramHandle),
                tiktok_handle: normalizeHandle(profileData.tiktokHandle),
                follower_range: profileData.followerRange || null,
                excluded_topics: profileData.excludedTopics,
            }, { onConflict: 'user_id' })

        if (profileErr) console.error('Error saving creator profile:', profileErr)

        setIsSaving(false)
    }

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-8">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F4F4F3] flex items-center justify-center">
                                    {profileData.avatarUrl ? (
                                        <Image
                                            src={profileData.avatarUrl}
                                            alt="Avatar"
                                            width={96}
                                            height={96}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl text-[#6B6B6B]">{profileData.name.charAt(0) || '?'}</span>
                                    )}
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[#1A1A1A]">{profileData.name || 'Nouveau créateur'}</h3>
                                <p className="text-sm text-[#6B6B6B]">{profileData.email}</p>
                                <Button variant="outline" size="sm" className="mt-2 border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F4F4F3] rounded-full">
                                    Changer la photo
                                </Button>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Nom complet</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Email</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#9B9B9B] cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Bio</label>
                            <textarea
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                rows={4}
                                placeholder="Décrivez votre style et vos spécialités..."
                                className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 resize-none placeholder:text-[#9B9B9B]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Localisation</label>
                            <input
                                type="text"
                                value={profileData.location}
                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                placeholder="Ex: Genève, Suisse"
                                className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 placeholder:text-[#9B9B9B]"
                            />
                        </div>

                        {/* Specialties */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-3">Spécialités</label>
                            <div className="flex flex-wrap gap-2">
                                {specialties.map(specialty => (
                                    <button
                                        key={specialty}
                                        onClick={() => {
                                            const selected = profileData.selectedSpecialties.includes(specialty)
                                            setProfileData({
                                                ...profileData,
                                                selectedSpecialties: selected
                                                    ? profileData.selectedSpecialties.filter(s => s !== specialty)
                                                    : [...profileData.selectedSpecialties, specialty]
                                            })
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${profileData.selectedSpecialties.includes(specialty)
                                            ? 'bg-[#1A1A1A] text-white'
                                            : 'bg-[#F4F4F3] text-[#6B6B6B] hover:bg-[#F2F2F1]'
                                            }`}
                                    >
                                        {specialty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Votre façon de travailler */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <CastingField label="Niveau d'expérience">
                                <select
                                    value={profileData.experienceLevel}
                                    onChange={(e) => setProfileData({ ...profileData, experienceLevel: e.target.value })}
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
                                    value={profileData.deliveryDelayDays}
                                    onChange={(e) => setProfileData({ ...profileData, deliveryDelayDays: e.target.value })}
                                    className={castingControlClass}
                                >
                                    <option value="">Non précisé</option>
                                    {DELIVERY_DELAYS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </CastingField>
                            <CastingField label="Tarif indicatif par vidéo (CHF)">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={profileData.hourlyRateChf}
                                    onChange={(e) => setProfileData({ ...profileData, hourlyRateChf: e.target.value })}
                                    placeholder="Ex : 250"
                                    className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                />
                            </CastingField>
                        </div>

                        {/* Réseaux */}
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-[#6B6B6B]">Réseaux</p>
                                <p className="text-[12px] text-[#9B9B9B] mt-0.5">
                                    Facultatif — certaines marques cherchent une audience en plus du contenu
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <CastingField label="Instagram">
                                    <input
                                        type="text"
                                        value={profileData.instagramHandle}
                                        onChange={(e) => setProfileData({ ...profileData, instagramHandle: e.target.value })}
                                        placeholder="@votrecompte"
                                        className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                    />
                                </CastingField>
                                <CastingField label="TikTok">
                                    <input
                                        type="text"
                                        value={profileData.tiktokHandle}
                                        onChange={(e) => setProfileData({ ...profileData, tiktokHandle: e.target.value })}
                                        placeholder="@votrecompte"
                                        className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                    />
                                </CastingField>
                                <CastingField label="Nombre d'abonnés">
                                    <select
                                        value={profileData.followerRange}
                                        onChange={(e) => setProfileData({ ...profileData, followerRange: e.target.value })}
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

                        {/* Thématiques et tournages */}
                        <div className="pt-8 border-t border-[#E2E2E1] space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[#1A1A1A]">Thématiques et tournages</h3>
                                <p className="text-sm text-[#6B6B6B] mt-1">
                                    Ces informations servent à vous proposer des missions qui vous correspondent. Plus votre profil est complet, plus vous êtes visible.
                                </p>
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-[12px] font-medium text-[#6B6B6B]">Thématiques</p>
                                <CastingChips
                                    options={NICHES}
                                    selected={profileData.niches}
                                    onToggle={toggleCastingChip('niches')}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-[12px] font-medium text-[#6B6B6B]">Lieux de tournage</p>
                                <CastingChips
                                    options={SHOOT_SETTINGS}
                                    selected={profileData.shootSettings}
                                    onToggle={toggleCastingChip('shootSettings')}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-[12px] font-medium text-[#6B6B6B]">Matériel</p>
                                <CastingChips
                                    options={EQUIPMENT}
                                    selected={profileData.equipment}
                                    onToggle={toggleCastingChip('equipment')}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-[12px] font-medium text-[#6B6B6B]">Disponibilité</p>
                                <div className="flex flex-wrap gap-2">
                                    <CastingToggle
                                        label="Je peux me déplacer"
                                        checked={profileData.canTravel}
                                        onChange={(v) => setProfileData(prev => ({ ...prev, canTravel: v }))}
                                    />
                                    <CastingToggle
                                        label="J'ai un véhicule"
                                        checked={profileData.hasVehicle}
                                        onChange={(v) => setProfileData(prev => ({ ...prev, hasVehicle: v }))}
                                    />
                                    <CastingToggle
                                        label="Je fais de la voix off"
                                        checked={profileData.doesVoiceover}
                                        onChange={(v) => setProfileData(prev => ({ ...prev, doesVoiceover: v }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5 pt-2">
                                <div>
                                    <p className="text-[12px] font-medium text-[#6B6B6B]">Sujets que vous ne souhaitez pas traiter</p>
                                    <p className="text-[12px] text-[#9B9B9B] mt-0.5">
                                        Ce que vous cochez ici est écarté — vous ne recevrez pas de missions sur ces sujets
                                    </p>
                                </div>
                                <CastingChips
                                    options={EXCLUDED_TOPICS}
                                    selected={profileData.excludedTopics}
                                    onToggle={toggleCastingChip('excludedTopics')}
                                />
                            </div>
                        </div>

                        {/* Profil physique */}
                        <div className="pt-8 border-t border-[#E2E2E1] space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-[#1A1A1A]">Profil physique</h3>
                                <p className="text-sm text-[#6B6B6B] mt-1">
                                    Déclaratif, à remplir seulement si vous le souhaitez
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CastingField label="Année de naissance">
                                    <select
                                        value={profileData.birthYear}
                                        onChange={(e) => setProfileData({ ...profileData, birthYear: e.target.value })}
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
                                        value={profileData.gender}
                                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
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
                                        value={profileData.heightCm}
                                        onChange={(e) => setProfileData({ ...profileData, heightCm: e.target.value })}
                                        placeholder="Ex : 170"
                                        className={`${castingControlClass} placeholder:text-[#9B9B9B]`}
                                    />
                                </CastingField>
                                <CastingField label="Couleur de cheveux">
                                    <select
                                        value={profileData.hairColor}
                                        onChange={(e) => setProfileData({ ...profileData, hairColor: e.target.value })}
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
                                        value={profileData.eyeColor}
                                        onChange={(e) => setProfileData({ ...profileData, eyeColor: e.target.value })}
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
                                        value={profileData.skinTone}
                                        onChange={(e) => setProfileData({ ...profileData, skinTone: e.target.value })}
                                        className={castingControlClass}
                                    >
                                        <option value="">Non précisé</option>
                                        {SKIN_TONES.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </CastingField>
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-[12px] font-medium text-[#6B6B6B]">Signes particuliers</p>
                                <div className="flex flex-wrap gap-2">
                                    <CastingToggle
                                        label="Tatouages visibles"
                                        checked={profileData.hasVisibleTattoos}
                                        onChange={(v) => setProfileData(prev => ({ ...prev, hasVisibleTattoos: v }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <p className="text-[12px] font-medium text-[#6B6B6B]">Votre foyer</p>
                                <div className="flex flex-wrap gap-2">
                                    <CastingToggle
                                        label="Enfants au foyer"
                                        checked={profileData.hasChildren}
                                        onChange={(v) => setProfileData(prev => ({ ...prev, hasChildren: v }))}
                                    />
                                    <CastingToggle
                                        label="Animaux au foyer"
                                        checked={profileData.hasPets}
                                        onChange={(v) => setProfileData(prev => ({ ...prev, hasPets: v }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full" onClick={handleSaveProfile} disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Enregistrer les modifications
                        </Button>
                    </div>
                )

            case 'notifications':
                return (
                    <div className="space-y-8">
                        {/* Email Notifications */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Notifications par email</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'emailNewMission', label: 'Nouvelles missions', desc: 'Recevez un email quand une nouvelle mission correspond à votre profil' },
                                    { key: 'emailMessages', label: 'Messages', desc: 'Recevez un email pour chaque nouveau message' },
                                    { key: 'emailPayments', label: 'Paiements', desc: 'Notifications de paiement et facturation' },
                                    { key: 'emailMarketing', label: 'Marketing', desc: 'Actualités et offres spéciales' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-[#F4F4F3] rounded-lg">
                                        <div>
                                            <p className="text-[#1A1A1A] font-medium">{item.label}</p>
                                            <p className="text-sm text-[#9B9B9B]">{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={notifications[item.key as keyof typeof notifications]}
                                            onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Push Notifications */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Notifications push</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'pushNewMission', label: 'Nouvelles missions' },
                                    { key: 'pushMessages', label: 'Messages' },
                                    { key: 'pushPayments', label: 'Paiements' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-[#F4F4F3] rounded-lg">
                                        <p className="text-[#1A1A1A] font-medium">{item.label}</p>
                                        <Switch
                                            checked={notifications[item.key as keyof typeof notifications]}
                                            onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case 'payment':
                return (
                    <div className="space-y-8">
                        {/* Current Payment Method */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Méthode de paiement</h3>
                            <div className="p-5 bg-[#F4F4F3] rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-[#6B6B6B]" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#1A1A1A]">Virement bancaire (IBAN)</p>
                                            <p className="text-sm text-[#9B9B9B]">Non configuré</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Update IBAN */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Configurer l'IBAN</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">Titulaire du compte</label>
                                    <input
                                        type="text"
                                        placeholder="Votre nom complet"
                                        className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 placeholder:text-[#9B9B9B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">IBAN</label>
                                    <input
                                        type="text"
                                        placeholder="CH00 0000 0000 0000 0000 0"
                                        className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 placeholder:text-[#9B9B9B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">BIC/SWIFT (optionnel)</label>
                                    <input
                                        type="text"
                                        placeholder="UBSWCHZH80A"
                                        className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15 placeholder:text-[#9B9B9B]"
                                    />
                                </div>
                                <Button className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full">
                                    <Save className="w-4 h-4 mr-2" />
                                    Enregistrer
                                </Button>
                            </div>
                        </div>
                    </div>
                )

            case 'security':
                return (
                    <div className="space-y-8">
                        {/* Password */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Mot de passe</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">Mot de passe actuel</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#1A1A1A]"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-[#F4F4F3] border border-transparent rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                    />
                                </div>
                                <Button className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full">
                                    Changer le mot de passe
                                </Button>
                            </div>
                        </div>

                        {/* 2FA */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Authentification à deux facteurs</h3>
                            <div className="p-5 bg-[#F4F4F3] rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-[#6B6B6B]" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#1A1A1A]">2FA par application</p>
                                            <p className="text-sm text-[#9B9B9B]">Utilisez Google Authenticator ou similaire</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={security.twoFactor}
                                        onCheckedChange={(checked) => setSecurity({ ...security, twoFactor: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 'account':
                return (
                    <div className="space-y-8">
                        {/* Export Data */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Exporter vos données</h3>
                            <div className="p-5 bg-[#F4F4F3] rounded-lg">
                                <p className="text-[#6B6B6B] mb-4">
                                    Téléchargez une copie de toutes vos données personnelles, incluant votre profil,
                                    vos missions et votre historique de paiements.
                                </p>
                                <Button variant="outline" className="border-[#E2E2E1] text-[#1A1A1A] hover:bg-[#F2F2F1] rounded-full">
                                    <Download className="w-4 h-4 mr-2" />
                                    Exporter mes données
                                </Button>
                            </div>
                        </div>

                        {/* Delete Account */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Supprimer le compte</h3>
                            <div className="p-5 bg-[#1A1A1A]/10 border border-[#F2CFCB]/20 rounded-lg">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1A]/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-[#C0392B]" />
                                    </div>
                                    <div>
                                        <p className="text-[#1A1A1A] font-medium mb-1">Action irréversible</p>
                                        <p className="text-[#6B6B6B] text-sm mb-4">
                                            La suppression de votre compte effacera définitivement toutes vos données,
                                            incluant votre profil, portfolio, et historique de missions.
                                            Cette action ne peut pas être annulée.
                                        </p>
                                        <Button variant="outline" className="border-[#F2CFCB]/30 text-[#C0392B] hover:bg-[#1A1A1A]/20">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer mon compte
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1A1A1A] tracking-[-0.02em]">Paramètres</h1>
                <p className="text-[#6B6B6B] mt-1">Gérez votre profil et préférences</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Sidebar Tabs — horizontal scroll on mobile, vertical on desktop */}
                <div className="flex md:flex-col md:w-60 md:flex-shrink-0 gap-1 overflow-x-auto pb-2 md:pb-0 md:space-y-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-lg text-left transition-all whitespace-nowrap flex-shrink-0 md:w-full ${activeTab === tab.id
                                    ? 'bg-[#1A1A1A] text-white'
                                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F3]'
                                    }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="font-medium text-sm md:text-base">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <ChevronRight className="w-4 h-4 ml-auto hidden md:block" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 bg-white border border-[#E2E2E1] rounded-xl p-4 md:p-8"
                >
                    {renderTabContent()}
                </motion.div>
            </div>
        </div>
    )
}
