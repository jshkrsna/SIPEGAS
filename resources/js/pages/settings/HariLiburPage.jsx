import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import dayjs from 'dayjs'

export default function HariLiburPage() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [tahun, setTahun] = useState(dayjs().year())
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ tanggal: '', nama_libur: '', jenis: 'sekolah' })
    const [submitting, setSubmitting] = useState(false)

    const fetch = async () => {
        setLoading(true)
        try { const { data } = await api.get('/settings/hari-libur', { params: { tahun } }); setList(data.data || []) }
        catch {} finally { setLoading(false) }
    }

    useEffect(() => { fetch() }, [tahun])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await api.post('/settings/hari-libur', form)
            setShowForm(false)
            setForm({ tanggal: '', nama_libur: '', jenis: 'sekolah' })
            fetch()
        } catch {} finally { setSubmitting(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Hapus hari libur ini?')) return
        try { await api.delete(`/settings/hari-libur/${id}`); fetch() } catch {}
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <PageHeader
                title="Hari Libur"
                description="Kalender libur sekolah"
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                action={
                    <div className="flex gap-2">
                        <select value={tahun} onChange={e => setTahun(+e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 shadow-lg shadow-blue-500/10">
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={() => setShowForm(s => !s)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                            {showForm ? '✕ Batal' : '+ Tambah'}
                        </button>
                    </div>
                }
            />

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Tanggal</label>
                        <input type="date" required value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Nama Libur</label>
                        <input required value={form.nama_libur} onChange={e => setForm(f => ({ ...f, nama_libur: e.target.value }))}
                            placeholder="Hari Raya..."
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Jenis</label>
                        <select value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                            <option value="sekolah">Sekolah</option>
                            <option value="nasional">Nasional</option>
                        </select>
                    </div>
                    <div className="sm:col-span-3">
                        <button type="submit" disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                            {submitting ? '⏳' : '+ Simpan'}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : list.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="text-4xl">🗓️</span>
                        <p className="text-slate-400 mt-3">Belum ada hari libur</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left px-4 py-3 text-slate-400 font-medium">Tanggal</th>
                                <th className="text-left px-4 py-3 text-slate-400 font-medium">Nama Libur</th>
                                <th className="text-left px-4 py-3 text-slate-400 font-medium">Jenis</th>
                                <th className="text-left px-4 py-3 text-slate-400 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(h => (
                                <tr key={h.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3 text-slate-300">{dayjs(h.tanggal).format('DD MMMM YYYY')}</td>
                                    <td className="px-4 py-3 text-white">{h.nama_libur}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${h.jenis === 'nasional' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {h.jenis}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleDelete(h.id)}
                                            className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors">
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
