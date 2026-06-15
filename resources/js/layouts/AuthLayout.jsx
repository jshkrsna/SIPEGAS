import React, { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import gsap from 'gsap'

const IMAGES = [
    '/images/login-bg1.jpg',
    '/images/login-bg2.jpg',
    '/images/login-bg3.jpg',
    '/images/login-bg4.jpeg',
]

export default function AuthLayout() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const imgRef = useRef(null)
    const containerRef = useRef(null)

    const changeImage = (newIndex) => {
        if (!imgRef.current) return
        gsap.to(imgRef.current, {
            opacity: 0,
            scale: 1.05,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                setCurrentIndex(newIndex)
                gsap.fromTo(imgRef.current, 
                    { opacity: 0, scale: 0.95 },
                    { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
                )
            }
        })
    }

    const nextImage = () => {
        changeImage((currentIndex + 1) % IMAGES.length)
    }

    const prevImage = () => {
        changeImage((currentIndex - 1 + IMAGES.length) % IMAGES.length)
    }

    // Auto slideshow
    useEffect(() => {
        const timer = setInterval(nextImage, 5000)
        return () => clearInterval(timer)
    }, [currentIndex])

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex relative overflow-hidden">
            {/* Left side — Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
                {/* Background gradient blobs (visible on mobile & left side) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl lg:hidden" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl" />
                </div>
                <Outlet />
            </div>

            {/* Right side — Image Slideshow (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-slate-950 border-l border-slate-800" ref={containerRef}>
                
                {/* Image Container */}
                <div className="relative w-full h-full overflow-hidden">
                    <img 
                        ref={imgRef}
                        src={IMAGES[currentIndex]} 
                        alt="Login Background" 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Dark overlay for better text/button contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30"></div>
                </div>

                {/* Navigation Arrows */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 opacity-0 hover:opacity-100 transition-opacity duration-300 z-20"
                     onMouseEnter={() => gsap.to(containerRef.current.querySelector('.nav-arrows'), {opacity: 1})}
                     onMouseLeave={() => gsap.to(containerRef.current.querySelector('.nav-arrows'), {opacity: 0})}
                >
                    <button 
                        onClick={prevImage}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 text-white transition-all transform hover:scale-110"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button 
                        onClick={nextImage}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 text-white transition-all transform hover:scale-110"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Slide Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                    {IMAGES.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => changeImage(idx)}
                            className={`h-2 rounded-full transition-all duration-500 ${currentIndex === idx ? 'w-8 bg-blue-500' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
