'use client'

import { useState, useEffect } from 'react'
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
    Loader2
} from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

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
    })

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
            }, { onConflict: 'user_id' })

        if (profileErr) console.error('Error saving creator profile:', profileErr)

        setIsSaving(false)
    }

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
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
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {profileData.avatarUrl ? (
                                        <Image
                                            src={profileData.avatarUrl}
                                            alt="Avatar"
                                            width={96}
                                            height={96}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl text-gray-500">{profileData.name.charAt(0) || '?'}</span>
                                    )}
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#6C3FA0] flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-gray-900" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{profileData.name || 'Nouveau créateur'}</h3>
                                <p className="text-sm text-gray-500">{profileData.email}</p>
                                <Button variant="outline" size="sm" className="mt-2 border-gray-200 text-gray-900 hover:bg-gray-100">
                                    Changer la photo
                                </Button>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Nom complet</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Bio</label>
                            <textarea
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                rows={4}
                                placeholder="Décrivez votre style et vos spécialités..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25 resize-none placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Localisation</label>
                            <input
                                type="text"
                                value={profileData.location}
                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                placeholder="Ex: Genève, Suisse"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Specialties */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-3">Spécialités</label>
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
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${profileData.selectedSpecialties.includes(specialty)
                                            ? 'bg-[#6C3FA0] text-gray-900'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {specialty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button className="btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications par email</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'emailNewMission', label: 'Nouvelles missions', desc: 'Recevez un email quand une nouvelle mission correspond à votre profil' },
                                    { key: 'emailMessages', label: 'Messages', desc: 'Recevez un email pour chaque nouveau message' },
                                    { key: 'emailPayments', label: 'Paiements', desc: 'Notifications de paiement et facturation' },
                                    { key: 'emailMarketing', label: 'Marketing', desc: 'Actualités et offres spéciales' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-gray-900 font-medium">{item.label}</p>
                                            <p className="text-sm text-gray-400">{item.desc}</p>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications push</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'pushNewMission', label: 'Nouvelles missions' },
                                    { key: 'pushMessages', label: 'Messages' },
                                    { key: 'pushPayments', label: 'Paiements' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <p className="text-gray-900 font-medium">{item.label}</p>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
                            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Virement bancaire (IBAN)</p>
                                            <p className="text-sm text-gray-400">Non configuré</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Update IBAN */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurer l'IBAN</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Titulaire du compte</label>
                                    <input
                                        type="text"
                                        placeholder="Votre nom complet"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25 placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">IBAN</label>
                                    <input
                                        type="text"
                                        placeholder="CH00 0000 0000 0000 0000 0"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono focus:outline-none focus:border-white/25 placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">BIC/SWIFT (optionnel)</label>
                                    <input
                                        type="text"
                                        placeholder="UBSWCHZH80A"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono focus:outline-none focus:border-white/25 placeholder:text-gray-400"
                                    />
                                </div>
                                <Button className="btn-primary">
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mot de passe</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Mot de passe actuel</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                                <Button className="btn-primary">
                                    Changer le mot de passe
                                </Button>
                            </div>
                        </div>

                        {/* 2FA */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentification à deux facteurs</h3>
                            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">2FA par application</p>
                                            <p className="text-sm text-gray-400">Utilisez Google Authenticator ou similaire</p>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exporter vos données</h3>
                            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                                <p className="text-gray-500 mb-4">
                                    Téléchargez une copie de toutes vos données personnelles, incluant votre profil,
                                    vos missions et votre historique de paiements.
                                </p>
                                <Button variant="outline" className="border-gray-200 text-gray-900 hover:bg-gray-100">
                                    <Download className="w-4 h-4 mr-2" />
                                    Exporter mes données
                                </Button>
                            </div>
                        </div>

                        {/* Delete Account */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supprimer le compte</h3>
                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-700" />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 font-medium mb-1">Action irréversible</p>
                                        <p className="text-gray-500 text-sm mb-4">
                                            La suppression de votre compte effacera définitivement toutes vos données,
                                            incluant votre profil, portfolio, et historique de missions.
                                            Cette action ne peut pas être annulée.
                                        </p>
                                        <Button variant="outline" className="border-red-500/30 text-red-700 hover:bg-red-500/20">
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-gray-500 mt-1">Gérez votre profil et préférences</p>
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
                                className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-left transition-all whitespace-nowrap flex-shrink-0 md:w-full ${activeTab === tab.id
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
                    className="flex-1 bg-white border border-white/[0.15] rounded-2xl p-4 md:p-8"
                >
                    {renderTabContent()}
                </motion.div>
            </div>
        </div>
    )
}
