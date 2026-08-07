'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, FileText, Wallet, ShieldCheck, Clapperboard } from 'lucide-react'
import { validateInviteCode } from '@/lib/services/adminService'
import { MoshLogo } from '@/components/brand/MoshLogo'

/**
 * Invitation landing.
 *
 * A creator arriving from an email link lands here rather than on a bare signup
 * form: they have never heard of the platform and need to know what they are
 * signing up to before being asked for a password.
 *
 * Account creation itself stays on /signup, and specialties are collected by the
 * existing onboarding after first sign-in — no duplicated form to drift.
 */

const POINTS = [
    {
        icon: Clapperboard,
        title: 'Des missions, pas de démarchage',
        body: "MOSH travaille avec des marques suisses et vous propose les missions qui correspondent à votre profil. Vous n'avez rien à prospecter.",
    },
    {
        icon: FileText,
        title: 'Un brief et un script fournis',
        body: "Chaque mission arrive avec un cadre clair : ce qu'il faut montrer, le ton, le format, les interdits. Vous tournez, vous livrez.",
    },
    {
        icon: Wallet,
        title: 'Un tarif annoncé à l\'avance',
        body: "Le montant est indiqué avant que vous acceptiez. Vous pouvez proposer un autre tarif avant de signer — c'est une discussion, pas un imposé.",
    },
    {
        icon: ShieldCheck,
        title: 'Un contrat pour chaque mission',
        body: 'Cession de droits, délais et rémunération sont écrits noir sur blanc, et signés en ligne avant le tournage.',
    },
]

export default function InvitationLandingPage() {
    const params = useParams()
    const code = String(params.code || '').toUpperCase()

    const [state, setState] = useState<'checking' | 'valid' | 'invalid'>('checking')
    const [reason, setReason] = useState<string | null>(null)

    useEffect(() => {
        if (!code) { setState('invalid'); return }
        validateInviteCode(code).then(r => {
            if (r.valid) setState('valid')
            else { setState('invalid'); setReason(r.error || null) }
        })
    }, [code])

    return (
        <div className="min-h-screen bg-[#F2F2F1]">
            <header className="h-16 flex items-center px-6 border-b border-[#E2E2E1] bg-white">
                <MoshLogo className="h-5 w-auto text-[#1A1A1A]" />
            </header>

            <main className="max-w-[720px] mx-auto px-6 py-12 md:py-16">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[#9B9B9B]">
                    Invitation créateur
                </p>
                <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1A1A1A] tracking-[-0.02em] leading-tight mt-2">
                    Vous avez été invité à rejoindre MOSH
                </h1>
                <p className="text-[15px] text-[#6B6B6B] mt-3 max-w-[56ch]">
                    MOSH est une agence suisse de contenu UGC. Nous confions à des créateurs
                    les vidéos que tournent nos clients — commerces, marques, enseignes.
                    Cette invitation vous donne accès à la plateforme.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-10">
                    {POINTS.map(p => (
                        <div key={p.title} className="bg-white border border-[#E2E2E1] rounded-xl p-5">
                            <div className="w-9 h-9 rounded-lg bg-[#F4F4F3] grid place-items-center mb-3">
                                <p.icon className="w-4.5 h-4.5 text-[#1A1A1A]" strokeWidth={1.8} />
                            </div>
                            <p className="text-[14px] font-semibold text-[#1A1A1A]">{p.title}</p>
                            <p className="text-[13px] text-[#6B6B6B] leading-relaxed mt-1">{p.body}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-[#E2E2E1] rounded-xl p-6 mt-4">
                    {state === 'checking' && (
                        <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Vérification de votre invitation…
                        </div>
                    )}

                    {state === 'valid' && (
                        <>
                            <h2 className="text-[16px] font-semibold text-[#1A1A1A]">Créer votre compte</h2>
                            <p className="text-[13px] text-[#6B6B6B] mt-1">
                                Quelques minutes : votre identité, un mot de passe, puis vos spécialités
                                et vos vidéos pour que nous sachions quoi vous proposer.
                            </p>
                            <Link
                                href={`/signup?role=creator&invite=${code}`}
                                className="inline-flex items-center gap-2 mt-4 px-4 h-11 bg-[#1A1A1A] text-white rounded-lg text-[14px] font-medium hover:bg-[#333333] transition-colors"
                            >
                                Créer mon compte créateur
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </Link>
                            <p className="text-[12px] text-[#9B9B9B] mt-3">
                                Invitation <span className="font-mono text-[#6B6B6B]">{code}</span> — valable 30 jours,
                                utilisable une seule fois.
                            </p>
                        </>
                    )}

                    {state === 'invalid' && (
                        <>
                            <h2 className="text-[16px] font-semibold text-[#1A1A1A]">
                                Cette invitation n&apos;est plus valable
                            </h2>
                            <p className="text-[13px] text-[#6B6B6B] mt-1">
                                {reason || "Le lien est incorrect."} Demandez-nous un nouveau lien et
                                nous vous en renverrons un.
                            </p>
                            <a
                                href="mailto:jeprendslaperoavecmosh@moshlemail.com?subject=Invitation%20cr%C3%A9ateur%20MOSH"
                                className="inline-flex items-center gap-2 mt-4 px-4 h-11 bg-white border border-[#E2E2E1] text-[#1A1A1A] rounded-lg text-[14px] font-medium hover:bg-[#F4F4F3] transition-colors"
                            >
                                Nous écrire
                            </a>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
