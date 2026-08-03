'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, Users, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { getAllAdmins } from '@/lib/services/adminService'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, EmptyState } from '@/components/ui/workspace'
import type { User } from '@/types/database'

export default function TeamPage() {
    const [admins, setAdmins] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({ fullName: '', email: '' })
    const [resetting, setResetting] = useState<string | null>(null)

    const load = async () => {
        const list = await getAllAdmins()
        setAdmins(list)
        setIsLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleCreate = async () => {
        if (!form.email.trim()) return
        setCreating(true)
        try {
            const res = await fetch('/api/team/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Collaborateur ajouté', {
                    description: 'Envoyez-lui le lien « mot de passe oublié » pour qu\'il définisse le sien.',
                })
                setShowAdd(false)
                setForm({ fullName: '', email: '' })
                await load()
            } else {
                toast.error(data.error || 'Échec de la création')
            }
        } catch {
            toast.error('Erreur réseau')
        }
        setCreating(false)
    }

    // No password is ever shown or transported: the teammate sets their own.
    const sendReset = async (email: string) => {
        setResetting(email)
        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        })
        setResetting(null)
        if (error) toast.error(error.message)
        else toast.success('Email de définition du mot de passe envoyé')
    }

    const inputClass = 'w-full px-3 h-9 bg-white border border-[#E2E2E1] rounded-lg text-[13px] text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/15'

    return (
        <div className="max-w-[1000px] mx-auto">
            <PageHeader
                title="Équipe"
                description="Les membres de MOSH. Chacun reçoit les notifications de la plateforme, par email aussi."
                actions={
                    <button
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.2} />
                        Ajouter un collaborateur
                    </button>
                }
            />

            <div className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="divide-y divide-[#E2E2E1]">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-[#F4F4F3]" />
                                <div className="h-4 bg-[#F4F4F3] rounded w-1/4" />
                            </div>
                        ))}
                    </div>
                ) : admins.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="Aucun collaborateur"
                        description="Ajoutez les membres de l'équipe pour qu'ils reçoivent les notifications."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="border-b border-[#E2E2E1]">
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Membre</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5">Email</th>
                                    <th className="text-left font-medium text-[11px] uppercase tracking-wider text-[#9B9B9B] px-4 py-2.5 hidden sm:table-cell">Depuis</th>
                                    <th className="w-40" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E2E1]">
                                {admins.map((a) => (
                                    <tr key={a.id} className="hover:bg-[#FAFAF9] transition-colors">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="w-7 h-7 rounded-full bg-[#F4F4F3] border border-[#E2E2E1] grid place-items-center text-[11px] font-semibold text-[#6B6B6B] shrink-0">
                                                    {(a.full_name || a.email).charAt(0).toUpperCase()}
                                                </span>
                                                <span className="font-medium text-[#1A1A1A] truncate">{a.full_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#6B6B6B] truncate max-w-[240px]">{a.email}</td>
                                        <td className="px-4 py-2.5 text-[#6B6B6B] hidden sm:table-cell tabular-nums whitespace-nowrap">
                                            {new Date(a.created_at).toLocaleDateString('fr-CH')}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <button
                                                onClick={() => sendReset(a.email)}
                                                disabled={resetting === a.email}
                                                className="inline-flex items-center gap-1.5 px-2.5 h-8 bg-white border border-[#E2E2E1] rounded-lg text-[12px] text-[#1A1A1A] hover:bg-[#F4F4F3] transition-colors disabled:opacity-50 whitespace-nowrap"
                                            >
                                                {resetting === a.email
                                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    : <Mail className="w-3.5 h-3.5" strokeWidth={1.8} />}
                                                Envoyer un accès
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAdd && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() => !creating && setShowAdd(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl border border-[#E2E2E1] shadow-xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between px-5 h-12 border-b border-[#E2E2E1]">
                            <h2 className="text-[14px] font-semibold text-[#1A1A1A]">Ajouter un collaborateur</h2>
                            <button
                                onClick={() => setShowAdd(false)}
                                className="w-7 h-7 rounded-md grid place-items-center text-[#9B9B9B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div>
                                <label className="block text-[12px] font-medium text-[#1A1A1A] mb-1.5">Nom</label>
                                <input
                                    className={inputClass}
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    placeholder="Ex : Marine David"
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-[#1A1A1A] mb-1.5">Email professionnel *</label>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="prenom@mosh.ch"
                                />
                                <p className="text-[11.5px] text-[#9B9B9B] mt-1.5">
                                    Le compte a un accès complet à MOSH. Aucun mot de passe n&apos;est créé ici :
                                    envoyez-lui ensuite un accès pour qu&apos;il définisse le sien.
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-3 border-t border-[#E2E2E1] flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="px-3 h-9 text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !form.email.trim()}
                                className="inline-flex items-center gap-1.5 px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors disabled:opacity-50"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.2} />}
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
