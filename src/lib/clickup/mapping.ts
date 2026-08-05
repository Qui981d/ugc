// ============================================================
// ClickUp mapping constants (no secrets — safe to import anywhere)
// ============================================================

// The subtasks created under every mission card, in order.
export const CLICKUP_SUBTASKS = [
    'Rédaction script',
    'Gestion UGC',
    'Livraison vidéo',
] as const

// App mission step (MissionStepType) → the ClickUp subtask it completes.
// Each subtask ticks at the moment that stage is genuinely finished:
// the script once the brand has approved it, the creator management once the
// contract is signed, the delivery once the video reaches the client.
// Adjust freely — values must match CLICKUP_SUBTASKS names.
export const STEP_TO_SUBTASK: Record<string, string> = {
    script_brand_approved: 'Rédaction script',
    contract_signed: 'Gestion UGC',
    video_sent_to_brand: 'Livraison vidéo',
}
