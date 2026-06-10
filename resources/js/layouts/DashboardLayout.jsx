import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = {
    guru: [
        { to: '/dashboard', icon: '', label: 'Dashboard' },
        { to: '/presensi', icon: '', label: 'Presensi' },
        { to: '/presensi/riwayat', icon: '', label: 'Riwayat' },
        { to: '/presensi/kalender', icon: '', label: 'Kalender' },
        { to: '/izin', icon: '', label: 'Izin / Cuti' },
        { to: '/laporan', icon: '', label: 'Laporan' },
    ],
    admin: [
        { to: '/dashboard', icon: '', label: 'Dashboard' },
        { to: '/presensi/riwayat', icon: '', label: 'Data Presensi' },
        { to: '/qr-generator', icon: '', label: 'Generate QR' },
        { to: '/izin/approval', icon: '', label: 'Approval Izin' },
        { to: '/pengguna', icon: '', label: 'Pengguna' },
        { to: '/laporan', icon: '', label: 'Laporan' },
        { to: '/settings/jam-kerja', icon: '', label: 'Jam Kerja' },
        { to: '/settings/hari-libur', icon: '', label: 'Hari Libur' },
        { to: '/settings/gps', icon: '', label: 'Lokasi GPS' },
    ],
    kepala_sekolah: [
        { to: '/dashboard', icon: '', label: 'Dashboard' },
        { to: '/presensi/riwayat', icon: '', label: 'Data Presensi' },
        { to: '/qr-generator', icon: '', label: 'Generate QR' },
        { to: '/izin/approval', icon: '', label: 'Approval Izin' },
        { to: '/laporan', icon: '', label: 'Laporan' },
    ],
    yayasan: [
        { to: '/dashboard', icon: '', label: 'Dashboard' },
        { to: '/laporan', icon: '', label: 'Laporan' },
    ],
}

const roleLabel = {
    guru: 'Guru',
    admin: 'Administrator',
    kepala_sekolah: 'Kepala Sekolah',
    yayasan: 'Yayasan',
}

const roleBadgeColor = {
    guru: 'bg-emerald-500/20 text-emerald-400',
    admin: 'bg-blue-500/20 text-blue-400',
    kepala_sekolah: 'bg-violet-500/20 text-violet-400',
    yayasan: 'bg-amber-500/20 text-amber-400',
}

export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const items = navItems[user?.role] || navItems.guru

    const handleLogout = async () => {
        setLoggingOut(true)
        await logout()
        navigate('/login')
    }

    const Sidebar = ({ mobile = false }) => (
        <aside className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 ${mobile ? 'w-full' : 'w-64'}`}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">S</div>
                <div>
                    <h1 className="text-white font-semibold text-sm">SIPEGAS</h1>
                    <p className="text-slate-500 text-xs">Sistem Presensi Sekolah</p>
                </div>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-slate-800">
                <NavLink to="/profil" onClick={() => mobile && setSidebarOpen(false)} className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700'}`
                }>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                        {user?.foto_profil_url ? (
                            <img src={user.foto_profil_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user?.initials || user?.nama_lengkap?.charAt(0) || '?'
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{user?.nama_lengkap}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeColor[user?.role]}`}>
                            {roleLabel[user?.role]}
                        </span>
                    </div>
                </NavLink>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
                {items.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/dashboard'}
                        onClick={() => mobile && setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`
                        }
                    >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="border border-red-500 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-700 hover:text-white hover:bg-red-500 transition-all duration-150 cursor-pointer"
                >
                    {/* <span className="text-base">🚪</span> */}
                    {loggingOut ? 'Keluar...' : 'Keluar'}
                </button>
            </div>
        </aside>
    )

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
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
