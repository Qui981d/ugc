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
    ImageIcon,
    Check,
    Star,
    Crown,
    Gem
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

// ── Pricing constants (placeholder – easy to update later) ──
const PRICE_PER_VIDEO = 490
const ACCOMPANIMENT_FEE = 300
const REPORTING_FEE = 200

const PRICING_TIERS = [
    {
        id: 'essentiel' as const,
        name: 'Essentiel',
        subtitle: 'L\'essentiel pour démarrer',
        icon: Star,
        features: [
            'Vidéos UGC haute qualité',
            'Sélection de créateurs',
            'Cession de droits 1 an',
        ],
        getPrice: (n: number) => n * PRICE_PER_VIDEO,
    },
    {
        id: 'premium' as const,
        name: 'Premium',
        subtitle: 'Le plus populaire',
        icon: Crown,
        popular: true,
        features: [
            'Tout de Essentiel',
            'Accompagnement dédié',
            'Validation à chaque étape',
            'Révisions incluses',
        ],
        getPrice: (n: number) => n * PRICE_PER_VIDEO + ACCOMPANIMENT_FEE,
    },
    {
        id: 'platinum' as const,
        name: 'Platinum',
        subtitle: 'Pour maximiser vos performances',
        icon: Gem,
        features: [
            'Tout de Premium',
            'Reporting détaillé',
            'Analyse de performance',
            'Recommandations stratégiques',
        ],
        getPrice: (n: number) => n * PRICE_PER_VIDEO + ACCOMPANIMENT_FEE + REPORTING_FEE,
    },
]

interface ContentBlock {
    id: string
    contentType: 'video' | 'photo'
    format: string
    scriptType: string
    description: string
    dos: string[]
    donts: string[]
}

function createEmptyBlock(): ContentBlock {
    return {
        id: crypto.randomUUID(),
        contentType: 'video',
        format: '9_16',
        scriptType: '',
        description: '',
        dos: [''],
        donts: [''],
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
    })
    const [briefImages, setBriefImages] = useState<File[]>([])
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

    // Form state – Step 2: Content blocks
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([createEmptyBlock()])

    // Form state – Step 3: Creator preference
    const [creatorPreference, setCreatorPreference] = useState<'single' | 'per_video'>('single')

    // Form state – Step 4: Pricing
    const [selectedPlan, setSelectedPlan] = useState<'essentiel' | 'premium' | 'platinum'>('premium')

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
        } else if (s === 4) {
            if (!selectedPlan) errs.plan = 'Choisissez une offre'
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

    // ── Block Do's / Don'ts ─────────────────────────
    const addBlockDo = (blockId: string) => {
        setContentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, dos: [...b.dos, ''] } : b))
    }
    const addBlockDont = (blockId: string) => {
        setContentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, donts: [...b.donts, ''] } : b))
    }
    const updateBlockDo = (blockId: string, i: number, v: string) => {
        setContentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, dos: b.dos.map((d, idx) => idx === i ? v : d) } : b))
    }
    const updateBlockDont = (blockId: string, i: number, v: string) => {
        setContentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, donts: b.donts.map((d, idx) => idx === i ? v : d) } : b))
    }
    const removeBlockDo = (blockId: string, i: number) => {
        setContentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, dos: b.dos.filter((_, idx) => idx !== i) } : b))
    }
    const removeBlockDont = (blockId: string, i: number) => {
        setContentBlocks(prev => prev.map(b => b.id === blockId ? { ...b, donts: b.donts.filter((_, idx) => idx !== i) } : b))
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
                budget_chf: PRICING_TIERS.find(t => t.id === selectedPlan)?.getPrice(contentBlocks.length) || 0,
                deadline: campaign.deadline || undefined,
                status: 'draft' as const,
                pricing_pack: selectedPlan,
                brief_image_urls: briefImageUrls,
                creator_preference: creatorPreference,
            }

            const result = await createCampaign(campaignPayload)
            if (result.error || !result.campaign) {
                toast.error('Erreur lors de la création de la campagne', { description: result.error })
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

            toast.success('Campagne créée avec succès ! 🎉', {
                description: `${contentBlocks.length} contenu${contentBlocks.length > 1 ? 's' : ''} ajouté${contentBlocks.length > 1 ? 's' : ''}. MOSH va analyser votre demande.`,
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
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${step >= s
                            ? 'bg-[#18181B] text-white'
                            : 'bg-gray-100 text-gray-400'
                            }`}>
                            {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s === 1 ? 'Détails' : s === 2 ? 'Contenus' : s === 3 ? 'Créateurs' : 'Offre'}
                        </span>
                        {s < 4 && <div className={`flex-1 h-px ${step > s ? 'bg-[#18181B]' : 'bg-gray-100'}`} />}
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
                                placeholder="Ex: Lancement collection été 2026"
                                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 ${errors.title ? 'border-red-400' : 'border-gray-200'}`}
                            />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-gray-500 mb-2">Description de la campagne *</label>
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

                        {/* Category */}
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
                                Images d&apos;illustration
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
                                                alt={`Image ${i + 1}`}
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
                                    <div className="mb-4">
                                        <label className="block text-xs text-gray-500 mb-2">Description détaillée</label>
                                        <textarea
                                            value={block.description}
                                            onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                                            rows={3}
                                            placeholder="Décrivez ce que vous attendez pour ce contenu..."
                                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 resize-none"
                                        />
                                    </div>

                                    {/* Per-block Do's */}
                                    <div className="mb-3">
                                        <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                            À faire
                                        </label>
                                        <div className="space-y-1.5">
                                            {block.dos.map((d, i) => (
                                                <div key={i} className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={d}
                                                        onChange={(e) => updateBlockDo(block.id, i, e.target.value)}
                                                        placeholder="Ex: Montrer le produit en utilisation"
                                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#18181B]/20"
                                                    />
                                                    {block.dos.length > 1 && (
                                                        <button onClick={() => removeBlockDo(block.id, i)} className="text-gray-400 hover:text-red-500 px-1">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => addBlockDo(block.id)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-1">
                                                <Plus className="w-3 h-3" /> Ajouter
                                            </button>
                                        </div>
                                    </div>

                                    {/* Per-block Don'ts */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                                            <X className="w-3 h-3 text-red-700" />
                                            À éviter
                                        </label>
                                        <div className="space-y-1.5">
                                            {block.donts.map((d, i) => (
                                                <div key={i} className="flex gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={d}
                                                        onChange={(e) => updateBlockDont(block.id, i, e.target.value)}
                                                        placeholder="Ex: Ne pas mentionner les concurrents"
                                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#18181B]/20"
                                                    />
                                                    {block.donts.length > 1 && (
                                                        <button onClick={() => removeBlockDont(block.id, i)} className="text-gray-400 hover:text-red-500 px-1">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => addBlockDont(block.id)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-1">
                                                <Plus className="w-3 h-3" /> Ajouter
                                            </button>
                                        </div>
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
                    </div>
                )}

                {/* ═══════════ STEP 4: CHOISISSEZ VOTRE OFFRE ═══════════ */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900">Choisissez votre offre</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {contentBlocks.length} contenu{contentBlocks.length > 1 ? 's' : ''} × {PRICE_PER_VIDEO} CHF par contenu
                            </p>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {PRICING_TIERS.map(tier => {
                                const TierIcon = tier.icon
                                const price = tier.getPrice(contentBlocks.length)
                                const isSelected = selectedPlan === tier.id
                                const isPopular = 'popular' in tier && tier.popular

                                return (
                                    <button
                                        key={tier.id}
                                        onClick={() => setSelectedPlan(tier.id)}
                                        className={`relative text-left p-5 rounded-2xl transition-all ${
                                            isSelected
                                                ? 'bg-[#18181B] text-white ring-2 ring-[#18181B] scale-[1.02]'
                                                : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {/* Popular badge */}
                                        {isPopular && (
                                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium ${
                                                isSelected ? 'bg-[#C4F042] text-[#18181B]' : 'bg-[#C4F042] text-[#18181B]'
                                            }`}>
                                                Le plus populaire
                                            </div>
                                        )}

                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <TierIcon className={`w-4 h-4 ${isSelected ? 'text-[#C4F042]' : 'text-[#18181B]'}`} />
                                            <span className={`font-bold text-sm uppercase tracking-wide ${isSelected ? 'text-white' : 'text-[#18181B]'}`}>
                                                {tier.name}
                                            </span>
                                        </div>
                                        <p className={`text-xs mb-4 ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {tier.subtitle}
                                        </p>

                                        {/* Price */}
                                        <div className="mb-4">
                                            <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-[#18181B]'}`}>
                                                {price.toLocaleString('fr-CH')} CHF
                                            </span>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-2">
                                            {tier.features.map((feature, fi) => (
                                                <div key={fi} className="flex items-start gap-2">
                                                    <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[#C4F042]' : 'text-emerald-600'}`} />
                                                    <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Select indicator */}
                                        <div className={`mt-4 py-2 rounded-xl text-center text-sm font-medium transition-all ${
                                            isSelected
                                                ? 'bg-[#C4F042] text-[#18181B]'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {isSelected ? 'Sélectionné' : `Choisir ${tier.name}`}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Summary Card */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4">
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
                                    <span className="text-gray-500">Contenus</span>
                                    <span className="text-gray-900 font-medium">{contentBlocks.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Créateurs</span>
                                    <span className="text-gray-900">
                                        {creatorPreference === 'single' ? 'Un seul pour tout' : 'Un par vidéo'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Offre</span>
                                    <span className="text-gray-900 font-medium">{PRICING_TIERS.find(t => t.id === selectedPlan)?.name}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-100">
                                    <span className="text-gray-900 font-semibold">Total</span>
                                    <span className="text-gray-900 font-bold text-lg">
                                        {(PRICING_TIERS.find(t => t.id === selectedPlan)?.getPrice(contentBlocks.length) || 0).toLocaleString('fr-CH')} CHF
                                    </span>
                                </div>
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

                    {step < 4 ? (
                        <Button
                            className="btn-primary"
                            onClick={handleNextStep}
                        >
                            Continuer
                        </Button>
                    ) : (
                        <Button
                            className="btn-primary"
                            onClick={() => { if (validateStep(4)) handleSubmit() }}
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
