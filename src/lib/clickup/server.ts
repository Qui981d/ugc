// NOTE: server-only module — imported exclusively by /api/clickup route handlers.
// Reads CLICKUP_API_TOKEN from the server environment; never import from a client component.
import { CLICKUP_SUBTASKS } from './mapping'

// ============================================================
// ClickUp REST API helper (server-only — uses the secret token)
// ============================================================

const BASE = 'https://api.clickup.com/api/v2'
// Default = the "Clients" space in the MOSH workspace; override via env if needed.
const CLIENTS_SPACE_ID = process.env.CLICKUP_CLIENTS_SPACE_ID || '90155355724'
// Done status name in the client lists (seen in ClickUp: "complete").
const DONE_STATUS = process.env.CLICKUP_DONE_STATUS || 'complete'

export function clickupConfigured(): boolean {
    return !!process.env.CLICKUP_API_TOKEN
}

async function cu(path: string, init?: RequestInit): Promise<any> {
    const token = process.env.CLICKUP_API_TOKEN
    if (!token) throw new Error('CLICKUP_API_TOKEN manquant (variable d\'environnement)')
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        cache: 'no-store',
    })
    if (!res.ok) {
        const body = await res.text()
        throw new Error(`ClickUp ${res.status}: ${body}`)
    }
    return res.json()
}

export interface ClientListGroup {
    folder: string
    lists: { id: string; name: string }[]
}

/** Client folders + their lists (for the mission-form dropdown). */
export async function getClientLists(): Promise<ClientListGroup[]> {
    const [foldersRes, listsRes] = await Promise.all([
        cu(`/space/${CLIENTS_SPACE_ID}/folder?archived=false`),
        cu(`/space/${CLIENTS_SPACE_ID}/list?archived=false`), // folderless lists
    ])

    const groups: ClientListGroup[] = (foldersRes.folders || []).map((f: any) => ({
        folder: f.name,
        lists: (f.lists || []).map((l: any) => ({ id: l.id, name: l.name })),
    })).filter((g: ClientListGroup) => g.lists.length > 0)

    const folderless = (listsRes.lists || []).map((l: any) => ({ id: l.id, name: l.name }))
    if (folderless.length > 0) groups.push({ folder: 'Sans dossier', lists: folderless })

    return groups
}

/** Create a mission card + its subtasks in a client list. */
export async function createMissionCard(
    listId: string,
    name: string,
    description: string
): Promise<{ taskId: string; url: string; subtaskMap: Record<string, string> }> {
    const parent = await cu(`/list/${listId}/task`, {
        method: 'POST',
        body: JSON.stringify({ name, description }),
    })

    const subtaskMap: Record<string, string> = {}
    for (const sub of CLICKUP_SUBTASKS) {
        const st = await cu(`/list/${listId}/task`, {
            method: 'POST',
            body: JSON.stringify({ name: `${sub} — ${name}`, parent: parent.id }),
        })
        subtaskMap[sub] = st.id
    }

    return { taskId: parent.id, url: parent.url, subtaskMap }
}

/**
 * Rewrite a task's description (parent card or subtask).
 * The description is replaced, never appended to, so a card can never hold two
 * versions of the same script.
 */
export async function updateTaskDescription(taskId: string, description: string): Promise<void> {
    await cu(`/task/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ description }),
    })
}

/** Mark a task (or subtask) as done. */
export async function completeTask(taskId: string): Promise<void> {
    await cu(`/task/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: DONE_STATUS }),
    })
}
