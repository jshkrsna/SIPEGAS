import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import ReactDOM from 'react-dom'
import api from '../../api/axios'
import dayjs from 'dayjs'
import { gsap } from 'gsap'
import PageHeader from '../../components/PageHeader'
import { usePageTransition } from '../../utils/usePageTransition'

const STATUS_STYLES = {
    pending:  'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/30',
}

const JENIS_ICON = {
    izin: '📝',
    cuti: '🏖️',
    sakit: '🏥',
}

const TABS = [
    { key: 'pending',  label: 'Menunggu',  dot: 'bg-amber-400' },
    { key: 'approved', label: 'Disetujui', dot: 'bg-emerald-400' },
    { key: 'rejected', label: 'Ditolak',   dot: 'bg-red-400' },
]

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
    const ref = useRef(null)
    useLayoutEffect(() => {
        if (ref.current) gsap.fromTo(ref.current, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' })
    }, [])
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" onClick={onClose}>
            <button onClick={onClose} className="fixed top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <img ref={ref} src={src} alt="Preview" className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl cursor-default" onClick={e => e.stopPropagation()} />
        </div>,
        document.body
    )
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onApprove, processing, lightboxSrc, setLightboxSrc }) {
    const overlayRef = useRef(null)
    const cardRef = useRef(null)
    const [catatan, setCatatan] = useState('')

    useLayoutEffect(() => {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
        gsap.fromTo(cardRef.current, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out' })
    }, [])

    const handleClose = () => {
        gsap.to(cardRef.current, { y: 16, opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: onClose })
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.18 })
    }

    const durasi = dayjs(item.tanggal_selesai).diff(item.tanggal_mulai, 'day') + 1

    return ReactDOM.createPortal(
        <div ref={overlayRef} className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
            <div ref={cardRef} className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-slate-700/60 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Drag handle – mobile */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-700" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {item.pengguna?.nama_lengkap?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm leading-tight">{item.pengguna?.nama_lengkap}</p>
                            <p className="text-slate-500 text-xs">{item.pengguna?.nip}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {/* Status + Jenis row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${STATUS_STYLES[item.status_approval]}`}>
                            {item.status_approval === 'approved' ? 'Disetujui' : item.status_approval === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-medium capitalize bg-slate-800 text-slate-300 border border-slate-700">
                            {JENIS_ICON[item.jenis] || '📄'} {item.jenis}
                        </span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {durasi} hari
                        </span>
                    </div>

                    {/* Tanggal */}
                    <div>
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Tanggal</p>
                        <p className="text-slate-200 text-sm font-medium">
                            {dayjs(item.tanggal_mulai).format('DD MMM YYYY')}
                            {durasi > 1 && <> &ndash; {dayjs(item.tanggal_selesai).format('DD MMM YYYY')}</>}
                        </p>
                    </div>

                    {/* Alasan */}
                    <div>
                        <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Alasan</p>
                        <p className="text-slate-200 text-sm leading-relaxed">{item.alasan}</p>
                    </div>

                    {/* Bukti */}
                    {item.bukti_url && (
                        <div>
                            <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-2">Lampiran</p>
                            {item.bukti_url.match(/\.(jpeg|jpg|gif|png)/i) || item.bukti_url.startsWith('data:image') ? (
                                <button onClick={() => setLightboxSrc(item.bukti_url)}
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-3 py-2 rounded-lg transition-colors w-full justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    Lihat Gambar Bukti
                                </button>
                            ) : (
                                <a href={item.bukti_url} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-3 py-2 rounded-lg transition-colors w-full justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                                    Buka Dokumen
                                </a>
                            )}
                        </div>
                    )}

                    {/* Catatan approver (sudah diproses) */}
                    {item.status_approval !== 'pending' && item.catatan_approver && (
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                            <p className="text-slate-500 text-[11px] uppercase tracking-wider mb-1">Catatan</p>
                            <p className="text-slate-300 text-sm italic">"{item.catatan_approver}"</p>
                        </div>
                    )}

                    {/* Action area – pending only */}
                    {item.status_approval === 'pending' && (
                        <div className="border-t border-slate-800 pt-4 space-y-3">
                            <textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)}
                                placeholder="Catatan untuk pemohon (opsional)..."
                                className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none transition-colors" />
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onApprove('rejected', catatan)} disabled={processing}
                                    className="py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 transition-all disabled:opacity-50">
                                    {processing ? '⏳' : 'Tolak'}
                                </button>
                                <button onClick={() => onApprove('approved', catatan)} disabled={processing}
                                    className="py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 transition-all disabled:opacity-50">
                                    {processing ? '⏳' : 'Setujui'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

// ─── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onSelect }) {
    const durasi = dayjs(item.tanggal_selesai).diff(item.tanggal_mulai, 'day') + 1
    return (
        <button onClick={() => onSelect(item)}
            className="w-full text-left bg-slate-900 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.pengguna?.nama_lengkap?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-slate-200 font-medium text-sm truncate">{item.pengguna?.nama_lengkap}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${STATUS_STYLES[item.status_approval]}`}>
                            {item.status_approval === 'approved' ? 'Disetujui' : item.status_approval === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                        {item.pengguna?.nip && <span className="mr-1.5">{item.pengguna.nip}</span>}
                        <span className="capitalize">{JENIS_ICON[item.jenis] || '📄'} {item.jenis}</span>
                        <span className="mx-1.5">·</span>
                        {dayjs(item.tanggal_mulai).format('DD MMM YYYY')}
                        {durasi > 1 && <> – {dayjs(item.tanggal_selesai).format('DD MMM YYYY')}</>}
                        <span className="ml-1 text-slate-600">({durasi}h)</span>
                    </p>
                </div>
                <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
            </div>
        </button>
    )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ApprovalIzin() {
    const [list, setList]         = useState([])
    const [loading, setLoading]   = useState(true)
    const [filter, setFilter]     = useState('pending')
    const [processing, setProcessing] = useState(false)
    const [modalItem, setModalItem]   = useState(null)
    const [lightboxSrc, setLightboxSrc] = useState(null)
    const pageRef = usePageTransition()

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/izin-cuti', { params: { status: filter } })
            setList(data.data?.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { fetchList() }, [filter])

    const handleApproval = async (action, catatan) => {
        if (!modalItem) return
        setProcessing(true)
        try {
            await api.patch(`/izin-cuti/${modalItem.id}/approve`, { action, catatan_approver: catatan })
            setModalItem(null)
            fetchList()
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses.')
        } finally { setProcessing(false) }
    }

    const pendingCount = filter === 'pending' ? list.length : null

    return (
        <div ref={pageRef} className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
            <PageHeader 
                title="Approval Izin & Cuti" 
                description="Review dan kelola pengajuan ketidakhadiran pegawai" 
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all flex items-center gap-2 ${
                            filter === t.key 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}>
                        {t.label}
                        {t.key === 'pending' && pendingCount > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === t.key ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-500'}`}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-[72px] rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p className="text-sm">Tidak ada pengajuan {TABS.find(t => t.key === filter)?.label.toLowerCase()}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {list.map(item => (
                        <ItemCard key={item.id} item={item} onSelect={setModalItem} />
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalItem && (
                <DetailModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                    onApprove={handleApproval}
                    processing={processing}
                    lightboxSrc={lightboxSrc}
                    setLightboxSrc={setLightboxSrc}
                />
            )}

            {/* Lightbox */}
            {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
        </div>
    )
}
