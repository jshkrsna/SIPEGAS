import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'

export default function ManajemenPengguna() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [jabatan, setJabatan] = useState([])
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editUser, setEditUser] = useState(null)
    const [form, setForm] = useState({ nip: '', nama_lengkap: '', email: '', password: '', role: 'pegawai', jabatan_id: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const params = {}
            if (search) params.search = search
            if (roleFilter) params.role = roleFilter
            const { data } = await api.get('/pengguna', { params })
            setUsers(data.data?.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    const fetchJabatan = async () => {
        try {
            const { data } = await api.get('/settings/jabatan')
            setJabatan(data.data || [])
        } catch {}
    }

    useEffect(() => { fetchUsers(); fetchJabatan() }, [])
    useEffect(() => {
        const t = setTimeout(fetchUsers, 400)
        return () => clearTimeout(t)
    }, [search, roleFilter])

    const resetForm = () => {
        setForm({ nip: '', nama_lengkap: '', email: '', password: '', role: 'pegawai', jabatan_id: '' })
        setEditUser(null)
        setError('')
    }

    const openEdit = (user) => {
        setEditUser(user)
        setForm({ nip: user.nip, nama_lengkap: user.nama_lengkap, email: user.email, password: '', role: user.role, jabatan_id: user.jabatan_id || '' })
        setShowForm(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            if (editUser) {
                await api.put(`/pengguna/${editUser.id}`, form)
                setSuccess('Data pengguna berhasil diperbarui.')
            } else {
                await api.post('/pengguna', form)
                setSuccess('Pengguna baru berhasil ditambahkan.')
            }
            setShowForm(false)
            resetForm()
            fetchUsers()
        } catch (err) {
            const errs = err.response?.data?.errors
            if (errs) setError(Object.values(errs).flat().join(', '))
            else setError(err.response?.data?.message || 'Gagal menyimpan data.')
        } finally { setSubmitting(false) }
    }

    const handleDeactivate = async (id, name) => {
        if (!confirm(`Nonaktifkan akun "${name}"?`)) return
        try {
            await api.delete(`/pengguna/${id}`)
            setSuccess(`${name} berhasil dinonaktifkan.`)
            fetchUsers()
        } catch {}
    }

    const ROLE_LABELS = {
        pegawai: 'Pegawai',
        admin: 'Administrator',
        kepala_sekolah: 'Kepala Sekolah',
        yayasan: 'Yayasan',
    }

    const ROLE_STYLES = {
        pegawai: 'bg-emerald-500/20 text-emerald-400',
        admin: 'bg-blue-500/20 text-blue-400',
        kepala_sekolah: 'bg-violet-500/20 text-violet-400',
        yayasan: 'bg-amber-500/20 text-amber-400',
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Manajemen Pengguna</h2>
                    <p className="text-slate-400 text-sm mt-1">{users.length} pengguna terdaftar</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(s => !s) }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    {showForm && !editUser ? '✕ Batal' : '+ Tambah Pengguna'}
                </button>
            </div>

            {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">✅ {success}</div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4">{editUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                    {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">⚠️ {error}</div>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { key: 'nip', label: 'NIP', type: 'text' },
                            { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text' },
                            { key: 'email', label: 'Email', type: 'email' },
                            { key: 'password', label: editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password', type: 'password' },
                        ].map(({ key, label, type }) => (
                            <div key={key}>
                                <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">{label}</label>
                                <input type={type} value={form[key]}
                                    required={key === 'password' ? !editUser : true}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Role</label>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                {['pegawai', 'admin', 'kepala_sekolah'].map(r => (
                                    <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-1.5">Jabatan (opsional)</label>
                            <select value={form.jabatan_id} onChange={e => setForm(f => ({ ...f, jabatan_id: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                                <option value="">— Pilih Jabatan —</option>
                                {jabatan.map(j => <option key={j.id} value={j.id}>{j.nama_jabatan}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2 flex gap-3 pt-1">
                            <button type="submit" disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                                {submitting ? '⏳ Menyimpan...' : editUser ? '💾 Simpan Perubahan' : '+ Tambah'}
                            </button>
                            <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-lg text-sm transition-colors">Batal</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-3 mb-5">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Cari nama, NIP, email..."
                    className="flex-1 min-w-48 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Semua Role</option>
                    {['pegawai', 'admin', 'kepala_sekolah'].map(r => (
                        <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Pegawai</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">NIP</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Jabatan</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                                                    {u.nama_lengkap?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white">{u.nama_lengkap}</p>
                                                    <p className="text-slate-500 text-xs">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.nip}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${ROLE_STYLES[u.role]}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{u.jabatan?.nama_jabatan || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(u)}
                                                    className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:bg-blue-500/10 px-2 py-1 rounded-lg transition-colors">
                                                    Edit
                                                </button>
                                                {u.is_active && (
                                                    <button onClick={() => handleDeactivate(u.id, u.nama_lengkap)}
                                                        className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors">
                                                        Nonaktif
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Tidak ada pengguna ditemukan</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
