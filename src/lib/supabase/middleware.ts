import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If Supabase is not configured, allow all routes (demo mode)
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Use getSession() instead of getUser() for middleware.
    // getSession() reads the JWT locally from cookies (no network roundtrip).
    // getUser() makes a network call to Supabase on EVERY navigation (~200-500ms).
    // For middleware protecting page routes (read-only), getSession() is sufficient.

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user ?? null

    // Define public routes that don't require authentication
    const publicRoutes = [
        '/',
        '/login',
        '/signup',
        '/auth/callback',
        '/creators',
        '/campaigns',
        '/aide',
    ]

    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith('/auth/') ||
        request.nextUrl.pathname.startsWith('/creators/') ||
        request.nextUrl.pathname.startsWith('/campaigns/')
    )

    if (!user && !isPublicRoute) {
        // No user and not a public route - redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse
}

