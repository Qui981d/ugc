import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Clé API OpenAI non configurée.' },
                { status: 500 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'Aucun fichier fourni.' },
                { status: 400 }
            )
        }

        // Whisper limit is 25 MB
        if (file.size > 25 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Le fichier dépasse la limite de 25 MB pour la transcription.' },
                { status: 400 }
            )
        }

        // Call Whisper with verbose_json to get word-level timestamps
        const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: file,
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
            language: 'fr',
        })

        // Access segments from the verbose response
        const segments = (transcription as unknown as {
            segments?: Array<{ start: number; end: number; text: string }>
        }).segments

        if (!segments || segments.length === 0) {
            return NextResponse.json({
                subtitles: [],
                message: 'Aucune parole détectée dans la vidéo.',
            })
        }

        // Convert Whisper segments to SubtitleEntry format
        const subtitles = segments.map((seg, i) => ({
            id: `ai-${Date.now()}-${i}`,
            start: Math.round(seg.start * 10) / 10,
            end: Math.round(seg.end * 10) / 10,
            text: seg.text.trim(),
        }))

        return NextResponse.json({ subtitles })

    } catch (error: unknown) {
        console.error('[Transcribe Route] Error:', error)
        const message = error instanceof Error ? error.message : 'Erreur interne'
        return NextResponse.json(
            { error: `Erreur transcription : ${message}` },
            { status: 500 }
        )
    }
}
