'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const FILTER_CATEGORIES = [
    { id: 'all', label: 'Tous' },
    { id: 'testimonial', label: 'Témoignage' },
    { id: 'unboxing', label: 'Unboxing' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'asmr', label: 'ASMR' },
    { id: 'tutorial', label: 'Tutoriel' },
]

const CANTONS = [
    { id: 'all', label: 'Tous les cantons' },
    { id: 'GE', label: 'Genève' },
    { id: 'VD', label: 'Vaud' },
    { id: 'VS', label: 'Valais' },
    { id: 'FR', label: 'Fribourg' },
    { id: 'NE', label: 'Neuchâtel' },
]

interface CreatorFiltersProps {
    onFilterChange?: (filters: { category: string; canton: string }) => void
}

export function CreatorFilters({ onFilterChange }: CreatorFiltersProps) {
    const [activeCategory, setActiveCategory] = useState('all')
    const [activeCanton, setActiveCanton] = useState('all')

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId)
        onFilterChange?.({ category: categoryId, canton: activeCanton })
    }

    const handleCantonChange = (cantonId: string) => {
        setActiveCanton(cantonId)
        onFilterChange?.({ category: activeCategory, canton: cantonId })
    }

    return (
        <div className="sticky top-0 z-40 py-4 bg-background/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Category Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {FILTER_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryChange(category.id)}
                                className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${activeCategory === category.id
                                        ? 'text-white'
                                        : 'text-white/60 hover:text-white/80'
                                    }`}
                            >
                                {activeCategory === category.id && (
                                    <motion.div
                                        layoutId="activeCategory"
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{category.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-6 bg-white/10" />

                    {/* Canton Dropdown */}
                    <div className="relative">
                        <select
                            value={activeCanton}
                            onChange={(e) => handleCantonChange(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 rounded-full px-4 py-2 pr-10 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
                        >
                            {CANTONS.map((canton) => (
                                <option key={canton.id} value={canton.id} className="bg-[#1A1A1A]">
                                    {canton.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
