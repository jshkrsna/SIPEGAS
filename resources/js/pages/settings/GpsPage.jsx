import React, { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function GpsView({ sekolahId }) {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ nama_lokasi: '', lat: '', lng: '', radius_meter: 100 })
    const [submitting, setSubmitting] = useState(false)
    const [locating, setLocating] = useState(false)
    const [error, setError] = useState('')

    const fetch = async () => {
        setLoading(true)
        try { const { data } = await api.get(`/settings/gps?sekolah_id=${sekolahId}`); setList(data.data || []) }
        catch {} finally { setLoading(false) }
    }

    useEffect(() => { fetch() }, [sekolahId])

    const useCurrentLocation = () => {
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            pos => {
                setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(7), lng: pos.coords.longitude.toFixed(7) }))
                setLocating(false)
            },
            () => { setLocating(false); setError('Gagal mengambil lokasi GPS.') },
            { enableHighAccuracy: true }
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await api.post(`/settings/gps?sekolah_id=${sekolahId}`, form)
            setShowForm(false)
            setForm({ nama_lokasi: '', lat: '', lng: '', radius_meter: 100 })
            fetch()
        } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan.') }
        finally { setSubmitting(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Hapus titik lokasi GPS ini?')) return
        try { await api.delete(`/settings/gps/${id}?sekolah_id=${sekolahId}`); fetch() } catch {}
    }

    const toggleActive = async (id, current) => {
        try { await api.put(`/settings/gps/${id}?sekolah_id=${sekolahId}`, { is_active: current ? 0 : 1 }); fetch() } catch {}
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Lokasi GPS Presensi</h3>
                <button onClick={() => setShowForm(s => !s)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    {showForm ? 'Batal' : '+ Tambah Lokasi'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Nama Lokasi (opsional)</label>
                            <input value={form.nama_lokasi} onChange={e => setForm(f => ({ ...f, nama_lokasi: e.target.value }))}
                                placeholder="Gedung Utama..."
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Latitude</label>
                                <input required type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                                    placeholder="-6.200000"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Longitude</label>
                                <input required type="number" step="any" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                                    placeholder="106.816666"
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <button type="button" onClick={useCurrentLocation} disabled={locating}
                            className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1.5 disabled:opacity-40">
                            {locating ? 'Mengambil lokasi...' : '📍 Gunakan Lokasi Saya Sekarang'}
                        </button>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Radius (meter)</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="10" max="500" value={form.radius_meter}
                                    onChange={e => setForm(f => ({ ...f, radius_meter: +e.target.value }))}
                                    className="flex-1 accent-blue-500" />
                                <span className="text-white text-sm w-12">{form.radius_meter}m</span>
                            </div>
                        </div>
                        <button type="submit" disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
                            {submitting ? 'Menyimpan...' : 'Simpan Lokasi'}
                        </button>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {loading ? (
                    <div className="h-20 rounded-xl bg-slate-800 animate-pulse" />
                ) : list.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Belum ada titik lokasi.</p>
                ) : (
                    list.map(gps => (
                        <div key={gps.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white text-sm font-medium">{gps.nama_lokasi || 'Lokasi Sekolah'}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${gps.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {gps.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs mt-1 font-mono">
                                    {Number(gps.lat).toFixed(6)}, {Number(gps.lng).toFixed(6)} · R: {gps.radius_meter}m
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button onClick={() => toggleActive(gps.id, gps.is_active)}
                                    className={`text-xs px-2 py-1 rounded transition-colors ${gps.is_active ? 'text-slate-400 hover:bg-slate-700' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                                    {gps.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button onClick={() => handleDelete(gps.id)}
                                    className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
