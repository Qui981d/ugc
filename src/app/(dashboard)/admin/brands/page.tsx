'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2, Megaphone } from 'lucide-react'
import { getAllBrands, type BrandWithProfile } from '@/lib/services/adminService'

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<BrandWithProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        async function load() {
            const data = await getAllBrands()
            setBrands(data)
            setIsLoading(false)
        }
        load()
    }, [])

    const filteredBrands = brands.filter(b =>
        !searchQuery ||
        b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.profiles_brand?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.profiles_brand?.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Marques clientes</h1>
                <p className="text-white/50 mt-1">{brands.length} marque{brands.length > 1 ? 's' : ''} inscrite{brands.length > 1 ? 's' : ''}</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                    type="text"
                    placeholder="Rechercher par nom, entreprise, industrie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
                />
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-12 text-white/40">Chargement...</div>
            ) : filteredBrands.length === 0 ? (
                <div className="text-center py-12 text-white/40">Aucune marque trouvée</div>
            ) : (
                <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Marque</th>
                                <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Industrie</th>
                                <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Contact</th>
                                <th className="text-left text-xs text-white/40 font-medium px-5 py-3">Inscription</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBrands.map((brand, i) => (
                                <motion.tr
                                    key={brand.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{brand.profiles_brand?.company_name || brand.full_name}</p>
                                                {brand.profiles_brand?.company_name && (
                                                    <p className="text-white/40 text-xs">{brand.full_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-white/60">
                                        {brand.profiles_brand?.industry || '—'}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-white/60">
                                        {brand.email}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-white/40">
                                        {new Date(brand.created_at).toLocaleDateString('fr-CH')}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
