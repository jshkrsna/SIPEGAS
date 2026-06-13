import React, { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePageTransition, useNavHover } from '../utils/usePageTransition'
import gsap from 'gsap'

const Icons = {
    Dashboard: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Presensi: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Riwayat: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    Kalender: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Izin: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    GenerateQR: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>,
    ApprovalJarakJauh: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    ApprovalIzin: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Pengguna: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    JamKerja: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    HariLibur: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    LokasiGPS: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Laporan: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Keluar: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
}

const navItems = {
    pegawai: [
        { to: '/dashboard', icon: 'Dashboard', label: 'Dashboard' },
        { to: '/presensi', icon: 'Presensi', label: 'Presensi' },
        { to: '/presensi/riwayat', icon: 'Riwayat', label: 'Riwayat' },
        { to: '/presensi/kalender', icon: 'Kalender', label: 'Kalender' },
        { to: '/izin', icon: 'Izin', label: 'Izin / Cuti' },
    ],
    admin: [
        { to: '/dashboard', icon: 'Dashboard', label: 'Dashboard' },
        { to: '/presensi/riwayat', icon: 'Riwayat', label: 'Data Presensi' },
        { to: '/qr-generator', icon: 'GenerateQR', label: 'Generate QR' },
        { to: '/presensi/approval-jarak-jauh', icon: 'ApprovalJarakJauh', label: 'Approval Jarak Jauh' },
        { to: '/izin/approval', icon: 'ApprovalIzin', label: 'Approval Izin' },
        { to: '/pengguna', icon: 'Pengguna', label: 'Pengguna' },
        { to: '/settings/jam-kerja', icon: 'JamKerja', label: 'Jam Kerja' },
        { to: '/settings/hari-libur', icon: 'HariLibur', label: 'Hari Libur' },
        { to: '/settings/gps', icon: 'LokasiGPS', label: 'Lokasi GPS' },
    ],
    kepala_sekolah: [
        { to: '/dashboard', icon: 'Dashboard', label: 'Dashboard' },
        { to: '/presensi/riwayat', icon: 'Riwayat', label: 'Data Presensi' },
        { to: '/qr-generator', icon: 'GenerateQR', label: 'Generate QR' },
        { to: '/presensi/approval-jarak-jauh', icon: 'ApprovalJarakJauh', label: 'Approval Jarak Jauh' },
        { to: '/izin/approval', icon: 'ApprovalIzin', label: 'Approval Izin' },
    ],
    yayasan: [
        { to: '/dashboard', icon: 'Dashboard', label: 'Dashboard' },
        { to: '/laporan', icon: 'Laporan', label: 'Laporan' },
    ],
}

const roleLabel = {
    pegawai: 'Pegawai',
    admin: 'Administrator',
    kepala_sekolah: 'Kepala Sekolah',
    yayasan: 'Yayasan',
}

const roleBadgeColor = {
    pegawai: 'bg-emerald-500/20 text-emerald-400',
    admin: 'bg-blue-500/20 text-blue-400',
    kepala_sekolah: 'bg-violet-500/20 text-violet-400',
    yayasan: 'bg-amber-500/20 text-amber-400',
}

export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const pageRef = usePageTransition()
    const navHover = useNavHover()

    const items = navItems[user?.role] || navItems.pegawai

    const handleLogout = async () => {
        setLoggingOut(true)
        await logout()
        navigate('/login')
    }

    const Sidebar = ({ mobile = false }) => {
        const sidebarRef = useRef(null)

        useEffect(() => {
            if (mobile) return
            gsap.to(sidebarRef.current, {
                width: isCollapsed ? 80 : 256,
                duration: 0.4,
                ease: 'power3.inOut'
            })
            gsap.to('.sidebar-text', {
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : 'auto',
                duration: 0.3,
                ease: 'power2.inOut'
            })
        }, [isCollapsed, mobile])

        return (
            <aside ref={sidebarRef} className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 ${mobile ? 'w-full' : 'w-64'} overflow-hidden relative`}>
                
                {/* Logo & Toggle */}
                <div className={`flex items-center px-4 py-5 border-b border-slate-800 h-[73px] ${isCollapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 sidebar-text ${isCollapsed && !mobile ? 'hidden' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                        <div className="whitespace-nowrap min-w-0">
                            <h1 className="text-white font-semibold text-sm">SIPEGAS</h1>
                        </div>
                    </div>
                    
                    {!mobile && (
                        <button 
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0 flex items-center gap-1"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {/* Panel Icon */}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                                <path d="M9 3v18" strokeWidth={2} />
                            </svg>
                            {/* Direction Arrow */}
                            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* User info */}
                <div className={`px-4 py-4 border-b border-slate-800 flex justify-center`}>
                    <NavLink to="/profil" onClick={() => mobile && setSidebarOpen(false)} title={isCollapsed && !mobile ? "Profil" : undefined} className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700'} ${isCollapsed && !mobile ? 'p-2 justify-center w-12 h-12' : 'p-3 w-full'}`
                    }>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                            {user?.foto_profil_url ? (
                                <img src={user.foto_profil_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.initials || user?.nama_lengkap?.charAt(0) || '?'
                            )}
                        </div>
                        <div className={`sidebar-text min-w-0 whitespace-nowrap ${isCollapsed && !mobile ? 'hidden' : ''}`}>
                            <p className="text-white text-sm font-medium truncate">{user?.nama_lengkap}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${roleBadgeColor[user?.role]}`}>
                                {roleLabel[user?.role]}
                            </span>
                        </div>
                    </NavLink>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 scrollbar-hide">
                    {items.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/dashboard' || item.to === '/presensi'}
                            onClick={() => mobile && setSidebarOpen(false)}
                            title={isCollapsed && !mobile ? item.label : undefined}
                            {...navHover}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                                } ${isCollapsed && !mobile ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5'}`
                            }
                        >
                            {Icons[item.icon]}
                            <span className={`sidebar-text whitespace-nowrap ${isCollapsed && !mobile ? 'hidden' : ''}`}>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-slate-800 flex justify-center">
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        title={isCollapsed && !mobile ? "Keluar" : undefined}
                        className={`border border-red-500/50 flex items-center justify-center gap-3 rounded-lg text-sm font-medium text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-150 cursor-pointer ${isCollapsed && !mobile ? 'w-10 h-10 p-0 mx-auto' : 'w-full px-3 py-2.5'}`}
                    >
                        {Icons.Keluar}
                        <span className={`sidebar-text whitespace-nowrap ${isCollapsed && !mobile ? 'hidden' : ''}`}>
                            {loggingOut ? 'Keluar...' : 'Keluar'}
                        </span>
                    </button>
                </div>
            </aside>
        )
    }

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-72 z-10">
                        <Sidebar mobile />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Topbar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">S</div>
                        <span className="text-white font-semibold text-sm">SIPEGAS</span>
                    </div>
                    <NavLink to="/profil" className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold hover:ring-2 hover:ring-blue-500 transition-all overflow-hidden">
                        {user?.foto_profil_url ? (
                            <img src={user.foto_profil_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user?.initials || user?.nama_lengkap?.charAt(0) || '?'
                        )}
                    </NavLink>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div ref={pageRef}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
