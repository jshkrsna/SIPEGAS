import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'
import { gsap } from 'gsap'
import PageHeader from '../../components/PageHeader'

const JENIS_OPTS = [
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'cuti', label: 'Cuti' },
    { value: 'tugas_luar', label: 'Tugas Luar' },
]

const STATUS_STYLES = {
    pending:  'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

export default function PengajuanIzin() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [inputType, setInputType] = useState('file') // 'file' or 'url'
    const [form, setForm] = useState({
        jenis: 'izin',
        tanggal_mulai: '',
        tanggal_selesai: '',
        alasan: '',
        bukti_url: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [modalItem, setModalItem] = useState(null)
    const [lightboxImage, setLightboxImage] = useState(null)
    
    const containerRef = useRef(null)

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/izin-cuti')
            setList(data.data?.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { 
        fetchList() 
        if (containerRef.current) {
            gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        
        if (!form.bukti_url) {
            setError('Bukti wajib diisi (Upload file atau Link URL).')
            return
        }

        setSubmitting(true)
        try {
            await api.post('/izin-cuti', form)
            setSuccess('Pengajuan berhasil dikirim!')
            setShowForm(false)
            setForm({ jenis: 'izin', tanggal_mulai: '', tanggal_selesai: '', alasan: '', bukti_url: '' })
            fetchList()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            const errs = err.response?.data?.errors
            if (errs) setError(Object.values(errs).flat().join(', '))
            else setError(err.response?.data?.message || 'Gagal mengirim pengajuan.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = async (id) => {
        if (!confirm('Batalkan pengajuan ini?')) return
        try {
            await api.delete(`/izin-cuti/${id}`)
            fetchList()
            if (modalItem && modalItem.id === id) setModalItem(null)
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal membatalkan.')
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
                            <span>📄 Detail Pengajuan Saya</span>
                        </h3>
                        <button onClick={() => setModalItem(null)} className="text-slate-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700">✕</button>
                    </div>
                    
                    <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Status</p>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium uppercase w-fit ${STATUS_STYLES[modalItem.status_approval]}`}>
                                        {modalItem.status_approval === 'approved' ? 'DISETUJUI' : modalItem.status_approval === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                                    </span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Jenis</p>
                                    <p className="text-slate-200 font-medium capitalize">{modalItem.jenis}</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Tanggal</p>
                                <p className="text-slate-200 font-medium">{dayjs(modalItem.tanggal_mulai).format('DD MMM YYYY')} — {dayjs(modalItem.tanggal_selesai).format('DD MMM YYYY')} ({dayjs(modalItem.tanggal_selesai).diff(modalItem.tanggal_mulai, 'day') + 1} hari)</p>
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
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Catatan dari Approver</p>
                                    <p className="text-slate-300 text-sm italic">"{modalItem.catatan_approver}"</p>
                                </div>
                            )}
                        </div>

                        {modalItem.status_approval === 'pending' && (
                            <div className="border-t border-slate-800 pt-5">
                                <button onClick={() => handleCancel(modalItem.id)}
                                    className="w-full py-3 rounded-xl text-red-400 hover:text-white font-semibold text-sm transition-colors border border-red-500/30 hover:bg-red-500 shadow-lg">
                                    Batalkan Pengajuan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const formRef = useRef(null)

    useEffect(() => {
        if (showForm && formRef.current) {
            gsap.fromTo(formRef.current, { opacity: 0, height: 0 }, { opacity: 1, height: 'auto', duration: 0.4, ease: 'power2.out' })
        }
    }, [showForm])

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto" ref={containerRef}>
            {/* Header like Presensi */}
            <PageHeader
                title="Izin & Cuti"
                description="Kelola pengajuan perizinan ketidakhadiran"
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                action={!showForm && (
                    <button onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                        <span>+</span> Pengajuan Baru
                    </button>
                )}
            />

            {/* Success Alert */}
            {success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
                    <span className="text-lg">✅</span> {success}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div ref={formRef} className="overflow-hidden mb-6">
                    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">📝</span>
                                Form Pengajuan
                            </h3>
                        </div>
                        {error && <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">Jenis</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {JENIS_OPTS.map(opt => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setForm(f => ({ ...f, jenis: opt.value }))}
                                            className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                                                form.jenis === opt.value
                                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-900/20'
                                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                                            }`}
                                        >{opt.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">Tanggal Mulai</label>
                                    <input type="date" required value={form.tanggal_mulai}
                                        onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                                        min={dayjs().format('YYYY-MM-DD')}
                                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">Tanggal Selesai</label>
                                    <input type="date" required value={form.tanggal_selesai}
                                        onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                                        min={form.tanggal_mulai || dayjs().format('YYYY-MM-DD')}
                                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">Alasan</label>
                                <textarea required rows={3} value={form.alasan}
                                    onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                                    placeholder="Jelaskan alasan izin / cuti Anda..."
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none transition-colors" />
                            </div>
                            
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">Bukti (Wajib)</label>
                                <div className="flex gap-2 mb-3 bg-slate-800/30 p-1 rounded-xl w-fit border border-slate-700/50">
                                    <button type="button" onClick={() => setInputType('file')} 
                                        className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-colors ${inputType === 'file' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                                        📁 Upload File
                                    </button>
                                    <button type="button" onClick={() => setInputType('url')} 
                                        className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-colors ${inputType === 'url' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
                                        🔗 Link URL
                                    </button>
                                </div>
                                
                                {inputType === 'file' ? (
                                    <input type="file" accept="image/*,.pdf" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if(file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setForm(f => ({ ...f, bukti_url: reader.result }));
                                            reader.readAsDataURL(file);
                                        } else {
                                            setForm(f => ({ ...f, bukti_url: '' }));
                                        }
                                    }} className="w-full bg-slate-800/50 border border-slate-700 text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" required={!form.bukti_url || !form.bukti_url.startsWith('data:')} />
                                ) : (
                                    <input type="url" value={form.bukti_url && !form.bukti_url.startsWith('data:') ? form.bukti_url : ''} 
                                        onChange={e => setForm(f => ({ ...f, bukti_url: e.target.value }))} 
                                        required={inputType === 'url'} 
                                        placeholder="https://drive.google.com/..." 
                                        className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
                                )}
                            </div>

                            <div className="flex gap-3 pt-3 border-t border-slate-800/50">
                                <button type="submit" disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20">
                                    {submitting ? '⏳ Mengirim...' : 'Kirim Pengajuan'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl text-sm transition-colors">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-700/30" />)
                ) : list.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                        <span className="text-5xl block mb-4 opacity-50">📋</span>
                        <p className="text-slate-400">Belum ada riwayat izin/cuti</p>
                    </div>
                ) : (
                    list.map(item => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors group">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase ${STATUS_STYLES[item.status_approval]}`}>
                                            {item.status_approval === 'approved' ? 'DISETUJUI' : item.status_approval === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                                        </span>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 capitalize font-medium">{item.jenis}</span>
                                        <span className="text-slate-500 text-xs">
                                            {dayjs(item.tanggal_mulai).format('DD MMM YYYY')} — {dayjs(item.tanggal_selesai).format('DD MMM YYYY')} ({dayjs(item.tanggal_selesai).diff(item.tanggal_mulai, 'day') + 1} hari)
                                        </span>
                                    </div>
                                    <p className="text-white text-sm font-medium mb-1 leading-relaxed">{item.alasan}</p>
                                    
                                    {item.catatan_approver && (
                                        <div className="mt-3 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Catatan {item.approved_by?.nama_lengkap ? `dari ${item.approved_by.nama_lengkap}` : 'Approver'}</p>
                                            <p className="text-slate-300 text-sm italic">"{item.catatan_approver}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                                    <button onClick={() => setModalItem(item)}
                                        className="flex-1 sm:w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700/50 hover:border-slate-600 text-center">
                                        Lihat Detail
                                    </button>
                                    {item.status_approval === 'pending' && (
                                        <button onClick={() => handleCancel(item.id)}
                                            className="flex-1 sm:w-full px-4 py-2 text-xs font-medium text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500 rounded-xl transition-colors flex-shrink-0">
                                            Batalkan
                                        </button>
                                    )}
                                </div>
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
