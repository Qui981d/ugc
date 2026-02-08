'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, MapPin, Clock } from 'lucide-react'

interface CreatorCardProps {
    id: string
    name: string
    location: string
    canton: string
    rating: number
    reviewCount: number
    specialties: string[]
    imageUrl: string
    videoUrl?: string
    responseTime: string
}

export function CreatorCard({
    id,
    name,
    location,
    canton,
    rating,
    reviewCount,
    specialties,
    imageUrl,
    videoUrl,
    responseTime,
}: CreatorCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    const handleMouseEnter = () => {
        setIsHovered(true)
        if (videoRef.current && videoUrl) {
            videoRef.current.play()
        }
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    return (
        <Link href={`/creators/${id}`}>
            <motion.div
                className="creator-card group cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                {/* Image/Video Container - 3:4 aspect ratio */}
                <div className="relative aspect-[3/4] overflow-hidden">
                    {/* Static Image */}
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className={`object-cover transition-opacity duration-500 ${isHovered && videoUrl ? 'opacity-0' : 'opacity-100'
                            }`}
                    />

                    {/* Video on Hover */}
                    {videoUrl && (
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            muted
                            loop
                            playsInline
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'
                                }`}
                        />
                    )}

                    {/* Gradient Overlay */}
                    <div className="video-overlay" />

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 z-20">
                        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-medium text-white">{rating.toFixed(1)}</span>
                            <span className="text-xs text-white/60">({reviewCount})</span>
                        </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                        <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>

                        <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
                            <MapPin className="h-3 w-3" />
                            <span>{location}</span>
                            <span className="tag text-[10px] py-0.5">{canton}</span>
                        </div>

                        {/* Specialties - Show on hover */}
                        <div className={`flex flex-wrap gap-1.5 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                            }`}>
                            {specialties.slice(0, 3).map((specialty) => (
                                <span key={specialty} className="tag-accent text-[10px]">
                                    {specialty}
                                </span>
                            ))}
                        </div>

                        {/* Response Time - Show on hover */}
                        <div className={`flex items-center gap-1.5 mt-2 text-xs text-white/60 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                            }`}>
                            <Clock className="h-3 w-3" />
                            <span>Répond en {responseTime}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}
