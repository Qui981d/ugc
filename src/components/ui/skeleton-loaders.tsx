'use client'

/**
 * Reusable skeleton loading components for shimmer effects
 * T-OPT1: Replace plain spinners with shimmer-pattern skeletons
 */

function SkeletonPulse({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-[#F0F2F5] rounded-lg animate-pulse ${className}`} />
    )
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-[#DADDE1] p-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F0F2F5] rounded-lg" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#F0F2F5] rounded w-1/3" />
                    <div className="h-3 bg-[#F0F2F5] rounded w-1/2" />
                </div>
            </div>
            <div className="h-3 bg-[#F0F2F5] rounded w-full" />
            <div className="h-3 bg-[#F0F2F5] rounded w-2/3" />
        </div>
    )
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3 md:gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-[#DADDE1] p-5 space-y-3 animate-pulse">
                    <div className="h-3 bg-[#F0F2F5] rounded w-20" />
                    <div className="h-7 bg-[#F0F2F5] rounded w-16" />
                    <div className="h-2 bg-[#F0F2F5] rounded w-24" />
                </div>
            ))}
        </div>
    )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-xl border border-[#DADDE1] p-6 space-y-3 animate-pulse">
            <div className="h-5 bg-[#F0F2F5] rounded w-40 mb-4" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-[#F0F2F5]/60 rounded-lg">
                    <div className="w-10 h-10 bg-[#EBEDF0] rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <div className="h-3 bg-[#EBEDF0] rounded w-1/3" />
                        <div className="h-2 bg-[#EBEDF0] rounded w-1/4" />
                    </div>
                    <div className="h-6 bg-[#EBEDF0] rounded-full w-16" />
                </div>
            ))}
        </div>
    )
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                    <div className="h-8 bg-[#F0F2F5] rounded w-64" />
                    <div className="h-4 bg-[#F0F2F5] rounded w-48" />
                </div>
                <div className="h-10 bg-[#F0F2F5] rounded-full w-36" />
            </div>
            <SkeletonStats />
            <SkeletonTable />
        </div>
    )
}

export function SkeletonDetail() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-4 bg-[#F0F2F5] rounded w-40 animate-pulse" />
            <div className="space-y-2 animate-pulse">
                <div className="h-8 bg-[#F0F2F5] rounded w-1/2" />
                <div className="h-4 bg-[#F0F2F5] rounded w-3/4" />
            </div>
            <SkeletonCard />
            <SkeletonCard />
        </div>
    )
}

export { SkeletonPulse }
