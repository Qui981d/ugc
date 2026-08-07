'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import { validateInviteCode } from '@/lib/services/adminService'
import { MoshLogo } from '@/components/brand/MoshLogo'

/**
 * Invitation landing.
 *
 * A creator arriving from an email has never heard of the platform, so this
 * explains it before asking for a password. Account creation stays on /signup
 * and specialties on the existing onboarding — no second form to keep in sync.
 *
 * Composition follows the brand deck rather than SaaS convention: monochrome,
 * alternating black and white grounds, contrast doing the work colour usually
 * does. The product shot is the real interface rebuilt in markup — sharper than
 * a PNG, responsive, and it cannot fall out of date with the design system.
 */

const STEPS = [
    { n: '01', t: 'On vous propose une mission', d: "Une marque, un produit, une date. Vous acceptez ou vous passez — sans justification." },
    { n: '02', t: 'Vous recevez le brief et le script', d: "Ce qu'il faut montrer, le ton, le format, les interdits. Écrit avant que vous sortiez la caméra." },
    { n: '03', t: 'Vous tournez et vous livrez', d: 'Vous déposez la vidéo sur la plateforme. On relit, on transmet à la marque.' },
    { n: '04', t: 'Vous êtes payé', d: 'Le montant était connu avant de commencer. Le contrat aussi.' },
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

    const cta = (
        <Link
            href={`/signup?role=creator&invite=${code}`}
            className="group inline-flex items-center gap-2.5 h-12 pl-5 pr-4 bg-white text-[#1A1A1A] rounded-full text-[15px] font-semibold hover:bg-[#F4F4F3] transition-colors"
        >
            Créer mon compte
            <span className="w-7 h-7 rounded-full bg-[#1A1A1A] grid place-items-center">
                <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </span>
        </Link>
    )

    return (
        <div className="bg-white">
            {/* ── Hero: near-black, asymmetric, the statement carries it ── */}
            <section className="bg-[#1A1A1A] text-white">
                <div className="max-w-[1080px] mx-auto px-6 pt-8 pb-16 md:pb-24">
                    <div className="flex items-center justify-between">
                        <MoshLogo className="h-5 w-auto text-white" />
                        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-white/40">
                            Invitation {code}
                        </span>
                    </div>

                    <div className="grid md:grid-cols-12 gap-8 mt-16 md:mt-24">
                        <div className="md:col-span-8">
                            <h1 className="text-[34px] md:text-[56px] leading-[1.02] tracking-[-0.03em] font-semibold text-balance">
                                Vous filmez.
                                <br />
                                On s&apos;occupe du reste.
                            </h1>
                        </div>
                        <div className="md:col-span-4 md:pt-3">
                            <p className="text-[15px] leading-relaxed text-white/60">
                                MOSH est une agence suisse de contenu UGC. Nos clients veulent des
                                vidéos qui ne ressemblent pas à des publicités. C&apos;est là que
                                vous intervenez.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── The deal, as a table of facts rather than decorated cards ── */}
            <section className="max-w-[1080px] mx-auto px-6 -mt-8 md:-mt-10">
                <div className="bg-white border border-[#E2E2E1] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                    <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E2E1]">
                        {[
                            ['Tarif', 'Annoncé avant que vous acceptiez. Négociable.'],
                            ['Contrat', 'Signé en ligne, une fois par mission.'],
                            ['Prospection', 'Aucune. Les missions viennent à vous.'],
                        ].map(([k, v]) => (
                            <div key={k} className="px-6 py-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9B9B9B]">{k}</p>
                                <p className="text-[14px] text-[#1A1A1A] mt-1.5 leading-snug">{v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Process: a real sequence, so numbered and connected ── */}
            <section className="max-w-[1080px] mx-auto px-6 py-20 md:py-28">
                <h2 className="text-[24px] md:text-[30px] font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                    Comment ça se passe
                </h2>

                <ol className="mt-10 border-t border-[#E2E2E1]">
                    {STEPS.map(s => (
                        <li key={s.n} className="grid md:grid-cols-12 gap-y-1 gap-x-6 py-6 border-b border-[#E2E2E1]">
                            <span className="md:col-span-1 font-mono text-[13px] text-[#9B9B9B] tabular-nums pt-0.5">
                                {s.n}
                            </span>
                            <h3 className="md:col-span-4 text-[16px] font-semibold text-[#1A1A1A] leading-snug">
                                {s.t}
                            </h3>
                            <p className="md:col-span-7 text-[14px] text-[#6B6B6B] leading-relaxed">
                                {s.d}
                            </p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ── Product shot: the actual creator view, rebuilt in markup ── */}
            <section className="bg-[#F2F2F1] border-y border-[#E2E2E1]">
                <div className="max-w-[1080px] mx-auto px-6 py-20 md:py-28">
                    <div className="grid md:grid-cols-12 gap-10 items-center">
                        <div className="md:col-span-4">
                            <h2 className="text-[24px] md:text-[30px] font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                                Tout est écrit
                            </h2>
                            <p className="text-[14px] text-[#6B6B6B] leading-relaxed mt-3">
                                Le montant, l&apos;échéance, l&apos;état de la mission. Vous voyez où
                                vous en êtes sans avoir à demander. Et si le tarif ne vous convient
                                pas, vous proposez le vôtre avant de signer.
                            </p>
                        </div>

                        <div className="md:col-span-8">
                            <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 h-11 border-b border-[#E2E2E1]">
                                    <span className="text-[13px] font-semibold text-[#1A1A1A]">Mes missions</span>
                                    <span className="text-[11px] text-[#9B9B9B] tabular-nums">2 en cours</span>
                                </div>

                                <div className="divide-y divide-[#E2E2E1]">
                                    {[
                                        { t: 'Réel UGC — Activation été', b: 'La Combe', s: 'Contrat à signer', tone: 'wait', a: '500.00', d: '25.08' },
                                        { t: 'Unboxing — Rentrée', b: 'Nightout SNC', s: 'Tournage', tone: 'run', a: '750.00', d: '02.09' },
                                    ].map(m => (
                                        <div key={m.t} className="flex items-center gap-3 px-4 py-3">
                                            <span className="w-8 h-8 rounded-lg bg-[#F4F4F3] border border-[#E2E2E1] grid place-items-center text-[11px] font-semibold text-[#6B6B6B] shrink-0">
                                                {m.b.charAt(0)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[13px] font-medium text-[#1A1A1A] truncate">{m.t}</span>
                                                <span className="block text-[12px] text-[#9B9B9B] truncate">{m.b} · {m.d}</span>
                                            </span>
                                            <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[11.5px] font-semibold whitespace-nowrap ${m.tone === 'wait'
                                                ? 'bg-[#FBF3E2] text-[#8A6100]'
                                                : 'bg-[#1A1A1A] text-white'
                                                }`}>
                                                {m.s}
                                            </span>
                                            <span className="text-[13px] font-semibold text-[#1A1A1A] tabular-nums whitespace-nowrap">
                                                {m.a}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[#E2E2E1] bg-[#FAFAF9] px-4 py-3 flex flex-wrap items-center gap-2">
                                    <span className="text-[12px] text-[#6B6B6B]">Rémunération proposée</span>
                                    <span className="text-[13px] font-semibold text-[#1A1A1A] tabular-nums">CHF 500.00</span>
                                    <span className="ml-auto text-[12px] text-[#1A1A1A] underline underline-offset-2">
                                        Demander un autre tarif
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Close ── */}
            <section className="bg-[#1A1A1A] text-white">
                <div className="max-w-[1080px] mx-auto px-6 py-20 md:py-24">
                    {state === 'checking' && (
                        <div className="flex items-center gap-2.5 text-[14px] text-white/50">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Vérification de votre invitation…
                        </div>
                    )}

                    {state === 'valid' && (
                        <div className="grid md:grid-cols-12 gap-8 items-end">
                            <div className="md:col-span-7">
                                <h2 className="text-[26px] md:text-[38px] font-semibold tracking-[-0.025em] leading-[1.1]">
                                    Votre invitation est valable.
                                </h2>
                                <p className="text-[15px] text-white/60 mt-3 max-w-[46ch]">
                                    Créez votre compte, indiquez vos spécialités et ajoutez quelques
                                    vidéos. On saura quoi vous proposer.
                                </p>
                            </div>
                            <div className="md:col-span-5 md:text-right">
                                {cta}
                                <p className="text-[12px] text-white/35 mt-3">
                                    Valable 30 jours · utilisable une seule fois
                                </p>
                            </div>
                        </div>
                    )}

                    {state === 'invalid' && (
                        <div className="max-w-[52ch]">
                            <h2 className="text-[26px] md:text-[34px] font-semibold tracking-[-0.025em] leading-[1.1]">
                                Cette invitation n&apos;est plus valable.
                            </h2>
                            <p className="text-[15px] text-white/60 mt-3">
                                {reason || 'Le lien est incorrect.'} Écrivez-nous et on vous en renvoie une.
                            </p>
                            <a
                                href="mailto:jeprendslaperoavecmosh@moshlemail.com?subject=Invitation%20cr%C3%A9ateur%20MOSH"
                                className="inline-flex items-center gap-2 h-11 px-5 mt-6 border border-white/25 rounded-full text-[14px] font-medium hover:bg-white/10 transition-colors"
                            >
                                Nous écrire
                            </a>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
