'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsLoading(true)
        setError('')

        const supabase = createClient()
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        })

        if (resetError) {
            setError('Une erreur est survenue. Vérifiez votre email et réessayez.')
        } else {
            setIsSent(true)
        }
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/90 backdrop-blur-sm border border-black/[0.03] rounded-[24px] p-8">
                    {isSent ? (
                        /* Success State */
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#C4F042]/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-[#18181B]" />
                            </div>
                            <h1 className="text-2xl font-semibold text-[#18181B] mb-2">Email envoyé !</h1>
                            <p className="text-[#71717A] mb-6">
                                Si un compte est associé à <strong>{email}</strong>, vous recevrez un lien de réinitialisation.
                            </p>
                            <Link href="/login">
                                <Button className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full w-full">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Retour à la connexion
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        /* Form */
                        <>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-[#C4F042] flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl font-black text-[#18181B]">M</span>
                                </div>
                                <h1 className="text-2xl font-semibold text-[#18181B]">Mot de passe oublié</h1>
                                <p className="text-[#71717A] mt-2 text-sm">
                                    Entrez votre adresse email et nous vous enverrons un lien de réinitialisation
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#71717A] mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="votre@email.ch"
                                            required
                                            className="w-full bg-[#F4F3EF] border border-transparent rounded-xl pl-10 pr-4 py-3 text-[#18181B] focus:outline-none focus:border-[#C4F042] focus:ring-1 focus:ring-[#C4F042]/25 placeholder:text-[#A1A1AA]"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || !email.trim()}
                                    className="bg-[#18181B] hover:bg-[#18181B]/90 text-white rounded-full w-full"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    Envoyer le lien
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link href="/login" className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                                    Retour à la connexion
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
