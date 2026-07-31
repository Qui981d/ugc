'use client'

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, User, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { validateInviteCode, markInvitationUsed } from "@/lib/services/adminService"

function SignupForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { signUp } = useAuth()
    const defaultRole = searchParams.get('role') || 'creator'
    const redirectTo = searchParams.get('redirect')
    const inviteCode = searchParams.get('invite') || ''

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
        inviteCode: inviteCode,
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

        // Validate invite code if provided
        if (creatorForm.inviteCode) {
            const validation = await validateInviteCode(creatorForm.inviteCode)
            if (!validation.valid) {
                setError(validation.error || 'Code d\'invitation invalide')
                setIsLoading(false)
                return
            }
        }

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
        } else {
            // Mark invitation as used
            if (creatorForm.inviteCode && result.userId) {
                await markInvitationUsed(creatorForm.inviteCode, result.userId)
            }
            if (redirectTo) {
                router.push(redirectTo)
            }
        }
    }

    const inputClass = "bg-[#FAFAF9] border-[#E2E2E1] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:ring-[#F2CFCB] focus:border-[#F2CFCB]"

    return (
        <Card className="bg-white border-[#E2E2E1] shadow-xl">
            <CardHeader className="text-center">
                <div className="text-2xl font-bold text-[#1A1A1A] mb-2">
                    MOSH
                </div>
                <CardTitle className="text-xl text-[#1A1A1A]">Créer un compte</CardTitle>
                <CardDescription className="text-[#6B6B6B]">
                    Rejoignez la plateforme UGC de référence en Suisse
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[#FBEAE8] border border-[#F2CFCB] text-[#C0392B] text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <Tabs value={role} onValueChange={(v) => setRole(v as 'brand' | 'creator')}>
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#F4F4F3]">
                        <TabsTrigger value="brand" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm">
                            <Building2 className="h-4 w-4" />
                            Marque
                        </TabsTrigger>
                        <TabsTrigger value="creator" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm">
                            <User className="h-4 w-4" />
                            Créateur
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="brand">
                        <form className="space-y-4" onSubmit={handleBrandSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="company" className="text-[#1A1A1A]">Nom de l&apos;entreprise *</Label>
                                <Input
                                    id="company"
                                    value={brandForm.companyName}
                                    onChange={(e) => setBrandForm({ ...brandForm, companyName: e.target.value })}
                                    placeholder="Ma Marque SA"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="uid" className="text-[#1A1A1A]">Numéro IDE (optionnel)</Label>
                                <Input
                                    id="uid"
                                    value={brandForm.uidNumber}
                                    onChange={(e) => setBrandForm({ ...brandForm, uidNumber: e.target.value })}
                                    placeholder="CHE-123.456.789"
                                    className={`${inputClass} ${brandForm.uidNumber && !/^CHE-\d{3}\.\d{3}\.\d{3}$/.test(brandForm.uidNumber) ? 'border-[#F2CFCB] focus:border-[#F2CFCB] focus:ring-[#F2CFCB]' : brandForm.uidNumber ? 'border-[#C9E6D0] focus:border-[#C9E6D0] focus:ring-[#C9E6D0]' : ''}`}
                                />
                                <p className={`text-xs flex items-center gap-1 ${brandForm.uidNumber && !/^CHE-\d{3}\.\d{3}\.\d{3}$/.test(brandForm.uidNumber) ? 'text-[#C0392B]' : brandForm.uidNumber ? 'text-[#1A7F37]' : 'text-[#9B9B9B]'}`}>
                                    {brandForm.uidNumber && /^CHE-\d{3}\.\d{3}\.\d{3}$/.test(brandForm.uidNumber) ? (
                                        <><CheckCircle2 className="w-3 h-3" /> Format IDE valide</>
                                    ) : brandForm.uidNumber ? (
                                        <><AlertCircle className="w-3 h-3" /> Format attendu : CHE-xxx.xxx.xxx</>
                                    ) : (
                                        'Format: CHE-xxx.xxx.xxx'
                                    )}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-brand" className="text-[#1A1A1A]">Email professionnel *</Label>
                                <Input
                                    id="email-brand"
                                    type="email"
                                    value={brandForm.email}
                                    onChange={(e) => setBrandForm({ ...brandForm, email: e.target.value })}
                                    placeholder="contact@mamarque.ch"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password-brand" className="text-[#1A1A1A]">Mot de passe *</Label>
                                <Input
                                    id="password-brand"
                                    type="password"
                                    value={brandForm.password}
                                    onChange={(e) => setBrandForm({ ...brandForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className={inputClass}
                                />
                                <p className="text-xs text-[#9B9B9B]">Minimum 6 caractères</p>
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
                                    <Label htmlFor="firstname" className="text-[#1A1A1A]">Prénom *</Label>
                                    <Input
                                        id="firstname"
                                        value={creatorForm.firstName}
                                        onChange={(e) => setCreatorForm({ ...creatorForm, firstName: e.target.value })}
                                        placeholder="Marie"
                                        required
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastname" className="text-[#1A1A1A]">Nom *</Label>
                                    <Input
                                        id="lastname"
                                        value={creatorForm.lastName}
                                        onChange={(e) => setCreatorForm({ ...creatorForm, lastName: e.target.value })}
                                        placeholder="Dupont"
                                        required
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-creator" className="text-[#1A1A1A]">Email *</Label>
                                <Input
                                    id="email-creator"
                                    type="email"
                                    value={creatorForm.email}
                                    onChange={(e) => setCreatorForm({ ...creatorForm, email: e.target.value })}
                                    placeholder="marie@email.ch"
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password-creator" className="text-[#1A1A1A]">Mot de passe *</Label>
                                <Input
                                    id="password-creator"
                                    type="password"
                                    value={creatorForm.password}
                                    onChange={(e) => setCreatorForm({ ...creatorForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className={inputClass}
                                />
                                <p className="text-xs text-[#9B9B9B]">Minimum 6 caractères</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="canton" className="text-[#1A1A1A]">Canton</Label>
                                <Input
                                    id="canton"
                                    value={creatorForm.canton}
                                    onChange={(e) => setCreatorForm({ ...creatorForm, canton: e.target.value })}
                                    placeholder="Genève"
                                    className={inputClass}
                                />
                            </div>

                            {creatorForm.inviteCode && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E8F3EA] border border-[#C9E6D0] text-[#1A7F37] text-sm">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>Invitation : <strong className="font-mono">{creatorForm.inviteCode.toUpperCase()}</strong></span>
                                </div>
                            )}

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

                <div className="mt-6 text-center text-sm text-[#9B9B9B]">
                    Déjà un compte?{" "}
                    <Link href="/login" className="text-[#C0392B] font-medium hover:text-[#C0392B]">
                        Connexion
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SignupPage() {
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
                <div className="w-full max-w-lg">
                    <Suspense fallback={<div className="text-[#6B6B6B]">Loading...</div>}>
                        <SignupForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
