import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import { usePageTransition } from '../../utils/usePageTransition'
import { gsap } from 'gsap'
import dayjs from 'dayjs'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_STYLES = {
    hadir:     'bg-emerald-500/20 text-emerald-400',
    terlambat: 'bg-amber-500/20 text-amber-400',
    izin:      'bg-blue-500/20 text-blue-400',
    cuti:      'bg-violet-500/20 text-violet-400',
    alpha:     'bg-red-500/20 text-red-400',
}

const METODE_LABEL = {
    face:        'Wajah',
    qr_code:     'QR Code',
    geolocation: 'GPS',
}

const METODE_STYLE = {
    face:        'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    qr_code:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    geolocation: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
}

// ─── Location Modal ───────────────────────────────────────────────────────────
function LocationModal({ presensi, onClose }) {
    const modalRef = useRef(null)
    const lat = parseFloat(presensi.lat_checkin)
    const lng = parseFloat(presensi.lng_checkin)

    useEffect(() => {
        gsap.fromTo(modalRef.current,
            { opacity: 0, scale: 0.95, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
        )
    }, [])

    const handleClose = () => {
        gsap.to(modalRef.current, {
            opacity: 0, scale: 0.95, y: 10, duration: 0.18, ease: 'power2.in',
            onComplete: onClose
        })
    }

    const hasLocation = !isNaN(lat) && !isNaN(lng) && lat !== 0

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleClose}>
            <div ref={modalRef} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-white font-semibold text-sm">Lokasi Check-in</h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {presensi.pengguna?.nama_lengkap || 'Pegawai'} · {dayjs(presensi.tanggal).format('DD MMM YYYY')}
                        </p>
                    </div>
                    <button onClick={handleClose} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Map */}
                <div style={{ height: 260 }}>
                    {hasLocation ? (
                        <MapContainer center={[lat, lng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={true} scrollWheelZoom={false}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[lat, lng]}>
                                <Popup>{presensi.pengguna?.nama_lengkap || 'Lokasi Check-in'}</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                            Data lokasi tidak tersedia
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-5 py-4 grid grid-cols-2 gap-3 border-t border-slate-800">
                    <div>
                        <p className="text-slate-500 text-xs">Koordinat</p>
                        <p className="text-white text-xs font-mono mt-0.5">
                            {hasLocation ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs">Metode</p>
                        <p className="text-white text-xs mt-0.5">{METODE_LABEL[presensi.metode] || presensi.metode || '—'}</p>
                    </div>
                    {presensi.selfie_url && (
                        <div className="col-span-2">
                            <p className="text-slate-500 text-xs mb-1.5">Foto Selfie</p>
                            <img src={presensi.selfie_url} alt="Selfie" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RiwayatPresensi() {
    const { user }    = useAuth()
    const pageRef     = usePageTransition()
    const [data, setData]           = useState(null)
    const [loading, setLoading]     = useState(true)
    const [selectedPresensi, setSelectedPresensi] = useState(null)
    const [filters, setFilters]     = useState({
        bulan: dayjs().month() + 1,
        tahun: dayjs().year(),
        status: '',
    })

    const isAdmin = user?.role === 'admin' || user?.role === 'kepala_sekolah'

    const fetchData = async (page = 1) => {
        setLoading(true)
        try {
            const params = { ...filters, page, per_page: 20 }
            const { data: res } = await api.get('/presensi', { params })
            setData(res.data)
        } catch {} finally { setLoading(false) }
    }

    useEffect(() => { fetchData(1) }, [filters])

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: dayjs().month(i).format('MMMM') }))

    return (
        <div ref={pageRef} className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-white">Riwayat Presensi</h2>
                <p className="text-slate-400 text-sm mt-0.5">Data presensi per bulan</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <select value={filters.bulan} onChange={e => setFilters(f => ({ ...f, bulan: +e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={filters.tahun} onChange={e => setFilters(f => ({ ...f, tahun: +e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Semua Status</option>
                    {['hadir', 'terlambat', 'izin', 'cuti', 'alpha'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Tanggal</th>
                                        {isAdmin && <th className="text-left px-4 py-3 text-slate-400 font-medium">Pegawai</th>}
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Masuk</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Pulang</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Metode</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Terlambat</th>
                                        {isAdmin && <th className="text-left px-4 py-3 text-slate-400 font-medium">Lokasi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.data || []).map(p => (
                                        <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{dayjs(p.tanggal).format('DD MMM YYYY')}</td>
                                            {isAdmin && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs flex-shrink-0 overflow-hidden">
                                                            {p.pengguna?.foto_profil_url
                                                                ? <img src={p.pengguna.foto_profil_url} className="w-full h-full object-cover" />
                                                                : p.pengguna?.nama_lengkap?.charAt(0)
                                                            }
                                                        </div>
                                                        <span className="text-white text-sm whitespace-nowrap">{p.pengguna?.nama_lengkap}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-slate-300">
                                                {p.waktu_checkin ? dayjs(p.waktu_checkin).format('HH:mm') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {p.waktu_checkout ? dayjs(p.waktu_checkout).format('HH:mm') : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[p.status_kehadiran] || 'bg-slate-700 text-slate-400'}`}>
                                                    {p.status_kehadiran}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.metode ? (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${METODE_STYLE[p.metode] || 'bg-slate-700 text-slate-400'}`}>
                                                        {METODE_LABEL[p.metode] || p.metode}
                                                    </span>
                                                ) : <span className="text-slate-600">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {p.terlambat_menit > 0 ? `${p.terlambat_menit} menit` : '—'}
                                            </td>
                                            {isAdmin && (
                                                <td className="px-4 py-3">
                                                    {(p.lat_checkin && parseFloat(p.lat_checkin) !== 0) ? (
                                                        <button
                                                            onClick={() => setSelectedPresensi(p)}
                                                            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                                                        >
                                                            Lihat Peta
                                                        </button>
                                                    ) : <span className="text-slate-600 text-xs">—</span>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {(!data?.data || data.data.length === 0) && (
                                        <tr>
                                            <td colSpan={isAdmin ? 8 : 6} className="px-4 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                                    </svg>
                                                    <span>Tidak ada data presensi</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data && data.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                                <p className="text-slate-400 text-xs">{data.from}–{data.to} dari {data.total} data</p>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchData(data.current_page - 1)} disabled={data.current_page === 1}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs disabled:opacity-40 hover:bg-slate-700 transition-colors">
                                        ← Prev
                                    </button>
                                    <button onClick={() => fetchData(data.current_page + 1)} disabled={data.current_page === data.last_page}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs disabled:opacity-40 hover:bg-slate-700 transition-colors">
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Location Modal */}
            {selectedPresensi && (
                <LocationModal presensi={selectedPresensi} onClose={() => setSelectedPresensi(null)} />
            )}
        </div>
    )
}
