'use client'

import { useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WatermarkedPlayerProps {
    videoUrl: string
    isWatermarked: boolean
    thumbnailUrl?: string
}

export function WatermarkedPlayer({
    videoUrl,
    isWatermarked,
    thumbnailUrl
}: WatermarkedPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [progress, setProgress] = useState(0)

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100
            setProgress(percent)
        }
    }

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                videoRef.current.requestFullscreen()
            }
        }
    }

    // Prevent right-click download when watermarked
    const handleContextMenu = (e: React.MouseEvent) => {
        if (isWatermarked) {
            e.preventDefault()
        }
    }

    return (
        <div
            className="relative aspect-[9/16] max-w-[320px] bg-black rounded-lg overflow-hidden group"
            onContextMenu={handleContextMenu}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
            />

            {/* Watermark Overlay */}
            {isWatermarked && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Diagonal watermarks */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-16 rotate-[-25deg]">
                        {[0, 1, 2, 3].map((i) => (
                            <span
                                key={i}
                                className="text-white/25 text-xl font-bold tracking-wider select-none whitespace-nowrap"
                            >
                                UGC SUISSE • UGC SUISSE
                            </span>
                        ))}
                    </div>

                    {/* Center watermark */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/15 backdrop-blur-sm px-5 py-2.5 rounded-lg">
                            <span className="text-white font-bold text-lg tracking-wide">
                                APERÇU
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {isPlaying ? (
                            <Pause className="h-8 w-8 text-white" />
                        ) : (
                            <Play className="h-8 w-8 text-white ml-1" />
                        )}
                    </div>
                </button>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/30 rounded-full mb-3">
                        <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={toggleMute}
                        >
                            {isMuted ? (
                                <VolumeX className="h-5 w-5" />
                            ) : (
                                <Volume2 className="h-5 w-5" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleFullscreen}
                        >
                            <Maximize className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Watermark Badge */}
            {isWatermarked && (
                <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-medium rounded">
                        APERÇU
                    </span>
                </div>
            )}
        </div>
    )
}
