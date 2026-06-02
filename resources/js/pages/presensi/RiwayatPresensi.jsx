import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import dayjs from 'dayjs'

const STATUS_STYLES = {
    hadir:     'bg-emerald-500/20 text-emerald-400',
    terlambat: 'bg-amber-500/20 text-amber-400',
    izin:      'bg-blue-500/20 text-blue-400',
    cuti:      'bg-violet-500/20 text-violet-400',
    alpha:     'bg-red-500/20 text-red-400',
}

export default function RiwayatPresensi() {
    const { user } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        bulan: dayjs().month() + 1,
        tahun: dayjs().year(),
        status: '',
    })
    const [currentPage, setCurrentPage] = useState(1)

    const fetchData = async (page = 1) => {
        setLoading(true)
        try {
            const params = { ...filters, page, per_page: 20 }
            const { data: res } = await api.get('/presensi', { params })
            setData(res.data)
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { fetchData(1) }, [filters])

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: dayjs().month(i).format('MMMM') }))

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Riwayat Presensi</h2>
                <p className="text-slate-400 text-sm mt-1">Data presensi per bulan</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <select value={filters.bulan} onChange={e => setFilters(f => ({ ...f, bulan: +e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={filters.tahun} onChange={e => setFilters(f => ({ ...f, tahun: +e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Semua Status</option>
                    {['hadir', 'terlambat', 'izin', 'cuti', 'alpha'].map(s => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Tanggal</th>
                                        {(user?.role === 'admin' || user?.role === 'kepala_sekolah') && (
                                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Pegawai</th>
                                        )}
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Masuk</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Pulang</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Terlambat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.data || []).map(p => (
                                        <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-300">{dayjs(p.tanggal).format('DD MMM YYYY')}</td>
                                            {(user?.role === 'admin' || user?.role === 'kepala_sekolah') && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs">
                                                            {p.pengguna?.nama_lengkap?.charAt(0)}
                                                        </div>
                                                        <span className="text-white text-sm">{p.pengguna?.nama_lengkap}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-slate-300">
                                                {p.waktu_checkin ? dayjs(p.waktu_checkin).format('HH:mm') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {p.waktu_checkout ? dayjs(p.waktu_checkout).format('HH:mm') : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[p.status_kehadiran] || 'bg-slate-700 text-slate-400'}`}>
                                                    {p.status_kehadiran}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {p.terlambat_menit > 0 ? `${p.terlambat_menit} menit` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data?.data || data.data.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                                Tidak ada data presensi
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data && data.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                                <p className="text-slate-400 text-xs">
                                    {data.from}–{data.to} dari {data.total} data
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchData(data.current_page - 1)} disabled={data.current_page === 1}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs disabled:opacity-40 hover:bg-slate-700 transition-colors">
                                        ← Prev
                                    </button>
                                    <button onClick={() => fetchData(data.current_page + 1)} disabled={data.current_page === data.last_page}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs disabled:opacity-40 hover:bg-slate-700 transition-colors">
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
