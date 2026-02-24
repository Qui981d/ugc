'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2 } from 'lucide-react'
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
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#18181B] tracking-tight">Marques clientes</h1>
                <p className="text-[#71717A] mt-1">{brands.length} marque{brands.length > 1 ? 's' : ''} inscrite{brands.length > 1 ? 's' : ''}</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A099]" strokeWidth={1.5} />
                <input
                    type="text"
                    placeholder="Rechercher par nom, entreprise, industrie..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#D9D7D0]/50 border border-[#C8C6BF]/40 rounded-2xl text-sm text-[#18181B] placeholder:text-[#A1A099] focus:outline-none focus:ring-2 focus:ring-[#C4F042]/40 focus:border-[#C4F042]/60 focus:bg-white/60 transition-all"
                />
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-8 animate-pulse space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-[#F4F3EF] rounded-xl" />
                    ))}
                </div>
            ) : filteredBrands.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] p-12 text-center">
                    <p className="text-[#71717A] font-medium">Aucune marque trouvée</p>
                    <p className="text-[#A1A1AA] text-sm mt-1">Essayez un autre terme de recherche</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm rounded-[24px] border border-black/[0.03] overflow-hidden"
                >
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-black/[0.04]">
                                <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Marque</th>
                                <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Industrie</th>
                                <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Contact</th>
                                <th className="text-left text-xs text-[#A1A1AA] font-medium px-6 py-4">Inscription</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBrands.map((brand, i) => (
                                <motion.tr
                                    key={brand.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-black/[0.03] last:border-0 hover:bg-[#F4F3EF]/50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl border border-black/[0.06] flex items-center justify-center text-[#71717A]">
                                                <Building2 className="w-4 h-4" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-[#18181B] font-medium text-sm">{brand.profiles_brand?.company_name || brand.full_name}</p>
                                                {brand.profiles_brand?.company_name && (
                                                    <p className="text-[#A1A1AA] text-xs">{brand.full_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#71717A]">
                                        {brand.profiles_brand?.industry ? (
                                            <span className="px-2.5 py-1 bg-[#F4F3EF] rounded-full text-xs font-medium text-[#18181B]">
                                                {brand.profiles_brand.industry}
                                            </span>
                                        ) : (
                                            <span className="text-[#A1A1AA]">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#71717A]">
                                        {brand.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#A1A1AA]">
                                        {new Date(brand.created_at).toLocaleDateString('fr-CH')}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    )
}
