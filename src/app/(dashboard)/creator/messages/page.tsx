'use client'

import { Suspense } from 'react'
import MissionWorkflowPanel from "@/components/missions/MissionWorkflowPanel"
import { Loader2 } from 'lucide-react'

export default function CreatorMessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[#6B6B6B]" /></div>}>
            <MissionWorkflowPanel userRole="creator" />
        </Suspense>
    )
}
