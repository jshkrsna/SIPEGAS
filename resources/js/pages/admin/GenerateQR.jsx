import React, { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../../api/axios'

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

    // Format MM:SS
    const minutes = Math.floor(expiresIn / 60)
    const seconds = expiresIn % 60
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    return (
        <div className="p-6 max-w-lg mx-auto text-center mt-10">
            <h2 className="text-2xl font-bold text-white mb-2">QR Code Presensi</h2>
            <p className="text-slate-400 text-sm mb-8">Scan QR ini melalui aplikasi presensi pegawai.</p>

            <div className="bg-white p-8 rounded-2xl shadow-xl inline-block mx-auto mb-6 relative">
                {loading ? (
                    <div className="w-64 h-64 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <QRCodeCanvas 
                        id="qr-code-canvas"
                        value={token} 
                        size={256}
                        level="H"
                        includeMargin={false}
                        fgColor="#0f172a"
                        imageSettings={{
                            src: "/favicon.svg",
                            height: 48,
                            width: 48,
                            excavate: true,
                        }}
                    />
                )}
            </div>

            {token && !loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center gap-5 max-w-sm mx-auto">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-1">QR Code akan kedaluwarsa dalam:</p>
                        <p className={`text-3xl font-mono font-bold ${expiresIn < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {formattedTime}
                        </p>
                    </div>
                    
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={fetchToken}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
                        >
                            🔄 Perbarui
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
    )
}
