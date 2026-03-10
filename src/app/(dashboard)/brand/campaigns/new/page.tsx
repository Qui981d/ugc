'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
    ArrowLeft,
    Upload,
    Calendar,
    CheckCircle2,
    X,
    Plus,
    Sparkles,
    Loader2,
    Trash2,
    Users,
    User,
    ImageIcon
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

const FORMAT_OPTIONS = [
    { id: '9_16', label: 'Vertical', desc: '9:16' },
    { id: '1_1', label: 'Carré', desc: '1:1' },
    { id: '16_9', label: 'Horizontal', desc: '16:9' },
    { id: '4_5', label: 'Portrait', desc: '4:5' },
]

const CONTENT_TYPES = [
    { id: 'video', label: 'Vidéo' },
    { id: 'photo', label: 'Photo' },
]

interface ContentBlock {
    id: string
    contentType: 'video' | 'photo'
    format: string
    scriptType: string
    description: string
}

function createEmptyBlock(): ContentBlock {
    return {
        id: crypto.randomUUID(),
        contentType: 'video',
        format: '9_16',
        scriptType: '',
        description: '',
    }
}

export default function NewCampaignPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Form state – Step 1
    const [campaign, setCampaign] = useState({
        title: '',
        productName: '',
        description: '',
        deadline: '',
        requirements: '',
        dos: [''],
        donts: [''],
    })
    const [briefImages, setBriefImages] = useState<File[]>([])
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

    // Form state – Step 2: Content blocks
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([createEmptyBlock()])

    // Form state – Step 3: Creator preference
    const [creatorPreference, setCreatorPreference] = useState<'single' | 'per_video'>('single')

    const [isSubmitting, setIsSubmitting] = useState(false)

    // ── Validation ──────────────────────────────────
    const validateStep = (s: number): boolean => {
        const errs: Record<string, string> = {}
        if (s === 1) {
            if (!campaign.title.trim()) errs.title = 'Le titre est requis'
            if (!campaign.description.trim()) errs.description = 'La description est requise'
        } else if (s === 2) {
            const hasEmpty = contentBlocks.some(b => !b.scriptType)
            if (hasEmpty) errs.contentBlocks = 'Chaque contenu doit avoir une catégorie'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleNextStep = () => {
        if (validateStep(step)) setStep(step + 1)
    }

    // ── Specialties ─────────────────────────────────
    const toggleSpecialty = (specialty: string) => {
        setSelectedSpecialties(prev =>
            prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
        )
    }

    // ── Do's / Don'ts ───────────────────────────────
    const addDo = () => setCampaign(prev => ({ ...prev, dos: [...prev.dos, ''] }))
    const addDont = () => setCampaign(prev => ({ ...prev, donts: [...prev.donts, ''] }))
    const updateDo = (i: number, v: string) => setCampaign(prev => ({ ...prev, dos: prev.dos.map((d, idx) => idx === i ? v : d) }))
    const updateDont = (i: number, v: string) => setCampaign(prev => ({ ...prev, donts: prev.donts.map((d, idx) => idx === i ? v : d) }))
    const removeDo = (i: number) => setCampaign(prev => ({ ...prev, dos: prev.dos.filter((_, idx) => idx !== i) }))
    const removeDont = (i: number) => setCampaign(prev => ({ ...prev, donts: prev.donts.filter((_, idx) => idx !== i) }))

    // ── Brief images ────────────────────────────────
    const handleBriefImageAdd = (files: FileList | null) => {
        if (!files) return
        setBriefImages(prev => [...prev, ...Array.from(files)])
    }
    const removeBriefImage = (i: number) => {
        setBriefImages(prev => prev.filter((_, idx) => idx !== i))
    }

    // ── Content blocks ──────────────────────────────
    const addContentBlock = () => setContentBlocks(prev => [...prev, createEmptyBlock()])
    const removeContentBlock = (id: string) => {
        if (contentBlocks.length <= 1) return
        setContentBlocks(prev => prev.filter(b => b.id !== id))
    }
    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
    }

    // ── Submit ───────────────────────────────────────
    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const { createCampaign, createCampaignContents } = await import('@/lib/services/campaignService')
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            // 1. Upload brief images
            const briefImageUrls: string[] = []
            for (const file of briefImages) {
                const ext = file.name.split('.').pop()
                const filePath = `brief-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
                const { error: uploadError } = await supabase.storage
                    .from('thumbnails')
                    .upload(filePath, file, { cacheControl: '3600', upsert: true })
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(filePath)
                    if (urlData?.publicUrl) briefImageUrls.push(urlData.publicUrl)
                }
            }

            // 2. Create campaign
            const campaignPayload = {
                title: campaign.title,
                description: campaign.description || undefined,
                product_name: campaign.productName || campaign.title,
                script_type: (contentBlocks[0]?.scriptType || 'testimonial') as any,
                budget_chf: 0,
                deadline: campaign.deadline || undefined,
                status: 'draft' as const,
                script_notes: campaign.requirements || undefined,
                brief_image_urls: briefImageUrls,
                creator_preference: creatorPreference,
            }

            const result = await createCampaign(campaignPayload)
            if (result.error || !result.campaign) {
                toast.error('Erreur lors de la création du brief', { description: result.error })
                setIsSubmitting(false)
                return
            }

            // 3. Create content blocks
            const contentsPayload = contentBlocks.map((b, i) => ({
                content_type: b.contentType as 'video' | 'photo',
                format: b.format,
                script_type: b.scriptType,
                description: b.description || undefined,
                position: i,
            }))

            const contentsResult = await createCampaignContents(result.campaign.id, contentsPayload)
            if (contentsResult.error) {
                toast.error('Erreur lors de la création des contenus', { description: contentsResult.error })
                setIsSubmitting(false)
                return
            }

            toast.success('Brief envoyé avec succès ! 🎉', {
                description: `${contentBlocks.length} contenu${contentBlocks.length > 1 ? 's' : ''} ajouté${contentBlocks.length > 1 ? 's' : ''}.`,
            })
            setIsSubmitting(false)
            router.push('/brand/campaigns')
        } catch (err) {
            toast.error('Erreur inattendue', { description: err instanceof Error ? err.message : String(err) })
            setIsSubmitting(false)
        }
    }

    // ══════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/brand/campaigns">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div className="h-6 w-px bg-gray-100" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nouvelle campagne UGC</h1>
                    <p className="text-gray-500 text-sm">Décrivez votre besoin, MOSH s&apos;occupe du reste</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-3">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s
                            ? 'bg-[#18181B] text-white'
                            : 'bg-gray-100 text-gray-400'
                            }`}>
                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        <span className={`text-sm ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s === 1 ? 'Détails' : s === 2 ? 'Contenus' : 'Créateurs'}
                        </span>
                        {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-[#18181B]' : 'bg-gray-100'}`} />}
                    </div>
                ))}
            </div>

            {/* Form */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-white/[0.15] rounded-2xl p-8"
            >
                {/* ═══════════ STEP 1: DÉTAILS ═══════════ */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations de base</h2>

                        {/* Title */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Titre de la campagne *</label>
                            <input
                                type="text"
                                value={campaign.title}
                                onChange={(e) => { setCampaign({ ...campaign, title: e.target.value }); setErrors(prev => ({ ...prev, title: '' })) }}
                                placeholder="Ex: Témoignage pour notre nouvelle collection"
                                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Description *</label>
                            <textarea
                                value={campaign.description}
                                onChange={(e) => { setCampaign({ ...campaign, description: e.target.value }); setErrors(prev => ({ ...prev, description: '' })) }}
                                rows={4}
                                placeholder="Décrivez votre campagne, le produit/service, et ce que vous attendez des créateurs..."
                                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        {/* Product Name */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Nom du produit / service</label>
                            <input
                                type="text"
                                value={campaign.productName}
                                onChange={(e) => setCampaign({ ...campaign, productName: e.target.value })}
                                placeholder="Ex: Montre Alpine Pro X"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20"
                            />
                        </div>

                        {/* Category (kept at campaign level for overall tagging) */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Tags de la campagne</label>
                            <div className="flex flex-wrap gap-2">
                                {SPECIALTIES.map(specialty => (
                                    <button
                                        key={specialty.id}
                                        onClick={() => toggleSpecialty(specialty.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSpecialties.includes(specialty.id)
                                            ? 'bg-[#18181B] text-white'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                    >
                                        {specialty.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brief Images */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">
                                Images d&apos;illustration du brief
                                <span className="text-gray-400 ml-1">(optionnel)</span>
                            </label>
                            <input
                                type="file"
                                id="brief-images-upload"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => handleBriefImageAdd(e.target.files)}
                            />
                            {briefImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mb-3">
                                    {briefImages.map((file, i) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Brief ${i + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                onClick={() => removeBriefImage(i)}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label
                                htmlFor="brief-images-upload"
                                className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors cursor-pointer"
                            >
                                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                    {briefImages.length > 0 ? 'Ajouter d\'autres images' : 'Glissez des images ou cliquez pour parcourir'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP • Max 5MB par image</p>
                            </label>
                        </div>
                    </div>
                )}

                {/* ═══════════ STEP 2: CONTENUS ═══════════ */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Description des contenus</h2>
                            <p className="text-sm text-gray-500 mt-1">Décrivez chaque contenu que vous souhaitez. Vous pouvez en ajouter autant que nécessaire.</p>
                        </div>

                        {/* Content Blocks */}
                        <div className="space-y-4">
                            {contentBlocks.map((block, index) => (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative"
                                >
                                    {/* Block header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-gray-700">
                                            Contenu {index + 1}
                                        </span>
                                        {contentBlocks.length > 1 && (
                                            <button
                                                onClick={() => removeContentBlock(block.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Content Type: Video / Photo */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-gray-500 mb-2">Type de contenu</label>
                                        <div className="flex gap-2">
                                            {CONTENT_TYPES.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => updateBlock(block.id, { contentType: type.id as 'video' | 'photo' })}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${block.contentType === type.id
                                                        ? 'bg-[#18181B] text-white'
                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Format */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-gray-500 mb-2">Format</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {FORMAT_OPTIONS.map(fmt => (
                                                <button
                                                    key={fmt.id}
                                                    onClick={() => updateBlock(block.id, { format: fmt.id })}
                                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${block.format === fmt.id
                                                        ? 'bg-[#18181B] text-white'
                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {fmt.label}
                                                    <span className="text-xs ml-1 opacity-60">{fmt.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Script Type / Category */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-gray-500 mb-2">Catégorie *</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {SPECIALTIES.map(spec => (
                                                <button
                                                    key={spec.id}
                                                    onClick={() => updateBlock(block.id, { scriptType: spec.id })}
                                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${block.scriptType === spec.id
                                                        ? 'bg-[#18181B] text-white'
                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {spec.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">Description détaillée</label>
                                        <textarea
                                            value={block.description}
                                            onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                                            rows={3}
                                            placeholder="Décrivez ce que vous attendez pour ce contenu..."
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 resize-none"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {errors.contentBlocks && <p className="text-xs text-red-500">{errors.contentBlocks}</p>}

                        {/* Add content button */}
                        <button
                            onClick={addContentBlock}
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter un contenu
                        </button>

                        {/* Do's */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
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
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-white/25"
                                        />
                                        {campaign.dos.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeDo(i)} className="text-gray-400 hover:text-red-700">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={addDo} className="text-gray-500 hover:text-gray-900">
                                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                                </Button>
                            </div>
                        </div>

                        {/* Don'ts */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2 flex items-center gap-2">
                                <X className="w-4 h-4 text-red-700" />
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
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-white/25"
                                        />
                                        {campaign.donts.length > 1 && (
                                            <Button variant="ghost" size="sm" onClick={() => removeDont(i)} className="text-gray-400 hover:text-red-700">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" onClick={addDont} className="text-gray-500 hover:text-gray-900">
                                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════ STEP 3: CRÉATEURS & DÉLAI ═══════════ */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Créateurs & Délai</h2>

                        {/* Creator Preference */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-3">Combien de créateurs souhaitez-vous ?</label>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setCreatorPreference('single')}
                                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${creatorPreference === 'single'
                                        ? 'bg-[#18181B]/10 border-[#18181B]/50 border-2'
                                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${creatorPreference === 'single' ? 'bg-[#18181B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${creatorPreference === 'single' ? 'text-gray-900' : 'text-gray-700'}`}>
                                            Un seul créateur pour toutes les vidéos
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">MOSH trouvera un créateur polyvalent pour l&apos;ensemble de votre campagne</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setCreatorPreference('per_video')}
                                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${creatorPreference === 'per_video'
                                        ? 'bg-[#18181B]/10 border-[#18181B]/50 border-2'
                                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${creatorPreference === 'per_video' ? 'bg-[#18181B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${creatorPreference === 'per_video' ? 'text-gray-900' : 'text-gray-700'}`}>
                                            Un créateur différent par vidéo
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">Chaque vidéo sera réalisée par un créateur spécialisé</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className="mt-6">
                            <label className="block text-sm text-gray-500 mb-2">Date souhaitée de livraison</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={campaign.deadline}
                                    onChange={(e) => setCampaign({ ...campaign, deadline: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-[#18181B]" />
                                <span className="text-gray-900 font-medium">Résumé de la campagne</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Titre</span>
                                    <span className="text-gray-900">{campaign.title || '—'}</span>
                                </div>
                                {campaign.productName && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Produit</span>
                                        <span className="text-gray-900">{campaign.productName}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nombre de contenus</span>
                                    <span className="text-gray-900 font-medium">{contentBlocks.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Créateurs</span>
                                    <span className="text-gray-900">
                                        {creatorPreference === 'single' ? 'Un seul pour tout' : 'Un par vidéo'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date souhaitée</span>
                                    <span className="text-gray-900">{campaign.deadline || '—'}</span>
                                </div>

                                {/* Content blocks summary */}
                                <div className="pt-3 border-t border-gray-100">
                                    <span className="text-gray-500 text-xs font-medium">📋 Contenus demandés</span>
                                    <div className="mt-2 space-y-1.5">
                                        {contentBlocks.map((block, i) => (
                                            <div key={block.id} className="flex items-center gap-2 text-xs">
                                                <span className="text-gray-400">{i + 1}.</span>
                                                <span className="text-gray-700 font-medium capitalize">{block.contentType}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-600">{FORMAT_OPTIONS.find(f => f.id === block.format)?.label || block.format}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-gray-600">{SPECIALTIES.find(s => s.id === block.scriptType)?.label || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {briefImages.length > 0 && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-gray-500 text-xs font-medium">🖼️ {briefImages.length} image{briefImages.length > 1 ? 's' : ''} d&apos;illustration</span>
                                    </div>
                                )}

                                {campaign.dos.filter(d => d.trim()).length > 0 && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-gray-500 text-xs font-medium">✅ À faire</span>
                                        <ul className="mt-1 space-y-0.5">
                                            {campaign.dos.filter(d => d.trim()).map((d, i) => (
                                                <li key={i} className="text-gray-900 text-xs">• {d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {campaign.donts.filter(d => d.trim()).length > 0 && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-gray-500 text-xs font-medium">❌ À éviter</span>
                                        <ul className="mt-1 space-y-0.5">
                                            {campaign.donts.filter(d => d.trim()).map((d, i) => (
                                                <li key={i} className="text-gray-900 text-xs">• {d}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        >
                            Retour
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <Button
                            className="btn-primary"
                            onClick={handleNextStep}
                        >
                            Continuer
                        </Button>
                    ) : (
                        <Button
                            className="btn-primary"
                            onClick={() => { if (validateStep(3)) handleSubmit() }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Envoyer le brief
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
