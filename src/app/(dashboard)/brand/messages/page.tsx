'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import MessagesPage from "@/components/messages/MessagesPage"
import { Loader2 } from 'lucide-react'

function BrandMessagesContent() {
    const searchParams = useSearchParams()
    const campaignId = searchParams.get('campaign')
    const creatorId = searchParams.get('creator')

    return <MessagesPage userRole="brand" initialCampaignId={campaignId || undefined} initialCreatorId={creatorId || undefined} />
}

export default function BrandMessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>}>
            <BrandMessagesContent />
        </Suspense>
    )
}
