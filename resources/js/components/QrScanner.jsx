import React, { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export default function QrScanner({ onScan, disabled }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [error, setError] = useState('')
    const [starting, setStarting] = useState(false)
    const [scanning, setScanning] = useState(false)
    
    // We use a ref to track if component is unmounted to stop the loop
    const activeRef = useRef(true)

    const startCamera = async () => {
        setStarting(true)
        setError('')
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera for QR scanning
            })
            setStream(s)
            activeRef.current = true
            if (videoRef.current) {
                videoRef.current.srcObject = s
                videoRef.current.setAttribute("playsinline", true) // required to tell iOS safari we don't want fullscreen
                videoRef.current.play()
                setScanning(true)
                requestAnimationFrame(tick)
            }
        } catch (e) {
            setError('Kamera tidak dapat diakses. Pastikan izin kamera diberikan.')
        } finally {
            setStarting(false)
        }
    }

    const stopCamera = () => {
        activeRef.current = false
        setScanning(false)
        if (stream) {
            stream.getTracks().forEach(t => t.stop())
            setStream(null)
        }
    }

    const tick = () => {
        if (!activeRef.current) return
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext("2d")
                canvas.height = videoRef.current.videoHeight
                canvas.width = videoRef.current.videoWidth
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                })
                
                if (code) {
                    stopCamera()
                    onScan(code.data)
                    return
                }
            }
        }
        if (activeRef.current) {
            requestAnimationFrame(tick)
        }
    }

    useEffect(() => {
        return () => stopCamera()
    }, [stream])

    return (
        <div className="space-y-3">
            <p className="text-slate-400 text-sm font-medium">🔲 Scan QR Code Sekolah</p>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}

            {!stream && (
                <button onClick={startCamera} disabled={disabled || starting}
                    className="w-full aspect-video rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 hover:border-emerald-500 flex flex-col items-center justify-center gap-2 transition-all">
                    <span className="text-4xl">{starting ? '⏳' : '📷'}</span>
                    <span className="text-slate-400 text-sm">{starting ? 'Menyiapkan scanner...' : 'Klik untuk buka scanner QR'}</span>
                </button>
            )}

            <div className={`relative rounded-xl overflow-hidden bg-black aspect-video ${!stream ? 'hidden' : ''}`}>
                <video ref={videoRef} muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-emerald-500/80 border-dashed rounded-xl" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="bg-black/50 text-white text-xs px-3 py-1 inline-block rounded-full backdrop-blur">
                        Arahkan kamera ke QR Code
                    </p>
                </div>
                <button onClick={stopCamera} className="absolute top-3 right-3 bg-red-500/80 backdrop-blur text-white text-xs px-2 py-1 rounded-lg">
                    Tutup
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}
