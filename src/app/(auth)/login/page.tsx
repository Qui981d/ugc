'use client'

import { useState, Suspense, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { MoshLogo } from "@/components/brand/MoshLogo"


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

    // Prevent hydration mismatch
    useEffect(() => { setMounted(true) }, [])

    // Redirect if already logged in
    useEffect(() => {
        if (mounted && !authLoading && user) {
            const destination = user.role === 'brand' ? '/brand' : user.role === 'admin' ? '/mosh-cockpit' : '/creator'
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
    }

    // Show loading while checking auth
    if (!mounted || authLoading) {
        return (
            <Card className="bg-white border-[#E2E2E1] shadow-xl">
                <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
                </CardContent>
            </Card>
        )
    }

    // If user is logged in, show loading while redirecting
    if (user) {
        return (
            <Card className="bg-white border-[#E2E2E1] shadow-xl">
                <CardContent className="py-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B] mb-4" />
                    <p className="text-[#6B6B6B]">Redirection en cours...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-white border-[#E2E2E1] shadow-xl">
            <CardHeader className="text-center">
                <MoshLogo className="h-7 w-auto mx-auto mb-3 text-[#1A1A1A]" />
                <CardTitle className="text-xl text-[#1A1A1A]">Connexion</CardTitle>
                <CardDescription className="text-[#6B6B6B]">
                    Accédez à votre espace personnel
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FBEAE8] border border-[#F2CFCB] text-[#C0392B] text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#1A1A1A]">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@exemple.ch"
                            required
                            className="bg-[#FAFAF9] border-[#E2E2E1] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:ring-[#F2CFCB] focus:border-[#F2CFCB]"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[#1A1A1A]">Mot de passe</Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-[#9B9B9B] hover:text-[#6B6B6B]"
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
                            className="bg-[#FAFAF9] border-[#E2E2E1] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:ring-[#F2CFCB] focus:border-[#F2CFCB]"
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

                <div className="mt-6 text-center text-sm text-[#9B9B9B]">
                    Pas encore de compte?{" "}
                    <Link href="/signup" className="text-[#C0392B] font-medium hover:text-[#C0392B]">
                        S&apos;inscrire
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#FAFAF9]">
            {/* Simple back link */}
            <div className="fixed top-6 left-6 z-50">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </Link>
            </div>

            <div className="flex items-center justify-center min-h-screen px-6">
                <div className="w-full max-w-md">
                    <Suspense fallback={<div className="text-[#6B6B6B] text-center">Chargement...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
