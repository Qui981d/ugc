'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Building2,
    Bell,
    CreditCard,
    Users,
    Shield,
    Camera,
    Save,
    CheckCircle2,
    Plus,
    Trash2,
    ChevronRight,
    Globe,
    Mail,
    Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrentBrand } from "@/hooks/useCurrentBrand"
import { createClient } from "@/lib/supabase/client"

const tabs = [
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'security', label: 'Sécurité', icon: Shield },
]

// T5: Unified input class constant
const INPUT_CLASS = 'w-full bg-[#F4F4F3] border border-[#E2E2E1] rounded-lg px-4 py-3 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/15 focus:border-[#1A1A1A]/50'

export default function BrandSettingsPage() {
    const { user } = useAuth()
    const { brandId } = useCurrentBrand()
    const [activeTab, setActiveTab] = useState('company')
    const [isLoading, setIsLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Company state — loaded from DB
    const [company, setCompany] = useState({
        company_name: '',
        website: '',
        description: '',
        industry: '',
        company_size: '',
        address: '',
    })

    // Notifications state — loaded from DB
    const [notifications, setNotifications] = useState({
        emailNewApplicant: true,
        emailMessages: true,
        emailCampaignEnd: true,
        emailInvoice: true,
        emailMarketing: false,
    })

    // B1: Load real data from Supabase
    const loadProfile = useCallback(async () => {
        if (!brandId) return
        setIsLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('profiles_brand')
            .select('*')
            .eq('user_id', brandId)
            .single()

        if (data) {
            setCompany({
                company_name: (data as any).company_name || '',
                website: (data as any).website || '',
                description: (data as any).description || '',
                industry: (data as any).industry || '',
                company_size: (data as any).company_size || '',
                address: (data as any).address || '',
            })
            // B10: Load notification prefs
            if ((data as any).notification_prefs) {
                setNotifications((data as any).notification_prefs)
            }
        }
        setIsLoading(false)
    }, [brandId])

    useEffect(() => { loadProfile() }, [loadProfile])

    // B1: Save company changes to Supabase
    const handleSaveCompany = async () => {
        if (!user) return
        setSaving(true)
        const supabase = createClient()
        await (supabase as any).from('profiles_brand')
            .update({
                company_name: company.company_name,
                website: company.website || null,
                description: company.description || null,
                industry: company.industry || null,
                company_size: company.company_size || null,
                address: company.address || null,
            })
            .eq('user_id', brandId)
        setSaving(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
    }

    // B10: Save notification preferences to Supabase
    const handleToggleNotification = async (key: string, checked: boolean) => {
        const updated = { ...notifications, [key]: checked }
        setNotifications(updated)
        if (!user) return
        const supabase = createClient()
        await (supabase as any).from('profiles_brand')
            .update({ notification_prefs: updated })
            .eq('user_id', brandId)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'company':
                return (
                    <div className="space-y-8">
                        {/* Form Fields — T5: all using INPUT_CLASS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Nom de l&apos;entreprise</label>
                                <input
                                    type="text"
                                    value={company.company_name}
                                    onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Site web</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" strokeWidth={1.5} />
                                    <input
                                        type="url"
                                        value={company.website}
                                        onChange={(e) => setCompany({ ...company, website: e.target.value })}
                                        placeholder="https://..."
                                        className={`${INPUT_CLASS} pl-11`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-[#6B6B6B] mb-2">Description</label>
                            <textarea
                                value={company.description}
                                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                rows={4}
                                placeholder="Décrivez votre entreprise..."
                                className={`${INPUT_CLASS} resize-none`}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Secteur</label>
                                <input
                                    type="text"
                                    value={company.industry}
                                    onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                                    placeholder="Ex: Horlogerie"
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Taille</label>
                                <input
                                    type="text"
                                    value={company.company_size}
                                    onChange={(e) => setCompany({ ...company, company_size: e.target.value })}
                                    placeholder="Ex: 50-200 employés"
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#6B6B6B] mb-2">Adresse</label>
                                <input
                                    type="text"
                                    value={company.address}
                                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                    placeholder="Genève, Suisse"
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleSaveCompany}
                                disabled={saving}
                                className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full px-6"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Enregistrer les modifications
                            </Button>
                            {saveSuccess && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm text-[#1A1A1A] font-medium flex items-center gap-1"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Sauvegardé
                                </motion.span>
                            )}
                        </div>
                    </div>
                )

            case 'notifications':
                return (
                    <div className="space-y-8">
                        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Notifications par email</h3>
                        <div className="space-y-4">
                            {[
                                { key: 'emailNewApplicant', label: 'Propositions de créateurs', desc: 'Recevez un email quand un créateur est proposé pour une mission' },
                                { key: 'emailMessages', label: 'Messages', desc: 'Recevez un email pour chaque nouveau message' },
                                { key: 'emailCampaignEnd', label: 'Fin de campagne', desc: 'Rappel avant la fin d\'une campagne' },
                                { key: 'emailInvoice', label: 'Factures', desc: 'Notifications de facturation' },
                                { key: 'emailMarketing', label: 'Actualités', desc: 'Nouveautés et conseils marketing' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-[#F4F4F3] rounded-lg">
                                    <div>
                                        <p className="text-[#1A1A1A] font-medium">{item.label}</p>
                                        <p className="text-sm text-[#9B9B9B]">{item.desc}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[item.key as keyof typeof notifications] ?? false}
                                        onCheckedChange={(checked) => handleToggleNotification(item.key, checked)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 'billing':
                return (
                    <div className="space-y-8">
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-amber-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-900">Facturation à venir</p>
                                    <p className="text-xs text-amber-700">Les options de facturation seront bientôt disponibles. Contactez MOSH pour toute question.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 'security':
                return (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Mot de passe</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">Mot de passe actuel</label>
                                    <input type="password" placeholder="••••••••" className={INPUT_CLASS} />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B6B6B] mb-2">Nouveau mot de passe</label>
                                    <input type="password" placeholder="••••••••" className={INPUT_CLASS} />
                                </div>
                                <Button className="bg-[#1A1A1A] hover:bg-[#333333] text-white rounded-full px-6">
                                    Changer le mot de passe
                                </Button>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1A1A1A] tracking-[-0.02em]">Paramètres</h1>
                <p className="text-[#6B6B6B] mt-1">Gérez votre entreprise et préférences</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Sidebar Tabs */}
                <div className="flex md:flex-col md:w-60 md:flex-shrink-0 gap-1 overflow-x-auto pb-2 md:pb-0 md:space-y-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-lg text-left transition-all whitespace-nowrap flex-shrink-0 md:w-full ${activeTab === tab.id
                                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F3]'
                                    }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="font-medium text-sm md:text-base">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <ChevronRight className="w-4 h-4 ml-auto hidden md:block" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 bg-white border border-[#E2E2E1] rounded-xl p-4 md:p-8"
                >
                    {renderTabContent()}
                </motion.div>
            </div>
        </div>
    )
}
