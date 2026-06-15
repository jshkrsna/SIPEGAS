import React, { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import gsap from 'gsap'

export default function GenerateQR() {
    const [token, setToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [expiresIn, setExpiresIn] = useState(0)

    const fetchToken = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/qr/generate')
            setToken(data.data.token)
            setExpiresIn(data.data.expires_in_seconds)
        } catch (error) {
            console.error('Failed to generate QR Token', error)
        } finally {
            setLoading(false)
        }
    }

    const downloadQR = () => {
        const canvas = document.getElementById('qr-code-canvas')
        if (!canvas) return
        const pngUrl = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.href = pngUrl
        downloadLink.download = `QR-Presensi-${Date.now()}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    }

    useEffect(() => {
        fetchToken()
    }, [])

    useEffect(() => {
        if (expiresIn <= 0) {
            if (token) fetchToken() // auto refresh when expired
            return
        }
        
        const interval = setInterval(() => {
            setExpiresIn(prev => prev - 1)
        }, 1000)
        
        return () => clearInterval(interval)
    }, [expiresIn, token])

    useEffect(() => {
        gsap.fromTo('.qr-wrapper', 
            { opacity: 0, scale: 0.9, y: 20 }, 
            { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)' }
        )
    }, [token])

    // Format MM:SS
    const minutes = Math.floor(expiresIn / 60)
    const seconds = expiresIn % 60
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    return (
        <div className="p-4 sm:p-6 max-w-[460px] w-full mx-auto mt-2 sm:mt-6">
            <PageHeader 
                title="QR Code" 
                description="Scan via aplikasi" 
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>} 
            />

            <div className="text-center qr-wrapper">
                <div className="bg-[#ffffff] w-full aspect-square flex items-center justify-center rounded-3xl shadow-xl shadow-blue-500/10 border-[6px] border-blue-500 mb-6 relative transition-all">
                    {loading ? (
                        <div className="w-64 h-64 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
                            <QRCodeCanvas 
                                id="qr-code-canvas"
                                value={token} 
                                size={320}
                                style={{ width: '100%', height: '100%', maxWidth: '320px', maxHeight: '320px' }}
                                level="H"
                                includeMargin={false}
                                fgColor="#0f172a"
                                imageSettings={{
                                    src: "/images/logo-hitam.png",
                                    height: 56,
                                    width: 56,
                                    excavate: true,
                                }}
                            />
                        </div>
                    )}
                </div>

                {token && !loading && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center gap-5 w-full shadow-lg">
                        <div className="text-center">
                            <p className="text-slate-400 text-sm mb-1">Kedaluwarsa dalam:</p>
                            <p className={`text-3xl font-mono font-bold ${expiresIn < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {formattedTime}
                            </p>
                        </div>
                        
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={fetchToken}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Perbarui
                            </button>
                            <button 
                                onClick={downloadQR}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                Download
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
