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
import { resolveCreatorFee, FEE_UNKNOWN_LABEL } from "@/lib/creator/fee"

interface Transaction {
    id: string
    type: 'payment' | 'withdrawal'
    description: string
    brand: string
    /** null when MOSH has not set the creator's fee yet — never the client budget. */
    amount: number | null
    status: string
    date: string
}

const statusConfig: Record<string, { label: string; class: string }> = {
    completed: { label: "Payé", class: "bg-[#EDEDEC] text-[#1A1A1A] border-[#1A1A1A]/30" },
    pending: { label: "En attente", class: "bg-[#8A6100]/20 text-[#8A6100] border-[#F0E0BC]/30" },
    failed: { label: "Échoué", class: "bg-[#1A1A1A]/20 text-[#C0392B] border-[#F2CFCB]/30" },
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

            // Videos assigned to this creator, whichever way the mission was
            // built: multi-video missions assign per content, so a query on
            // selected_creator_id alone silently omits that whole income.
            const { data: myContents } = await (supabase as any)
                .from('campaign_contents')
                .select('campaign_id, creator_amount_chf')
                .eq('assigned_creator_id', userId!)

            const contentsByCampaign = new Map<string, (number | null)[]>()
            for (const row of (myContents || []) as any[]) {
                const list = contentsByCampaign.get(row.campaign_id) || []
                list.push(row.creator_amount_chf)
                contentsByCampaign.set(row.campaign_id, list)
            }

            const { data: direct, error } = await supabase
                .from('campaigns')
                .select(`
                    id,
                    title,
                    status,
                    creator_amount_chf,
                    created_at,
                    brand:users!campaigns_brand_id_fkey (
                        full_name
                    )
                `)
                .eq('selected_creator_id', userId!)
                .order('created_at', { ascending: false })

            const directIds = new Set(((direct || []) as any[]).map(c => c.id))
            const missingIds = [...contentsByCampaign.keys()].filter(id => !directIds.has(id))

            let viaContents: any[] = []
            if (missingIds.length > 0) {
                const { data } = await (supabase as any)
                    .from('campaigns')
                    .select(`
                        id,
                        title,
                        status,
                        creator_amount_chf,
                        created_at,
                        brand:users!campaigns_brand_id_fkey (
                            full_name
                        )
                    `)
                    .in('id', missingIds)
                    .order('created_at', { ascending: false })
                viaContents = data || []
            }

            if (error && error.message) {
                console.error('Error fetching earnings:', error.message)
            } else {
                const campaigns = [...((direct || []) as any[]), ...viaContents]
                const txs: Transaction[] = campaigns.map((camp: any) => ({
                    id: camp.id,
                    type: 'payment' as const,
                    description: `Mission: ${camp.title || 'Sans titre'}`,
                    brand: camp.brand?.full_name || 'Marque',
                    // The creator's fee, never budget_chf — that is the client price.
                    amount: resolveCreatorFee({
                        campaignAmount: camp.creator_amount_chf,
                        contentAmounts: contentsByCampaign.get(camp.id),
                    }),
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
        .reduce((acc, t) => acc + (t.amount ?? 0), 0)

    const pendingAmount = transactions
        .filter(t => t.status === 'pending')
        .reduce((acc, t) => acc + (t.amount ?? 0), 0)

    if (!mounted || (!user && isLoading)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#9B9B9B]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[28px] md:text-[34px] font-semibold text-[#1A1A1A] tracking-[-0.02em]">Revenus</h1>
                    <p className="text-[#6B6B6B] mt-1">Suivez vos gains et paiements</p>
                </div>
                <Button variant="outline" className="border-[#E2E2E1] text-[#9B9B9B] rounded-full cursor-not-allowed opacity-50" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter (bientôt)
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#E2E2E1] rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#EDEDEC] flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                        </div>
                        <span className="text-[#1A1A1A] text-xs font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Total
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{formatCHF(totalEarned)}</p>
                    <p className="text-xs text-[#9B9B9B] mt-1">Revenus totaux</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white border border-[#E2E2E1] rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#8A6100]/15 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-[#8A6100]" strokeWidth={1.5} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{formatCHF(pendingAmount)}</p>
                    <p className="text-xs text-[#9B9B9B] mt-1">En attente</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-[#E2E2E1] rounded-xl p-5"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#EDEDEC] flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{transactions.length}</p>
                    <p className="text-xs text-[#9B9B9B] mt-1">Transactions</p>
                </motion.div>
            </div>

            {/* Payment Method */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white border border-[#E2E2E1] rounded-xl p-6"
            >
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Méthode de paiement</h2>

                <div className="space-y-4">
                    <div className="bg-[#F4F4F3] rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-[#6B6B6B]" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[#1A1A1A]">Virement bancaire</p>
                                <p className="text-xs text-[#9B9B9B]">Non configuré</p>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full border-[#E2E2E1] text-[#9B9B9B] rounded-full cursor-not-allowed opacity-50" disabled>
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
                className="bg-white border border-[#E2E2E1] rounded-xl overflow-hidden"
            >
                <div className="p-6 border-b border-[#F2F2F1]">
                    <h2 className="text-lg font-semibold text-[#1A1A1A]">Historique des transactions</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="p-12 text-center text-[#9B9B9B]">
                        <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune transaction pour le moment</p>
                        <p className="text-sm mt-2">Complétez des missions pour gagner de l'argent</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#F2F2F1]">
                        {transactions.map((tx, index) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 + index * 0.03 }}
                                className="flex items-center justify-between p-5 hover:bg-[#F4F4F3]/40 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'payment' ? 'bg-[#E8F3EA]' : 'bg-[#F4F4F3]'
                                        }`}>
                                        {tx.type === 'payment' ? (
                                            <ArrowDownRight className="w-5 h-5 text-[#1A1A1A]" />
                                        ) : (
                                            <ArrowUpRight className="w-5 h-5 text-[#1A1A1A]" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#1A1A1A]">{tx.description}</p>
                                        <p className="text-xs text-[#9B9B9B]">{tx.brand}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span className="text-xs text-[#9B9B9B]">{tx.date}</span>
                                    <Badge className={`${statusConfig[tx.status].class} border`}>
                                        {statusConfig[tx.status].label}
                                    </Badge>
                                    {tx.amount === null ? (
                                        <span className="text-sm text-[#9B9B9B]">{FEE_UNKNOWN_LABEL}</span>
                                    ) : (
                                        <span className={`text-lg font-semibold tabular-nums ${tx.amount >= 0 ? 'text-[#1A1A1A]' : 'text-[#C0392B]'
                                            }`}>
                                            {tx.amount >= 0 ? '+' : ''}{formatCHF(tx.amount)}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
