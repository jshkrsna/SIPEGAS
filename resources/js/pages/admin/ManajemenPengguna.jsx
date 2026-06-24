import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import api from '../../api/axios'
import PageHeader from '../../components/PageHeader'
import { usePageTransition } from '../../utils/usePageTransition'

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROLE_LABELS = {
    pegawai:       'Pegawai',
    admin:         'Administrator',
    kepala_sekolah:'Kepala Sekolah',
    yayasan:       'Yayasan',
}
const ROLE_STYLES = {
    pegawai:       'bg-emerald-500/20 text-emerald-400',
    admin:         'bg-blue-500/20 text-blue-400',
    kepala_sekolah:'bg-violet-500/20 text-violet-400',
    yayasan:       'bg-amber-500/20 text-amber-400',
}

// ─── User Form Modal (portal) ─────────────────────────────────────────────────
function UserFormModal({ editUser, jabatan, sekolahId, isYayasanMode, onClose, onSaved }) {
    const defaultRole = isYayasanMode ? 'yayasan' : (editUser?.role || 'pegawai')
    const [form, setForm] = useState({
        nip:          editUser?.nip          || '',
        nama_lengkap: editUser?.nama_lengkap || '',
        email:        editUser?.email        || '',
        password:     '',
        role:         defaultRole,
        jabatan_id:   editUser?.jabatan_id   || '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError]           = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            const payload = { ...form }
            if (sekolahId && !isYayasanMode) {
                payload.sekolah_id = sekolahId
            }
            if (editUser && !payload.password) delete payload.password
            if (editUser) {
                await api.put(`/pengguna/${editUser.id}`, payload)
            } else {
                await api.post('/pengguna', payload)
            }
            onSaved()
        } catch (err) {
            const errs = err.response?.data?.errors
            if (errs) setError(Object.values(errs).flat().join(', '))
            else setError(err.response?.data?.message || 'Gagal menyimpan data.')
        } finally { setSubmitting(false) }
    }

    const availableRoles = isYayasanMode 
        ? ['yayasan'] 
        : ['pegawai', 'admin', 'kepala_sekolah']

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-white font-semibold">
                        {editUser ? 'Edit Pengguna' : (isYayasanMode ? 'Tambah User Yayasan' : 'Tambah Pengguna Baru')}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1">
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { key: 'nip',          label: 'NIP',        type: 'text'     },
                            { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text'   },
                            { key: 'email',        label: 'Email',      type: 'email'    },
                            { key: 'password',     label: editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password', type: 'password' },
                        ].map(({ key, label, type }) => (
                            <div key={key} className={key === 'nama_lengkap' || key === 'password' ? 'sm:col-span-2' : ''}>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">{label}</label>
                                <input type={type} value={form[key]}
                                    required={key === 'password' ? !editUser : true}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        ))}
                        {!isYayasanMode && (
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Role</label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                    {availableRoles.map(r => (
                                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {!isYayasanMode && (
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Jabatan (opsional)</label>
                                <select value={form.jabatan_id} onChange={e => setForm(f => ({ ...f, jabatan_id: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                    <option value="">— Pilih Jabatan —</option>
                                    {jabatan.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 mt-2">
                        <button type="submit" disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                            {submitting ? '⏳ Menyimpan...' : editUser ? '💾 Simpan Perubahan' : '+ Tambah'}
                        </button>
                        <button type="button" onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-lg text-sm transition-colors">Batal</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}


// ─── Users Of School View ─────────────────────────────────────────────────────
function UsersOfSchoolView({ sekolah, onBack }) {
    const [users, setUsers]       = useState([])
    const [jabatan, setJabatan]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [search, setSearch]     = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    
    const [showForm, setShowForm] = useState(false)
    const [editData, setEditData] = useState(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [uRes, jRes] = await Promise.all([
                api.get(`/pengguna?sekolah_id=${sekolah.id}`),
                api.get(`/settings/jabatan?sekolah_id=${sekolah.id}`)
            ])
            setUsers(uRes.data.data.data || [])
            setJabatan(jRes.data.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { fetchData() }, [sekolah.id])

    const handleDelete = async (id) => {
        if (!confirm('Hapus pengguna ini?')) return
        try {
            await api.delete(`/pengguna/${id}`)
            fetchData()
        } catch {}
    }

    const filtered = users.filter(u => {
        const mSearch = !search || u.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || u.nip.includes(search)
        const mRole   = !roleFilter || u.role === roleFilter
        return mSearch && mRole
    })

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{sekolah.nama_sekolah}</h2>
                    <p className="text-slate-400 text-sm">Kelola pengguna di sekolah ini</p>
                </div>
                <button onClick={() => { setEditData(null); setShowForm(true) }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                    + Tambah Pengguna
                </button>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Cari nama atau NIP..."
                    className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Semua Role</option>
                    <option value="pegawai">Pegawai</option>
                    <option value="kepala_sekolah">Kepala Sekolah</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengguna</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kontak</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role & Jabatan</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="5" className="p-4">
                                            <div className="h-10 bg-slate-800/50 rounded animate-pulse w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-500">
                                        <p>Tidak ada pengguna ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {u.foto_profil_url ? (
                                                        <img src={u.foto_profil_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-white text-xs font-medium">{u.nama_lengkap.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{u.nama_lengkap}</p>
                                                    <p className="text-slate-500 text-xs font-mono">{u.nip}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-300 text-sm">{u.email}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-1 ${ROLE_STYLES[u.role] || 'bg-slate-700 text-slate-300'}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                            {u.jabatan && <p className="text-slate-400 text-xs truncate max-w-[150px]">{u.jabatan.nama_jabatan}</p>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-700'}`}>
                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button onClick={() => { setEditData(u); setShowForm(true) }} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 mr-2 transition-colors">Edit</button>
                                            <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 transition-colors">Hapus</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <UserFormModal
                    editUser={editData}
                    jabatan={jabatan}
                    sekolahId={sekolah.id}
                    isYayasanMode={false}
                    onClose={() => { setShowForm(false); setEditData(null) }}
                    onSaved={() => { setShowForm(false); fetchData() }}
                />
            )}
        </div>
    )
}

// ─── School List View ─────────────────────────────────────────────────────────
function SekolahListView({ onSelect }) {
    const [schools, setSchools] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                const { data } = await api.get('/sekolah/by-yayasan')
                setSchools(data.data || [])
            } catch {}
            finally { setLoading(false) }
        }
        fetch()
    }, [])

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <p className="text-slate-400 text-sm">Pilih sekolah untuk mengelola pengguna</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />)}
                </div>
            ) : schools.length === 0 ? (
                <div className="text-center py-20 text-slate-500">Belum ada sekolah terdaftar.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schools.map(s => (
                        <div key={s.id} onClick={() => onSelect(s)}
                            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 cursor-pointer transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors overflow-hidden">
                                    {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-cover" /> : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-medium text-sm mb-1 group-hover:text-blue-400 transition-colors">{s.nama_sekolah}</h4>
                                    <p className="text-slate-500 text-xs font-mono">{s.kode_sekolah}</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManajemenPengguna() {
    const pageRef = usePageTransition()
    const [selectedSchool, setSelectedSchool] = useState(null)

    return (
        <div ref={pageRef} className="p-4 sm:p-6 max-w-6xl mx-auto">
            {!selectedSchool && (
                <PageHeader
                    title="Manajemen Pengguna"
                    description="Pilih sekolah untuk melihat dan mengelola pengguna"
                    icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                />
            )}

            {!selectedSchool ? (
                <SekolahListView 
                    onSelect={s => setSelectedSchool(s)} 
                />
            ) : (
                <UsersOfSchoolView sekolah={selectedSchool} onBack={() => setSelectedSchool(null)} />
            )}
        </div>
    )
}
