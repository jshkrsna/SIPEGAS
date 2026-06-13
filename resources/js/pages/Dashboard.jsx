import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import gsap from 'gsap'
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
        blue:   'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        green:  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        yellow: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        red:    'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
        violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
        amber:  'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    }
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 flex items-center gap-3 h-full`}>
            <span className="text-3xl flex-shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
                <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider truncate" title={label}>{label}</p>
                <p className="text-white text-2xl font-bold mt-0.5">{value ?? '—'}</p>
                {sub && <p className="text-slate-500 text-[11px] mt-0.5 truncate" title={sub}>{sub}</p>}
            </div>
        </div>
    )
}

// ─── Guru Dashboard ───────────────────────────────────────────────────────────
function GuruDashboard({ data }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.dashboard-item', 
                { opacity: 0, y: 30 }, 
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
            )
        }, containerRef)
        return () => ctx.revert()
    }, [data])

    const b = data.bulan_ini
    const today = data.today_presensi
    const pieData = [
        { name: 'Hadir',     value: b.hadir,     color: STATUS_COLORS.hadir },
        { name: 'Terlambat', value: b.terlambat, color: STATUS_COLORS.terlambat },
        { name: 'Izin',      value: b.izin,      color: STATUS_COLORS.izin },
        { name: 'Cuti',      value: b.cuti,      color: STATUS_COLORS.cuti },
        { name: 'Alpha',     value: b.alpha,     color: STATUS_COLORS.alpha },
    ].filter(d => d.value > 0)

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Today Status */}
            <div className={`dashboard-item rounded-xl p-5 border flex items-center gap-4 ${
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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="dashboard-item h-full"><StatCard label="Hadir"     value={b.hadir}     icon="✅" color="green"  /></div>
                <div className="dashboard-item h-full"><StatCard label="Terlambat" value={b.terlambat} icon="⏰" color="yellow" /></div>
                <div className="dashboard-item h-full"><StatCard label="Izin"      value={b.izin}      icon="📝" color="blue"   /></div>
                <div className="dashboard-item h-full"><StatCard label="Cuti"      value={b.cuti}      icon="🏖️" color="violet" /></div>
                <div className="dashboard-item h-full"><StatCard label="Alpha"     value={b.alpha}     icon="❌" color="red"    /></div>
            </div>

            {/* Chart */}
            {pieData.length > 0 && (
                <div className="dashboard-item bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Rekap Bulan Ini</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {data.pending_izin > 0 && (
                <div className="dashboard-item bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
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
    const containerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.dashboard-item', 
                { opacity: 0, scale: 0.95, y: 20 }, 
                { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(1.5)' }
            )
        }, containerRef)
        return () => ctx.revert()
    }, [data])

    const t    = data.today || {}
    const trend = data.weekly_trend || {}

    const barData = Object.entries(trend).map(([date, statuses]) => {
        const row = { date: dayjs(date).format('DD/MM') }
        statuses.forEach(s => { row[s.status_kehadiran] = s.total })
        return row
    })

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Today Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="dashboard-item h-full"><StatCard label="Total Pegawai" value={data.total_pegawai}   icon="👥" color="blue"   /></div>
                <div className="dashboard-item h-full"><StatCard label="Hadir"          value={t.hadir}             icon="✅" color="green"  /></div>
                <div className="dashboard-item h-full"><StatCard label="Terlambat"      value={t.terlambat}         icon="⏰" color="yellow" /></div>
                <div className="dashboard-item h-full"><StatCard label="Izin"           value={t.izin}              icon="📝" color="blue"   /></div>
                <div className="dashboard-item h-full"><StatCard label="Alpha"          value={t.alpha}             icon="❌" color="red"    /></div>
                <div className="dashboard-item h-full"><StatCard label="Pending Izin"   value={data.pending_izin}   icon="📋" color="violet" /></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Trend */}
                <div className="dashboard-item bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Tren Kehadiran 7 Hari</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData}>
                            <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} 
                            />
                            <Bar dataKey="hadir"     fill={STATUS_COLORS.hadir}     radius={[2, 2, 0, 0]} name="Hadir"     />
                            <Bar dataKey="terlambat" fill={STATUS_COLORS.terlambat} radius={[2, 2, 0, 0]} name="Terlambat" />
                            <Bar dataKey="alpha"     fill={STATUS_COLORS.alpha}     radius={[2, 2, 0, 0]} name="Alpha"     />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Checkins */}
                <div className="dashboard-item bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-4">Check-in Terkini</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(data.recent_checkins || []).map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                    {p.pengguna?.nama_lengkap?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm truncate">{p.pengguna?.nama_lengkap}</p>
                                    <p className="text-slate-400 text-xs">
                                        {dayjs(p.waktu_checkin).format('HH:mm')} · <span className={`capitalize ${
                                            p.status_kehadiran === 'hadir' ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>{p.status_kehadiran}</span>
                                    </p>
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

// ─── Yayasan Dashboard ────────────────────────────────────────────────────────
const RANK_MEDAL = ['🥇', '🥈', '🥉']

function YayasanDashboard({ data }) {
    const perSekolah = data.per_sekolah || []

    // Comparative bar chart per school
    const chartData = perSekolah.map(s => ({
        name:      s.kode_sekolah || s.nama_sekolah,
        Hadir:     s.bulan?.hadir     ?? 0,
        Terlambat: s.bulan?.terlambat ?? 0,
        Alpha:     s.bulan?.alpha     ?? 0,
    }))

    return (
        <div className="space-y-6">
            {/* Macro Stats — 4 cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Total Sekolah"
                    value={data.total_sekolah}
                    icon="🏫"
                    color="blue"
                    sub="unit di bawah yayasan"
                />
                <StatCard
                    label="Total Pegawai Aktif"
                    value={data.total_pegawai}
                    icon="👥"
                    color="violet"
                    sub="seluruh unit sekolah"
                />
                <StatCard
                    label="Hadir Hari Ini"
                    value={data.today_hadir}
                    icon="✅"
                    color="green"
                    sub="lintas semua sekolah"
                />
                <StatCard
                    label="Rata-rata Kehadiran"
                    value={`${data.avg_kehadiran ?? 0}%`}
                    icon="📊"
                    color="amber"
                    sub="bulan ini, semua sekolah"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Grafik Komparatif */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-1">Grafik Komparatif Kehadiran</h3>
                    <p className="text-slate-500 text-xs mb-4">Performa kedisiplinan antar unit sekolah — bulan ini</p>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} barCategoryGap="30%">
                                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                                    formatter={(val, name) => [val, name]}
                                />
                                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                                <Bar dataKey="Hadir"     fill={STATUS_COLORS.hadir}     radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Terlambat" fill={STATUS_COLORS.terlambat} radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Alpha"     fill={STATUS_COLORS.alpha}     radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm gap-2">
                            <span className="text-3xl">📉</span>
                            <span>Belum ada data presensi bulan ini</span>
                        </div>
                    )}
                </div>

                {/* Leaderboard Kedisiplinan */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-1">Leaderboard Kedisiplinan</h3>
                    <p className="text-slate-500 text-xs mb-4">Peringkat unit sekolah berdasarkan % kehadiran tertinggi</p>
                    <div className="space-y-2">
                        {perSekolah.length > 0 ? perSekolah.map((s, i) => {
                            const pct  = s.bulan?.pct_hadir ?? 0
                            const barW = `${Math.max(pct, 3)}%`
                            const barColor = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                            const pctColor = pct >= 90 ? 'text-emerald-400' : pct >= 75 ? 'text-amber-400' : 'text-red-400'
                            return (
                                <div key={s.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all duration-200">
                                    {/* Rank badge */}
                                    <div className="w-8 text-center text-lg flex-shrink-0">
                                        {RANK_MEDAL[i] ?? <span className="text-slate-500 text-sm font-bold">#{i + 1}</span>}
                                    </div>
                                    {/* School info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-white text-sm font-medium truncate">{s.nama_sekolah}</p>
                                            <span className={`text-xs font-bold ml-2 flex-shrink-0 ${pctColor}`}>{pct}%</span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                                style={{ width: barW }} />
                                        </div>
                                        <div className="flex gap-3 mt-1.5">
                                            <span className="text-slate-500 text-xs">{s.total_pegawai} pegawai</span>
                                            <span className="text-emerald-500 text-xs">✓ {s.bulan?.hadir ?? 0} hadir</span>
                                            {(s.bulan?.alpha ?? 0) > 0 && (
                                                <span className="text-red-500 text-xs">✗ {s.bulan.alpha} alpha</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="text-center py-10 text-slate-500 text-sm">
                                <p className="text-3xl mb-2">📭</p>
                                <p>Belum ada data kehadiran bulan ini</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Executive Report shortcut */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5 flex flex-wrap items-center gap-4">
                <span className="text-3xl">📋</span>
                <div className="flex-1 min-w-0">
                    <p className="text-amber-400 font-semibold">Executive Report Generator</p>
                    <p className="text-slate-400 text-sm mt-0.5">
                        Unduh rekap kehadiran seluruh sekolah dalam format Excel atau PDF untuk kebutuhan rapat internal.
                    </p>
                </div>
                <a
                    href="/laporan"
                    className="flex-shrink-0 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/30 text-amber-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    Buka Laporan →
                </a>
            </div>
        </div>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
                <h2 className="text-2xl font-bold text-white">
                    Selamat datang, {user?.nama_lengkap?.split(' ')[0]} 👋
                </h2>
                <p className="text-slate-400 mt-1">{now.format('dddd, D MMMM YYYY')}</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : stats ? (
                ['guru', 'pegawai'].includes(user?.role) ? <GuruDashboard data={stats} />    :
                ['admin', 'kepala_sekolah'].includes(user?.role) ? <AdminDashboard data={stats} />   :
                user?.role === 'yayasan'        ? <YayasanDashboard data={stats} /> :
                <div className="text-slate-400">Dashboard tersedia</div>
            ) : (
                <div className="text-slate-400">Gagal memuat data</div>
            )}
        </div>
    )
}
