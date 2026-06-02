import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
                    <QRCodeSVG 
                        value={token} 
                        size={256}
                        level="H"
                        includeMargin={false}
                        fgColor="#0f172a" 
                    />
                )}
            </div>

            {token && !loading && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <p className="text-slate-400 text-sm">QR Code akan kedaluwarsa dalam:</p>
                    <p className={`text-2xl font-mono font-bold ${expiresIn < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formattedTime}
                    </p>
                    <button 
                        onClick={fetchToken}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                        🔄 Perbarui QR Sekarang
                    </button>
                </div>
            )}
        </div>
    )
}
