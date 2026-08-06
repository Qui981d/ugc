'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { useCurrentBrand } from "@/hooks/useCurrentBrand"
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
    Gem,
    FileSignature,
    ShieldCheck
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
    const { brandId, isActingAsBrand } = useCurrentBrand()
    const [step, setStep] = useState(1)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Form state – Step 1
    const [campaign, setCampaign] = useState({
        title: '',
        productName: '',
        description: '',
        deadline: '',
        deliveryDateFixed: false,
        shootingDate: '',
        shootingDateFixed: false,
    })
    const [briefImages, setBriefImages] = useState<File[]>([])
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

    // Form state – Step 2: Content blocks
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([createEmptyBlock()])

    // Form state – Step 3: Creator preference
    const [creatorPreference, setCreatorPreference] = useState<'single' | 'per_video'>('single')

    // Form state – Step 4: Pricing
    const [selectedPlan, setSelectedPlan] = useState<'essentiel' | 'premium' | 'platinum'>('premium')

    // Quote signing modal
    const [showQuoteModal, setShowQuoteModal] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)

    const [isSubmitting, setIsSubmitting] = useState(false)

    // ── Draft persistence (localStorage) ──
    const DRAFT_KEY = 'mosh_campaign_draft'

    // Restore draft on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(DRAFT_KEY)
            if (saved) {
                const draft = JSON.parse(saved)
                if (draft.campaign) setCampaign(draft.campaign)
                if (draft.contentBlocks) setContentBlocks(draft.contentBlocks)
                if (draft.creatorPreference) setCreatorPreference(draft.creatorPreference)
                if (draft.selectedPlan) setSelectedPlan(draft.selectedPlan)
                if (draft.selectedSpecialties) setSelectedSpecialties(draft.selectedSpecialties)
                if (draft.step) setStep(draft.step)
            }
        } catch { /* ignore parse errors */ }
    }, [])

    // Save draft on changes (skip if submitting or empty)
    useEffect(() => {
        if (isSubmitting) return
        if (!campaign.title && !campaign.productName && !campaign.description) return
        const draft = { campaign, contentBlocks, creatorPreference, selectedPlan, selectedSpecialties, step }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }, [campaign, contentBlocks, creatorPreference, selectedPlan, selectedSpecialties, step, isSubmitting])

    // Warn on leave if draft exists
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (campaign.title || campaign.productName) {
                e.preventDefault()
            }
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [campaign.title, campaign.productName])

    const clearDraft = () => localStorage.removeItem(DRAFT_KEY)

    // Generate quote number
    const generateQuoteNumber = useCallback(() => {
        const year = new Date().getFullYear()
        const rand = Date.now().toString(36).toUpperCase().slice(-4)
        return `MOSH-DEVIS-${year}-${rand}`
    }, [])

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

    // With a single content, "one creator for everything" and "one per video"
    // describe the same thing, so that step is dropped rather than asked.
    const singleContent = contentBlocks.length <= 1
    const stepIds = singleContent ? [1, 2, 4] : [1, 2, 3, 4]
    const stepIndex = Math.max(0, stepIds.indexOf(step))
    const isLastStep = step === stepIds[stepIds.length - 1]

    const goToStep = (delta: number) => {
        const next = stepIds[stepIndex + delta]
        if (next) setStep(next)
    }

    const handleNextStep = () => {
        if (validateStep(step)) goToStep(1)
    }

    // Removing content blocks while standing on the creator step would strand
    // the user on a page that no longer exists.
    useEffect(() => {
        if (singleContent && step === 3) setStep(4)
    }, [singleContent, step])

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

            // 2. Create campaign (with quote data)
            const quoteNumber = generateQuoteNumber()
            let signerIp = 'unknown'
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json')
                const ipData = await ipRes.json()
                signerIp = ipData.ip || 'unknown'
            } catch { /* best-effort */ }

            const campaignPayload = {
                title: campaign.title,
                description: campaign.description || undefined,
                product_name: campaign.productName || campaign.title,
                script_type: (contentBlocks[0]?.scriptType || 'testimonial') as any,
                budget_chf: PRICING_TIERS.find(t => t.id === selectedPlan)?.getPrice(contentBlocks.length) || 0,
                deadline: campaign.deadline || undefined,
                delivery_date_fixed: campaign.deliveryDateFixed,
                shooting_date: campaign.shootingDate || undefined,
                shooting_date_fixed: campaign.shootingDateFixed,
                status: 'draft' as const,
                pricing_pack: selectedPlan,
                brief_image_urls: briefImageUrls,
                // A restored draft may still say 'per_video' after the blocks were
                // trimmed back to one; the content count is the source of truth.
                creator_preference: contentBlocks.length <= 1 ? 'single' : creatorPreference,
                quote_number: quoteNumber,
                quote_signed_at: new Date().toISOString(),
                quote_signer_ip: signerIp,
            }

            const result = await createCampaign(campaignPayload, brandId || undefined)
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
            clearDraft()
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
                    <Button variant="ghost" size="sm" className="text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F3]">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div className="h-6 w-px bg-[#F4F4F3]" />
                <div>
                    <h1 className="text-2xl font-bold text-[#1A1A1A]">Nouvelle campagne UGC</h1>
                    <p className="text-[#6B6B6B] text-sm">Décrivez votre besoin, MOSH s&apos;occupe du reste</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                {stepIds.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${step >= s
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-[#F4F4F3] text-[#9B9B9B]'
                            }`}>
                            {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${step >= s ? 'text-[#1A1A1A]' : 'text-[#9B9B9B]'}`}>
                            {s === 1 ? 'Détails' : s === 2 ? 'Contenus' : s === 3 ? 'Créateurs' : 'Offre'}
                        </span>
                        {i < stepIds.length - 1 && <div className={`flex-1 h-px ${step > s ? 'bg-[#1A1A1A]' : 'bg-[#F4F4F3]'}`} />}
                    </div>
                ))}
            </div>

            {/* Form */}
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-white/[0.15] rounded-lg p-8"
            >
                {/* ═══════════ STEP 1: DÉTAILS ═══════════ */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">Informations de base</h2>

                        {/* Title */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Titre de la campagne *</label>
                            <input
                                type="text"
                                value={campaign.title}
                                onChange={(e) => { setCampaign({ ...campaign, title: e.target.value }); setErrors(prev => ({ ...prev, title: '' })) }}
                                placeholder="Ex: Lancement collection été 2026"
                                className={`w-full bg-[#FAFAF9] border rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 ${errors.title ? 'border-[#F2CFCB]' : 'border-[#E2E2E1]'}`}
                            />
                            {errors.title && <p className="text-xs text-[#C0392B] mt-1">{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Description de la campagne *</label>
                            <textarea
                                value={campaign.description}
                                onChange={(e) => { setCampaign({ ...campaign, description: e.target.value }); setErrors(prev => ({ ...prev, description: '' })) }}
                                rows={4}
                                placeholder="Décrivez votre campagne, le produit/service, et ce que vous attendez des créateurs..."
                                className={`w-full bg-[#FAFAF9] border rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 resize-none ${errors.description ? 'border-[#F2CFCB]' : 'border-[#E2E2E1]'}`}
                            />
                            {errors.description && <p className="text-xs text-[#C0392B] mt-1">{errors.description}</p>}
                        </div>

                        {/* Product Name */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Nom du produit / service</label>
                            <input
                                type="text"
                                value={campaign.productName}
                                onChange={(e) => setCampaign({ ...campaign, productName: e.target.value })}
                                placeholder="Ex: Montre Alpine Pro X"
                                className="w-full bg-[#FAFAF9] border border-[#E2E2E1] rounded-lg px-4 py-3 text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Tags de la campagne</label>
                            <div className="flex flex-wrap gap-2">
                                {SPECIALTIES.map(specialty => (
                                    <button
                                        key={specialty.id}
                                        onClick={() => toggleSpecialty(specialty.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSpecialties.includes(specialty.id)
                                            ? 'bg-[#1A1A1A] text-white'
                                            : 'bg-[#FAFAF9] text-[#6B6B6B] hover:bg-[#F4F4F3] border border-[#E2E2E1]'
                                            }`}
                                    >
                                        {specialty.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brief Images */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">
                                Images d&apos;illustration
                                <span className="text-[#9B9B9B] ml-1">(optionnel)</span>
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
                                                className="w-full h-24 object-cover rounded-lg border border-[#E2E2E1]"
                                            />
                                            <button
                                                onClick={() => removeBriefImage(i)}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <label
                                htmlFor="brief-images-upload"
                                className="block border-2 border-dashed border-[#E2E2E1] rounded-lg p-6 text-center hover:border-[#C4C4C3] transition-colors cursor-pointer"
                            >
                                <Upload className="w-6 h-6 text-[#9B9B9B] mx-auto mb-2" />
                                <p className="text-sm text-[#6B6B6B]">
                                    {briefImages.length > 0 ? 'Ajouter d\'autres images' : 'Glissez des images ou cliquez pour parcourir'}
                                </p>
                                <p className="text-xs text-[#9B9B9B] mt-1">JPG, PNG, WebP • Max 5MB par image</p>
                            </label>
                        </div>
                    </div>
                )}

                {/* ═══════════ STEP 2: CONTENUS ═══════════ */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-[#1A1A1A]">Quelles vidéos souhaitez-vous ?</h2>
                            <p className="text-sm text-[#6B6B6B] mt-1">Chaque bloc ci-dessous correspond à une vidéo à produire dans le cadre de cette campagne. Ajoutez autant de vidéos que nécessaire.</p>
                            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#1A1A1A]/5 rounded-full">
                                <span className="text-base">🎬</span>
                                <span className="text-sm font-medium text-[#1A1A1A]">{contentBlocks.length} vidéo{contentBlocks.length > 1 ? 's' : ''} dans cette campagne</span>
                            </div>
                        </div>

                        {/* Content Blocks */}
                        <div className="space-y-4">
                            {contentBlocks.map((block, index) => (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-[#FAFAF9] border border-[#E2E2E1] rounded-lg p-5 relative"
                                >
                                    {/* Block header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-[#1A1A1A]">
                                            {block.contentType === 'photo' ? 'Photo' : 'Vidéo'} {index + 1}
                                        </span>
                                        {contentBlocks.length > 1 && (
                                            <button
                                                onClick={() => removeContentBlock(block.id)}
                                                className="text-[#9B9B9B] hover:text-[#C0392B] transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Content Type: Video / Photo */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-[#6B6B6B] mb-2">Type de contenu</label>
                                        <div className="flex gap-2">
                                            {CONTENT_TYPES.map(type => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => updateBlock(block.id, { contentType: type.id as 'video' | 'photo' })}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${block.contentType === type.id
                                                        ? 'bg-[#1A1A1A] text-white'
                                                        : 'bg-white text-[#6B6B6B] border border-[#E2E2E1] hover:border-[#C4C4C3]'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Format */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-[#6B6B6B] mb-2">Format</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {FORMAT_OPTIONS.map(fmt => (
                                                <button
                                                    key={fmt.id}
                                                    onClick={() => updateBlock(block.id, { format: fmt.id })}
                                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${block.format === fmt.id
                                                        ? 'bg-[#1A1A1A] text-white'
                                                        : 'bg-white text-[#6B6B6B] border border-[#E2E2E1] hover:border-[#C4C4C3]'
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
                                        <label className="block text-xs text-[#6B6B6B] mb-2">Catégorie *</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {SPECIALTIES.map(spec => (
                                                <button
                                                    key={spec.id}
                                                    onClick={() => updateBlock(block.id, { scriptType: spec.id })}
                                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${block.scriptType === spec.id
                                                        ? 'bg-[#1A1A1A] text-white'
                                                        : 'bg-white text-[#6B6B6B] border border-[#E2E2E1] hover:border-[#C4C4C3]'
                                                        }`}
                                                >
                                                    {spec.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mb-4">
                                        <label className="block text-xs text-[#6B6B6B] mb-2">Description détaillée</label>
                                        <textarea
                                            value={block.description}
                                            onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                                            rows={3}
                                            placeholder="Décrivez ce que vous attendez pour ce contenu..."
                                            className="w-full bg-white border border-[#E2E2E1] rounded-lg px-4 py-2.5 text-[#1A1A1A] text-sm placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 resize-none"
                                        />
                                    </div>

                                    {/* Per-block Do's */}
                                    <div className="mb-3">
                                        <label className="block text-xs text-[#6B6B6B] mb-1.5 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3 h-3 text-[#1A7F37]" />
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
                                                        className="flex-1 bg-white border border-[#E2E2E1] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/15"
                                                    />
                                                    {block.dos.length > 1 && (
                                                        <button onClick={() => removeBlockDo(block.id, i)} className="text-[#9B9B9B] hover:text-[#C0392B] px-1">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => addBlockDo(block.id)} className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 mt-1">
                                                <Plus className="w-3 h-3" /> Ajouter
                                            </button>
                                        </div>
                                    </div>

                                    {/* Per-block Don'ts */}
                                    <div>
                                        <label className="block text-xs text-[#6B6B6B] mb-1.5 flex items-center gap-1.5">
                                            <X className="w-3 h-3 text-[#C0392B]" />
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
                                                        className="flex-1 bg-white border border-[#E2E2E1] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]/15"
                                                    />
                                                    {block.donts.length > 1 && (
                                                        <button onClick={() => removeBlockDont(block.id, i)} className="text-[#9B9B9B] hover:text-[#C0392B] px-1">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => addBlockDont(block.id)} className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 mt-1">
                                                <Plus className="w-3 h-3" /> Ajouter
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {errors.contentBlocks && <p className="text-xs text-[#C0392B]">{errors.contentBlocks}</p>}

                        {/* Add content button */}
                        <button
                            onClick={addContentBlock}
                            className="w-full border-2 border-dashed border-[#E2E2E1] rounded-lg py-3 text-sm text-[#6B6B6B] hover:border-[#C4C4C3] hover:text-[#1A1A1A] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Ajouter une vidéo
                        </button>
                    </div>
                )}

                {/* ═══════════ STEP 3: CRÉATEURS & DÉLAI ═══════════ */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">Créateurs & Délai</h2>

                        {/* Creator Preference */}
                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-3">Combien de créateurs souhaitez-vous ?</label>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setCreatorPreference('single')}
                                    className={`w-full p-4 rounded-lg text-left transition-all flex items-center gap-4 ${creatorPreference === 'single'
                                        ? 'bg-[#1A1A1A]/10 border-[#1A1A1A]/50 border-2'
                                        : 'bg-[#FAFAF9] border border-[#E2E2E1] hover:border-[#C4C4C3]'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${creatorPreference === 'single' ? 'bg-[#1A1A1A] text-white' : 'bg-[#E2E2E1] text-[#6B6B6B]'}`}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-[#1A1A1A] ${creatorPreference === 'single' ? 'font-semibold' : 'font-medium'}`}>
                                            Un seul créateur pour toutes les vidéos
                                        </p>
                                        <p className="text-xs text-[#9B9B9B] mt-0.5">MOSH trouvera un créateur polyvalent pour l&apos;ensemble de votre campagne</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setCreatorPreference('per_video')}
                                    className={`w-full p-4 rounded-lg text-left transition-all flex items-center gap-4 ${creatorPreference === 'per_video'
                                        ? 'bg-[#1A1A1A]/10 border-[#1A1A1A]/50 border-2'
                                        : 'bg-[#FAFAF9] border border-[#E2E2E1] hover:border-[#C4C4C3]'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${creatorPreference === 'per_video' ? 'bg-[#1A1A1A] text-white' : 'bg-[#E2E2E1] text-[#6B6B6B]'}`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className={`text-[#1A1A1A] ${creatorPreference === 'per_video' ? 'font-semibold' : 'font-medium'}`}>
                                            Un créateur différent par vidéo
                                        </p>
                                        <p className="text-xs text-[#9B9B9B] mt-0.5">Chaque vidéo sera réalisée par un créateur spécialisé</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Dates. The brand states when it wants delivery and whether that
                            date is firm. MOSH, briefing on the client's behalf, also plans
                            the shoot — a scheduling decision the brand doesn't make. */}
                        <div className={`mt-6 grid gap-6 ${isActingAsBrand ? 'sm:grid-cols-2' : ''}`}>
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Date souhaitée de livraison</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                                    <input
                                        type="date"
                                        value={campaign.deadline}
                                        onChange={(e) => setCampaign({ ...campaign, deadline: e.target.value })}
                                        className="w-full bg-[#FAFAF9] border border-[#E2E2E1] rounded-lg pl-10 pr-4 py-3 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                    />
                                </div>
                                <label className="flex items-center gap-2 mt-2 text-sm text-[#6B6B6B] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={campaign.deliveryDateFixed}
                                        onChange={(e) => setCampaign({ ...campaign, deliveryDateFixed: e.target.checked })}
                                        className="accent-[#1A1A1A]"
                                    />
                                    Date impérative (non négociable)
                                </label>
                            </div>

                            {isActingAsBrand && (
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">
                                        Date de tournage
                                        <span className="ml-1.5 text-[11px] text-[#9B9B9B]">— MOSH</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                                        <input
                                            type="date"
                                            value={campaign.shootingDate}
                                            onChange={(e) => setCampaign({ ...campaign, shootingDate: e.target.value })}
                                            className="w-full bg-[#FAFAF9] border border-[#E2E2E1] rounded-lg pl-10 pr-4 py-3 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 mt-2 text-sm text-[#6B6B6B] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={campaign.shootingDateFixed}
                                            onChange={(e) => setCampaign({ ...campaign, shootingDateFixed: e.target.checked })}
                                            className="accent-[#1A1A1A]"
                                        />
                                        Date impérative (non négociable)
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════ STEP 4: CHOISISSEZ VOTRE OFFRE ═══════════ */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-[#1A1A1A]">Choisissez votre offre</h2>
                            <p className="text-sm text-[#6B6B6B] mt-1">
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
                                        className={`relative text-left p-5 rounded-lg transition-all ${
                                            isSelected
                                                ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A] scale-[1.02]'
                                                : 'bg-white border border-[#E2E2E1] hover:border-[#C4C4C3] hover:shadow-sm'
                                        }`}
                                    >
                                        {/* Popular badge */}
                                        {isPopular && (
                                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-medium ${
                                                isSelected ? 'bg-[#1A1A1A] text-white' : 'bg-[#1A1A1A] text-white'
                                            }`}>
                                                Le plus populaire
                                            </div>
                                        )}

                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <TierIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`} />
                                            <span className={`font-bold text-sm uppercase tracking-wide ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                                {tier.name}
                                            </span>
                                        </div>
                                        <p className={`text-xs mb-4 ${isSelected ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
                                            {tier.subtitle}
                                        </p>

                                        {/* Price */}
                                        <div className="mb-4">
                                            <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                                {price.toLocaleString('fr-CH')} CHF
                                            </span>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-2">
                                            {tier.features.map((feature, fi) => (
                                                <div key={fi} className="flex items-start gap-2">
                                                    <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[#1A1A1A]' : 'text-[#1A7F37]'}`} />
                                                    <span className={`text-xs ${isSelected ? 'text-[#C4C4C3]' : 'text-[#6B6B6B]'}`}>
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Select indicator */}
                                        <div className={`mt-4 py-2 rounded-lg text-center text-sm font-medium transition-all ${
                                            isSelected
                                                ? 'bg-[#1A1A1A] text-white'
                                                : 'bg-[#F4F4F3] text-[#6B6B6B]'
                                        }`}>
                                            {isSelected ? 'Sélectionné' : `Choisir ${tier.name}`}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Summary Card */}
                        <div className="bg-[#FAFAF9] border border-[#E2E2E1] rounded-lg p-5 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                                <span className="text-[#1A1A1A] font-medium">Résumé de la campagne</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#6B6B6B]">Titre</span>
                                    <span className="text-[#1A1A1A]">{campaign.title || '—'}</span>
                                </div>
                                {campaign.productName && (
                                    <div className="flex justify-between">
                                        <span className="text-[#6B6B6B]">Produit</span>
                                        <span className="text-[#1A1A1A]">{campaign.productName}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-[#6B6B6B]">Contenus</span>
                                    <span className="text-[#1A1A1A] font-medium">{contentBlocks.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#6B6B6B]">Créateurs</span>
                                    <span className="text-[#1A1A1A]">
                                        {creatorPreference === 'single' ? 'Un seul pour tout' : 'Un par vidéo'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#6B6B6B]">Offre</span>
                                    <span className="text-[#1A1A1A] font-medium">{PRICING_TIERS.find(t => t.id === selectedPlan)?.name}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-[#E2E2E1]">
                                    <span className="text-[#1A1A1A] font-semibold">Total</span>
                                    <span className="text-[#1A1A1A] font-bold text-lg">
                                        {(PRICING_TIERS.find(t => t.id === selectedPlan)?.getPrice(contentBlocks.length) || 0).toLocaleString('fr-CH')} CHF
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-8 pt-6 border-t border-[#E2E2E1]">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => goToStep(-1)}
                            className="text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F3]"
                        >
                            Retour
                        </Button>
                    ) : (
                        <div />
                    )}

                    {!isLastStep ? (
                        <Button
                            className="btn-primary"
                            onClick={handleNextStep}
                        >
                            Continuer
                        </Button>
                    ) : (
                        <Button
                            className="btn-primary"
                            onClick={() => { if (validateStep(4)) setShowQuoteModal(true) }}
                            disabled={isSubmitting}
                        >
                            <FileSignature className="w-4 h-4 mr-2" />
                            Signer et envoyer
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* ═══════════ QUOTE SIGNING MODAL ═══════════ */}
            <AnimatePresence>
                {showQuoteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => { if (!isSubmitting) setShowQuoteModal(false) }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="p-6 pb-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                                        <FileSignature className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1A1A1A]">Signature du devis</h3>
                                        <p className="text-xs text-[#6B6B6B]">Validez votre offre pour envoyer le brief</p>
                                    </div>
                                </div>
                            </div>

                            {/* Devis content */}
                            <div className="p-6 space-y-4">
                                {/* Summary */}
                                <div className="bg-[#FAFAF9] rounded-lg p-4 space-y-2.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[#6B6B6B]">Campagne</span>
                                        <span className="text-[#1A1A1A] font-medium">{campaign.title || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6B6B6B]">Offre</span>
                                        <span className="text-[#1A1A1A] font-medium">{PRICING_TIERS.find(t => t.id === selectedPlan)?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[#6B6B6B]">Contenus</span>
                                        <span className="text-[#1A1A1A]">{contentBlocks.length} × {PRICE_PER_VIDEO} CHF</span>
                                    </div>
                                    {selectedPlan !== 'essentiel' && (
                                        <div className="flex justify-between">
                                            <span className="text-[#6B6B6B]">Accompagnement</span>
                                            <span className="text-[#1A1A1A]">+ {ACCOMPANIMENT_FEE} CHF</span>
                                        </div>
                                    )}
                                    {selectedPlan === 'platinum' && (
                                        <div className="flex justify-between">
                                            <span className="text-[#6B6B6B]">Reporting</span>
                                            <span className="text-[#1A1A1A]">+ {REPORTING_FEE} CHF</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-[#E2E2E1]">
                                        <span className="text-[#1A1A1A] font-bold">Total TTC</span>
                                        <span className="text-[#1A1A1A] font-bold text-lg">
                                            {(PRICING_TIERS.find(t => t.id === selectedPlan)?.getPrice(contentBlocks.length) || 0).toLocaleString('fr-CH')} CHF
                                        </span>
                                    </div>
                                </div>

                                {/* Legal text */}
                                <div className="bg-[#FAFAF9] rounded-lg p-4">
                                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                                        En signant ce devis, vous confirmez avoir pris connaissance de l&apos;offre sélectionnée 
                                        et acceptez les conditions générales de MOSH. Ce devis fait foi comme engagement 
                                        de commande pour la prestation décrite ci-dessus. Le paiement sera exigible selon 
                                        les conditions convenues avec l&apos;équipe MOSH.
                                    </p>
                                </div>

                                {/* Checkbox */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div
                                        className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            acceptedTerms
                                                ? 'bg-[#1A1A1A] border-[#1A1A1A]'
                                                : 'border-[#C4C4C3] group-hover:border-[#C4C4C3]'
                                        }`}
                                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                                    >
                                        {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className="text-sm text-[#1A1A1A]">
                                        J&apos;accepte les conditions générales et je confirme cette commande
                                    </span>
                                </label>

                                {/* Signing is the submission; saying so avoids the brief
                                    appearing "sent" without the sender realising they sent it. */}
                                <p className="text-xs text-[#6B6B6B]">
                                    En signant, votre brief est transmis à MOSH et la mission démarre.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-2 flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => { setShowQuoteModal(false); setAcceptedTerms(false) }}
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    className="flex-1 btn-primary"
                                    // Awaited, and the modal stays up until it resolves:
                                    // closing first hid the progress state and left any
                                    // failure without context.
                                    onClick={async () => { await handleSubmit() }}
                                    disabled={!acceptedTerms || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                            Signer et envoyer le brief
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
