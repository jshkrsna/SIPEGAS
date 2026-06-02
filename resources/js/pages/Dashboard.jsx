import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
dayjs.locale('id')

const STATUS_COLORS = {
    hadir: '#10b981',
    terlambat: '#f59e0b',
    izin: '#3b82f6',
    cuti: '#8b5cf6',
    alpha: '#ef4444',
    belum_hadir: '#475569',
}

function StatCard({ label, value, icon, color = 'blue', sub }) {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        yellow: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
        violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
    }
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 flex items-center gap-4`}>
            <span className="text-3xl">{icon}</span>
            <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
                <p className="text-white text-2xl font-bold mt-0.5">{value ?? '—'}</p>
                {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
            </div>
        </div>
    )
}

// ─── Guru Dashboard ───────────────────────────────────────────────────────────
function GuruDashboard({ data }) {
    const b = data.bulan_ini
    const today = data.today_presensi
    const pieData = [
        { name: 'Hadir', value: b.hadir, color: STATUS_COLORS.hadir },
        { name: 'Terlambat', value: b.terlambat, color: STATUS_COLORS.terlambat },
        { name: 'Izin', value: b.izin, color: STATUS_COLORS.izin },
        { name: 'Cuti', value: b.cuti, color: STATUS_COLORS.cuti },
        { name: 'Alpha', value: b.alpha, color: STATUS_COLORS.alpha },
    ].filter(d => d.value > 0)

    return (
        <div className="space-y-6">
            {/* Today Status */}
            <div className={`rounded-xl p-5 border flex items-center gap-4 ${
                today ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
            }`}>
                <span className="text-4xl">{today ? '✅' : '⏰'}</span>
                <div>
                    <p className="text-slate-400 text-sm">Status Hari Ini</p>
                    {today ? (
                        <>
                            <p className="text-white font-semibold text-lg capitalize">{today.status_kehadiran}</p>
                            <p className="text-slate-400 text-sm">
                                Masuk: {dayjs(today.waktu_checkin).format('HH:mm')}
                                {today.waktu_checkout && ` · Pulang: ${dayjs(today.waktu_checkout).format('HH:mm')}`}
                            </p>
                        </>
                    ) : (
                        <p className="text-white font-semibold text-lg">Belum Presensi</p>
                    )}
                </div>
                {!today && (
                    <a href="/presensi" className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        Presensi Sekarang
                    </a>
                )}
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatCard label="Hadir" value={b.hadir} icon="✅" color="green" />
                <StatCard label="Terlambat" value={b.terlambat} icon="⏰" color="yellow" />
                <StatCard label="Izin" value={b.izin} icon="📝" color="blue" />
                <StatCard label="Cuti" value={b.cuti} icon="🏖️" color="violet" />
                <StatCard label="Alpha" value={b.alpha} icon="❌" color="red" />
            </div>

            {/* Chart */}
            {pieData.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Rekap Bulan Ini</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {data.pending_izin > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                        <p className="text-amber-400 font-medium">{data.pending_izin} pengajuan izin masih pending</p>
                        <a href="/izin" className="text-amber-300 text-sm hover:underline">Lihat status →</a>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Admin/Kepala Dashboard ───────────────────────────────────────────────────
function AdminDashboard({ data }) {
    const t = data.today || {}
    const trend = data.weekly_trend || {}

    const barData = Object.entries(trend).map(([date, statuses]) => {
        const row = { date: dayjs(date).format('DD/MM') }
        statuses.forEach(s => { row[s.status_kehadiran] = s.total })
        return row
    })

    return (
        <div className="space-y-6">
            {/* Today Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total Pegawai" value={data.total_pegawai} icon="👥" color="blue" />
                <StatCard label="Hadir" value={t.hadir} icon="✅" color="green" />
                <StatCard label="Terlambat" value={t.terlambat} icon="⏰" color="yellow" />
                <StatCard label="Izin" value={t.izin} icon="📝" color="blue" />
                <StatCard label="Alpha" value={t.alpha} icon="❌" color="red" />
                <StatCard label="Pending Izin" value={data.pending_izin} icon="📋" color="violet" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Tren Kehadiran 7 Hari</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData}>
                            <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                            <Bar dataKey="hadir" fill={STATUS_COLORS.hadir} radius={[2, 2, 0, 0]} name="Hadir" />
                            <Bar dataKey="terlambat" fill={STATUS_COLORS.terlambat} radius={[2, 2, 0, 0]} name="Terlambat" />
                            <Bar dataKey="alpha" fill={STATUS_COLORS.alpha} radius={[2, 2, 0, 0]} name="Alpha" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Checkins */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Check-in Terkini</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(data.recent_checkins || []).map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                    {p.pengguna?.nama_lengkap?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm truncate">{p.pengguna?.nama_lengkap}</p>
                                    <p className="text-slate-400 text-xs">{dayjs(p.waktu_checkin).format('HH:mm')} · <span className={`capitalize ${
                                        p.status_kehadiran === 'hadir' ? 'text-emerald-400' : 'text-amber-400'
                                    }`}>{p.status_kehadiran}</span></p>
                                </div>
                            </div>
                        ))}
                        {(!data.recent_checkins || data.recent_checkins.length === 0) && (
                            <p className="text-slate-500 text-sm text-center py-4">Belum ada check-in hari ini</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(r => setStats(r.data.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const now = dayjs()

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Selamat datang, {user?.nama_lengkap?.split(' ')[0]} 👋</h2>
                <p className="text-slate-400 mt-1">{now.format('dddd, D MMMM YYYY')}</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : stats ? (
                user?.role === 'guru' ? <GuruDashboard data={stats} /> :
                (user?.role === 'admin' || user?.role === 'kepala_sekolah') ? <AdminDashboard data={stats} /> :
                <div className="text-slate-400">Dashboard tersedia</div>
            ) : (
                <div className="text-slate-400">Gagal memuat data</div>
            )}
        </div>
    )
}
