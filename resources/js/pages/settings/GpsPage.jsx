import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'

export default function GpsPage() {
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ nama_lokasi: '', lat: '', lng: '', radius_meter: 100 })
    const [submitting, setSubmitting] = useState(false)
    const [locating, setLocating] = useState(false)
    const [error, setError] = useState('')

    const fetch = async () => {
        setLoading(true)
        try { const { data } = await api.get('/settings/gps'); setList(data.data || []) }
        catch {} finally { setLoading(false) }
    }

    useEffect(() => { fetch() }, [])

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
            await api.post('/settings/gps', form)
            setShowForm(false)
            setForm({ nama_lokasi: '', lat: '', lng: '', radius_meter: 100 })
            fetch()
        } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan.') }
        finally { setSubmitting(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Hapus titik lokasi GPS ini?')) return
        try { await api.delete(`/settings/gps/${id}`); fetch() } catch {}
    }

    const toggleActive = async (id, current) => {
        try { await api.put(`/settings/gps/${id}`, { is_active: current ? 0 : 1 }); fetch() } catch {}
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <PageHeader
                title="Lokasi GPS Presensi"
                description="Titik lokasi valid untuk check-in geofencing"
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                action={
                    <button onClick={() => setShowForm(s => !s)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                        {showForm ? '✕ Batal' : '+ Tambah Lokasi'}
                    </button>
                }
            />

            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">Titik Lokasi Baru</h3>
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Nama Lokasi (opsional)</label>
                            <input value={form.nama_lokasi} onChange={e => setForm(f => ({ ...f, nama_lokasi: e.target.value }))}
                                placeholder="Gedung Utama, Lab Komputer..."
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
                            {locating ? '⏳ Mengambil lokasi...' : '📍 Gunakan Lokasi Saya Sekarang'}
                        </button>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Radius (meter)</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="10" max="500" value={form.radius_meter}
                                    onChange={e => setForm(f => ({ ...f, radius_meter: +e.target.value }))}
                                    className="flex-1 accent-blue-500" />
                                <span className="text-white text-sm w-16 text-right">{form.radius_meter}m</span>
                            </div>
                        </div>
                        <button type="submit" disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                            {submitting ? '⏳ Menyimpan...' : '+ Simpan Lokasi'}
                        </button>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {loading ? (
                    [...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800 animate-pulse" />)
                ) : list.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-4xl">📡</span>
                        <p className="text-slate-400 mt-3">Belum ada titik lokasi. Tambahkan lokasi sekolah.</p>
                    </div>
                ) : (
                    list.map(gps => (
                        <div key={gps.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${gps.is_active ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                                📍
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">{gps.nama_lokasi || 'Lokasi Sekolah'}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${gps.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {gps.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs mt-0.5 font-mono">
                                    {Number(gps.lat).toFixed(6)}, {Number(gps.lng).toFixed(6)} · Radius: {gps.radius_meter}m
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => toggleActive(gps.id, gps.is_active)}
                                    className={`text-xs border px-2 py-1 rounded-lg transition-colors ${gps.is_active
                                        ? 'border-slate-600 text-slate-400 hover:bg-slate-700'
                                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                                    {gps.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button onClick={() => handleDelete(gps.id)}
                                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors">
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
