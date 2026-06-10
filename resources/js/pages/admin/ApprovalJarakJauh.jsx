import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'

const STATUS_STYLES = {
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
}

export default function ApprovalJarakJauh() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [processing, setProcessing] = useState(null)
    const [modal, setModal] = useState(null) // { id, action }

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

    const handleApproval = async () => {
        if (!modal) return
        setProcessing(modal.id)
        try {
            await api.post(`/presensi/${modal.id}/approve-remote`, {
                action: modal.action
            })
            setModal(null)
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
                <h2 className="text-2xl font-bold text-white">Approval Presensi Jarak Jauh</h2>
                <p className="text-slate-400 text-sm mt-1">Review dan setujui presensi di luar radius</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
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
                                    {item.pengguna?.foto_profil_url
                                        ? <img src={item.pengguna.foto_profil_url} className="w-full h-full object-cover rounded-full" />
                                        : item.pengguna?.nama_lengkap?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-white font-medium">{item.pengguna?.nama_lengkap}</p>
                                        <span className="text-slate-500 text-xs">{item.pengguna?.nip}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[item.status_approval_remote]}`}>
                                            {item.status_approval_remote}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-xs mt-1 mb-2">
                                        {dayjs(item.tanggal).format('DD MMM YYYY')} ·
                                        Masuk: {item.waktu_checkin ? dayjs(item.waktu_checkin).format('HH:mm') : '-'}
                                        {' '}· Jarak: &gt; 20m
                                    </p>

                                    {item.keterangan && (
                                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mt-2 mb-2">
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{item.keterangan}</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3 mt-2">
                                        {item.bukti_luar_radius_url && (
                                            <a href={item.bukti_luar_radius_url} target="_blank" rel="noreferrer"
                                                className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                                                <span>📎</span> Lihat Bukti Jarak Jauh
                                            </a>
                                        )}
                                        {item.selfie_url && (
                                            <a href={item.selfie_url} target="_blank" rel="noreferrer"
                                                className="text-blue-400 text-xs hover:underline flex items-center gap-1">
                                                <span>📷</span> Foto Selfie
                                            </a>
                                        )}
                                        {item.gpsLog && (
                                            <span className="text-slate-500 text-xs flex items-center gap-1">
                                                <span>📍</span> {item.gpsLog.lat_checkin}, {item.gpsLog.lng_checkin}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {item.status_approval_remote === 'pending' && (
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <button onClick={() => setModal({ id: item.id, action: 'approved' })}
                                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors w-full">
                                            ✓ Setujui
                                        </button>
                                        <button onClick={() => setModal({ id: item.id, action: 'rejected' })}
                                            className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium transition-colors w-full">
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
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-white font-semibold text-lg mb-2">
                            {modal.action === 'approved' ? '✅ Setujui Presensi' : '❌ Tolak Presensi'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Apakah Anda yakin ingin memproses presensi jarak jauh ini?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleApproval} disabled={processing === modal.id}
                                className={`flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-colors ${modal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                                    } disabled:opacity-40`}>
                                {processing === modal.id ? '⏳ Proses...' : modal.action === 'approved' ? 'Setujui' : 'Tolak'}
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
