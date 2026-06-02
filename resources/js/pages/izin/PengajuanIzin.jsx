import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'

const JENIS_OPTS = [
    { value: 'izin', label: 'Izin', color: 'blue' },
    { value: 'sakit', label: 'Sakit', color: 'red' },
    { value: 'cuti', label: 'Cuti', color: 'violet' },
    { value: 'tugas_luar', label: 'Tugas Luar', color: 'amber' },
]

const STATUS_STYLES = {
    pending:  'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
}

export default function PengajuanIzin() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
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

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/izin-cuti')
            setList(data.data?.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { fetchList() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setSubmitting(true)
        try {
            await api.post('/izin-cuti', form)
            setSuccess('Pengajuan berhasil dikirim!')
            setShowForm(false)
            setForm({ jenis: 'izin', tanggal_mulai: '', tanggal_selesai: '', alasan: '', bukti_url: '' })
            fetchList()
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
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal membatalkan.')
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Izin / Cuti</h2>
                    <p className="text-slate-400 text-sm mt-1">Kelola pengajuan izin dan cuti</p>
                </div>
                <button onClick={() => setShowForm(s => !s)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    {showForm ? '✕ Batal' : '+ Pengajuan Baru'}
                </button>
            </div>

            {/* Success */}
            {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">✅ {success}</div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">Form Pengajuan</h3>
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Jenis</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {JENIS_OPTS.map(opt => (
                                    <button key={opt.value} type="button"
                                        onClick={() => setForm(f => ({ ...f, jenis: opt.value }))}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                                            form.jenis === opt.value
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Tanggal Mulai</label>
                                <input type="date" required value={form.tanggal_mulai}
                                    onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}
                                    min={dayjs().format('YYYY-MM-DD')}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Tanggal Selesai</label>
                                <input type="date" required value={form.tanggal_selesai}
                                    onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}
                                    min={form.tanggal_mulai || dayjs().format('YYYY-MM-DD')}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Alasan</label>
                            <textarea required rows={3} value={form.alasan}
                                onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                                placeholder="Tuliskan alasan pengajuan..."
                                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">URL Bukti (opsional)</label>
                            <input type="url" value={form.bukti_url}
                                onChange={e => setForm(f => ({ ...f, bukti_url: e.target.value }))}
                                placeholder="https://drive.google.com/..."
                                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button type="submit" disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                                {submitting ? '⏳ Mengirim...' : '📤 Kirim Pengajuan'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-800 animate-pulse" />)
                ) : list.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-4xl">📋</span>
                        <p className="text-slate-400 mt-3">Belum ada pengajuan izin/cuti</p>
                    </div>
                ) : (
                    list.map(item => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[item.status_approval]}`}>
                                            {item.status_approval}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">{item.jenis}</span>
                                    </div>
                                    <p className="text-white font-medium">{item.alasan}</p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {dayjs(item.tanggal_mulai).format('DD MMM')} — {dayjs(item.tanggal_selesai).format('DD MMM YYYY')}
                                        {' '}· {dayjs(item.tanggal_selesai).diff(item.tanggal_mulai, 'day') + 1} hari
                                    </p>
                                    {item.catatan_approver && (
                                        <p className="text-slate-500 text-xs mt-1 italic">Catatan: {item.catatan_approver}</p>
                                    )}
                                </div>
                                {item.status_approval === 'pending' && (
                                    <button onClick={() => handleCancel(item.id)}
                                        className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors flex-shrink-0">
                                        Batalkan
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
