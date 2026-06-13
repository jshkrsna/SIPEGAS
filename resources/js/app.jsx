import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import AuthLayout from './layouts/AuthLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import PresensiPage from './pages/presensi/PresensiPage'
import RiwayatPresensi from './pages/presensi/RiwayatPresensi'
import KalenderPresensi from './pages/presensi/KalenderPresensi'
import PengajuanIzin from './pages/izin/PengajuanIzin'
import ApprovalIzin from './pages/izin/ApprovalIzin'
import ApprovalJarakJauh from './pages/admin/ApprovalJarakJauh'
import ManajemenPengguna from './pages/admin/ManajemenPengguna'
import LaporanBulanan from './pages/laporan/LaporanBulanan'
import LaporanYayasan from './pages/laporan/LaporanYayasan'
import JamKerjaPage from './pages/settings/JamKerjaPage'
import HariLiburPage from './pages/settings/HariLiburPage'
import GpsPage from './pages/settings/GpsPage'
import GenerateQR from './pages/admin/GenerateQR'
import ProfilPage from './pages/ProfilPage'

function PrivateRoute({ children, roles }) {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Memuat...</p>
            </div>
        </div>
    )
    if (!user) return <Navigate to="/login" replace />
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
    return children
}

export default function App() {
    const { user, loading } = useAuth()

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    )

    return (
        <Routes>
            {/* Public */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            </Route>

            {/* Protected */}
            <Route element={
                <PrivateRoute>
                    <DashboardLayout />
                </PrivateRoute>
            }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profil" element={<ProfilPage />} />
                <Route path="/presensi" element={<PresensiPage />} />
                <Route path="/presensi/riwayat" element={<RiwayatPresensi />} />
                <Route path="/presensi/kalender" element={<KalenderPresensi />} />
                <Route path="/izin" element={<PengajuanIzin />} />
                <Route path="/izin/approval" element={
                    <PrivateRoute roles={['admin', 'kepala_sekolah']}>
                        <ApprovalIzin />
                    </PrivateRoute>
                } />
                <Route path="/presensi/approval-jarak-jauh" element={
                    <PrivateRoute roles={['admin', 'kepala_sekolah']}>
                        <ApprovalJarakJauh />
                    </PrivateRoute>
                } />
                <Route path="/laporan" element={
                    user?.role === 'yayasan' ? <LaporanYayasan /> : <LaporanBulanan />
                } />
                <Route path="/pengguna" element={
                    <PrivateRoute roles={['admin']}>
                        <ManajemenPengguna />
                    </PrivateRoute>
                } />
                <Route path="/qr-generator" element={
                    <PrivateRoute roles={['admin', 'kepala_sekolah']}>
                        <GenerateQR />
                    </PrivateRoute>
                } />
                <Route path="/settings/jam-kerja" element={
                    <PrivateRoute roles={['admin']}>
                        <JamKerjaPage />
                    </PrivateRoute>
                } />
                <Route path="/settings/hari-libur" element={
                    <PrivateRoute roles={['admin']}>
                        <HariLiburPage />
                    </PrivateRoute>
                } />
                <Route path="/settings/gps" element={
                    <PrivateRoute roles={['admin']}>
                        <GpsPage />
                    </PrivateRoute>
                } />
            </Route>

            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    )
}

// Render React App
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

const container = document.getElementById('app')
if (container) {
    const root = createRoot(container)
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    )
}
