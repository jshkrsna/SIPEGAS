import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import { usePageTransition } from '../../utils/usePageTransition'
import gsap from 'gsap'

export default function ManajemenYayasan() {
    const pageRef = usePageTransition()
    const [yayasans, setYayasans] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editData, setEditData] = useState(null)
    const [form, setForm] = useState({ nama_yayasan: '', kode_yayasan: '', alamat: '', no_telp: '', is_active: true })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchYayasan = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/yayasan?all=true')
            setYayasans(data.data || [])
        } catch {} finally { setLoading(false) }
    }

    useEffect(() => { fetchYayasan() }, [])

    const handleEdit = (y) => {
        setEditData(y)
        setForm({
            nama_yayasan: y.nama_yayasan || '',
            kode_yayasan: y.kode_yayasan || '',
            alamat: y.alamat || '',
            no_telp: y.no_telp || '',
            is_active: y.is_active === undefined ? true : y.is_active
        })
        setShowForm(true)
        setError('')
    }

    const handleCreate = () => {
        setEditData(null)
        setForm({ nama_yayasan: '', kode_yayasan: '', alamat: '', no_telp: '', is_active: true })
        setShowForm(true)
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setSubmitting(true)
        try {
            if (editData) {
                await api.put(`/yayasan/${editData.id}`, form)
                setSuccess('Yayasan berhasil diperbarui.')
            } else {
                await api.post('/yayasan', form)
                setSuccess('Yayasan berhasil ditambahkan.')
            }
            setShowForm(false)
            fetchYayasan()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            const errs = err.response?.data?.errors
            if (errs) setError(Object.values(errs).flat().join(', '))
            else setError(err.response?.data?.message || 'Gagal menyimpan data yayasan.')
        } finally { setSubmitting(false) }
    }

    const handleDeactivate = async (y) => {
        if (!confirm(`Nonaktifkan yayasan "${y.nama_yayasan}"?`)) return
        try {
            await api.delete(`/yayasan/${y.id}`)
            setSuccess('Yayasan dinonaktifkan.')
            fetchYayasan()
            setTimeout(() => setSuccess(''), 3000)
        } catch {}
    }

    const handleActivate = async (y) => {
        try {
            await api.put(`/yayasan/${y.id}`, { ...y, is_active: 1 })
            setSuccess('Yayasan diaktifkan kembali.')
            fetchYayasan()
            setTimeout(() => setSuccess(''), 3000)
        } catch {}
    }

    return (
        <div ref={pageRef} className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
            <PageHeader 
                title="Data Yayasan" 
                description="Kelola data entitas yayasan"
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                action={
                    <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                        + Tambah Yayasan
                    </button>
                }
            />

            {success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                    ✅ {success}
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : yayasans.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">Belum ada data yayasan.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800/50 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Nama Yayasan</th>
                                    <th className="px-4 py-3 font-medium">Kode</th>
                                    <th className="px-4 py-3 font-medium">Alamat</th>
                                    <th className="px-4 py-3 font-medium">No. Telepon</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yayasans.map(y => (
                                    <tr key={y.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">{y.nama_yayasan}</td>
                                        <td className="px-4 py-3 text-slate-400">{y.kode_yayasan}</td>
                                        <td className="px-4 py-3 text-slate-400">{y.alamat || '-'}</td>
                                        <td className="px-4 py-3 text-slate-400">{y.no_telp || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${y.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {y.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(y)} className="text-xs text-blue-400 hover:bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/30">Edit</button>
                                                {y.is_active ? (
                                                    <button onClick={() => handleDeactivate(y)} className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/30">Nonaktif</button>
                                                ) : (
                                                    <button onClick={() => handleActivate(y)} className="text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">Aktifkan</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={e => { if(e.target===e.currentTarget) setShowForm(false) }}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-white font-semibold">{editData ? 'Edit Yayasan' : 'Tambah Yayasan'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">{error}</div>}
                            
                            <div>
                                <label className="block text-slate-400 text-xs font-medium mb-1">Nama Yayasan <span className="text-red-400">*</span></label>
                                <input required value={form.nama_yayasan} onChange={e => setForm(f => ({...f, nama_yayasan: e.target.value}))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-medium mb-1">Kode Yayasan <span className="text-red-400">*</span></label>
                                <input required value={form.kode_yayasan} onChange={e => setForm(f => ({...f, kode_yayasan: e.target.value}))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-medium mb-1">Alamat</label>
                                <textarea rows={2} value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-medium mb-1">No. Telepon</label>
                                <input value={form.no_telp} onChange={e => setForm(f => ({...f, no_telp: e.target.value}))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
                                    {submitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
