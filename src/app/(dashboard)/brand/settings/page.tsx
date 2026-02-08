'use client'

import { useState } from 'react'
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
    Mail
} from "lucide-react"
import Image from "next/image"

const tabs = [
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'team', label: 'Équipe', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
]

const MOCK_TEAM = [
    { id: '1', name: 'Jean Martin', email: 'jean.martin@company.ch', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    { id: '2', name: 'Sophie Dubois', email: 'sophie.dubois@company.ch', role: 'Éditeur', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: '3', name: 'Pierre Favre', email: 'pierre.favre@company.ch', role: 'Viewer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
]

export default function BrandSettingsPage() {
    const [activeTab, setActiveTab] = useState('company')

    // Company state
    const [company, setCompany] = useState({
        name: 'Swiss Brand SA',
        website: 'https://swissbrand.ch',
        description: 'Entreprise leader dans le secteur horloger suisse depuis 1985. Nous créons des montres de qualité alliant tradition et innovation.',
        industry: 'Horlogerie',
        size: '50-200 employés',
        location: 'Genève, Suisse'
    })

    // Notifications state
    const [notifications, setNotifications] = useState({
        emailNewApplicant: true,
        emailMessages: true,
        emailCampaignEnd: true,
        emailInvoice: true,
        emailMarketing: false,
    })

    const renderTabContent = () => {
        switch (activeTab) {
            case 'company':
                return (
                    <div className="space-y-8">
                        {/* Logo */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center">
                                    <Image
                                        src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop"
                                        alt="Company Logo"
                                        width={96}
                                        height={96}
                                        className="object-cover"
                                    />
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                                <p className="text-sm text-white/50">Compte vérifié</p>
                                <Button variant="outline" size="sm" className="mt-2 border-white/20 text-white hover:bg-white/10">
                                    Changer le logo
                                </Button>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-white/60 mb-2">Nom de l'entreprise</label>
                                <input
                                    type="text"
                                    value={company.name}
                                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-2">Site web</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="url"
                                        value={company.website}
                                        onChange={(e) => setCompany({ ...company, website: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-white/60 mb-2">Description</label>
                            <textarea
                                value={company.description}
                                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm text-white/60 mb-2">Secteur</label>
                                <input
                                    type="text"
                                    value={company.industry}
                                    onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-2">Taille</label>
                                <input
                                    type="text"
                                    value={company.size}
                                    onChange={(e) => setCompany({ ...company, size: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-2">Localisation</label>
                                <input
                                    type="text"
                                    value={company.location}
                                    onChange={(e) => setCompany({ ...company, location: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                />
                            </div>
                        </div>

                        <Button className="btn-primary">
                            <Save className="w-4 h-4 mr-2" />
                            Enregistrer les modifications
                        </Button>
                    </div>
                )

            case 'billing':
                return (
                    <div className="space-y-8">
                        {/* Current Plan */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Plan actuel</h3>
                            <div className="p-6 bg-gradient-to-br from-accent/20 to-purple-500/10 border border-accent/30 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Badge className="bg-accent text-white border-0 mb-2">Pro</Badge>
                                        <p className="text-2xl font-bold text-white">CHF 199/mois</p>
                                        <p className="text-sm text-white/60 mt-1">Renouvelé le 1 Mars 2024</p>
                                    </div>
                                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                                        Changer de plan
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Billing Address */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Adresse de facturation</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">Rue</label>
                                        <input
                                            type="text"
                                            defaultValue="Rue du Rhône 45"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">NPA & Ville</label>
                                        <input
                                            type="text"
                                            defaultValue="1204 Genève"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">Pays</label>
                                        <input
                                            type="text"
                                            defaultValue="Suisse"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/60 mb-2">N° TVA (optionnel)</label>
                                        <input
                                            type="text"
                                            defaultValue="CHE-123.456.789"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-white/25"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Méthode de paiement</h3>
                            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-white/70" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Visa •••• 4242</p>
                                            <p className="text-sm text-white/40">Expire 12/25</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                                        Modifier
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Invoices */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Historique des factures</h3>
                            <div className="space-y-2">
                                {[
                                    { date: '1 Fév 2024', amount: 199, status: 'Payée' },
                                    { date: '1 Jan 2024', amount: 199, status: 'Payée' },
                                    { date: '1 Déc 2023', amount: 199, status: 'Payée' },
                                ].map((invoice, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-white font-medium">{invoice.date}</p>
                                                <p className="text-sm text-white/40">Plan Pro</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                                                {invoice.status}
                                            </Badge>
                                            <span className="text-white font-medium">CHF {invoice.amount}</span>
                                            <Button size="sm" variant="ghost" className="text-white/50 hover:text-white">
                                                Télécharger
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case 'team':
                return (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Membres de l'équipe</h3>
                                <p className="text-sm text-white/50">Gérez les accès à votre compte</p>
                            </div>
                            <Button className="btn-primary">
                                <Plus className="w-4 h-4 mr-2" />
                                Inviter un membre
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {MOCK_TEAM.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                                            <Image
                                                src={member.avatar}
                                                alt={member.name}
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{member.name}</p>
                                            <p className="text-sm text-white/40">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={`border ${member.role === 'Admin'
                                                ? 'bg-accent/20 text-accent border-accent/30'
                                                : 'bg-white/10 text-white/60 border-white/20'
                                            }`}>
                                            {member.role}
                                        </Badge>
                                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-white/5 border border-dashed border-white/20 rounded-xl text-center">
                            <Mail className="w-8 h-8 text-white/30 mx-auto mb-2" />
                            <p className="text-white/50 text-sm">Invitez des collègues par email</p>
                        </div>
                    </div>
                )

            case 'notifications':
                return (
                    <div className="space-y-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Notifications par email</h3>
                        <div className="space-y-4">
                            {[
                                { key: 'emailNewApplicant', label: 'Nouvelles candidatures', desc: 'Recevez un email quand un créateur postule à une campagne' },
                                { key: 'emailMessages', label: 'Messages', desc: 'Recevez un email pour chaque nouveau message' },
                                { key: 'emailCampaignEnd', label: 'Fin de campagne', desc: 'Rappel avant la fin d\'une campagne' },
                                { key: 'emailInvoice', label: 'Factures', desc: 'Notifications de facturation' },
                                { key: 'emailMarketing', label: 'Actualités', desc: 'Nouveautés et conseils marketing' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                    <div>
                                        <p className="text-white font-medium">{item.label}</p>
                                        <p className="text-sm text-white/40">{item.desc}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[item.key as keyof typeof notifications]}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 'security':
                return (
                    <div className="space-y-8">
                        {/* Password */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Mot de passe</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">Mot de passe actuel</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
                                    />
                                </div>
                                <Button className="btn-primary">
                                    Changer le mot de passe
                                </Button>
                            </div>
                        </div>

                        {/* 2FA */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Authentification à deux facteurs</h3>
                            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">2FA activée</p>
                                            <p className="text-sm text-white/40">Via Google Authenticator</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                        Désactiver
                                    </Button>
                                </div>
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
                <h1 className="text-3xl font-bold text-white">Paramètres</h1>
                <p className="text-white/60 mt-1">Gérez votre entreprise et préférences</p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Tabs */}
                <div className="w-60 flex-shrink-0 space-y-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <ChevronRight className="w-4 h-4 ml-auto" />
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
                    className="flex-1 bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-8"
                >
                    {renderTabContent()}
                </motion.div>
            </div>
        </div>
    )
}
