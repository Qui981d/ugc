'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    Upload,
    Image as ImageIcon,
    Calendar,
    DollarSign,
    Users,
    CheckCircle2,
    X,
    Plus,
    HelpCircle,
    Sparkles,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const SPECIALTIES = [
    { id: 'testimonial', label: 'Témoignage' },
    { id: 'unboxing', label: 'Unboxing' },
    { id: 'review', label: 'Review' },
    { id: 'tutorial', label: 'Tutoriel' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'asmr', label: 'ASMR' },
]

const CONTENT_TYPES = [
    { id: 'video', label: 'Vidéo UGC', desc: 'Format classique portrait ou paysage' },
    { id: 'reel', label: 'Reel / Short', desc: 'Format court vertical <60s' },
    { id: 'story', label: 'Story', desc: 'Format éphémère 24h' },
    { id: 'photo', label: 'Photo', desc: 'Image haute qualité' },
]

export default function NewCampaignPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    // Form state
    const [campaign, setCampaign] = useState({
        title: '',
        description: '',
        category: '',
        contentType: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
        creatorsNeeded: '1',
        requirements: '',
        dos: [''],
        donts: [''],
        thumbnail: null as File | null
    })

    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

    const toggleSpecialty = (specialty: string) => {
        setSelectedSpecialties(prev =>
            prev.includes(specialty)
                ? prev.filter(s => s !== specialty)
                : [...prev, specialty]
        )
    }

    const addDo = () => {
        setCampaign(prev => ({ ...prev, dos: [...prev.dos, ''] }))
    }

    const addDont = () => {
        setCampaign(prev => ({ ...prev, donts: [...prev.donts, ''] }))
    }

    const updateDo = (index: number, value: string) => {
        setCampaign(prev => ({
            ...prev,
            dos: prev.dos.map((d, i) => i === index ? value : d)
        }))
    }

    const updateDont = (index: number, value: string) => {
        setCampaign(prev => ({
            ...prev,
            donts: prev.donts.map((d, i) => i === index ? value : d)
        }))
    }

    const removeDo = (index: number) => {
        setCampaign(prev => ({
            ...prev,
            dos: prev.dos.filter((_, i) => i !== index)
        }))
    }

    const removeDont = (index: number) => {
        setCampaign(prev => ({
            ...prev,
            donts: prev.donts.filter((_, i) => i !== index)
        }))
    }

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        console.log('Starting campaign creation...')

        try {
            // Map form data to API format
            const { createCampaign } = await import('@/lib/services/campaignService')

            // Store form data reference before API call
            const formData = campaign

            console.log('Form data:', formData)
            console.log('Selected specialties:', selectedSpecialties)

            const campaignPayload = {
                title: formData.title,
                description: formData.description || undefined,
                product_name: formData.title, // Using title as product name for now
                script_type: (selectedSpecialties[0] || 'testimonial') as any,
                budget_chf: Number(formData.budgetMax) || Number(formData.budgetMin) || 0,
                deadline: formData.deadline ? formData.deadline : undefined,
                status: 'open' as const,
                script_notes: formData.requirements || undefined,
            }

            console.log('Campaign payload:', campaignPayload)

            const result = await createCampaign(campaignPayload)

            console.log('API result:', result)

            if (result.error) {
                console.error('Error creating campaign:', result.error)
                alert('Erreur lors de la création de la campagne: ' + result.error)
                setIsSubmitting(false)
                return
            }

            console.log('Campaign created successfully:', result.campaign)
            // Reset submitting state before navigation
            setIsSubmitting(false)
            router.push('/brand/campaigns')
        } catch (err) {
            console.error('Unexpected error:', err)
            alert('Erreur inattendue lors de la création: ' + (err instanceof Error ? err.message : String(err)))
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/brand/campaigns">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div className="h-6 w-px bg-white/20" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Nouvelle campagne</h1>
                    <p className="text-white/60 text-sm">Créez une nouvelle campagne UGC</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-3">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s
                            ? 'bg-accent text-white'
                            : 'bg-white/10 text-white/40'
                            }`}>
                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        <span className={`text-sm ${step >= s ? 'text-white' : 'text-white/40'}`}>
                            {s === 1 ? 'Détails' : s === 2 ? 'Contenu' : 'Budget'}
                        </span>
                        {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-accent' : 'bg-white/10'}`} />}
                    </div>
                ))}
            </div>

            {/* Form */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-8"
            >
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Informations de base</h2>

                        {/* Title */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Titre de la campagne *</label>
                            <input
                                type="text"
                                value={campaign.title}
                                onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                                placeholder="Ex: Témoignage pour notre nouvelle collection"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Description *</label>
                            <textarea
                                value={campaign.description}
                                onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                                rows={4}
                                placeholder="Décrivez votre campagne, le produit/service, et ce que vous attendez des créateurs..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Catégorie de contenu *</label>
                            <div className="flex flex-wrap gap-2">
                                {SPECIALTIES.map(specialty => (
                                    <button
                                        key={specialty.id}
                                        onClick={() => toggleSpecialty(specialty.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSpecialties.includes(specialty.id)
                                            ? 'bg-accent text-white'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {specialty.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Image de couverture</label>
                            <input
                                type="file"
                                id="thumbnail-upload"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        setCampaign({ ...campaign, thumbnail: file })
                                    }
                                }}
                            />
                            <label
                                htmlFor="thumbnail-upload"
                                className="block border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/30 transition-colors cursor-pointer"
                            >
                                {campaign.thumbnail ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <img
                                            src={URL.createObjectURL(campaign.thumbnail)}
                                            alt="Preview"
                                            className="w-32 h-32 object-cover rounded-lg"
                                        />
                                        <p className="text-sm text-white/60">{campaign.thumbnail.name}</p>
                                        <p className="text-xs text-accent">Cliquez pour changer</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
                                        <p className="text-sm text-white/50">Glissez une image ou cliquez pour parcourir</p>
                                        <p className="text-xs text-white/30 mt-1">JPG, PNG • Max 5MB</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Type de contenu & Brief</h2>

                        {/* Content Type */}
                        <div>
                            <label className="block text-sm text-white/60 mb-3">Format de contenu *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {CONTENT_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setCampaign({ ...campaign, contentType: type.id })}
                                        className={`p-4 rounded-xl text-left transition-all ${campaign.contentType === type.id
                                            ? 'bg-accent/20 border-accent/50 border'
                                            : 'bg-white/5 border border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <p className={`font-medium ${campaign.contentType === type.id ? 'text-white' : 'text-white/80'}`}>
                                            {type.label}
                                        </p>
                                        <p className="text-xs text-white/40 mt-1">{type.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Brief créatif</label>
                            <textarea
                                value={campaign.requirements}
                                onChange={(e) => setCampaign({ ...campaign, requirements: e.target.value })}
                                rows={4}
                                placeholder="Décrivez le ton souhaité, les éléments à inclure, le message clé..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none"
                            />
                        </div>

                        {/* Do's */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                À faire
                            </label>
                            <div className="space-y-2">
                                {campaign.dos.map((d, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={d}
                                            onChange={(e) => updateDo(i, e.target.value)}
                                            placeholder="Ex: Montrer le produit en utilisation"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                                        />
                                        {campaign.dos.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeDo(i)}
                                                className="text-white/40 hover:text-red-400"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={addDo} className="text-white/50 hover:text-white">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Ajouter
                                </Button>
                            </div>
                        </div>

                        {/* Don'ts */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                                <X className="w-4 h-4 text-red-400" />
                                À éviter
                            </label>
                            <div className="space-y-2">
                                {campaign.donts.map((d, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={d}
                                            onChange={(e) => updateDont(i, e.target.value)}
                                            placeholder="Ex: Ne pas mentionner les concurrents"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                                        />
                                        {campaign.donts.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeDont(i)}
                                                className="text-white/40 hover:text-red-400"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={addDont} className="text-white/50 hover:text-white">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Budget & Délais</h2>

                        {/* Budget Range */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Fourchette de budget (CHF) *</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="number"
                                        value={campaign.budgetMin}
                                        onChange={(e) => setCampaign({ ...campaign, budgetMin: e.target.value })}
                                        placeholder="Min"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="number"
                                        value={campaign.budgetMax}
                                        onChange={(e) => setCampaign({ ...campaign, budgetMax: e.target.value })}
                                        placeholder="Max"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                Budget par créateur, hors frais de plateforme
                            </p>
                        </div>

                        {/* Deadline */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Date limite de candidature *</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="date"
                                    value={campaign.deadline}
                                    onChange={(e) => setCampaign({ ...campaign, deadline: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/25 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Creators Needed */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Nombre de créateurs souhaités</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <select
                                    value={campaign.creatorsNeeded}
                                    onChange={(e) => setCampaign({ ...campaign, creatorsNeeded: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-white/25 appearance-none"
                                >
                                    <option value="1">1 créateur</option>
                                    <option value="2-3">2-3 créateurs</option>
                                    <option value="4-5">4-5 créateurs</option>
                                    <option value="5+">5+ créateurs</option>
                                </select>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span className="text-white font-medium">Résumé de la campagne</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-white/50">Titre</span>
                                    <span className="text-white">{campaign.title || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Catégories</span>
                                    <span className="text-white">{selectedSpecialties.map(id => SPECIALTIES.find(s => s.id === id)?.label || id).join(', ') || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Budget</span>
                                    <span className="text-white">
                                        {campaign.budgetMin && campaign.budgetMax
                                            ? `CHF ${campaign.budgetMin} – ${campaign.budgetMax}`
                                            : '—'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50">Date limite</span>
                                    <span className="text-white">{campaign.deadline || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                            Retour
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button
                            className="btn-primary"
                            onClick={() => setStep(step + 1)}
                        >
                            Continuer
                        </Button>
                    ) : (
                        <Button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Publication...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Publier la campagne
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
