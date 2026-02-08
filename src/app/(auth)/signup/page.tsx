'use client'

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, User, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

function SignupForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { signUp } = useAuth()
    const defaultRole = searchParams.get('role') || 'brand'
    const redirectTo = searchParams.get('redirect')

    const [role, setRole] = useState<'brand' | 'creator'>(defaultRole as 'brand' | 'creator')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Brand form state
    const [brandForm, setBrandForm] = useState({
        companyName: '',
        uidNumber: '',
        email: '',
        password: '',
    })

    // Creator form state
    const [creatorForm, setCreatorForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        canton: '',
    })

    const handleBrandSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const result = await signUp(
            brandForm.email,
            brandForm.password,
            brandForm.companyName,
            'brand',
            {
                company_name: brandForm.companyName,
                uid_number: brandForm.uidNumber || null,
            }
        )

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else if (redirectTo) {
            router.push(redirectTo)
        }
    }

    const handleCreatorSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const fullName = `${creatorForm.firstName} ${creatorForm.lastName}`

        const result = await signUp(
            creatorForm.email,
            creatorForm.password,
            fullName,
            'creator',
            {
                location_canton: creatorForm.canton || null,
            }
        )

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
        } else if (redirectTo) {
            router.push(redirectTo)
        }
    }

    return (
        <Card className="bg-white/5 border-white/10 shadow-2xl">
            <CardHeader className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                    UGC<span className="text-accent">Suisse</span>
                </div>
                <CardTitle className="text-xl text-white">Créer un compte</CardTitle>
                <CardDescription className="text-white/60">
                    Rejoignez la plateforme UGC de référence en Suisse
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Tabs value={role} onValueChange={(v) => setRole(v as 'brand' | 'creator')}>
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
                        <TabsTrigger value="brand" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                            <Building2 className="h-4 w-4" />
                            Marque
                        </TabsTrigger>
                        <TabsTrigger value="creator" className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                            <User className="h-4 w-4" />
                            Créateur
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="brand">
                        <form className="space-y-4" onSubmit={handleBrandSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-white/80">Nom de l&apos;entreprise *</Label>
                                <Input
                                    id="company"
                                    value={brandForm.companyName}
                                    onChange={(e) => setBrandForm({ ...brandForm, companyName: e.target.value })}
                                    placeholder="Ma Marque SA"
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="uid" className="text-white/80">Numéro IDE (optionnel)</Label>
                                <Input
                                    id="uid"
                                    value={brandForm.uidNumber}
                                    onChange={(e) => setBrandForm({ ...brandForm, uidNumber: e.target.value })}
                                    placeholder="CHE-123.456.789"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                                <p className="text-xs text-white/40">
                                    Format: CHE-xxx.xxx.xxx
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-brand" className="text-white/80">Email professionnel *</Label>
                                <Input
                                    id="email-brand"
                                    type="email"
                                    value={brandForm.email}
                                    onChange={(e) => setBrandForm({ ...brandForm, email: e.target.value })}
                                    placeholder="contact@mamarque.ch"
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password-brand" className="text-white/80">Mot de passe *</Label>
                                <Input
                                    id="password-brand"
                                    type="password"
                                    value={brandForm.password}
                                    onChange={(e) => setBrandForm({ ...brandForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                                <p className="text-xs text-white/40">Minimum 6 caractères</p>
                            </div>

                            <Button className="w-full btn-primary" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Création en cours...
                                    </>
                                ) : (
                                    'Créer mon compte marque'
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="creator">
                        <form className="space-y-4" onSubmit={handleCreatorSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstname" className="text-white/80">Prénom *</Label>
                                    <Input
                                        id="firstname"
                                        value={creatorForm.firstName}
                                        onChange={(e) => setCreatorForm({ ...creatorForm, firstName: e.target.value })}
                                        placeholder="Marie"
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastname" className="text-white/80">Nom *</Label>
                                    <Input
                                        id="lastname"
                                        value={creatorForm.lastName}
                                        onChange={(e) => setCreatorForm({ ...creatorForm, lastName: e.target.value })}
                                        placeholder="Dupont"
                                        required
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-creator" className="text-white/80">Email *</Label>
                                <Input
                                    id="email-creator"
                                    type="email"
                                    value={creatorForm.email}
                                    onChange={(e) => setCreatorForm({ ...creatorForm, email: e.target.value })}
                                    placeholder="marie@email.ch"
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password-creator" className="text-white/80">Mot de passe *</Label>
                                <Input
                                    id="password-creator"
                                    type="password"
                                    value={creatorForm.password}
                                    onChange={(e) => setCreatorForm({ ...creatorForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                                <p className="text-xs text-white/40">Minimum 6 caractères</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="canton" className="text-white/80">Canton</Label>
                                <Input
                                    id="canton"
                                    value={creatorForm.canton}
                                    onChange={(e) => setCreatorForm({ ...creatorForm, canton: e.target.value })}
                                    placeholder="Genève"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                                />
                            </div>

                            <Button className="w-full btn-primary" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Création en cours...
                                    </>
                                ) : (
                                    'Créer mon compte créateur'
                                )}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 text-center text-sm text-white/50">
                    Déjà un compte?{" "}
                    <Link href="/login" className="text-white font-medium hover:underline">
                        Connexion
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="flex items-center justify-center min-h-screen px-6 pt-20">
                <div className="w-full max-w-lg">
                    <Suspense fallback={<div className="text-white">Loading...</div>}>
                        <SignupForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
