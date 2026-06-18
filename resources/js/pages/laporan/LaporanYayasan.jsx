import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import api from '../../api/axios'
import gsap from 'gsap'

export default function LaporanYayasan() {
    const [sekolah, setSekolah] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const containerRef = useRef(null)

    useEffect(() => {
        const fetchSekolah = async () => {
            try {
                const { data } = await api.get('/sekolah')
                setSekolah(data.data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchSekolah()
    }, [])

    useEffect(() => {
        if (!loading && sekolah.length > 0) {
            const ctx = gsap.context(() => {
                gsap.fromTo('.sekolah-card', 
                    { opacity: 0, y: 20 }, 
                    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }
                )
            }, containerRef)
            return () => ctx.revert()
        }
    }, [loading])

    return (
        <div ref={containerRef} className="p-6 max-w-5xl mx-auto space-y-6">
            <PageHeader 
                title="Laporan Presensi Sekolah" 
                description="Pilih sekolah untuk melihat data presensi dan mengunduh rekapan." 
                icon={<svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : sekolah.length === 0 ? (
                <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-4xl">🏢</span>
                    <p className="text-slate-400 mt-3">Tidak ada data sekolah.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sekolah.map(s => (
                        <div key={s.id} onClick={() => navigate(`/presensi/riwayat?sekolah_id=${s.id}`)}
                            className="sekolah-card bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    🏫
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">{s.nama_sekolah}</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">{s.alamat || 'Alamat tidak tersedia'}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Lihat Data Presensi →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
