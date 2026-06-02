import React, { useState, useRef, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import dayjs from 'dayjs'
import QrScanner from '../../components/QrScanner'

// ─── Selfie Camera Component ─────────────────────────────────────────────────
function SelfieCapture({ onCapture, disabled }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [photo, setPhoto] = useState(null)
    const [cameraError, setCameraError] = useState('')
    const [starting, setStarting] = useState(false)

    const startCamera = async () => {
        setStarting(true)
        setCameraError('')
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            })
            setStream(s)
        } catch (e) {
            setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera diberikan.')
        } finally {
            setStarting(false)
        }
    }

    const stopCamera = useCallback(() => {
        if (stream) stream.getTracks().forEach(t => t.stop())
        setStream(null)
    }, [stream])

    const capture = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setPhoto(dataUrl)
        stopCamera()
        onCapture(dataUrl)
    }

    const retake = () => {
        setPhoto(null)
        onCapture(null)
        startCamera()
    }

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream
        }
    }, [stream])

    useEffect(() => () => stopCamera(), [])

    return (
        <div className="space-y-3">
            <p className="text-slate-400 text-sm font-medium">📸 Foto Selfie (Wajib)</p>

            {cameraError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{cameraError}</div>
            )}

            {!stream && !photo && (
                <button onClick={startCamera} disabled={disabled || starting}
                    className="w-full aspect-video rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 hover:border-blue-500 flex flex-col items-center justify-center gap-2 transition-all">
                    <span className="text-4xl">{starting ? '⏳' : '📷'}</span>
                    <span className="text-slate-400 text-sm">{starting ? 'Menyiapkan kamera...' : 'Klik untuk buka kamera'}</span>
                </button>
            )}

            {stream && !photo && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/60 rounded-full" />
                    </div>
                    <button onClick={capture}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-blue-500 hover:bg-blue-50 transition-colors shadow-lg">
                    </button>
                </div>
            )}

            {photo && (
                <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 right-3">
                        <button onClick={retake} className="bg-slate-900/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors">
                            🔄 Ulangi
                        </button>
                    </div>
                    <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                        ✓ Foto Tersimpan
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}

// ─── GPS Status Component ─────────────────────────────────────────────────────
function GpsStatus({ onLocation }) {
    const [status, setStatus] = useState('idle') // idle | loading | success | error
    const [location, setLocation] = useState(null)
    const [error, setError] = useState('')

    const getLocation = () => {
        setStatus('loading')
        setError('')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                }
                setLocation(loc)
                setStatus('success')
                onLocation(loc)
            },
            (err) => {
                setError('Gagal mendapatkan lokasi GPS. Pastikan GPS aktif dan izin lokasi diberikan.')
                setStatus('error')
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    useEffect(() => { getLocation() }, [])

    return (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
            status === 'error' ? 'bg-red-500/10 border-red-500/30' :
            'bg-slate-800 border-slate-700'
        }`}>
            <span className="text-xl">
                {status === 'success' ? '📍' : status === 'error' ? '❌' : status === 'loading' ? '⌛' : '🗺️'}
            </span>
            <div className="flex-1">
                {status === 'success' && (
                    <>
                        <p className="text-emerald-400 font-medium">Lokasi terdeteksi</p>
                        <p className="text-slate-400 text-xs">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)} · Akurasi: {location.accuracy.toFixed(0)}m
                        </p>
                    </>
                )}
                {status === 'loading' && <p className="text-slate-400">Mendeteksi lokasi GPS...</p>}
                {status === 'error' && (
                    <>
                        <p className="text-red-400">{error}</p>
                        <button onClick={getLocation} className="text-xs text-blue-400 hover:underline mt-1">Coba lagi</button>
                    </>
                )}
            </div>
        </div>
    )
}

// ─── Main Presensi Page ───────────────────────────────────────────────────────
export default function PresensiPage() {
    const { user } = useAuth()
    const [todayPresensi, setTodayPresensi] = useState(null)
    const [loadingToday, setLoadingToday] = useState(true)
    const [location, setLocation] = useState(null)
    const [selfieData, setSelfieData] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    const [metode, setMetode] = useState('qr_code') // qr_code | geolocation
    const [qrToken, setQrToken] = useState('')

    const fetchToday = async () => {
        try {
            const { data } = await api.get('/presensi/today')
            setTodayPresensi(data.data)
        } catch {}
        finally { setLoadingToday(false) }
    }

    useEffect(() => { fetchToday() }, [])

    const handleCheckin = async () => {
        if (metode === 'qr_code' && !qrToken) return setError('Silakan scan QR code terlebih dahulu.')
        if (!selfieData) return setError('Selfie wajib diambil terlebih dahulu.')
        if (!location) return setError('Lokasi GPS belum terdeteksi.')
        
        setError('')
        setSubmitting(true)
        try {
            const { data } = await api.post('/presensi/checkin', {
                lat: location.lat,
                lng: location.lng,
                accuracy_meter: location.accuracy,
                selfie_url: selfieData,
                metode: metode,
                qr_token: qrToken,
            })
            setResult(data)
            setTodayPresensi(data.data?.presensi)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal melakukan check-in.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCheckout = async () => {
        if (!selfieData) return setError('Selfie checkout wajib diambil.')
        setError('')
        setSubmitting(true)
        try {
            const { data } = await api.post('/presensi/checkout', { selfie_url: selfieData })
            setResult(data)
            setTodayPresensi(data.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal melakukan check-out.')
        } finally {
            setSubmitting(false)
        }
    }

    const now = dayjs()

    if (loadingToday) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Presensi</h2>
                <p className="text-slate-400 mt-1">{now.format('dddd, D MMMM YYYY · HH:mm')}</p>
            </div>

            {/* Already checked in and out */}
            {todayPresensi?.waktu_checkout && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                    <span className="text-5xl">✅</span>
                    <h3 className="text-white font-semibold text-lg mt-3">Presensi Selesai</h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Masuk: {dayjs(todayPresensi.waktu_checkin).format('HH:mm')} ·
                        Pulang: {dayjs(todayPresensi.waktu_checkout).format('HH:mm')}
                    </p>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm capitalize ${
                        todayPresensi.status_kehadiran === 'hadir' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>{todayPresensi.status_kehadiran}</span>
                </div>
            )}

            {/* Not yet checked in */}
            {!todayPresensi && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">📍</span>
                        </div>
                        <div>
                            <p className="text-white font-semibold">Check-in Presensi</p>
                            <p className="text-slate-400 text-xs">Pilih metode check-in Anda</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
                        <button onClick={() => setMetode('qr_code')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${metode === 'qr_code' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}>Scan QR Code</button>
                        <button onClick={() => setMetode('geolocation')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${metode === 'geolocation' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}>GPS Only</button>
                    </div>

                    {metode === 'qr_code' && (
                        <div className="space-y-3">
                            {qrToken ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">✅</span>
                                        <div>
                                            <p className="text-emerald-400 font-medium">QR Code Valid</p>
                                            <p className="text-slate-400 text-xs">Token: {qrToken.substring(0,8)}...</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setQrToken('')} className="text-xs text-red-400 hover:underline">Hapus</button>
                                </div>
                            ) : (
                                <QrScanner onScan={setQrToken} disabled={submitting} />
                            )}
                        </div>
                    )}

                    <GpsStatus onLocation={setLocation} />
                    <SelfieCapture onCapture={setSelfieData} disabled={submitting} />

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>
                    )}

                    {result && (
                        <div className={`p-3 rounded-lg border text-sm ${
                            result.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                            {result.message}
                        </div>
                    )}

                    <button
                        onClick={handleCheckin}
                        disabled={submitting || !selfieData || !location || (metode === 'qr_code' && !qrToken)}
                        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        {submitting ? '⏳ Memproses...' : '✅ Check-In Sekarang'}
                    </button>
                </div>
            )}

            {/* Checked in but not out */}
            {todayPresensi && !todayPresensi.waktu_checkout && (
                <div className="space-y-5">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">✅</span>
                            <div>
                                <p className="text-emerald-400 font-semibold">Sudah Check-in</p>
                                <p className="text-slate-400 text-sm">
                                    Waktu masuk: {dayjs(todayPresensi.waktu_checkin).format('HH:mm')} ·
                                    <span className={`ml-1 capitalize ${todayPresensi.status_kehadiran === 'terlambat' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {todayPresensi.status_kehadiran}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                        <p className="text-white font-semibold">Check-out Presensi</p>
                        <SelfieCapture onCapture={setSelfieData} disabled={submitting} />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={submitting || !selfieData}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
                        >
                            {submitting ? '⏳ Memproses...' : '🚪 Check-Out Sekarang'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
