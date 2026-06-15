import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1 = enter email, 2 = enter code + new password
    const [email, setEmail] = useState('')
    const [token, setToken] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [demoToken, setDemoToken] = useState('')

    // Step 1: Request reset token
    const handleRequestToken = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        try {
            const { data } = await api.post('/auth/forgot-password', { email })
            setSuccess(data.message)
            // In demo mode, the token is returned in the response
            if (data.data?.token) {
                setDemoToken(data.data.token)
                setToken(data.data.token)
            }
            setStep(2)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim permintaan reset.')
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (password !== passwordConfirm) {
            setError('Konfirmasi password tidak cocok.')
            setLoading(false)
            return
        }

        try {
            const { data } = await api.post('/auth/reset-password', {
                email,
                token,
                password,
                password_confirmation: passwordConfirm,
            })
            setSuccess(data.message)
            // Redirect to login after 2 seconds
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mereset password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="h-20 mx-auto mb-4 flex items-center justify-center">
                        <img src="/images/logo-hitam.png" alt="SIPEGAS Logo" className="h-full w-auto block dark:hidden" />
                        <img src="/images/logo-putih.png" alt="SIPEGAS Logo" className="h-full w-auto hidden dark:block" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {step === 1 ? 'Lupa Password' : 'Reset Password'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {step === 1
                            ? 'Masukkan email Anda untuk mendapatkan kode verifikasi'
                            : 'Masukkan kode verifikasi dan password baru Anda'}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                        <span>✅</span> {success}
                    </div>
                )}

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleRequestToken} className="space-y-4">
                        <div>
                            <label className="block text-slate-700 dark:text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="email@sipegas.id"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-blue-500/25 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Mengirim...
                                </span>
                            ) : 'Kirim Kode Verifikasi'}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter Code + New Password */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {/* Demo token display */}
                        {demoToken && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
                                <p className="text-xs text-slate-400 mb-1">Kode verifikasi (mode demo):</p>
                                <p className="font-mono font-bold text-lg tracking-[0.3em] text-center">{demoToken}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-slate-700 dark:text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Kode Verifikasi (6-digit)</label>
                            <input
                                type="text"
                                value={token}
                                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                placeholder="123456"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm font-mono tracking-widest text-center"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 dark:text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Password Baru</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-700 dark:text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={e => setPasswordConfirm(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-blue-500/25 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Mereset...
                                </span>
                            ) : 'Reset Password'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep(1); setError(''); setSuccess(''); setDemoToken('') }}
                            className="w-full text-slate-400 hover:text-slate-200 text-sm transition-colors py-2"
                        >
                            ← Kirim ulang kode
                        </button>
                    </form>
                )}

                {/* Back to login */}
                <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        ← Kembali ke halaman login
                    </Link>
                </div>
            </div>
        </div>
    )
}
