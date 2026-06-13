import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'
import { gsap } from 'gsap'

const STATUS_STYLES = {
    pending:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default function ApprovalIzin() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [processing, setProcessing] = useState(false)
    const [modalItem, setModalItem] = useState(null)
    const [catatan, setCatatan] = useState('')
    const [lightboxImage, setLightboxImage] = useState(null)

    const containerRef = useRef(null)

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/izin-cuti', { params: { status: filter } })
            setList(data.data?.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { 
        fetchList() 
    }, [filter])

    useLayoutEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        }
    }, [])

    const handleApproval = async (action) => {
        if (!modalItem) return
        setProcessing(true)
        try {
            await api.patch(`/izin-cuti/${modalItem.id}/approve`, {
                action: action,
                catatan_approver: catatan,
            })
            setModalItem(null)
            setCatatan('')
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
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setLightboxImage(null) }}>
                <img ref={ref} src={lightboxImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()} />
                <button onClick={() => setLightboxImage(null)} className="fixed top-4 right-4 w-10 h-10 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
                    ✕
                </button>
            </div>
        )
    }

    // Modal Component
    const Modal = () => {
        const ref = useRef(null)
        useLayoutEffect(() => {
            if (ref.current && modalItem) {
                gsap.fromTo(ref.current, { opacity: 0, y: 30, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' })
            }
        }, [modalItem])

        if (!modalItem) return null

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setModalItem(null) }}>
                <div ref={ref} className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center flex-shrink-0">
                        <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                            <span>📄 Detail Pengajuan</span>
                        </h3>
                        <button onClick={() => setModalItem(null)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700">✕</button>
                    </div>
                    
                    <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-xl shadow-inner">
                                {modalItem.pengguna?.nama_lengkap?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white font-semibold text-lg">{modalItem.pengguna?.nama_lengkap}</p>
                                <p className="text-slate-400 text-sm">{modalItem.pengguna?.nip}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Jenis</p>
                                    <p className="text-slate-200 font-medium capitalize">{modalItem.jenis}</p>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Durasi</p>
                                    <p className="text-slate-200 font-medium">{dayjs(modalItem.tanggal_selesai).diff(modalItem.tanggal_mulai, 'day') + 1} hari</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Tanggal</p>
                                <p className="text-slate-200 font-medium">{dayjs(modalItem.tanggal_mulai).format('DD MMM YYYY')} — {dayjs(modalItem.tanggal_selesai).format('DD MMM YYYY')}</p>
                            </div>

                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Alasan</p>
                                <p className="text-slate-200 text-sm leading-relaxed">{modalItem.alasan}</p>
                            </div>

                            {modalItem.bukti_url && (
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Bukti Lampiran</p>
                                    {modalItem.bukti_url.match(/\.(jpeg|jpg|gif|png)$/i) || modalItem.bukti_url.startsWith('data:image') ? (
                                        <button onClick={() => setLightboxImage(modalItem.bukti_url)} className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-colors w-full justify-center">
                                            <span>🖼️</span> Lihat Gambar Bukti
                                        </button>
                                    ) : (
                                        <a href={modalItem.bukti_url} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-colors w-full justify-center">
                                            <span>🔗</span> Buka Lampiran Dokumen
                                        </a>
                                    )}
                                </div>
                            )}

                            {modalItem.status_approval !== 'pending' && modalItem.catatan_approver && (
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Catatan Anda</p>
                                    <p className="text-slate-300 text-sm italic">"{modalItem.catatan_approver}"</p>
                                </div>
                            )}
                        </div>

                        {modalItem.status_approval === 'pending' && (
                            <div className="border-t border-slate-800 pt-5">
                                <p className="text-slate-400 text-sm mb-3">Tambahkan catatan (opsional) untuk pemohon:</p>
                                <textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)}
                                    placeholder="Tuliskan pesan persetujuan / penolakan..."
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none mb-5 transition-colors" />
                                
                                <div className="flex gap-3">
                                    <button onClick={() => handleApproval('approved')} disabled={processing}
                                        className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg bg-[#10b981] hover:bg-[#059669] shadow-emerald-600/20 disabled:opacity-50">
                                        {processing ? '⏳' : '✅ Setujui'}
                                    </button>
                                    <button onClick={() => handleApproval('rejected')} disabled={processing}
                                        className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg bg-[#ef4444] hover:bg-[#dc2626] shadow-red-600/20 disabled:opacity-50">
                                        {processing ? '⏳' : '❌ Tolak'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto" ref={containerRef}>
            {/* Header */}
            <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xl sm:text-2xl">📋</span>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Approval Izin & Cuti</h2>
                        <p className="text-slate-400 text-sm mt-0.5">Review dan kelola pengajuan ketidakhadiran pegawai</p>
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                            filter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
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
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg shadow-inner">
                                    {item.pengguna?.nama_lengkap?.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-white font-semibold">{item.pengguna?.nama_lengkap}</p>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[item.status_approval]}`}>
                                            {item.status_approval}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {item.pengguna?.nip} <span className="mx-1.5 opacity-50">•</span> {dayjs(item.tanggal_mulai).format('DD MMM YYYY')} ({item.jenis})
                                    </p>
                                </div>
                            </div>
                            <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                                <button onClick={() => { setModalItem(item); setCatatan('') }}
                                    className="flex-1 sm:w-full px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors border border-slate-700/50 hover:border-slate-600 text-center">
                                    Lihat Detail
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal />
            <Lightbox />
        </div>
    )
}
