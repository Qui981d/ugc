'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import {
    User,
    Sparkles,
    Globe,
    Video,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
]

export function CreatorOnboarding({ userId, userName, onComplete }: CreatorOnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [isSaving, setIsSaving] = useState(false)

    // Form data
    const [bio, setBio] = useState('')
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['fr'])
    const [portfolioUrl, setPortfolioUrl] = useState('')
    const [portfolioUrls, setPortfolioUrls] = useState<string[]>([])

    const canProceed = () => {
        switch (currentStep) {
            case 0: return bio.trim().length >= 10
            case 1: return selectedSpecialties.length >= 1
            case 2: return selectedLanguages.length >= 1
            case 3: return true // Portfolio is optional
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
                specialties: selectedSpecialties,
                languages: selectedLanguages,
                portfolio_video_urls: portfolioUrls,
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
                        className="w-16 h-16 rounded-lg bg-[#0866FF] flex items-center justify-center mx-auto mb-4"
                    >
                        <span className="text-2xl font-black text-[#1C1E21]">M</span>
                    </motion.div>
                    <h1 className="text-[28px] font-semibold text-[#1C1E21] tracking-[-0.02em]">
                        Bienvenue, {userName.split(' ')[0]} ! 👋
                    </h1>
                    <p className="text-[#65676B] mt-2">
                        Complétez votre profil pour recevoir vos premières missions
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {steps.map((step, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className={`
                                w-full h-1.5 rounded-full transition-all duration-500
                                ${index <= currentStep ? 'bg-[#0866FF]' : 'bg-[#EBEDF0]'}
                            `} />
                            <span className={`text-[10px] font-medium transition-colors ${
                                index <= currentStep ? 'text-[#1C1E21]' : 'text-[#8A8D91]'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white border border-[#DADDE1] rounded-xl p-6 md:p-8">
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
                                        <h2 className="text-lg font-semibold text-[#1C1E21] mb-1">Présentez-vous</h2>
                                        <p className="text-sm text-[#65676B]">Décrivez votre style, votre expérience et ce qui vous rend unique</p>
                                    </div>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={5}
                                        placeholder="Ex : Créatrice de contenu spécialisée dans le lifestyle et la beauté. 3 ans d'expérience en UGC avec un style authentique et dynamique..."
                                        className="w-full bg-[#F0F2F5] border border-transparent rounded-lg px-4 py-3 text-[#1C1E21] focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF]/30 resize-none placeholder:text-[#8A8D91]"
                                    />
                                    <p className={`text-xs ${bio.trim().length >= 10 ? 'text-[#65676B]' : 'text-[#8A8D91]'}`}>
                                        {bio.trim().length}/10 caractères minimum
                                    </p>
                                </div>
                            )}

                            {/* Step 1: Specialties */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1C1E21] mb-1">Vos spécialités</h2>
                                        <p className="text-sm text-[#65676B]">Sélectionnez les formats que vous maîtrisez</p>
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
                                                            ? 'bg-[#1C1E21] text-white ring-2 ring-[#0866FF]'
                                                            : 'bg-[#F0F2F5] text-[#65676B] hover:bg-[#EBEDF0]'
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
                                </div>
                            )}

                            {/* Step 2: Languages */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#1C1E21] mb-1">Langues parlées</h2>
                                        <p className="text-sm text-[#65676B]">Dans quelles langues pouvez-vous créer du contenu ?</p>
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
                                                            ? 'bg-[#1C1E21] text-white ring-2 ring-[#0866FF]'
                                                            : 'bg-[#F0F2F5] text-[#65676B] hover:bg-[#EBEDF0]'
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
                                        <h2 className="text-lg font-semibold text-[#1C1E21] mb-1">Votre portfolio</h2>
                                        <p className="text-sm text-[#65676B]">Ajoutez des liens vers vos vidéos (TikTok, Instagram, YouTube...)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddPortfolioUrl()}
                                            placeholder="https://www.tiktok.com/@votre-video"
                                            className="flex-1 bg-[#F0F2F5] border border-transparent rounded-lg px-4 py-3 text-[#1C1E21] focus:outline-none focus:border-[#0866FF] focus:ring-1 focus:ring-[#0866FF]/30 placeholder:text-[#8A8D91]"
                                        />
                                        <Button
                                            onClick={handleAddPortfolioUrl}
                                            disabled={!portfolioUrl.trim()}
                                            className="bg-[#0866FF] hover:bg-[#0653CC] text-white rounded-lg px-4"
                                        >
                                            Ajouter
                                        </Button>
                                    </div>
                                    {portfolioUrls.length > 0 && (
                                        <div className="space-y-2">
                                            {portfolioUrls.map((url, index) => (
                                                <div key={index} className="flex items-center gap-2 p-3 bg-[#F0F2F5] rounded-lg">
                                                    <Video className="w-4 h-4 text-[#65676B] flex-shrink-0" />
                                                    <span className="text-sm text-[#1C1E21] truncate flex-1">{url}</span>
                                                    <button
                                                        onClick={() => handleRemoveUrl(index)}
                                                        className="text-[#8A8D91] hover:text-red-500 transition-colors text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-[#8A8D91]">
                                        Vous pourrez aussi en ajouter plus tard depuis votre portfolio
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#EBEDF0]">
                        {currentStep > 0 ? (
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                className="text-[#65676B] hover:text-[#1C1E21] hover:bg-[#F0F2F5] rounded-full"
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
                            className="bg-[#0866FF] hover:bg-[#0653CC] text-white rounded-full px-6"
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
                        className="text-sm text-[#8A8D91] hover:text-[#65676B] transition-colors"
                    >
                        Compléter plus tard
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
