'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Wallet,
    TrendingUp,
    Clock,
    Calendar,
    Download,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Building2,
    Loader2,
    ChevronRight
} from "lucide-react"
import { formatCHF } from "@/lib/validations/swiss"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"

interface Transaction {
    id: string
    type: 'payment' | 'withdrawal'
    description: string
    brand: string
    amount: number
    status: string
    date: string
}

const statusConfig: Record<string, { label: string; class: string }> = {
    completed: { label: "Payé", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    pending: { label: "En attente", class: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    failed: { label: "Échoué", class: "bg-red-500/20 text-red-400 border-red-500/30" },
}

export default function CreatorEarningsPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)

    useEffect(() => {
        // Don't do anything while auth is loading
        if (!userId) return

        // No user = nothing to load
        if (!user) return

        async function fetchEarnings() {
            setIsDataLoading(true)
            const supabase = createClient()

            // Fetch completed applications as transactions
            const { data, error } = await supabase
                .from('applications')
                .select(`
                    id,
                    status,
                    created_at,
                    campaign:campaigns (
                        title,
                        budget_chf,
                        brand:users!campaigns_brand_id_fkey (
                            full_name
                        )
                    )
                `)
                .eq('creator_id', userId!)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false })

            if (error && error.message) {
                console.error('Error fetching earnings:', error.message)
            } else {
                // Transform to transactions format
                const txs: Transaction[] = (data || []).map((app: any) => ({
                    id: app.id,
                    type: 'payment' as const,
                    description: `Mission: ${app.campaign?.title || 'Sans titre'}`,
                    brand: app.campaign?.brand?.full_name || 'Marque',
                    amount: app.campaign?.budget_chf || 0,
                    status: app.status === 'completed' ? 'completed' : 'pending',
                    date: new Date(app.created_at).toLocaleDateString('fr-CH')
                }))
                setTransactions(txs)
            }
            setIsDataLoading(false)
        }

        fetchEarnings()
    }, [userId])

    const totalEarned = transactions
        .filter(t => t.status === 'completed')
        .reduce((acc, t) => acc + t.amount, 0)

    const pendingAmount = transactions
        .filter(t => t.status === 'pending')
        .reduce((acc, t) => acc + t.amount, 0)

    if (!user && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Revenus</h1>
                    <p className="text-white/60 mt-1">Suivez vos gains et paiements</p>
                </div>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Total
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCHF(totalEarned)}</p>
                    <p className="text-xs text-white/40 mt-1">Revenus totaux</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatCHF(pendingAmount)}</p>
                    <p className="text-xs text-white/40 mt-1">En attente</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{transactions.length}</p>
                    <p className="text-xs text-white/40 mt-1">Transactions</p>
                </motion.div>
            </div>

            {/* Payment Method */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-6"
            >
                <h2 className="text-lg font-semibold text-white mb-4">Méthode de paiement</h2>

                <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white/70" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Virement bancaire</p>
                                <p className="text-xs text-white/40">Non configuré</p>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Configurer IBAN
                    </Button>
                </div>
            </motion.div>

            {/* Transactions Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Historique des transactions</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="p-12 text-center text-white/40">
                        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune transaction pour le moment</p>
                        <p className="text-sm mt-2">Complétez des missions pour gagner de l'argent</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.06]">
                        {transactions.map((tx, index) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 + index * 0.03 }}
                                className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'payment' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                                        }`}>
                                        {tx.type === 'payment' ? (
                                            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                            <ArrowUpRight className="w-5 h-5 text-blue-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{tx.description}</p>
                                        <p className="text-xs text-white/40">{tx.brand}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span className="text-xs text-white/40">{tx.date}</span>
                                    <Badge className={`${statusConfig[tx.status].class} border`}>
                                        {statusConfig[tx.status].label}
                                    </Badge>
                                    <span className={`text-lg font-semibold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-white'
                                        }`}>
                                        {tx.amount >= 0 ? '+' : ''}{formatCHF(tx.amount)}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
