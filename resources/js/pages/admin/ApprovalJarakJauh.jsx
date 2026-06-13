import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'
import PageHeader from '../../components/PageHeader'
import { gsap } from 'gsap'

export default function ApprovalJarakJauh() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [processing, setProcessing] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [lightboxImage, setLightboxImage] = useState(null)

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/presensi', {
                params: { is_luar_radius: true, status_approval_remote: filter }
            })
            setList(data.data?.data || [])
        } catch { }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchList() }, [filter])

    const handleApproval = async (action) => {
        if (!selectedItem) return
        setProcessing(true)
        try {
            await api.post(`/presensi/${selectedItem.id}/approve-remote`, { action })
            setSelectedItem(null)
            fetchList()
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses.')
        } finally {
            setProcessing(false)
        }
    }

    // Lightbox Component
    const Lightbox = () => {
        const ref = useRef(null)
        useLayoutEffect(() => {
            if (ref.current && lightboxImage) {
                gsap.fromTo(ref.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' })
            }
        }, [lightboxImage])

        if (!lightboxImage) return null
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out" onClick={() => setLightboxImage(null)}>
                <img ref={ref} src={lightboxImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl" />
            </div>
        )
    }

    // Detail Modal Component
    const DetailModal = () => {
        const ref = useRef(null)
        useLayoutEffect(() => {
            if (ref.current && selectedItem) {
                gsap.fromTo(ref.current, { opacity: 0, y: 30, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
            }
        }, [selectedItem])

        if (!selectedItem) return null
        const item = selectedItem

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null) }}>
                <div ref={ref} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-full overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                        <div>
                            <h3 className="text-white font-semibold text-lg">Detail Presensi Jarak Jauh</h3>
                            <p className="text-slate-400 text-sm mt-1">{item.pengguna?.nama_lengkap} • {item.pengguna?.nip}</p>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                            ✕
                        </button>
                    </div>

                    <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                        {/* Waktu & Lokasi */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Waktu Check-in</p>
                                    <p className="text-white font-medium">{dayjs(item.tanggal).format('DD MMM YYYY')} - {item.waktu_checkin ? dayjs(item.waktu_checkin).format('HH:mm') : '-'}</p>
                                </div>
                                {item.gpsLog && (
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Peta Lokasi Absen</p>
                                        <a href={`https://www.google.com/maps?q=${item.gpsLog.lat_checkin},${item.gpsLog.lng_checkin}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 decoration-blue-500/30 flex items-center gap-1">
                                            {item.gpsLog.lat_checkin}, {item.gpsLog.lng_checkin}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Keterangan */}
                        {item.keterangan && (
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Keterangan / Catatan</p>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{item.keterangan}</p>
                                </div>
                            </div>
                        )}

                        {/* Foto & Bukti */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {item.selfie_url && (
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Foto Selfie</p>
                                    <div className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800 border border-slate-700 cursor-zoom-in" onClick={() => setLightboxImage(item.selfie_url)}>
                                        <img src={item.selfie_url} alt="Selfie" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white bg-black/60 px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">Lihat Pop Up</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-xs text-center mt-2">Wajah pengguna saat melakukan presensi</p>
                                </div>
                            )}
                            {item.bukti_luar_radius_url && (
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Bukti Dokumen</p>
                                    <div className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800 border border-slate-700 cursor-zoom-in" onClick={() => setLightboxImage(item.bukti_luar_radius_url)}>
                                        <img src={item.bukti_luar_radius_url} alt="Bukti" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white bg-black/60 px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">Lihat Pop Up</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-xs text-center mt-2">Dokumen bukti bekerja jarak jauh</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {item.status_approval_remote === 'pending' && (
                        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-800/30 flex gap-3">
                            <button onClick={() => handleApproval('approved')} disabled={processing}
                                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50">
                                {processing ? 'Memproses...' : 'Setuju'}
                            </button>
                            <button onClick={() => handleApproval('rejected')} disabled={processing}
                                className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50">
                                {processing ? 'Memproses...' : 'Tolak'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <PageHeader 
                title="Approval Presensi Jarak Jauh" 
                description="Review dan setujui presensi di luar radius" 
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${filter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-700/30" />)
                ) : list.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                        <span className="text-5xl block mb-4 opacity-50">📭</span>
                        <p className="text-slate-400">Tidak ada pengajuan {filter}</p>
                    </div>
                ) : (
                    list.map(item => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                            <div className="flex items-start gap-4 sm:gap-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg shadow-inner">
                                    {item.pengguna?.foto_profil_url
                                        ? <img src={item.pengguna.foto_profil_url} className="w-full h-full object-cover rounded-full" />
                                        : item.pengguna?.nama_lengkap?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                        <p className="text-white font-semibold text-base sm:text-lg">{item.pengguna?.nama_lengkap}</p>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${item.status_approval_remote === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : item.status_approval_remote === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {item.status_approval_remote}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-3">
                                        {item.pengguna?.nip} <span className="mx-1.5 opacity-50">•</span> {dayjs(item.tanggal).format('DD MMM YYYY')} (Masuk: {item.waktu_checkin ? dayjs(item.waktu_checkin).format('HH:mm') : '-'})
                                    </p>

                                    {item.keterangan && (
                                        <div className="mb-4 bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                                            <p className="text-slate-300 text-sm line-clamp-2">{item.keterangan}</p>
                                        </div>
                                    )}

                                    <button onClick={() => setSelectedItem(item)} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-5 py-2.5 rounded-xl inline-flex items-center">
                                        Lihat Detail
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <DetailModal />
            <Lightbox />
        </div>
    )
}
