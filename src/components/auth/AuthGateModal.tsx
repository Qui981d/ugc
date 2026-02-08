'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, LogIn, UserPlus, Briefcase, Sparkles } from 'lucide-react'

interface AuthGateModalProps {
    isOpen: boolean
    onClose: () => void
    action: 'contact' | 'apply' | 'generic'
    redirectTo?: string
}

export function AuthGateModal({ isOpen, onClose, action, redirectTo }: AuthGateModalProps) {
    const [selectedRole, setSelectedRole] = useState<'brand' | 'creator' | null>(null)

    const actionTexts = {
        contact: {
            title: 'Connectez-vous pour contacter',
            description: 'Créez un compte ou connectez-vous pour envoyer un message à ce créateur.',
            icon: Sparkles,
        },
        apply: {
            title: 'Connectez-vous pour postuler',
            description: 'Créez un compte créateur ou connectez-vous pour postuler à cette campagne.',
            icon: Briefcase,
        },
        generic: {
            title: 'Connexion requise',
            description: 'Créez un compte ou connectez-vous pour continuer.',
            icon: LogIn,
        },
    }

    const { title, description, icon: Icon } = actionTexts[action]

    const signupUrl = selectedRole
        ? `/signup?role=${selectedRole}${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`
        : `/signup${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`

    const loginUrl = `/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-50"
                    >
                        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden">
                            {/* Header */}
                            <div className="relative p-6 pb-4 text-center">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>

                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
                                    <Icon className="w-8 h-8 text-accent" />
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                                <p className="text-white/60 text-sm">{description}</p>
                            </div>

                            {/* Role Selection for Signup */}
                            {action === 'contact' && (
                                <div className="px-6 pb-4">
                                    <p className="text-xs text-white/40 text-center mb-3">Vous êtes :</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setSelectedRole('brand')}
                                            className={`p-4 rounded-xl border transition-all ${selectedRole === 'brand'
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <Briefcase className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'brand' ? 'text-accent' : 'text-white/60'}`} />
                                            <span className={`text-sm font-medium ${selectedRole === 'brand' ? 'text-accent' : 'text-white/80'}`}>
                                                Une marque
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setSelectedRole('creator')}
                                            className={`p-4 rounded-xl border transition-all ${selectedRole === 'creator'
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <Sparkles className={`w-6 h-6 mx-auto mb-2 ${selectedRole === 'creator' ? 'text-accent' : 'text-white/60'}`} />
                                            <span className={`text-sm font-medium ${selectedRole === 'creator' ? 'text-accent' : 'text-white/80'}`}>
                                                Un créateur
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="p-6 pt-2 space-y-3">
                                <Link href={signupUrl} className="block">
                                    <Button className="w-full btn-primary">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Créer un compte
                                    </Button>
                                </Link>
                                <Link href={loginUrl} className="block">
                                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Se connecter
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
