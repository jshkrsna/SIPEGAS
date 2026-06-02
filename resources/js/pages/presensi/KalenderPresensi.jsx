import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import dayjs from 'dayjs'

const STATUS_COLOR = {
    hadir:     '#10b981',
    terlambat: '#f59e0b',
    izin:      '#3b82f6',
    cuti:      '#8b5cf6',
    alpha:     '#ef4444',
}

export default function KalenderPresensi() {
    const [data, setData] = useState([])
    const [month, setMonth] = useState(dayjs().month())
    const [year, setYear] = useState(dayjs().year())
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.get('/presensi', { params: { bulan: month + 1, tahun: year, per_page: 100 } })
            .then(r => setData(r.data.data?.data || []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [month, year])

    const startOfMonth = dayjs().year(year).month(month).startOf('month')
    const daysInMonth  = startOfMonth.daysInMonth()
    const startDay     = startOfMonth.day() // 0=Sun

    const presensiMap = data.reduce((acc, p) => {
        acc[dayjs(p.tanggal).date()] = p
        return acc
    }, {})

    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Kalender Presensi</h2>
                    <p className="text-slate-400 text-sm mt-1">Visualisasi kehadiran bulanan</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => {
                        if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
                    }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">←</button>
                    <span className="text-white font-medium px-2">{dayjs().year(year).month(month).format('MMMM YYYY')}</span>
                    <button onClick={() => {
                        if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
                    }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">→</button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {dayLabels.map(d => (
                        <div key={d} className="text-center text-slate-500 text-xs font-medium py-2">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells before first day */}
                        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}

                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const presensi = presensiMap[day]
                            const isToday = dayjs().date() === day && dayjs().month() === month && dayjs().year() === year
                            const isWeekend = dayjs().year(year).month(month).date(day).day() % 6 === 0

                            return (
                                <div key={day}
                                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center p-1 text-xs transition-all
                                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                                        ${presensi ? 'cursor-pointer hover:opacity-80' : isWeekend ? 'bg-slate-800/30' : 'bg-slate-800/50'}
                                    `}
                                    style={presensi ? { backgroundColor: STATUS_COLOR[presensi.status_kehadiran] + '33' } : {}}
                                    title={presensi ? `${presensi.status_kehadiran}${presensi.waktu_checkin ? ` · Masuk ${dayjs(presensi.waktu_checkin).format('HH:mm')}` : ''}` : ''}
                                >
                                    <span className={`font-medium ${isToday ? 'text-blue-400' : isWeekend ? 'text-slate-500' : 'text-slate-300'}`}>{day}</span>
                                    {presensi && (
                                        <div className="w-2 h-2 rounded-full mt-0.5" style={{ backgroundColor: STATUS_COLOR[presensi.status_kehadiran] }} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-800">
                    {Object.entries(STATUS_COLOR).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="capitalize">{status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
