'use client'

import { useRef, useState, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export interface TrimRange {
    start: number  // seconds
    end: number    // seconds
}

export interface SubtitleEntry {
    id: string
    start: number  // seconds
    end: number    // seconds
    text: string
}

export function useFFmpeg() {
    const ffmpegRef = useRef<FFmpeg | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [processing, setProcessing] = useState(false)

    const load = useCallback(async () => {
        if (loaded || loading) return
        setLoading(true)

        const ffmpeg = new FFmpeg()

        ffmpeg.on('progress', ({ progress: p }) => {
            setProgress(Math.round(p * 100))
        })

        // Load single-thread core (no SharedArrayBuffer needed)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        ffmpegRef.current = ffmpeg
        setLoaded(true)
        setLoading(false)
    }, [loaded, loading])

    const trim = useCallback(async (file: File, range: TrimRange): Promise<Blob | null> => {
        const ffmpeg = ffmpegRef.current
        if (!ffmpeg) return null

        setProcessing(true)
        setProgress(0)

        try {
            const inputName = 'input.' + (file.name.split('.').pop() || 'mp4')
            const outputName = 'output.mp4'

            await ffmpeg.writeFile(inputName, await fetchFile(file))

            const duration = range.end - range.start
            await ffmpeg.exec([
                '-ss', range.start.toFixed(3),
                '-i', inputName,
                '-t', duration.toFixed(3),
                '-c:v', 'copy',
                '-c:a', 'copy',
                '-avoid_negative_ts', 'make_zero',
                outputName,
            ])

            const data = (await ffmpeg.readFile(outputName)) as Uint8Array
            const blob = new Blob([new Uint8Array(data)], { type: 'video/mp4' })

            // Cleanup
            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)

            setProcessing(false)
            setProgress(100)
            return blob
        } catch (err) {
            console.error('FFmpeg trim error:', err)
            setProcessing(false)
            return null
        }
    }, [])

    const trimAndBurnSubtitles = useCallback(async (
        file: File,
        range: TrimRange,
        subtitles: SubtitleEntry[]
    ): Promise<Blob | null> => {
        const ffmpeg = ffmpegRef.current
        if (!ffmpeg) return null

        setProcessing(true)
        setProgress(0)

        try {
            const inputName = 'input.' + (file.name.split('.').pop() || 'mp4')
            const outputName = 'output.mp4'

            await ffmpeg.writeFile(inputName, await fetchFile(file))

            const duration = range.end - range.start

            if (subtitles.length > 0) {
                // Build SRT subtitle file
                const srtContent = subtitles.map((sub, i) => {
                    const adjustedStart = Math.max(0, sub.start - range.start)
                    const adjustedEnd = Math.min(duration, sub.end - range.start)
                    return `${i + 1}\n${formatSRT(adjustedStart)} --> ${formatSRT(adjustedEnd)}\n${sub.text}\n`
                }).join('\n')

                await ffmpeg.writeFile('subs.srt', srtContent)

                // Trim + burn subtitles (re-encode required for subtitle burn-in)
                await ffmpeg.exec([
                    '-ss', range.start.toFixed(3),
                    '-i', inputName,
                    '-t', duration.toFixed(3),
                    '-vf', `subtitles=subs.srt:force_style='FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2'`,
                    '-c:a', 'copy',
                    '-preset', 'ultrafast',
                    outputName,
                ])

                await ffmpeg.deleteFile('subs.srt')
            } else {
                // Just trim (stream copy, fast)
                await ffmpeg.exec([
                    '-ss', range.start.toFixed(3),
                    '-i', inputName,
                    '-t', duration.toFixed(3),
                    '-c:v', 'copy',
                    '-c:a', 'copy',
                    '-avoid_negative_ts', 'make_zero',
                    outputName,
                ])
            }

            const data = (await ffmpeg.readFile(outputName)) as Uint8Array
            const blob = new Blob([new Uint8Array(data)], { type: 'video/mp4' })

            await ffmpeg.deleteFile(inputName)
            await ffmpeg.deleteFile(outputName)

            setProcessing(false)
            setProgress(100)
            return blob
        } catch (err) {
            console.error('FFmpeg process error:', err)
            setProcessing(false)
            return null
        }
    }, [])

    return {
        load,
        loaded,
        loading,
        trim,
        trimAndBurnSubtitles,
        processing,
        progress,
    }
}

// Format seconds to SRT timestamp: HH:MM:SS,mmm
function formatSRT(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.round((seconds % 1) * 1000)
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`
}

function pad(n: number) { return n.toString().padStart(2, '0') }
function pad3(n: number) { return n.toString().padStart(3, '0') }
