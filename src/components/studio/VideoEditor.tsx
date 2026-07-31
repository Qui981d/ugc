'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
    Play,
    Pause,
    Scissors,
    Loader2,
    Upload,
    RotateCcw,
    Volume2,
    VolumeX,
    Type,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react'
import { useFFmpeg, type TrimRange, type SubtitleEntry } from '@/hooks/useFFmpeg'

interface VideoEditorProps {
    file: File
    onExport: (blob: Blob) => void | Promise<void>
    onCancel: () => void
}

export default function VideoEditor({ file, onExport, onCancel }: VideoEditorProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)

    // Video state
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [videoUrl, setVideoUrl] = useState('')

    // Trim
    const [trimStart, setTrimStart] = useState(0)
    const [trimEnd, setTrimEnd] = useState(0)
    const [dragging, setDragging] = useState<'start' | 'end' | 'playhead' | null>(null)

    // Thumbnails
    const [thumbnails, setThumbnails] = useState<string[]>([])
    const [thumbLoading, setThumbLoading] = useState(true)

    // Subtitles
    const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([])
    const [showSubPanel, setShowSubPanel] = useState(false)

    // FFmpeg
    const ffmpeg = useFFmpeg()
    const [exporting, setExporting] = useState(false)

    // AI transcription
    const [transcribing, setTranscribing] = useState(false)

    // Create object URL for the video file
    useEffect(() => {
        const url = URL.createObjectURL(file)
        setVideoUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file])

    // Extract thumbnails when video loads
    const extractThumbnails = useCallback(async () => {
        const video = document.createElement('video')
        video.src = URL.createObjectURL(file)
        video.muted = true
        video.preload = 'auto'

        await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => resolve()
        })

        const dur = video.duration
        setDuration(dur)
        setTrimEnd(dur)

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const thumbCount = Math.min(20, Math.max(8, Math.floor(dur / 2)))
        canvas.width = 120
        canvas.height = 68

        const thumbs: string[] = []
        for (let i = 0; i < thumbCount; i++) {
            const time = (i / thumbCount) * dur
            video.currentTime = time
            await new Promise<void>((resolve) => {
                video.onseeked = () => resolve()
            })
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            thumbs.push(canvas.toDataURL('image/jpeg', 0.5))
        }

        setThumbnails(thumbs)
        setThumbLoading(false)
        URL.revokeObjectURL(video.src)
        video.remove()
    }, [file])

    useEffect(() => {
        extractThumbnails()
    }, [extractThumbnails])

    // Sync playhead with video
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime)
            if (video.currentTime >= trimEnd) {
                video.pause()
                setPlaying(false)
            }
        }
        video.addEventListener('timeupdate', onTimeUpdate)
        return () => video.removeEventListener('timeupdate', onTimeUpdate)
    }, [trimEnd])

    // Play/Pause
    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return
        if (playing) {
            video.pause()
            setPlaying(false)
        } else {
            if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
                video.currentTime = trimStart
            }
            video.play()
            setPlaying(true)
        }
    }

    // Timeline interaction
    const getTimeFromX = (clientX: number): number => {
        const rect = timelineRef.current?.getBoundingClientRect()
        if (!rect) return 0
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        return (x / rect.width) * duration
    }

    const handleTimelineMouseDown = (e: React.MouseEvent) => {
        const time = getTimeFromX(e.clientX)
        const startDist = Math.abs(time - trimStart)
        const endDist = Math.abs(time - trimEnd)
        const handleThreshold = duration * 0.025

        if (startDist < handleThreshold) {
            setDragging('start')
        } else if (endDist < handleThreshold) {
            setDragging('end')
        } else {
            setDragging('playhead')
            const newTime = Math.max(trimStart, Math.min(time, trimEnd))
            setCurrentTime(newTime)
            if (videoRef.current) videoRef.current.currentTime = newTime
        }
    }

    useEffect(() => {
        if (!dragging) return

        const handleMove = (e: MouseEvent) => {
            const time = getTimeFromX(e.clientX)
            if (dragging === 'start') {
                setTrimStart(Math.max(0, Math.min(time, trimEnd - 0.5)))
            } else if (dragging === 'end') {
                setTrimEnd(Math.max(trimStart + 0.5, Math.min(time, duration)))
            } else if (dragging === 'playhead') {
                const newTime = Math.max(trimStart, Math.min(time, trimEnd))
                setCurrentTime(newTime)
                if (videoRef.current) videoRef.current.currentTime = newTime
            }
        }

        const handleUp = () => setDragging(null)

        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
    }, [dragging, trimStart, trimEnd, duration])

    // Format time
    const fmt = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        const ms = Math.floor((s % 1) * 10)
        return `${m}:${sec.toString().padStart(2, '0')}.${ms}`
    }

    // Subtitle helpers
    const addSubtitle = () => {
        const newSub: SubtitleEntry = {
            id: Date.now().toString(),
            start: currentTime,
            end: Math.min(currentTime + 3, trimEnd),
            text: 'Votre texte ici',
        }
        setSubtitles([...subtitles, newSub])
    }

    const updateSubtitle = (id: string, field: keyof SubtitleEntry, value: string | number) => {
        setSubtitles(subtitles.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const removeSubtitle = (id: string) => {
        setSubtitles(subtitles.filter(s => s.id !== id))
    }

    // AI subtitle generation
    const handleGenerateSubtitles = async () => {
        if (transcribing) return
        setTranscribing(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (data.error) {
                console.error('AI subtitle error:', data.error)
            } else if (data.subtitles && data.subtitles.length > 0) {
                setSubtitles(data.subtitles)
                setShowSubPanel(true)
            }
        } catch (err) {
            console.error('AI subtitle fetch error:', err)
        }
        setTranscribing(false)
    }

    const activeSub = subtitles.find(s => currentTime >= s.start && currentTime <= s.end)

    // Export
    const handleExport = async () => {
        setExporting(true)
        if (!ffmpeg.loaded) {
            await ffmpeg.load()
        }
        const trimRange: TrimRange = { start: trimStart, end: trimEnd }
        const blob = await ffmpeg.trimAndBurnSubtitles(file, trimRange, subtitles)
        if (blob) {
            await onExport(blob)
        }
        setExporting(false)
    }

    const trimmedDuration = trimEnd - trimStart
    const startPercent = duration > 0 ? (trimStart / duration) * 100 : 0
    const endPercent = duration > 0 ? (trimEnd / duration) * 100 : 0
    const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="space-y-4">
            {/* ===== VIDEO PREVIEW ===== */}
            <div className="relative bg-black rounded-lg overflow-hidden group">
                {videoUrl && (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    muted={muted}
                    className="w-full max-h-[420px] mx-auto"
                    onClick={togglePlay}
                    playsInline
                />
                )}

                {/* Subtitle overlay */}
                {activeSub && (
                    <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none px-4">
                        <span className="inline-block bg-black/70 text-white px-4 py-2 rounded-lg text-lg font-medium backdrop-blur-sm">
                            {activeSub.text}
                        </span>
                    </div>
                )}

                {/* Play/Pause overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        {playing ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                    </div>
                </div>

                {/* Time display */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-mono">
                    {fmt(currentTime)} / {fmt(duration)}
                </div>

                {/* Mute button */}
                <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }}
                    className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/80 transition">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
            </div>

            {/* ===== CONTROLS BAR ===== */}
            <div className="flex items-center gap-2 bg-[#F4F4F3] rounded-lg px-3 py-2">
                <button onClick={togglePlay}
                    className="w-9 h-9 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-[#333333] transition shrink-0">
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Trim info */}
                <div className="flex-1 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Scissors className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <span className="text-[#6B6B6B]">Trim :</span>
                        <span className="font-mono text-[#1A1A1A] font-medium">{fmt(trimStart)}</span>
                        <span className="text-[#9B9B9B]">→</span>
                        <span className="font-mono text-[#1A1A1A] font-medium">{fmt(trimEnd)}</span>
                        <span className="text-[#9B9B9B]">({fmt(trimmedDuration)})</span>
                    </div>
                </div>

                {/* Reset trim */}
                <button onClick={() => { setTrimStart(0); setTrimEnd(duration) }}
                    className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset
                </button>
            </div>

            {/* ===== TIMELINE ===== */}
            <div className="bg-[#1A1A1A] rounded-lg p-3 space-y-2">
                <div
                    ref={timelineRef}
                    className="relative h-16 rounded-lg overflow-hidden cursor-pointer select-none"
                    onMouseDown={handleTimelineMouseDown}
                >
                    {/* Thumbnails */}
                    {thumbLoading ? (
                        <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-[#6B6B6B] animate-spin" />
                        </div>
                    ) : (
                        <div className="flex h-full">
                            {thumbnails.map((thumb, i) => (
                                <img key={i} src={thumb} alt="" className="h-full flex-1 object-cover" draggable={false} />
                            ))}
                        </div>
                    )}

                    {/* Dimmed zones (outside trim) */}
                    <div className="absolute inset-y-0 left-0 bg-black/60" style={{ width: `${startPercent}%` }} />
                    <div className="absolute inset-y-0 right-0 bg-black/60" style={{ width: `${100 - endPercent}%` }} />

                    {/* Trim start handle */}
                    <div
                        className="absolute inset-y-0 w-4 bg-[#1A1A1A] cursor-col-resize z-20 flex items-center justify-center hover:bg-[#1A1A1A] transition-colors"
                        style={{ left: `calc(${startPercent}% - 8px)` }}
                    >
                        <div className="w-0.5 h-6 bg-[#1A1A1A]/60 rounded-full" />
                    </div>

                    {/* Trim end handle */}
                    <div
                        className="absolute inset-y-0 w-4 bg-[#1A1A1A] cursor-col-resize z-20 flex items-center justify-center hover:bg-[#1A1A1A] transition-colors"
                        style={{ left: `calc(${endPercent}% - 8px)` }}
                    >
                        <div className="w-0.5 h-6 bg-[#1A1A1A]/60 rounded-full" />
                    </div>

                    {/* Trim border */}
                    <div className="absolute inset-y-0 border-t-2 border-b-2 border-[#1A1A1A] z-10 pointer-events-none"
                        style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }} />

                    {/* Playhead */}
                    <div
                        className="absolute inset-y-0 w-0.5 bg-white z-30 pointer-events-none"
                        style={{ left: `${playheadPercent}%` }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </div>

                    {/* Subtitle markers */}
                    {subtitles.map(sub => (
                        <div
                            key={sub.id}
                            className="absolute bottom-0 h-2 bg-[#8A6100]/70 rounded-t z-[15]"
                            style={{
                                left: `${(sub.start / duration) * 100}%`,
                                width: `${((sub.end - sub.start) / duration) * 100}%`,
                            }}
                        />
                    ))}
                </div>

                {/* Time markers */}
                <div className="flex justify-between text-[10px] font-mono text-[#6B6B6B] px-1">
                    {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                        <span key={pct}>{fmt(pct * duration)}</span>
                    ))}
                </div>
            </div>

            {/* ===== SUBTITLE PANEL ===== */}
            <div className="bg-white border border-[#E2E2E1] rounded-lg overflow-hidden">
                <button
                    onClick={() => setShowSubPanel(!showSubPanel)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F4F3] transition"
                >
                    <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]">
                        <Type className="w-4 h-4 text-[#8A6100]" />
                        Sous-titres
                        {subtitles.length > 0 && (
                            <span className="text-xs bg-[#FBF3E2] text-[#8A6100] px-1.5 py-0.5 rounded-full">{subtitles.length}</span>
                        )}
                    </div>
                    {showSubPanel ? <ChevronUp className="w-4 h-4 text-[#9B9B9B]" /> : <ChevronDown className="w-4 h-4 text-[#9B9B9B]" />}
                </button>

                {showSubPanel && (
                    <div className="border-t border-[#F4F4F3] px-4 py-3 space-y-3">
                        {subtitles.length === 0 && (
                            <div className="text-center py-4 space-y-3">
                                <p className="text-xs text-[#9B9B9B]">Aucun sous-titre.</p>
                                <button
                                    onClick={handleGenerateSubtitles}
                                    disabled={transcribing}
                                    className="w-full py-2.5 bg-gradient-to-r from-[#1A1A1A] to-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:from-[#1A1A1A] hover:to-[#1A1A1A] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {transcribing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Transcription en cours...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Générer les sous-titres IA</>
                                    )}
                                </button>
                            </div>
                        )}

                        {subtitles.map(sub => (
                            <div key={sub.id} className="flex items-start gap-2 bg-[#F4F4F3] rounded-lg p-3">
                                <div className="flex-1 space-y-1.5">
                                    <input
                                        value={sub.text}
                                        onChange={e => updateSubtitle(sub.id, 'text', e.target.value)}
                                        className="w-full bg-white border border-[#E2E2E1] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15"
                                        placeholder="Texte du sous-titre..."
                                    />
                                    <div className="flex items-center gap-2 text-xs">
                                        <label className="text-[#6B6B6B]">De</label>
                                        <input type="number" step="0.1" min={0} max={duration}
                                            value={sub.start.toFixed(1)}
                                            onChange={e => updateSubtitle(sub.id, 'start', parseFloat(e.target.value) || 0)}
                                            className="w-16 bg-white border border-[#E2E2E1] rounded-lg px-1.5 py-0.5 text-center font-mono focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15" />
                                        <label className="text-[#6B6B6B]">à</label>
                                        <input type="number" step="0.1" min={0} max={duration}
                                            value={sub.end.toFixed(1)}
                                            onChange={e => updateSubtitle(sub.id, 'end', parseFloat(e.target.value) || 0)}
                                            className="w-16 bg-white border border-[#E2E2E1] rounded-lg px-1.5 py-0.5 text-center font-mono focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]/15" />
                                        <span className="text-[#9B9B9B]">({fmt(sub.end - sub.start)})</span>
                                    </div>
                                </div>
                                <button onClick={() => removeSubtitle(sub.id)}
                                    className="p-1 text-[#9B9B9B] hover:text-[#C0392B] transition mt-1">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        <div className="flex gap-2">
                            <button onClick={addSubtitle}
                                className="flex-1 py-2.5 border border-dashed border-[#E2E2E1] rounded-lg text-xs text-[#6B6B6B] hover:bg-[#EDEDEC] hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A] transition flex items-center justify-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" />
                                Ajouter à {fmt(currentTime)}
                            </button>
                            {subtitles.length > 0 && (
                                <button
                                    onClick={handleGenerateSubtitles}
                                    disabled={transcribing}
                                    className="py-2.5 px-4 bg-gradient-to-r from-[#1A1A1A] to-[#1A1A1A] text-white rounded-lg text-xs font-medium hover:from-[#1A1A1A] hover:to-[#1A1A1A] transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                >
                                    {transcribing ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcription...</>
                                    ) : (
                                        <><Sparkles className="w-3.5 h-3.5" /> Regénérer IA</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== EXPORT BAR ===== */}
            <div className="flex items-center gap-3">
                <button onClick={onCancel}
                    className="px-4 py-2.5 border border-[#E2E2E1] rounded-lg text-sm text-[#6B6B6B] hover:bg-[#F4F4F3] transition">
                    Annuler
                </button>

                <button
                    onClick={handleExport}
                    disabled={exporting || ffmpeg.loading}
                    className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-[#333333] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {exporting || ffmpeg.loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {ffmpeg.loading ? 'Chargement FFmpeg...' :
                                ffmpeg.progress > 0 ? `Export en cours (${ffmpeg.progress}%)...` :
                                    'Préparation...'}
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            {subtitles.length > 0 ? 'Exporter & Livrer (trim + sous-titres)' : 'Exporter & Livrer'}
                        </>
                    )}
                </button>
            </div>

            {/* Export progress bar */}
            {(exporting || ffmpeg.loading) && (
                <div className="w-full bg-[#F4F4F3] rounded-full h-2">
                    <motion.div
                        className="bg-[#1A1A1A] h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: ffmpeg.loading ? '30%' : `${ffmpeg.progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}
        </div>
    )
}
