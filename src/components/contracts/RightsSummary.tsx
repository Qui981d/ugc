'use client'

import { Check, Plus, Minus } from 'lucide-react'
import { summarizeRights, type MissionRights } from '@/lib/contracts/rights'

interface RightsSummaryProps {
    rights: MissionRights
    className?: string
}

/**
 * The creator-facing reading of the mission rights.
 *
 * Excluded lines stay on screen: "we are not asking for your account" is
 * reassuring information, and silence on the point is not.
 */
export default function RightsSummary({ rights, className = '' }: RightsSummaryProps) {
    const lines = summarizeRights(rights)

    return (
        <div className={`bg-white border border-[#E2E2E1] rounded-xl p-4 ${className}`}>
            <p className="text-[11px] uppercase tracking-wider text-[#9B9B9B]">Droits</p>
            <p className="text-[13px] text-[#1A1A1A] mt-1">
                Ce que la marque pourra faire de ta vidéo.
            </p>

            <div className="mt-3 divide-y divide-[#E2E2E1]">
                {lines.map(line => (
                    <div
                        key={line.label}
                        className="flex items-start justify-between gap-4 py-2.5"
                    >
                        <div className="flex items-start gap-2 min-w-0">
                            {line.tone === 'included' && (
                                <Check className="w-3.5 h-3.5 text-[#1A7F37] flex-shrink-0 mt-0.5" />
                            )}
                            {line.tone === 'extra' && (
                                <Plus className="w-3.5 h-3.5 text-[#8A6100] flex-shrink-0 mt-0.5" />
                            )}
                            {line.tone === 'excluded' && (
                                <Minus className="w-3.5 h-3.5 text-[#9B9B9B] flex-shrink-0 mt-0.5" />
                            )}
                            <span
                                className={`text-[13px] ${line.tone === 'excluded' ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'
                                    }`}
                            >
                                {line.label}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 text-right">
                            <span
                                className={`text-[13px] ${line.tone === 'excluded' ? 'text-[#9B9B9B]' : 'text-[#1A1A1A]'
                                    }`}
                            >
                                {line.value}
                            </span>
                            {line.tone === 'included' && (
                                <span className="text-[11px] uppercase tracking-wider bg-[#E8F3EA] text-[#1A7F37] px-2 py-0.5 rounded-full">
                                    Inclus
                                </span>
                            )}
                            {line.tone === 'extra' && (
                                <span className="text-[11px] uppercase tracking-wider bg-[#FBF3E2] text-[#8A6100] px-2 py-0.5 rounded-full">
                                    Option payée
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
