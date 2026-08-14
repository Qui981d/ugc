'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Folder, Loader2, X } from 'lucide-react'

/**
 * Browse the real kDrive tree instead of typing a path.
 *
 * Destination paths are long and full of traps — accents, capitals, `VIDEOS`
 * against `VIDÉOS`, one client folder whose name ends in a space. Typed by hand
 * they fail at export time, silently, months later. Clicking through removes
 * the whole class of mistake.
 */

interface FolderEntry {
    id: string
    name: string
    path: string | null
}

interface Crumb {
    id: string
    name: string
    /** Empty at the root: the drive itself is never a destination. */
    path: string
}

const ROOT: Crumb = { id: '1', name: 'kDrive', path: '' }

/**
 * Mirror of `yearAwarePath` in `@/lib/kdrive/server`.
 *
 * Re-implemented rather than imported: that module reads the kDrive token from
 * the server environment and must never reach a client bundle. Four lines of
 * duplication is the cheaper price.
 */
function yearAwarePath(path: string, now = new Date()): string | null {
    const year = String(now.getFullYear())
    const parts = path.split('/')
    const idx = parts.lastIndexOf(year)
    if (idx === -1) return null
    parts[idx] = '{année}'
    return parts.join('/')
}

export interface FolderPickerProps {
    open: boolean
    /** Shown as the current destination while browsing; not resolved into a location. */
    initialPath?: string
    onSelect: (path: string) => void
    onClose: () => void
}

export default function FolderPicker({ open, initialPath, onSelect, onClose }: FolderPickerProps) {
    const [trail, setTrail] = useState<Crumb[]>([ROOT])
    const [folders, setFolders] = useState<FolderEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    /** A picked path waiting on the year-placeholder decision. */
    const [pending, setPending] = useState<{ literal: string; templated: string } | null>(null)
    const [useTemplate, setUseTemplate] = useState(true)

    const current = trail[trail.length - 1]

    // Every opening starts from the root, so a previous session's location is
    // never mistaken for the current one.
    useEffect(() => {
        if (!open) return
        setTrail([ROOT])
        setPending(null)
        setUseTemplate(true)
        setError(null)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    useEffect(() => {
        if (!open) return
        let cancelled = false
        setLoading(true)
        setError(null)
            ; (async () => {
                try {
                    const res = await fetch(`/api/kdrive/browse?dir=${encodeURIComponent(current.id)}`)
                    const data = await res.json().catch(() => null)
                    if (cancelled) return
                    // The API's message is the only description of what kDrive
                    // actually refused — show it as-is rather than a summary.
                    if (!res.ok || !data || data.error) {
                        setError(data?.error || `Erreur kDrive (HTTP ${res.status})`)
                        setFolders([])
                    } else {
                        setFolders(data.folders || [])
                    }
                } catch {
                    if (!cancelled) {
                        setError("Erreur de connexion au service kDrive.")
                        setFolders([])
                    }
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [open, current.id])

    if (!open) return null

    const descend = (f: FolderEntry) => {
        setTrail(t => {
            const parent = t[t.length - 1]
            return [...t, { id: f.id, name: f.name, path: f.path || `${parent.path}/${f.name}` }]
        })
    }

    const goTo = (index: number) => setTrail(t => t.slice(0, index + 1))

    /**
     * A path pinned to a literal year would need every client's folder
     * re-picked each January, and nobody would remember. Offer the placeholder
     * the moment the year appears in the choice.
     */
    const confirmPath = (path: string) => {
        const templated = yearAwarePath(path)
        if (templated) {
            setPending({ literal: path, templated })
            setUseTemplate(true)
            return
        }
        onSelect(path)
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl border border-[#E2E2E1] shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]"
            >
                <div className="flex items-center justify-between px-5 h-12 border-b border-[#E2E2E1] shrink-0">
                    <h2 className="text-[14px] font-semibold text-[#1A1A1A]">Choisir un dossier kDrive</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-md grid place-items-center text-[#9B9B9B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {pending ? (
                    /* Year step — asked once, right after the choice, while the
                       reason is still in front of the person deciding. */
                    <>
                        <div className="px-5 py-4 space-y-3 overflow-y-auto">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                                Dossier de l&apos;année
                            </p>
                            <p className="text-[12px] text-[#6B6B6B]">
                                Ce chemin contient l&apos;année en cours. En la remplaçant par{' '}
                                <span className="font-mono text-[#1A1A1A]">{'{année}'}</span>, le dossier
                                de l&apos;année suivra automatiquement.
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setUseTemplate(true)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${useTemplate
                                        ? 'border-[#1A1A1A] bg-[#F4F4F3]'
                                        : 'border-[#E2E2E1] bg-white hover:bg-[#FAFAF9]'
                                        }`}
                                >
                                    <span className="block text-[13px] font-medium text-[#1A1A1A]">
                                        Suivre l&apos;année automatiquement
                                    </span>
                                    <span className="block text-[12px] font-mono text-[#6B6B6B] mt-0.5 break-all">
                                        {pending.templated}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setUseTemplate(false)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${!useTemplate
                                        ? 'border-[#1A1A1A] bg-[#F4F4F3]'
                                        : 'border-[#E2E2E1] bg-white hover:bg-[#FAFAF9]'
                                        }`}
                                >
                                    <span className="block text-[13px] font-medium text-[#1A1A1A]">
                                        Garder ce dossier exact
                                    </span>
                                    <span className="block text-[12px] font-mono text-[#6B6B6B] mt-0.5 break-all">
                                        {pending.literal}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="px-5 py-3 border-t border-[#E2E2E1] flex items-center justify-end gap-2 shrink-0">
                            <button
                                onClick={() => setPending(null)}
                                className="px-3 h-9 text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                            >
                                Retour
                            </button>
                            <button
                                onClick={() => {
                                    onSelect(useTemplate ? pending.templated : pending.literal)
                                    onClose()
                                }}
                                className="px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors"
                            >
                                Valider
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Breadcrumb — every segment goes back up */}
                        <div className="px-5 py-2.5 border-b border-[#E2E2E1] flex flex-wrap items-center gap-0.5 shrink-0">
                            {trail.map((c, i) => (
                                <span key={`${c.id}-${i}`} className="flex items-center gap-0.5 min-w-0">
                                    {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#C4C4C3] shrink-0" />}
                                    <button
                                        onClick={() => goTo(i)}
                                        disabled={i === trail.length - 1}
                                        className={`px-1.5 py-0.5 rounded-md text-[12px] truncate max-w-[160px] transition-colors ${i === trail.length - 1
                                            ? 'text-[#1A1A1A] font-medium cursor-default'
                                            : 'text-[#6B6B6B] hover:bg-[#F4F4F3] hover:text-[#1A1A1A]'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-[200px]">
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[#9B9B9B]">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Lecture du dossier…
                                </div>
                            ) : error ? (
                                <div className="px-5 py-4">
                                    <div className="bg-[#FBEAE8] border border-[#F3D2CE] rounded-lg px-3 py-2.5">
                                        <p className="text-[12px] text-[#C0392B] break-words">{error}</p>
                                    </div>
                                </div>
                            ) : folders.length === 0 ? (
                                <p className="text-[13px] text-[#9B9B9B] text-center py-12">
                                    Aucun sous-dossier
                                </p>
                            ) : (
                                <div className="divide-y divide-[#E2E2E1]">
                                    {folders.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => descend(f)}
                                            className="w-full flex items-center gap-2.5 px-5 py-2.5 text-left hover:bg-[#FAFAF9] transition-colors group"
                                        >
                                            <Folder className="w-4 h-4 text-[#9B9B9B] shrink-0" strokeWidth={1.8} />
                                            <span className="text-[13px] text-[#1A1A1A] truncate flex-1">{f.name}</span>
                                            <ChevronRight className="w-4 h-4 text-[#C4C4C3] group-hover:text-[#1A1A1A] transition-colors shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-[#E2E2E1] shrink-0 space-y-2">
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                                    Dossier sélectionné
                                </p>
                                <p className="text-[12px] font-mono text-[#6B6B6B] break-all mt-0.5">
                                    {current.path || initialPath || 'Ouvrez un dossier pour le choisir'}
                                </p>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-3 h-9 text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                                >
                                    Annuler
                                </button>
                                {/* The destination is usually the folder just opened,
                                    not one of its children. */}
                                <button
                                    onClick={() => confirmPath(current.path)}
                                    disabled={!current.path}
                                    className="px-3 h-9 bg-[#1A1A1A] text-white rounded-lg text-[13px] font-medium hover:bg-[#333333] transition-colors disabled:opacity-50"
                                >
                                    Choisir ce dossier
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
