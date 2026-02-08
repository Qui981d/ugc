'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import MessagesPage from "@/components/messages/MessagesPage"

function MessagesContent() {
    const searchParams = useSearchParams()
    const campaignId = searchParams.get('campaign') || undefined

    return <MessagesPage userRole="creator" initialCampaignId={campaignId} />
}

export default function CreatorMessagesPage() {
    return (
        <Suspense fallback={null}>
            <MessagesContent />
        </Suspense>
    )
}
