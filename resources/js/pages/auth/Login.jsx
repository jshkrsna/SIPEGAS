import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPass, setShowPass] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await login(form.email, form.password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.')
        } finally {
            setLoading(false)
        }
    }

    const demoAccounts = [
        { label: 'Admin', email: 'admin@sipegas.id', role: 'admin', color: 'blue' },
        { label: 'Kepala', email: 'kepala@sipegas.id', role: 'kepala', color: 'violet' },
        { label: 'Guru', email: 'andi@sipegas.id', role: 'guru', color: 'emerald' },
        { label: 'Yayasan', email: 'yayasan@sipegas.id', role: 'yayasan', color: 'amber' },
    ]

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="h-20 mx-auto flex items-center justify-center">
                        <img src="/images/logo-hitam.png" alt="SIPEGAS Logo" className="h-full w-auto block dark:hidden" />
                        <img src="/images/logo-putih.png" alt="SIPEGAS Logo" className="h-full w-auto hidden dark:block" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-4">Sistem Presensi Pegawai Sekolah</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-700 dark:text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                            placeholder="email@sekolah.id"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-700 dark:text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                required
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm pr-10"
                            />
                            <button type="button" onClick={() => setShowPass(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs transition-colors">
                            Lupa Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-blue-500/25 mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Masuk...
                            </span>
                        ) : 'Masuk'}
                    </button>
                </form>

                {/* Demo Accounts */}
                <div className="mt-6 pt-5 border-t border-slate-800">
                    <p className="text-slate-500 text-xs text-center mb-3">Demo akun (password: <code className="text-slate-400">password123</code>)</p>
                    <div className="grid grid-cols-4 gap-2">
                        {demoAccounts.map(acc => (
                            <button
                                key={acc.email}
                                onClick={() => setForm({ email: acc.email, password: 'password123' })}
                                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all
                                    ${acc.color === 'blue' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' :
                                        acc.color === 'violet' ? 'border-violet-500/30 text-violet-400 hover:bg-violet-500/10' :
                                            acc.color === 'emerald' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' :
                                                'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}
                            >
                                {acc.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <p className="text-center text-slate-600 text-xs mt-6">
                © {new Date().getFullYear()} SIPEGAS · Sistem Presensi Pegawai Sekolah
            </p>
        </div>
    )
}
