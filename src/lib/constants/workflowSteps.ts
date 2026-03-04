import {
    FileText,
    Users,
    CheckCircle2,
    Video,
    Pen,
    Send,
    Package,
    Star,
    Shield,
    Camera,
    ScrollText,
    Upload,
} from 'lucide-react'

// ================================================
// MISSION STEP TYPES
// ================================================
export type StepOwner = 'mosh' | 'brand' | 'creator'

export interface WorkflowStepDef {
    type: string
    label: string
    owner: StepOwner
    icon: typeof FileText
}

/**
 * Master workflow step definitions — single source of truth.
 * All pipeline / timeline UIs should derive their labels from this.
 */
export const WORKFLOW_STEPS: WorkflowStepDef[] = [
    { type: 'brief_received', label: 'Analyse du brief', owner: 'mosh', icon: FileText },
    { type: 'creators_proposed', label: 'Proposition de profils', owner: 'mosh', icon: Users },
    { type: 'brand_reviewing_profiles', label: 'Choix marque', owner: 'brand', icon: Users },
    { type: 'creator_validated', label: 'Choix du créateur', owner: 'brand', icon: CheckCircle2 },
    { type: 'script_sent', label: 'Rédaction du script', owner: 'mosh', icon: Pen },
    { type: 'script_brand_review', label: 'Envoi du script', owner: 'mosh', icon: Send },
    { type: 'script_brand_approved', label: 'Validation du script', owner: 'brand', icon: CheckCircle2 },
    { type: 'mission_sent_to_creator', label: 'Envoi de la mission', owner: 'mosh', icon: Send },
    { type: 'contract_signed', label: 'Signature du contrat', owner: 'creator', icon: ScrollText },
    { type: 'creator_accepted', label: 'Acceptation mission', owner: 'creator', icon: CheckCircle2 },
    { type: 'creator_shooting', label: 'Tournage', owner: 'creator', icon: Camera },
    { type: 'video_uploaded_by_creator', label: 'Livraison de la vidéo', owner: 'creator', icon: Upload },
    { type: 'video_validated', label: 'Contrôle qualité', owner: 'mosh', icon: Shield },
    { type: 'video_sent_to_brand', label: 'Envoi à la marque', owner: 'mosh', icon: Package },
    { type: 'brand_final_review', label: 'Review finale', owner: 'brand', icon: Shield },
    { type: 'brand_final_approved', label: 'Validation finale', owner: 'brand', icon: Star },
]

/** Lookup: step type → label */
export const STEP_LABEL_MAP: Record<string, string> = Object.fromEntries(
    WORKFLOW_STEPS.map(s => [s.type, s.label])
)

/** Get all steps for a given owner */
export const getStepsByOwner = (owner: StepOwner) =>
    WORKFLOW_STEPS.filter(s => s.owner === owner)
