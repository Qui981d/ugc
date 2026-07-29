// ============================================================
// ClickUp mapping constants (no secrets — safe to import anywhere)
// ============================================================

// The subtasks created under every mission card, in order.
export const CLICKUP_SUBTASKS = [
    'Contact Enseigne',
    'Brief',
    'Recherche UGC',
    'Gestion UGC',
    'Livraison vidéo',
    'À programmer dans SP',
] as const

// App mission step (MissionStepType) → the ClickUp subtask it should complete.
// Adjust freely: keys are app steps, values must match CLICKUP_SUBTASKS names.
export const STEP_TO_SUBTASK: Record<string, string> = {
    script_brand_approved: 'Brief',
    mission_sent_to_creator: 'Recherche UGC',
    contract_signed: 'Gestion UGC',
    video_uploaded_by_creator: 'Livraison vidéo',
    brand_final_approved: 'À programmer dans SP',
}
