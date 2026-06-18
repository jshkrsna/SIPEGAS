import React, { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function JamKerjaView({ sekolahId }) {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ nama_shift: '', jam_masuk: '07:00', jam_pulang: '15:00', toleransi_menit: 15, is_default: false })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const fetch = async () => {
        setLoading(true)
        try { const { data } = await api.get(`/settings/jam-kerja?sekolah_id=${sekolahId}`); setList(data.data || []) }
        catch {} finally { setLoading(false) }
    }

    useEffect(() => { fetch() }, [sekolahId])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await api.post(`/settings/jam-kerja?sekolah_id=${sekolahId}`, form)
            setShowForm(false)
            setForm({ nama_shift: '', jam_masuk: '07:00', jam_pulang: '15:00', toleransi_menit: 15, is_default: false })
            fetch()
        } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan.') }
        finally { setSubmitting(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Hapus shift ini?')) return
        try { await api.delete(`/settings/jam-kerja/${id}?sekolah_id=${sekolahId}`); fetch() } catch {}
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Jam Kerja</h3>
                <button onClick={() => setShowForm(s => !s)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    {showForm ? 'Batal' : '+ Tambah Shift'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Nama Shift</label>
                            <input required value={form.nama_shift} onChange={e => setForm(f => ({ ...f, nama_shift: e.target.value }))}
                                placeholder="Shift Pagi"
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Toleransi (menit)</label>
                            <input type="number" min="0" max="60" value={form.toleransi_menit}
                                onChange={e => setForm(f => ({ ...f, toleransi_menit: +e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Jam Masuk</label>
                            <input type="time" required value={form.jam_masuk} onChange={e => setForm(f => ({ ...f, jam_masuk: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Jam Pulang</label>
                            <input type="time" required value={form.jam_pulang} onChange={e => setForm(f => ({ ...f, jam_pulang: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="is_default" checked={form.is_default}
                                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                                className="w-4 h-4 rounded accent-blue-500" />
                            <label htmlFor="is_default" className="text-slate-300 text-sm">Jadikan shift default</label>
                        </div>
                        <div className="sm:col-span-2">
                            <button type="submit" disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
                                {submitting ? 'Menyimpan...' : 'Simpan Shift'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {loading ? (
                    <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
                ) : list.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Belum ada shift kerja.</p>
                ) : (
                    list.map(jam => (
                        <div key={jam.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-sm font-medium">{jam.nama_shift}</p>
                                    {jam.is_default === 1 && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Default</span>
                                    )}
                                </div>
                                <p className="text-slate-400 text-xs mt-1">
                                    {jam.jam_masuk?.slice(0, 5)} — {jam.jam_pulang?.slice(0, 5)} · Toleransi {jam.toleransi_menit}m
                                </p>
                            </div>
                            <button onClick={() => handleDelete(jam.id)}
                                className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">
                                Hapus
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
