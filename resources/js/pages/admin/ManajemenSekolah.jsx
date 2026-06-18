import React, { useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import { usePageTransition } from '../../utils/usePageTransition'
import JamKerjaView from '../settings/JamKerjaPage' // We refactored this to a view
import GpsView from '../settings/GpsPage' // Refactored to a view

// ─── Icons ────────────────────────────────────────────────────────────────────
const SchoolIcon = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
)

// ─── Form Modal ───────────────────────────────────────────────────────────────
function SekolahFormModal({ editData, yayasanList, onClose, onSaved }) {
    const [form, setForm] = useState({
        nama_sekolah: editData?.nama_sekolah || '',
        kode_sekolah: editData?.kode_sekolah || '',
        alamat:       editData?.alamat       || '',
        no_telp:      editData?.no_telp      || '',
        yayasan_id:   editData?.yayasan?.id  || editData?.yayasan_id || '',
        is_active:    editData?.is_active !== undefined ? editData.is_active : true,
        logo_base64:  '',
    })
    const [logoPreview, setLogoPreview] = useState(editData?.logo_url || null)
    const fileInputRef = useRef(null)

    const [submitting, setSubmitting] = useState(false)
    const [error, setError]           = useState('')

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoPreview(reader.result)
            setForm(f => ({ ...f, logo_base64: reader.result }))
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            if (editData) {
                await api.put(`/sekolah/${editData.id}`, form)
            } else {
                await api.post('/sekolah', form)
            }
            onSaved()
        } catch (err) {
            const errs = err.response?.data?.errors
            if (errs) setError(Object.values(errs).flat().join(', '))
            else setError(err.response?.data?.message || 'Gagal menyimpan.')
        } finally { setSubmitting(false) }
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-white font-semibold">{editData ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
                    {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}

                    {/* Logo Upload */}
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-20 h-20 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-white text-xs font-medium">Ubah</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">Format: JPG, PNG. Maks 1MB.</p>
                        <input type="file" accept="image/jpeg, image/png" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Nama Sekolah <span className="text-red-400">*</span></label>
                            <input type="text" required value={form.nama_sekolah}
                                onChange={e => setForm(f => ({ ...f, nama_sekolah: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Kode Sekolah <span className="text-red-400">*</span></label>
                            <input type="text" required value={form.kode_sekolah}
                                onChange={e => setForm(f => ({ ...f, kode_sekolah: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 uppercase" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">No. Telepon</label>
                            <input type="text" value={form.no_telp}
                                onChange={e => setForm(f => ({ ...f, no_telp: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Alamat</label>
                            <textarea rows={2} value={form.alamat}
                                onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                        </div>
                        {yayasanList.length > 0 && (
                            <div className="sm:col-span-2">
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Yayasan</label>
                                <select value={form.yayasan_id} onChange={e => setForm(f => ({ ...f, yayasan_id: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                    <option value="">— Pilih Yayasan —</option>
                                    {yayasanList.map(y => <option key={y.id} value={y.id}>{y.nama_yayasan}</option>)}
                                </select>
                            </div>
                        )}
                        {editData && (
                            <div className="sm:col-span-2 flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={form.is_active}
                                        onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                                <span className="text-slate-300 text-sm">Sekolah Aktif</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                            {submitting ? '⏳ Menyimpan...' : editData ? '💾 Simpan Perubahan' : '+ Tambah Sekolah'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-lg text-sm transition-colors">
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}

// ─── Detail Modal (Pengaturan Sekolah) ───────────────────────────────────────
function SekolahDetailModal({ sekolah, yayasanList, onClose, onRefresh }) {
    const [activeTab, setActiveTab] = useState('info')
    const [showEdit, setShowEdit] = useState(false)

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-3xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {sekolah.logo_url ? <img src={sekolah.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <SchoolIcon />}
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg">{sekolah.nama_sekolah}</h3>
                            <p className="text-slate-400 text-sm">{sekolah.kode_sekolah}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="flex px-6 border-b border-slate-800 flex-shrink-0">
                    {[{ id: 'info', label: 'Info & Edit' }, { id: 'jam', label: 'Jam Kerja' }, { id: 'gps', label: 'Lokasi GPS' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-6 max-w-xl">
                            <div>
                                <h4 className="text-sm font-medium text-slate-400 mb-1">Nama Sekolah</h4>
                                <p className="text-white">{sekolah.nama_sekolah}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-400 mb-1">Alamat</h4>
                                <p className="text-white">{sekolah.alamat || '—'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-400 mb-1">Telepon</h4>
                                <p className="text-white">{sekolah.no_telp || '—'}</p>
                            </div>
                            <button onClick={() => setShowEdit(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors mt-4">
                                Edit Informasi Sekolah
                            </button>
                        </div>
                    )}
                    {activeTab === 'jam' && <JamKerjaView sekolahId={sekolah.id} />}
                    {activeTab === 'gps' && <GpsView sekolahId={sekolah.id} />}
                </div>
            </div>

            {showEdit && (
                <SekolahFormModal 
                    editData={sekolah} 
                    yayasanList={yayasanList} 
                    onClose={() => setShowEdit(false)} 
                    onSaved={() => { setShowEdit(false); onRefresh(); onClose(); }} 
                />
            )}
        </div>,
        document.body
    )
}

// ─── School Card ──────────────────────────────────────────────────────────────
function SekolahCard({ sekolah, onSettings, onDeactivate, onActivate }) {
    return (
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {sekolah.logo_url ? (
                            <img src={sekolah.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <SchoolIcon className="w-6 h-6 text-blue-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-semibold text-sm leading-tight truncate">{sekolah.nama_sekolah}</p>
                        <p className="text-slate-500 text-xs font-mono mt-0.5">{sekolah.kode_sekolah}</p>
                    </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${sekolah.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-700'}`}>
                    {sekolah.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
            </div>

            <div className="space-y-1.5 mb-5">
                {sekolah.yayasan && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
                        <span className="truncate">{sekolah.yayasan.nama_yayasan}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span>{sekolah.total_pegawai} pegawai</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={() => onSettings(sekolah)}
                    className="flex-1 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Pengaturan
                </button>
                {sekolah.is_active ? (
                    <button onClick={() => onDeactivate(sekolah)}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors">
                        Nonaktif
                    </button>
                ) : (
                    <button onClick={() => onActivate(sekolah)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 px-3 py-2 rounded-lg transition-colors">
                        Aktif
                    </button>
                )}
            </div>
        </div>
    )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ManajemenSekolah() {
    const pageRef      = usePageTransition()
    const [list, setList]             = useState([])
    const [yayasanList, setYayasanList] = useState([])
    const [loading, setLoading]       = useState(true)
    const [search, setSearch]         = useState('')
    
    // For Modals
    const [showForm, setShowForm]     = useState(false) // Edit / Create form
    const [editData, setEditData]     = useState(null)
    const [detailSekolah, setDetailSekolah] = useState(null) // Shows settings modal

    const [success, setSuccess]       = useState('')

    const fetchList = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/sekolah/by-yayasan')
            setList(data.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    const fetchYayasan = async () => {
        try {
            const { data } = await api.get('/yayasan')
            setYayasanList(data.data || [])
        } catch {}
    }

    useEffect(() => { fetchList(); fetchYayasan() }, [])

    const handleSaved = () => {
        setShowForm(false)
        setEditData(null)
        setDetailSekolah(null)
        setSuccess('Data sekolah berhasil disimpan.')
        fetchList()
        setTimeout(() => setSuccess(''), 4000)
    }

    const handleDeactivate = async (sekolah) => {
        if (!confirm(`Nonaktifkan sekolah "${sekolah.nama_sekolah}"?`)) return
        try {
            await api.delete(`/sekolah/${sekolah.id}`)
            setSuccess(`${sekolah.nama_sekolah} berhasil dinonaktifkan.`)
            fetchList()
            setTimeout(() => setSuccess(''), 4000)
        } catch {}
    }

    const handleActivate = async (sekolah) => {
        try {
            await api.put(`/sekolah/${sekolah.id}`, { is_active: 1 })
            setSuccess(`${sekolah.nama_sekolah} berhasil diaktifkan.`)
            fetchList()
            setTimeout(() => setSuccess(''), 4000)
        } catch {}
    }

    const filtered = list.filter(s =>
        !search ||
        s.nama_sekolah.toLowerCase().includes(search.toLowerCase()) ||
        s.kode_sekolah.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div ref={pageRef} className="p-4 sm:p-6 max-w-6xl mx-auto">
            <PageHeader
                title="Manajemen Sekolah"
                description={`${list.length} sekolah dalam yayasan`}
                icon={<SchoolIcon />}
                action={
                    <button onClick={() => { setEditData(null); setShowForm(true) }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        + Tambah Sekolah
                    </button>
                }
            />

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                    ✅ {success}
                </div>
            )}

            {/* Search */}
            <div className="mb-5">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Cari nama atau kode sekolah..."
                    className="w-full sm:max-w-sm bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-52 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/>
                    </svg>
                    <p className="text-sm">{search ? 'Tidak ada sekolah yang cocok' : 'Belum ada sekolah terdaftar'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(s => (
                        <SekolahCard key={s.id} sekolah={s}
                            onSettings={(s) => setDetailSekolah(s)}
                            onDeactivate={handleDeactivate}
                            onActivate={handleActivate}
                        />
                    ))}
                </div>
            )}

            {/* Modal Edit/Tambah */}
            {showForm && (
                <SekolahFormModal
                    editData={editData}
                    yayasanList={yayasanList}
                    onClose={() => { setShowForm(false); setEditData(null) }}
                    onSaved={handleSaved}
                />
            )}

            {/* Modal Settings/Detail */}
            {detailSekolah && !showForm && (
                <SekolahDetailModal
                    sekolah={detailSekolah}
                    yayasanList={yayasanList}
                    onClose={() => setDetailSekolah(null)}
                    onRefresh={fetchList}
                />
            )}
        </div>
    )
}
