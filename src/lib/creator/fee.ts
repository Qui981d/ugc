/**
 * What the creator is paid — never what the client paid.
 *
 * `campaigns` carries both numbers side by side: `budget_chf` is the client
 * price, `creator_amount_chf` is the creator's fee. Falling back from one to
 * the other shows MOSH's margin to the creator, which is exactly what the
 * earnings screen was doing (790 CHF displayed against a 300 CHF mission).
 *
 * So there is no fallback. An undetermined fee returns null and the screen says
 * "à confirmer" — a missing amount is missing, not the client's budget.
 */

export interface CreatorFeeSources {
    /** `campaigns.creator_amount_chf` — set when the whole mission is one creator's. */
    campaignAmount?: number | null
    /**
     * `campaign_contents.creator_amount_chf` for the videos assigned to this
     * creator. A multi-video mission can hand them several, so they add up.
     */
    contentAmounts?: (number | null | undefined)[]
}

export function resolveCreatorFee({ campaignAmount, contentAmounts }: CreatorFeeSources): number | null {
    const perContent = (contentAmounts || []).filter(
        (n): n is number => typeof n === 'number' && Number.isFinite(n)
    )
    // Per-video amounts win: on a multi-creator mission the campaign-level
    // figure covers someone else, or the whole batch.
    if (perContent.length > 0) return perContent.reduce((a, b) => a + b, 0)

    return typeof campaignAmount === 'number' && Number.isFinite(campaignAmount)
        ? campaignAmount
        : null
}

/** Totals ignore undetermined fees rather than guessing at them. */
export function sumCreatorFees(fees: (number | null)[]): number {
    return fees.reduce<number>((acc, f) => acc + (f ?? 0), 0)
}

export const FEE_UNKNOWN_LABEL = 'À confirmer'
