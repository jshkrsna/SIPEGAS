import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'

const STATUS_STYLES = {
    pending:  'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
}

export default function ApprovalIzin() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [processing, setProcessing] = useState(null)
    const [modal, setModal] = useState(null) // { id, action }
    const [catatan, setCatatan] = useState('')

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/izin-cuti', { params: { status: filter } })
            setList(data.data?.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { fetchList() }, [filter])

    const handleApproval = async () => {
        if (!modal) return
        setProcessing(modal.id)
        try {
            await api.patch(`/izin-cuti/${modal.id}/approve`, {
                action: modal.action,
                catatan_approver: catatan,
            })
            setModal(null)
            setCatatan('')
            fetchList()
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memproses.')
        } finally {
            setProcessing(null)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Approval Izin / Cuti</h2>
                <p className="text-slate-400 text-sm mt-1">Review dan setujui pengajuan pegawai</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                            filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-800 animate-pulse" />)
                ) : list.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-4xl">📭</span>
                        <p className="text-slate-400 mt-3">Tidak ada pengajuan {filter}</p>
                    </div>
                ) : (
                    list.map(item => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    {item.pengguna?.nama_lengkap?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-white font-medium">{item.pengguna?.nama_lengkap}</p>
                                        <span className="text-slate-500 text-xs">{item.pengguna?.nip}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[item.status_approval]}`}>
                                            {item.status_approval}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">{item.jenis}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm">{item.alasan}</p>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {dayjs(item.tanggal_mulai).format('DD MMM YYYY')} — {dayjs(item.tanggal_selesai).format('DD MMM YYYY')}
                                        {' '}· {dayjs(item.tanggal_selesai).diff(item.tanggal_mulai, 'day') + 1} hari
                                    </p>
                                    {item.bukti_url && (
                                        <a href={item.bukti_url} target="_blank" rel="noreferrer"
                                            className="text-blue-400 text-xs hover:underline mt-1 inline-block">📎 Lihat Bukti</a>
                                    )}
                                    {item.catatan_approver && (
                                        <p className="text-slate-500 text-xs mt-1 italic">Catatan: {item.catatan_approver}</p>
                                    )}
                                </div>
                                {item.status_approval === 'pending' && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => { setModal({ id: item.id, action: 'approved' }); setCatatan('') }}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors">
                                            ✓ Setuju
                                        </button>
                                        <button onClick={() => { setModal({ id: item.id, action: 'rejected' }); setCatatan('') }}
                                            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors">
                                            ✕ Tolak
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-white font-semibold text-lg mb-1">
                            {modal.action === 'approved' ? '✅ Setujui Pengajuan' : '❌ Tolak Pengajuan'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">Tambahkan catatan (opsional)</p>
                        <textarea rows={3} value={catatan} onChange={e => setCatatan(e.target.value)}
                            placeholder="Catatan untuk pemohon..."
                            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none mb-4" />
                        <div className="flex gap-3">
                            <button onClick={handleApproval} disabled={processing === modal.id}
                                className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-colors ${
                                    modal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                                } disabled:opacity-40`}>
                                {processing === modal.id ? '⏳ Memproses...' : modal.action === 'approved' ? 'Setujui' : 'Tolak'}
                            </button>
                            <button onClick={() => setModal(null)}
                                className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
