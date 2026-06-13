import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import { usePageTransition, animateTabSwitch } from '../../utils/usePageTransition'
import { gsap } from 'gsap'
import jsQR from 'jsqr'
import dayjs from 'dayjs'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── SVG Face Overlay ────────────────────────────────────────────────────────
function FaceOverlay({ scanning }) {
    const dotRefs = useRef([])
    const circleRef = useRef(null)

    useEffect(() => {
        if (!scanning) return
        // Animate the ring
        if (circleRef.current) {
            gsap.to(circleRef.current, {
                strokeDashoffset: 0,
                duration: 1.2,
                ease: 'power2.inOut',
                repeat: -1,
                yoyo: true,
            })
        }
        // Animate each landmark dot
        dotRefs.current.forEach((dot, i) => {
            if (!dot) return
            gsap.to(dot, {
                scale: 1.6,
                opacity: 0.9,
                duration: 0.5,
                delay: i * 0.08,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                transformOrigin: 'center center',
            })
        })
        return () => {
            gsap.killTweensOf(circleRef.current)
            dotRefs.current.forEach(d => d && gsap.killTweensOf(d))
        }
    }, [scanning])

    // Face landmark points (cx,cy relative to a 300x300 viewBox — face oval)
    const dots = [
        // Dahi atas
        [150, 55], [120, 62], [180, 62],
        // Pelipis
        [95, 95], [205, 95],
        // Mata kiri
        [108, 118], [128, 112], [118, 126],
        // Mata kanan
        [182, 118], [162, 112], [172, 126],
        // Hidung
        [150, 140], [140, 158], [160, 158], [150, 165],
        // Pipi
        [85, 160], [215, 160],
        // Bibir
        [130, 188], [150, 184], [170, 188], [150, 200],
        // Rahang bawah
        [105, 195], [195, 195], [125, 220], [175, 220], [150, 235],
    ]

    return (
        <svg
            viewBox="0 0 300 300"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        >
            {/* Oval face guide */}
            <ellipse
                ref={circleRef}
                cx="150" cy="148" rx="100" ry="125"
                fill="none"
                stroke={scanning ? '#3b82f6' : 'rgba(255,255,255,0.3)'}
                strokeWidth="1.5"
                strokeDasharray="20 6"
                strokeDashoffset="30"
                strokeLinecap="round"
            />
            {/* Corner brackets */}
            {[
                // top-left
                [50, 23, 50, 50, 77, 50],
                // top-right
                [250, 23, 250, 50, 223, 50],
                // bottom-left
                [50, 273, 50, 246, 77, 246],
                // bottom-right
                [250, 273, 250, 246, 223, 246],
            ].map(([x1, y1, x2, y2, x3, y3], i) => (
                <polyline
                    key={i}
                    points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                    fill="none"
                    stroke={scanning ? '#60a5fa' : 'rgba(255,255,255,0.4)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            ))}
            {/* Face landmark dots */}
            {dots.map(([cx, cy], i) => (
                <circle
                    key={i}
                    ref={el => dotRefs.current[i] = el}
                    cx={cx} cy={cy} r="2.5"
                    fill={scanning ? '#93c5fd' : 'rgba(255,255,255,0.4)'}
                    opacity="0.6"
                />
            ))}
        </svg>
    )
}

// ─── QR Scan Line Animation ───────────────────────────────────────────────────
function QrScanLine({ active }) {
    const lineRef = useRef(null)
    useEffect(() => {
        if (!active || !lineRef.current) return
        gsap.fromTo(lineRef.current,
            { top: '10%' },
            { top: '90%', duration: 1.8, ease: 'sine.inOut', repeat: -1, yoyo: true }
        )
        return () => gsap.killTweensOf(lineRef.current)
    }, [active])

    if (!active) return null
    return (
        <div ref={lineRef} className="absolute left-0 right-0 pointer-events-none" style={{ zIndex: 10 }}>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80 shadow-lg" />
        </div>
    )
}

// ─── Mini Map Leaflet ─────────────────────────────────────────────────────────
function MiniMap({ location }) {
    if (!location) return null
    return (
        <div className="rounded-xl overflow-hidden border border-slate-700" style={{ height: 180 }}>
            <MapContainer
                center={[location.lat, location.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.lat, location.lng]}>
                    <Popup>Lokasi Anda</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}

// ─── Face Camera Mode ─────────────────────────────────────────────────────────
function FaceCamera({ onCapture, disabled, location }) {
    const videoRef   = useRef(null)
    const canvasRef  = useRef(null)
    const [stream, setStream]       = useState(null)
    const [photo, setPhoto]         = useState(null)
    const [error, setCameraError]   = useState('')
    const [starting, setStarting]   = useState(false)

    const startCamera = async () => {
        setStarting(true); setCameraError('')
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            })
            setStream(s)
        } catch {
            setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera diberikan.')
        } finally { setStarting(false) }
    }

    const stopCamera = useCallback(() => {
        if (stream) stream.getTracks().forEach(t => t.stop())
        setStream(null)
    }, [stream])

    const capture = () => {
        const canvas = canvasRef.current
        const video  = videoRef.current
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        setPhoto(dataUrl)
        stopCamera()
        onCapture(dataUrl)
    }

    const retake = () => { setPhoto(null); onCapture(null); startCamera() }

    useEffect(() => {
        if (stream && videoRef.current) videoRef.current.srcObject = stream
    }, [stream])

    useEffect(() => () => stopCamera(), [])

    return (
        <div className="space-y-3">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            {!stream && !photo && (
                <button onClick={startCamera} disabled={disabled || starting}
                    className="w-full aspect-video rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 hover:border-blue-500/60 flex flex-col items-center justify-center gap-3 transition-all duration-200 group">
                    <div className="w-14 h-14 rounded-full bg-slate-700 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                        <svg className="w-7 h-7 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.867V15.13a1 1 0 01-1.447.898L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                        </svg>
                    </div>
                    <span className="text-slate-400 text-sm">{starting ? 'Menyiapkan kamera...' : 'Aktifkan Kamera Wajah'}</span>
                </button>
            )}

            {stream && !photo && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                    <FaceOverlay scanning={true} />
                    {/* Capture button */}
                    <button onClick={capture}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-blue-500 hover:scale-105 transition-transform shadow-lg shadow-blue-500/30" />
                    {/* GPS badge */}
                    {location && (
                        <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            GPS Aktif
                        </div>
                    )}
                </div>
            )}

            {photo && (
                <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 right-3">
                        <button onClick={retake} className="bg-slate-900/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-800 transition-colors">
                            Ulangi
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

// ─── QR Camera Mode ───────────────────────────────────────────────────────────
function QRCamera({ onScan, disabled }) {
    const videoRef   = useRef(null)
    const canvasRef  = useRef(null)
    const activeRef  = useRef(true)
    const [stream, setStream]     = useState(null)
    const [error, setError]       = useState('')
    const [starting, setStarting] = useState(false)
    const [scanning, setScanning] = useState(false)

    const stopCamera = () => {
        activeRef.current = false
        setScanning(false)
        if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null) }
    }

    const tick = useCallback(() => {
        if (!activeRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
            const ctx = canvas.getContext('2d')
            canvas.height = video.videoHeight
            canvas.width  = video.videoWidth
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
            if (code) {
                stopCamera()
                onScan(code.data)
                return
            }
        }
        if (activeRef.current) requestAnimationFrame(tick)
    }, [onScan])

    const startCamera = async () => {
        setStarting(true); setError('')
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            setStream(s)
            activeRef.current = true
            if (videoRef.current) {
                videoRef.current.srcObject = s
                videoRef.current.setAttribute('playsinline', true)
                videoRef.current.play()
                setScanning(true)
                requestAnimationFrame(tick)
            }
        } catch {
            setError('Kamera tidak dapat diakses. Pastikan izin kamera diberikan.')
        } finally { setStarting(false) }
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setError('')
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                const canvas = canvasRef.current
                if (!canvas) return
                const ctx = canvas.getContext('2d')
                canvas.width = img.width
                canvas.height = img.height
                ctx.drawImage(img, 0, 0, img.width, img.height)
                const imageData = ctx.getImageData(0, 0, img.width, img.height)
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
                if (code) {
                    onScan(code.data)
                } else {
                    setError('QR Code tidak ditemukan pada gambar yang diunggah.')
                }
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => () => stopCamera(), [stream])

    return (
        <div className="space-y-3">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            {!stream && (
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={startCamera} disabled={disabled || starting}
                        className="w-full aspect-video rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 flex flex-col items-center justify-center gap-3 transition-all duration-200 group p-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-700 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                            <svg className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z"/>
                            </svg>
                        </div>
                        <span className="text-slate-400 text-xs text-center">{starting ? 'Menyiapkan...' : 'Buka Kamera'}</span>
                    </button>
                    
                    <label className="w-full aspect-video rounded-xl bg-slate-800 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 flex flex-col items-center justify-center gap-3 transition-all duration-200 group cursor-pointer p-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-700 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                            <svg className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                        </div>
                        <span className="text-slate-400 text-xs text-center">Upload Gambar QR</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={disabled || starting} />
                    </label>
                </div>
            )}

            <div className={`relative rounded-xl overflow-hidden bg-black aspect-video ${!stream ? 'hidden' : ''}`}>
                <video ref={videoRef} muted className="w-full h-full object-cover" />
                {/* Corner brackets */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-52 h-52">
                        {/* corners */}
                        {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                          'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
                            <div key={i} className={`absolute w-8 h-8 ${cls} border-emerald-400 rounded-sm`} />
                        ))}
                        <QrScanLine active={scanning} />
                    </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur">Arahkan ke QR Code</span>
                </div>
                <button onClick={stopCamera} className="absolute top-3 right-3 bg-slate-800/80 backdrop-blur text-white text-xs px-2 py-1 rounded-lg border border-slate-600">
                    Tutup
                </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}

// ─── GPS + Map Component ─────────────────────────────────────────────────────
function GpsMapStatus({ onLocation }) {
    const [status, setStatus]     = useState('idle')
    const [location, setLocation] = useState(null)
    const [error, setError]       = useState('')

    const getLocation = () => {
        setStatus('loading'); setError('')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
                setLocation(loc)
                setStatus('success')
                onLocation(loc)
            },
            () => {
                setError('Gagal mendapatkan lokasi GPS. Pastikan GPS aktif dan izin diberikan.')
                setStatus('error')
            },
            { enableHighAccuracy: true, timeout: 12000 }
        )
    }

    useEffect(() => { getLocation() }, [])

    return (
        <div className="space-y-2">
            <div className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${
                status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
                status === 'error'   ? 'bg-red-500/10 border-red-500/30' :
                                      'bg-slate-800 border-slate-700'
            }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    status === 'success' ? 'bg-emerald-400 animate-pulse' :
                    status === 'error'   ? 'bg-red-400' : 'bg-slate-500 animate-pulse'
                }`} />
                <div className="flex-1 min-w-0">
                    {status === 'success' && (
                        <>
                            <p className="text-emerald-400 font-medium text-xs">Lokasi Terdeteksi</p>
                            <p className="text-slate-400 text-xs truncate">
                                {location.lat.toFixed(5)}, {location.lng.toFixed(5)} · ±{Math.round(location.accuracy)}m
                            </p>
                        </>
                    )}
                    {status === 'loading' && <p className="text-slate-400 text-xs">Mendeteksi lokasi GPS...</p>}
                    {status === 'error' && (
                        <div className="flex items-center gap-2">
                            <p className="text-red-400 text-xs flex-1">{error}</p>
                            <button onClick={getLocation} className="text-xs text-blue-400 hover:underline flex-shrink-0">Coba lagi</button>
                        </div>
                    )}
                </div>
            </div>
            {status === 'success' && location && <MiniMap location={location} />}
        </div>
    )
}

// ─── Main PresensiPage ────────────────────────────────────────────────────────
export default function PresensiPage() {
    const { user }        = useAuth()
    const pageRef         = usePageTransition()
    const tabContentRef   = useRef(null)

    const [todayPresensi, setTodayPresensi] = useState(null)
    const [holiday, setHoliday]             = useState(null)
    const [loadingToday, setLoadingToday]   = useState(true)
    const [location, setLocation]           = useState(null)
    const [selfieData, setSelfieData]       = useState(null)
    const [submitting, setSubmitting]       = useState(false)
    const [result, setResult]               = useState(null)
    const [error, setError]                 = useState('')
    const [tab, setTab]                     = useState('face') // face | qr
    const [qrToken, setQrToken]             = useState('')
    const [qrSubmitting, setQrSubmitting]   = useState(false)
    const [showRemoteForm, setShowRemoteForm] = useState(false)
    const [remoteFile, setRemoteFile]       = useState(null)
    const [remoteNote, setRemoteNote]       = useState('')

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => setRemoteFile(reader.result)
        reader.readAsDataURL(file)
    }

    const fetchToday = async () => {
        try { 
            const { data } = await api.get('/presensi/today')
            setTodayPresensi(data.data)
            setHoliday(data.holiday)
        }
        catch {} finally { setLoadingToday(false) }
    }

    useEffect(() => { fetchToday() }, [])

    const switchTab = (newTab) => {
        if (newTab === tab) return
        const dir = newTab === 'qr' ? 'right' : 'left'
        setTab(newTab)
        setSelfieData(null); setQrToken(''); setError(''); setResult(null)
        setTimeout(() => animateTabSwitch(tabContentRef.current, dir), 10)
    }

    // Auto-submit when QR scanned
    const handleQrScan = async (token) => {
        setQrToken(token)
        if (!location) { setError('Lokasi GPS belum terdeteksi. Tunggu sebentar.'); return }
        setQrSubmitting(true); setError('')
        try {
            const { data } = await api.post('/presensi/checkin', {
                lat: location.lat,
                lng: location.lng,
                accuracy_meter: location.accuracy,
                metode: 'qr_code',
                qr_token: token,
            })
            setResult(data)
            setTodayPresensi(data.data?.presensi)
        } catch (err) {
            if (err.response?.data?.error_code === 'LUAR_RADIUS') {
                setShowRemoteForm(true)
                setError('Anda berada di luar radius sekolah. Silakan lengkapi form presensi jarak jauh di bawah ini.')
            } else {
                setError(err.response?.data?.message || 'QR Code tidak valid atau sudah kadaluarsa.')
                setQrToken('')
            }
        } finally { setQrSubmitting(false) }
    }

    const handleCheckin = async () => {
        if (!selfieData) return setError('Foto wajah wajib diambil terlebih dahulu.')
        if (!location)   return setError('Lokasi GPS belum terdeteksi.')
        
        setError(''); setSubmitting(true)
        try {
            const payload = {
                lat: location.lat,
                lng: location.lng,
                accuracy_meter: location.accuracy,
                selfie_url: selfieData,
                metode: 'face',
            }
            const { data } = await api.post('/presensi/checkin', payload)
            setResult(data)
            setTodayPresensi(data.data?.presensi)
        } catch (err) {
            if (err.response?.data?.error_code === 'LUAR_RADIUS') {
                setShowRemoteForm(true)
                setError('Anda berada di luar radius sekolah. Silakan lengkapi form presensi jarak jauh di bawah ini.')
            } else {
                setError(err.response?.data?.message || 'Gagal melakukan check-in.')
            }
        } finally { setSubmitting(false) }
    }

    const handleRemoteSubmit = async () => {
        if (!location) return setError('Lokasi GPS belum terdeteksi.')
        if (!remoteFile) return setError('Bukti file bekerja jarak jauh wajib dilampirkan.')
        if (tab === 'face' && !selfieData) return setError('Foto wajah wajib diambil terlebih dahulu.')
        if (tab === 'qr' && !qrToken) return setError('QR Token tidak valid.')

        setError(''); setSubmitting(true)
        try {
            const payload = {
                lat: location.lat,
                lng: location.lng,
                accuracy_meter: location.accuracy,
                metode: tab === 'face' ? 'face' : 'qr_code',
                is_luar_radius: true,
                bukti_luar_radius: remoteFile,
                keterangan: remoteNote
            }
            if (tab === 'face') {
                payload.selfie_url = selfieData
            } else {
                payload.qr_token = qrToken
            }
            const { data } = await api.post('/presensi/checkin', payload)
            setResult(data)
            setTodayPresensi(data.data?.presensi)
            setShowRemoteForm(false)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim presensi jarak jauh.')
        } finally { setSubmitting(false) }
    }

    const handleCheckout = async () => {
        if (!selfieData) return setError('Selfie checkout wajib diambil.')
        setError(''); setSubmitting(true)
        try {
            const { data } = await api.post('/presensi/checkout', { selfie_url: selfieData })
            setResult(data); setTodayPresensi(data.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal melakukan check-out.')
        } finally { setSubmitting(false) }
    }

    const renderRemoteForm = () => (
        <div className="space-y-4 p-4 border border-blue-500/30 bg-blue-500/5 rounded-xl">
            <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                {tab === 'face' ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-600 flex-shrink-0">
                        <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    </div>
                )}
                <div>
                    <p className="text-white text-sm font-semibold">{tab === 'face' ? 'Foto Wajah Tersimpan' : 'QR Scan Berhasil'}</p>
                    <p className="text-slate-400 text-xs">Form Presensi Jarak Jauh</p>
                </div>
            </div>
            
            <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Upload Bukti Bekerja (Wajib)</label>
                <input 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-colors bg-slate-800 rounded-xl p-1.5 border border-slate-700"
                />
                {remoteFile && <p className="text-emerald-400 text-xs mt-2">✓ File berhasil dipilih</p>}
            </div>

            <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Catatan (Opsional)</label>
                <textarea 
                    value={remoteNote}
                    onChange={e => setRemoteNote(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Tambahkan catatan presensi jarak jauh Anda..."
                />
            </div>
            <button
                onClick={handleRemoteSubmit}
                disabled={submitting || !remoteFile}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
                {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Memproses...</>
                ) : 'Kirim Presensi Jarak Jauh'}
            </button>
        </div>
    )

    const now = dayjs()

    if (loadingToday) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div ref={pageRef} className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Presensi</h2>
                <p className="text-slate-400 text-sm mt-0.5">{now.format('dddd, D MMMM YYYY · HH:mm')}</p>
            </div>

            {/* ── Status Presensi / Libur ── */}
            {holiday ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
                    <span className="text-4xl mb-3 block">🎉</span>
                    <h3 className="text-emerald-400 font-bold text-lg mb-1">Selamat untuk berlibur!</h3>
                    <p className="text-slate-300 text-sm">Hari ini adalah hari libur: <span className="font-semibold text-white">{holiday.nama_libur}</span></p>
                    <p className="text-slate-500 text-xs mt-3">Fitur presensi dinonaktifkan pada hari libur.</p>
                </div>
            ) : todayPresensi?.waktu_checkout ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-lg">Presensi Selesai</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Masuk: {dayjs(todayPresensi.waktu_checkin).format('HH:mm')} ·
                            Pulang: {dayjs(todayPresensi.waktu_checkout).format('HH:mm')}
                        </p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm capitalize ${
                        todayPresensi.status_kehadiran === 'hadir' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>{todayPresensi.status_kehadiran}</span>
                </div>
            ) : null}

            {/* ── Check-In Form ── */}
            {!holiday && !todayPresensi && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">Check-in Presensi</p>
                            <p className="text-slate-500 text-xs">Pilih metode verifikasi kehadiran Anda</p>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="px-5 pt-4">
                        <div className="flex gap-1 p-1 bg-slate-800 rounded-xl">
                            <button
                                onClick={() => switchTab('face')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                                    tab === 'face'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                Pengenalan Wajah
                            </button>
                            <button
                                onClick={() => switchTab('qr')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg font-medium transition-all duration-200 ${
                                    tab === 'qr'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z"/>
                                </svg>
                                Scan QR Code
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div ref={tabContentRef} className="px-5 pb-5 pt-4 space-y-4">

                        {/* GPS + Map (always visible) */}
                        <GpsMapStatus onLocation={setLocation} />

                        {/* Face Tab */}
                        {tab === 'face' && (
                            <div className="space-y-4">
                                {!showRemoteForm ? (
                                    <>
                                        <div>
                                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">Foto Wajah</p>
                                            <FaceCamera onCapture={setSelfieData} disabled={submitting} location={location} />
                                        </div>
                                        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                                        {result && (
                                            <div className={`p-3 rounded-lg border text-sm ${result.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {result.message}
                                            </div>
                                        )}
                                        <button
                                            onClick={handleCheckin}
                                            disabled={submitting || !selfieData || !location}
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Memproses...</>
                                            ) : 'Check-In Sekarang'}
                                        </button>
                                    </>
                                ) : renderRemoteForm()}
                            </div>
                        )}

                        {/* QR Tab */}
                        {tab === 'qr' && (
                            <div className="space-y-4">
                                {!showRemoteForm ? (
                                    <>
                                        {qrSubmitting && (
                                            <div className="flex items-center justify-center gap-3 py-4">
                                                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-emerald-400 text-sm">Memvalidasi QR Code...</span>
                                            </div>
                                        )}
                                        {!qrToken && !qrSubmitting && (
                                            <>
                                                <div>
                                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">Scanner QR</p>
                                                    <QRCamera onScan={handleQrScan} disabled={qrSubmitting} />
                                                </div>
                                                <p className="text-slate-500 text-xs text-center">Arahkan kamera ke QR Code yang ditampilkan oleh Admin/Kepala Sekolah. Presensi akan tercatat otomatis.</p>
                                            </>
                                        )}
                                        {qrToken && result && (
                                            <div className={`p-4 rounded-xl border text-sm ${result.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                                {result.message}
                                            </div>
                                        )}
                                        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                                    </>
                                ) : renderRemoteForm()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Checked-in, belum checkout ── */}
            {!holiday && todayPresensi && !todayPresensi.waktu_checkout && (
                <div className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-emerald-400 font-semibold">Sudah Check-in</p>
                            <p className="text-slate-400 text-sm">
                                Masuk: {dayjs(todayPresensi.waktu_checkin).format('HH:mm')} ·
                                <span className={`ml-1 capitalize ${todayPresensi.status_kehadiran === 'terlambat' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {todayPresensi.status_kehadiran}
                                </span>
                                {todayPresensi.metode && (
                                    <span className="ml-1 text-slate-500">
                                        · via {todayPresensi.metode === 'face' ? 'Wajah' : todayPresensi.metode === 'qr_code' ? 'QR Code' : todayPresensi.metode}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <p className="text-white font-semibold">Check-out Presensi</p>
                        <FaceCamera onCapture={setSelfieData} disabled={submitting} location={location} />
                        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                        <button
                            onClick={handleCheckout}
                            disabled={submitting || !selfieData}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Memproses...</>
                            ) : 'Check-Out Sekarang'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
