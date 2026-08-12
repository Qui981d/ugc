/**
 * When the six months of paid advertising start, and when they run out.
 *
 * The platform cannot observe the first ad — Meta and TikTok do not tell us,
 * and reading it would mean API access to the client's ad account. So the date
 * is declared by MOSH, and the contract carries a fallback for when nobody
 * declares it: the window opens automatically twelve months after final
 * acceptance. That is why an expiry is always computable, even if no one
 * touches anything.
 *
 * See lib/contracts/rights.ts for the durations; nothing is hardcoded here.
 */

import type { MissionRights } from './rights'

/**
 * Calendar months, not 30-day blocks.
 *
 * 31 August plus six months is 28 February, not 2 March — JavaScript would
 * roll the overflow into the next month, so the day is clamped to the end of
 * the target month.
 */
export function addMonths(date: Date, months: number): Date {
    const d = new Date(date.getTime())
    const targetMonth = d.getUTCMonth() + months
    const day = d.getUTCDate()
    d.setUTCDate(1)
    d.setUTCMonth(targetMonth)
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
    d.setUTCDate(Math.min(day, lastDay))
    return d
}

/**
 * Weekdays only. Cantonal public holidays are not applied — the shutdown
 * deadline is an operational courtesy, not a limitation period, and a wrong
 * holiday calendar would be worse than none.
 */
export function addBusinessDays(date: Date, days: number): Date {
    const d = new Date(date.getTime())
    let remaining = days
    while (remaining > 0) {
        d.setUTCDate(d.getUTCDate() + 1)
        const weekday = d.getUTCDay()
        if (weekday !== 0 && weekday !== 6) remaining--
    }
    return d
}

export type PaidWindowStatus =
    /** Rights sold, but the mission is not finished, so no clock can run yet. */
    | 'not_applicable'
    /** Final acceptance done, no first ad declared, the longstop has not hit. */
    | 'awaiting_activation'
    | 'active'
    /** Inside 30 days of expiry — the moment to sell an extension. */
    | 'expiring_soon'
    | 'expired'
    /** Past expiry and past the grace period: ads should already be off. */
    | 'shutdown_overdue'

export interface PaidWindow {
    status: PaidWindowStatus
    /** Null only while the mission has no final acceptance. */
    startsAt: Date | null
    expiresAt: Date | null
    /** How the start was determined — worth showing, the two are not equivalent. */
    startSource: 'declared' | 'fallback' | null
    /** Last day the client may keep an ad running after expiry. */
    shutdownDeadline: Date | null
    daysRemaining: number | null
}

const DAY_MS = 86_400_000
const EXPIRING_SOON_DAYS = 30

export interface PaidWindowInput {
    rights: MissionRights
    /** `brand_final_approved` completion. Null until the mission is accepted. */
    finalAcceptedAt: Date | string | null
    /** First advertising run, as declared by MOSH. */
    activatedAt: Date | string | null
    /** Injected so the result is testable and stable within a render. */
    now?: Date
}

const toDate = (v: Date | string | null): Date | null =>
    v ? (v instanceof Date ? v : new Date(v)) : null

export function computePaidWindow({
    rights,
    finalAcceptedAt,
    activatedAt,
    now = new Date(),
}: PaidWindowInput): PaidWindow {
    const empty: PaidWindow = {
        status: 'not_applicable',
        startsAt: null,
        expiresAt: null,
        startSource: null,
        shutdownDeadline: null,
        daysRemaining: null,
    }

    if (!rights.paid.enabled) return empty

    const declared = toDate(activatedAt)
    const accepted = toDate(finalAcceptedAt)

    // No declared start and nothing to count the longstop from: the clock
    // cannot begin, and inventing a date would create a right nobody agreed to.
    if (!declared && !accepted) return empty

    const startsAt = declared ?? addMonths(accepted!, rights.paid.activationLongstopMonths)
    const startSource: 'declared' | 'fallback' = declared ? 'declared' : 'fallback'
    const expiresAt = addMonths(startsAt, rights.paid.durationMonths)
    const shutdownDeadline = addBusinessDays(expiresAt, rights.paid.shutdownGraceDays)

    const msLeft = expiresAt.getTime() - now.getTime()
    const daysRemaining = Math.ceil(msLeft / DAY_MS)

    let status: PaidWindowStatus
    if (now < startsAt) {
        status = 'awaiting_activation'
    } else if (msLeft > EXPIRING_SOON_DAYS * DAY_MS) {
        status = 'active'
    } else if (msLeft > 0) {
        status = 'expiring_soon'
    } else if (now <= shutdownDeadline) {
        status = 'expired'
    } else {
        status = 'shutdown_overdue'
    }

    return { status, startsAt, expiresAt, startSource, shutdownDeadline, daysRemaining }
}

const FR_DATE = new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Zurich',
})

export const formatPaidDate = (d: Date | null): string => (d ? FR_DATE.format(d) : '—')

/** One line of plain French, for MOSH's screens. */
export function describePaidWindow(w: PaidWindow): string {
    switch (w.status) {
        case 'not_applicable':
            return 'Pas de droits publicitaires en cours.'
        case 'awaiting_activation':
            return `Première diffusion pas encore déclarée. Sans déclaration, la période court dès le ${formatPaidDate(w.startsAt)}.`
        case 'active':
            return `Publicité autorisée jusqu'au ${formatPaidDate(w.expiresAt)} — ${w.daysRemaining} jours restants.`
        case 'expiring_soon':
            return `Expire dans ${w.daysRemaining} jours, le ${formatPaidDate(w.expiresAt)}. C'est le moment de proposer une extension.`
        case 'expired':
            return `Expiré le ${formatPaidDate(w.expiresAt)}. Les campagnes doivent être arrêtées avant le ${formatPaidDate(w.shutdownDeadline)}.`
        case 'shutdown_overdue':
            return `Expiré le ${formatPaidDate(w.expiresAt)} et délai d'arrêt dépassé. Toute publicité encore en ligne est hors contrat.`
    }
}
