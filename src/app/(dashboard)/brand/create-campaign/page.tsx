'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { formatCHF, calculateTVA } from "@/lib/validations/swiss"

const STEPS = [
    { id: 1, title: "Produit", description: "Décrivez votre produit" },
    { id: 2, title: "Format", description: "Type de vidéo souhaité" },
    { id: 3, title: "Droits", description: "Usage et droits" },
    { id: 4, title: "Budget", description: "Définissez votre budget" },
]

const SCRIPT_TYPES = [
    { value: "testimonial", label: "Témoignage", description: "Avis authentique sur le produit" },
    { value: "unboxing", label: "Unboxing", description: "Déballage et découverte" },
    { value: "asmr", label: "ASMR", description: "Focus sur les sons et textures" },
    { value: "tutorial", label: "Tutoriel", description: "Comment utiliser le produit" },
    { value: "lifestyle", label: "Lifestyle", description: "Intégration dans le quotidien" },
    { value: "review", label: "Review", description: "Test et analyse détaillée" },
]

const RIGHTS_OPTIONS = [
    { value: "organic", label: "Usage organique", description: "Réseaux sociaux uniquement", multiplier: 1 },
    { value: "paid_3m", label: "Publicité 3 mois", description: "Ads payantes pendant 3 mois", multiplier: 1.3 },
    { value: "paid_6m", label: "Publicité 6 mois", description: "Ads payantes pendant 6 mois", multiplier: 1.5 },
    { value: "paid_12m", label: "Publicité 12 mois", description: "Ads payantes pendant 12 mois", multiplier: 1.8 },
    { value: "perpetual", label: "Perpétuel", description: "Droits illimités", multiplier: 2.5 },
]

export default function CreateCampaignPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({
        // Step 1: Product
        productName: "",
        productDescription: "",
        requiresShipping: false,

        // Step 2: Format
        format: "9_16",
        scriptType: "",
        scriptNotes: "",

        // Step 3: Rights
        rightsUsage: "organic",

        // Step 4: Budget
        title: "",
        baseBudget: 300,
        deadline: "",
    })

    const selectedRights = RIGHTS_OPTIONS.find(r => r.value === formData.rightsUsage)
    const finalBudget = formData.baseBudget * (selectedRights?.multiplier || 1)
    const tvaInfo = calculateTVA(finalBudget)

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = () => {
        // TODO: Submit to Supabase
        console.log("Campaign data:", formData)
        router.push("/dashboard/brand/campaigns")
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Nouvelle campagne</h1>
                <p className="text-muted-foreground mt-1">Créez un brief pour trouver le créateur idéal</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                  ${currentStep > step.id
                                        ? 'bg-foreground text-white'
                                        : currentStep === step.id
                                            ? 'bg-[#E60000] text-white'
                                            : 'bg-slate-200 text-slate-500'
                                    }
                `}
                            >
                                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={`w-24 h-1 mx-3 ${currentStep > step.id ? 'bg-foreground' : 'bg-slate-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2">
                    {STEPS.map(step => (
                        <div key={step.id} className="text-center" style={{ width: '80px' }}>
                            <p className={`text-sm font-medium ${currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Step 1: Product */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="productName">Nom du produit</Label>
                                <Input
                                    id="productName"
                                    placeholder="Ex: Crème hydratante bio"
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="productDescription">Description</Label>
                                <Textarea
                                    id="productDescription"
                                    placeholder="Décrivez votre produit et ses points forts..."
                                    rows={4}
                                    value={formData.productDescription}
                                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="shipping"
                                    className="h-4 w-4 rounded border-slate-300"
                                    checked={formData.requiresShipping}
                                    onChange={(e) => setFormData({ ...formData, requiresShipping: e.target.checked })}
                                />
                                <Label htmlFor="shipping" className="font-normal">
                                    Le produit doit être envoyé au créateur
                                </Label>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Format */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Format vidéo</Label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { value: "9_16", label: "9:16", desc: "Stories/Reels" },
                                        { value: "16_9", label: "16:9", desc: "YouTube" },
                                        { value: "1_1", label: "1:1", desc: "Feed carré" },
                                        { value: "4_5", label: "4:5", desc: "Feed portrait" },
                                    ].map(format => (
                                        <button
                                            key={format.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, format: format.value })}
                                            className={`p-4 rounded-lg border-2 text-center transition-colors ${formData.format === format.value
                                                    ? 'border-[#E60000] bg-red-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="font-bold text-lg">{format.label}</div>
                                            <div className="text-xs text-muted-foreground">{format.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Type de contenu</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {SCRIPT_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, scriptType: type.value })}
                                            className={`p-4 rounded-lg border-2 text-left transition-colors ${formData.scriptType === type.value
                                                    ? 'border-[#E60000] bg-red-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-sm text-muted-foreground">{type.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scriptNotes">Instructions supplémentaires (optionnel)</Label>
                                <Textarea
                                    id="scriptNotes"
                                    placeholder="Points clés à mentionner, ton souhaité..."
                                    rows={3}
                                    value={formData.scriptNotes}
                                    onChange={(e) => setFormData({ ...formData, scriptNotes: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Rights */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {RIGHTS_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rightsUsage: option.value })}
                                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${formData.rightsUsage === option.value
                                                ? 'border-[#E60000] bg-red-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{option.label}</div>
                                                <div className="text-sm text-muted-foreground">{option.description}</div>
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground">
                                                {option.multiplier > 1 && `+${Math.round((option.multiplier - 1) * 100)}%`}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Note:</strong> Un contrat de cession de droits conforme au Code des Obligations suisse sera généré automatiquement lors de la validation du contenu.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Budget */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre de la campagne</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Lancement Nouvelle Collection Printemps"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget de base (CHF)</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    min={100}
                                    step={50}
                                    value={formData.baseBudget}
                                    onChange={(e) => setFormData({ ...formData, baseBudget: Number(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Date limite (optionnel)</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>

                            {/* Summary */}
                            <div className="p-6 bg-slate-50 rounded-lg space-y-3">
                                <h4 className="font-semibold">Récapitulatif</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Budget de base</span>
                                        <span>{formatCHF(formData.baseBudget)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Droits ({selectedRights?.label})
                                        </span>
                                        <span>
                                            {selectedRights && selectedRights.multiplier > 1
                                                ? `+${formatCHF(finalBudget - formData.baseBudget)}`
                                                : 'Inclus'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200">
                                        <span className="text-muted-foreground">Sous-total</span>
                                        <span>{formatCHF(tvaInfo.net)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">TVA (8.1%)</span>
                                        <span>{formatCHF(tvaInfo.tva)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-200 font-semibold text-base">
                                        <span>Total</span>
                                        <span>{formatCHF(tvaInfo.gross)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-border">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour
                        </Button>

                        {currentStep < 4 ? (
                            <Button onClick={handleNext} className="btn-swiss-red">
                                Suivant
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} className="btn-swiss-red">
                                <Check className="h-4 w-4 mr-2" />
                                Publier la campagne
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
