import { NextResponse } from 'next/server'
import { getClientLists, clickupConfigured } from '@/lib/clickup/server'

export const runtime = 'nodejs'

export async function GET() {
    if (!clickupConfigured()) {
        return NextResponse.json({ groups: [], configured: false })
    }
    try {
        const groups = await getClientLists()
        return NextResponse.json({ groups, configured: true })
    } catch (e: any) {
        console.error('[ClickUp] lists error:', e?.message)
        return NextResponse.json({ groups: [], configured: true, error: 'Impossible de charger les clients ClickUp' }, { status: 502 })
    }
}
