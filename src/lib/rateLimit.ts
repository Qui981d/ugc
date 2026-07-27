// ================================================
// In-memory Rate Limiter for API Routes
// Protects against abuse (especially OpenAI cost)
// ================================================

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key)
        }
    }
}, 5 * 60 * 1000)

/**
 * Simple in-memory rate limiter.
 * @param key - Unique identifier (e.g. userId or IP)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { success: boolean, remaining: number }
 */
export function rateLimit(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60 * 1000  // 1 minute default
): { success: boolean; remaining: number } {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { success: true, remaining: maxRequests - 1 }
    }

    if (entry.count >= maxRequests) {
        return { success: false, remaining: 0 }
    }

    entry.count++
    return { success: true, remaining: maxRequests - entry.count }
}
