'use client'

import { useState, Suspense, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"


function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn, user, isLoading: authLoading } = useAuth()
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const redirectTo = searchParams.get('redirect')

    // Prevent hydration mismatch: auth state differs between server and client
    useEffect(() => { setMounted(true) }, [])

    // Redirect if already logged in
    useEffect(() => {
        if (mounted && !authLoading && user) {
            const destination = user.role === 'brand' ? '/brand' : '/creator'
            router.push(redirectTo || destination)
        }
    }, [user, authLoading, router, redirectTo, mounted])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const result = await signIn(email, password)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else if (redirectTo) {
            router.push(redirectTo)
        }
        // Otherwise, AuthContext.signIn handles redirect based on role
    }

    // Show loading while checking auth (only after mount to avoid hydration mismatch)
    if (!mounted || authLoading) {
        return (
            <Card className="bg-white/5 border-white/10 shadow-2xl">
                <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                </CardContent>
            </Card>
        )
    }

    // If user is logged in, show loading while redirecting
    if (user) {
        return (
            <Card className="bg-white/5 border-white/10 shadow-2xl">
                <CardContent className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white/50 mb-4" />
                    <p className="text-white/60">Redirection en cours...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-white/5 border-white/10 shadow-2xl">
            <CardHeader className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                    UGC<span className="text-accent">Suisse</span>
                </div>
                <CardTitle className="text-xl text-white">Connexion</CardTitle>
                <CardDescription className="text-white/60">
                    Accédez à votre espace personnel
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/80">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@exemple.ch"
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-white/80">Mot de passe</Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-white/50 hover:text-white"
                            >
                                Mot de passe oublié?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                        />
                    </div>

                    <Button
                        className="w-full btn-primary"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connexion...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-white/50">
                    Pas encore de compte?{" "}
                    <Link href="/signup" className="text-white font-medium hover:underline">
                        Créer un compte
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="flex items-center justify-center min-h-screen px-6 pt-20">
                <div className="w-full max-w-md">
                    <Suspense fallback={<div className="text-white text-center">Chargement...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
