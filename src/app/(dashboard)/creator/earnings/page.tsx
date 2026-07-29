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
    completed: { label: "Payé", class: "bg-[#E7F0FF] text-[#1C1E21] border-[#0866FF]/30" },
    pending: { label: "En attente", class: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
    failed: { label: "Échoué", class: "bg-red-500/20 text-red-700 border-red-500/30" },
}

export default function CreatorEarningsPage() {
    const { user, isLoading } = useAuth()
    const userId = user?.id
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isDataLoading, setIsDataLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    useEffect(() => {
        // Don't do anything while auth is loading
        if (!userId) return

        // No user = nothing to load
        if (!user) return

        async function fetchEarnings() {
            setIsDataLoading(true)
            const supabase = createClient()

            // Fetch campaigns assigned to this creator as transactions
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
                    id,
                    title,
                    status,
                    budget_chf,
                    created_at,
                    brand:users!campaigns_brand_id_fkey (
                        full_name
                    )
                `)
                .eq('selected_creator_id', userId!)
                .order('created_at', { ascending: false })

            if (error && error.message) {
                console.error('Error fetching earnings:', error.message)
            } else {
                // Transform to transactions format
                const txs: Transaction[] = (data || []).map((camp: any) => ({
                    id: camp.id,
                    type: 'payment' as const,
                    description: `Mission: ${camp.title || 'Sans titre'}`,
                    brand: camp.brand?.full_name || 'Marque',
                    amount: camp.budget_chf || 0,
                    status: camp.status === 'completed' ? 'completed' : 'pending',
                    date: new Date(camp.created_at).toLocaleDateString('fr-CH')
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

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#8A8D91]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1C1E21] tracking-[-0.02em]">Revenus</h1>
                    <p className="text-[#65676B] mt-1">Suivez vos gains et paiements</p>
                </div>
                <Button variant="outline" className="border-[#DADDE1] text-[#8A8D91] rounded-full cursor-not-allowed opacity-50" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter (bientôt)
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#DADDE1] rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E7F0FF] flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#1C1E21]" strokeWidth={1.5} />
                        </div>
                        <span className="text-[#1C1E21] text-xs font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Total
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">{formatCHF(totalEarned)}</p>
                    <p className="text-xs text-[#8A8D91] mt-1">Revenus totaux</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white border border-[#DADDE1] rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-700" strokeWidth={1.5} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">{formatCHF(pendingAmount)}</p>
                    <p className="text-xs text-[#8A8D91] mt-1">En attente</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-[#DADDE1] rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#E7F0FF] flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-[#1C1E21]" strokeWidth={1.5} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#1C1E21]">{transactions.length}</p>
                    <p className="text-xs text-[#8A8D91] mt-1">Transactions</p>
                </motion.div>
            </div>

            {/* Payment Method */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white border border-[#DADDE1] rounded-xl p-6"
            >
                <h2 className="text-lg font-semibold text-[#1C1E21] mb-4">Méthode de paiement</h2>

                <div className="space-y-4">
                    <div className="bg-[#F0F2F5] rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#65676B]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[#1C1E21]">Virement bancaire</p>
                                <p className="text-xs text-[#8A8D91]">Non configuré</p>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full border-[#DADDE1] text-[#8A8D91] rounded-full cursor-not-allowed opacity-50" disabled>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Configurer IBAN (bientôt)
                    </Button>
                </div>
            </motion.div>

            {/* Transactions Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-[#DADDE1] rounded-xl overflow-hidden"
            >
                <div className="p-6 border-b border-[#EBEDF0]">
                    <h2 className="text-lg font-semibold text-[#1C1E21]">Historique des transactions</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="p-12 text-center text-[#8A8D91]">
                        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune transaction pour le moment</p>
                        <p className="text-sm mt-2">Complétez des missions pour gagner de l'argent</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#EBEDF0]">
                        {transactions.map((tx, index) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 + index * 0.03 }}
                                className="flex items-center justify-between p-5 hover:bg-[#F0F2F5]/40 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'payment' ? 'bg-[#E7F0FF]' : 'bg-[#E7F0FF]'
                                        }`}>
                                        {tx.type === 'payment' ? (
                                            <ArrowDownRight className="w-5 h-5 text-[#1C1E21]" />
                                        ) : (
                                            <ArrowUpRight className="w-5 h-5 text-[#1C1E21]" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#1C1E21]">{tx.description}</p>
                                        <p className="text-xs text-[#8A8D91]">{tx.brand}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span className="text-xs text-[#8A8D91]">{tx.date}</span>
                                    <Badge className={`${statusConfig[tx.status].class} border`}>
                                        {statusConfig[tx.status].label}
                                    </Badge>
                                    <span className={`text-lg font-semibold ${tx.amount >= 0 ? 'text-[#1C1E21]' : 'text-[#1C1E21]'
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
