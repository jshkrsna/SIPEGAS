import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import dayjs from 'dayjs'

const STATUS_COLOR = {
    hadir:     'bg-emerald-500/20 text-emerald-400',
    terlambat: 'bg-amber-500/20 text-amber-400',
    izin:      'bg-blue-500/20 text-blue-400',
    cuti:      'bg-violet-500/20 text-violet-400',
    alpha:     'bg-red-500/20 text-red-400',
}

export default function LaporanBulanan() {
    const { user } = useAuth()
    const [rekap, setRekap] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [filters, setFilters] = useState({
        bulan: dayjs().month() + 1,
        tahun: dayjs().year(),
    })
    const [detail, setDetail] = useState(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    const fetchRekap = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/rekap', { params: filters })
            setRekap(data.data || [])
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => { fetchRekap() }, [filters])

    const handleRefresh = async () => {
        setRefreshing(true)
        try {
            await api.post('/rekap/refresh', filters)
            fetchRekap()
        } catch {}
        finally { setRefreshing(false) }
    }

    const viewDetail = async (penggunaId) => {
        setLoadingDetail(true)
        try {
            const { data } = await api.get(`/rekap/detail/${penggunaId}`, { params: filters })
            setDetail(data.data)
        } catch {}
        finally { setLoadingDetail(false) }
    }

    const handleExport = async (type) => {
        try {
            const response = await api.get(`/rekap/export/${type}`, {
                params: filters,
                responseType: 'blob', // Important for downloading files
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Rekap_Presensi_${filters.bulan}_${filters.tahun}.${type === 'excel' ? 'xlsx' : 'pdf'}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Export failed:', error)
        }
    }

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: dayjs().month(i).format('MMMM') }))

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-white">Laporan Bulanan</h2>
                    <p className="text-slate-400 text-sm mt-1">Rekap kehadiran pegawai</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('excel')}
                        className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        📥 Excel
                    </button>
                    <button onClick={() => handleExport('pdf')}
                        className="bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        📄 PDF
                    </button>
                    {(user?.role === 'admin') && (
                        <button onClick={handleRefresh} disabled={refreshing}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-40">
                            {refreshing ? '⏳ Memperbarui...' : '🔄 Refresh Rekap'}
                        </button>
                    )}
                </div>
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
            </div>

            <div className={`${detail ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>
                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Pegawai</th>
                                        <th className="text-center px-3 py-3 text-slate-400 font-medium">H</th>
                                        <th className="text-center px-3 py-3 text-slate-400 font-medium">T</th>
                                        <th className="text-center px-3 py-3 text-slate-400 font-medium">I</th>
                                        <th className="text-center px-3 py-3 text-slate-400 font-medium">C</th>
                                        <th className="text-center px-3 py-3 text-slate-400 font-medium">A</th>
                                        {user?.role !== 'pegawai' && <th className="text-center px-3 py-3 text-slate-400 font-medium">Detail</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rekap.map(r => (
                                        <tr key={r.id} className={`border-b border-slate-800/50 transition-colors cursor-pointer ${
                                            detail?.pengguna?.id === r.pengguna_id ? 'bg-blue-500/10' : 'hover:bg-slate-800/30'
                                        }`} onClick={() => viewDetail(r.pengguna_id)}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs">
                                                        {r.pengguna?.nama_lengkap?.charAt(0)}
                                                    </div>
                                                    <span className="text-white text-sm">{r.pengguna?.nama_lengkap}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center text-emerald-400 font-medium">{r.total_hadir}</td>
                                            <td className="px-3 py-3 text-center text-amber-400 font-medium">{r.total_terlambat}</td>
                                            <td className="px-3 py-3 text-center text-blue-400 font-medium">{r.total_izin}</td>
                                            <td className="px-3 py-3 text-center text-violet-400 font-medium">{r.total_cuti}</td>
                                            <td className="px-3 py-3 text-center text-red-400 font-medium">{r.total_alpha}</td>
                                            {user?.role !== 'pegawai' && (
                                                <td className="px-3 py-3 text-center">
                                                    <button className="text-xs text-blue-400 hover:underline">Lihat →</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {rekap.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                                            Belum ada rekap. Klik "Refresh Rekap" untuk menghitung.
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                            {/* Legend */}
                            <div className="flex gap-4 px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
                                <span>H = Hadir</span>
                                <span>T = Terlambat</span>
                                <span>I = Izin</span>
                                <span>C = Cuti</span>
                                <span>A = Alpha</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {detail && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-white font-semibold">{detail.pengguna?.nama_lengkap}</h3>
                                <p className="text-slate-400 text-xs">{dayjs().month(detail.bulan - 1).format('MMMM')} {detail.tahun}</p>
                            </div>
                            <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                        </div>
                        {loadingDetail ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-96 overflow-y-auto">
                                {(detail.presensi || []).map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                                        <span className="text-slate-500 text-xs w-16 flex-shrink-0">{dayjs(p.tanggal).format('DD MMM')}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${STATUS_COLOR[p.status_kehadiran]}`}>
                                            {p.status_kehadiran}
                                        </span>
                                        <span className="text-slate-400 text-xs">
                                            {p.waktu_checkin ? dayjs(p.waktu_checkin).format('HH:mm') : '—'}
                                            {p.waktu_checkout && ` – ${dayjs(p.waktu_checkout).format('HH:mm')}`}
                                        </span>
                                        {p.terlambat_menit > 0 && (
                                            <span className="text-amber-400 text-xs ml-auto">{p.terlambat_menit}m</span>
                                        )}
                                    </div>
                                ))}
                                {(!detail.presensi || detail.presensi.length === 0) && (
                                    <p className="text-slate-500 text-sm text-center py-8">Tidak ada data presensi</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
