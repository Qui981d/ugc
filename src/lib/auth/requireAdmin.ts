import { createClient } from '@/lib/supabase/server'

/**
 * Gate for routes that act with the service-role key.
 *
 * Those routes bypass RLS entirely, so the caller's identity has to be proven
 * from their session cookie — never taken from the request body. Returns the
 * admin's user id, or null when the caller isn't a signed-in admin.
 */
export async function requireAdmin(): Promise<string | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        return (data as { role?: string } | null)?.role === 'admin' ? user.id : null
    } catch {
        return null
    }
}
