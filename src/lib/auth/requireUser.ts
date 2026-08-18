import { createClient } from '@/lib/supabase/server'

/**
 * Gate for routes that act on behalf of any signed-in user.
 *
 * Distinct from requireAdmin: several of these routes are legitimately called
 * by a brand — creating a campaign mirrors it into ClickUp, completing a step
 * ticks a subtask — so demanding an admin would break the brand workspace.
 * What they must not be is open to the internet, which is what they were.
 *
 * Returns the caller's user id, or null when there is no session.
 */
export async function requireUser(): Promise<string | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user?.id ?? null
    } catch {
        return null
    }
}
