import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'

export default function ProfilPage() {
    const { user, refreshUser } = useAuth()
    
    const [pwdForm, setPwdForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    })
    
    const [submitting, setSubmitting] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })
    
    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

    // Avatar Upload & Crop State
    const [imageSrc, setImageSrc] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const roleLabel = {
        pegawai: 'Pegawai',
        admin: 'Administrator',
        kepala_sekolah: 'Kepala Sekolah',
        yayasan: 'Yayasan'
    }

    const toggleTheme = (newTheme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        if (newTheme === 'light') {
            document.documentElement.classList.add('theme-light')
        } else {
            document.documentElement.classList.remove('theme-light')
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setMsg({ type: '', text: '' })
        
        if (pwdForm.new_password !== pwdForm.new_password_confirmation) {
            return setMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' })
        }
        
        setSubmitting(true)
        try {
            const { data } = await api.post('/auth/change-password', pwdForm)
            setMsg({ type: 'success', text: data.message })
            setPwdForm({ current_password: '', new_password: '', new_password_confirmation: '' })
        } catch (err) {
            setMsg({ 
                type: 'error', 
                text: err.response?.data?.message || 'Gagal mengubah password.' 
            })
        } finally {
            setSubmitting(false)
        }
    }

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            let imageDataUrl = await readFile(file)
            setImageSrc(imageDataUrl)
        }
    }

    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.addEventListener('load', () => resolve(reader.result), false)
            reader.readAsDataURL(file)
        })
    }

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleUploadAvatar = async () => {
        try {
            setUploading(true)
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
            
            await api.post('/auth/update-avatar', { foto_base64: croppedImage })
            await refreshUser()
            
            setImageSrc(null)
            setMsg({ type: 'success', text: 'Foto profil berhasil diperbarui.' })
        } catch (e) {
            console.error(e)
            setMsg({ type: 'error', text: 'Gagal memproses/mengunggah gambar.' })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 relative">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Profil Pengguna</h2>
                <p className="text-slate-400 mt-1">Informasi detail akun dan pengaturan keamanan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center">
                        <div 
                            className="relative w-32 h-32 rounded-full mb-4 shadow-lg group cursor-pointer overflow-hidden border-4 border-slate-800 hover:border-blue-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {user?.foto_profil_url ? (
                                <img src={user.foto_profil_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold">
                                    {user?.initials || user?.nama_lengkap?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-2xl mb-1">📷</span>
                                <span className="text-white text-xs font-medium">Ubah Foto</span>
                            </div>
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />

                        <h3 className="text-xl font-semibold text-white">{user?.nama_lengkap}</h3>
                        <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
                        <div className="mt-4 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                            {roleLabel[user?.role] || user?.role}
                        </div>
                    </div>
                </div>

                {/* Details & Security */}
                <div className="md:col-span-2 space-y-6">
                    {/* Detail Information */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 mb-4">Informasi Akun</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">NIP / Identitas</p>
                                <p className="text-white text-sm mt-1">{user?.nip || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">Sekolah Unit</p>
                                <p className="text-white text-sm mt-1">{user?.sekolah?.nama_sekolah || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">Jabatan</p>
                                <p className="text-white text-sm mt-1">{user?.jabatan?.nama_jabatan || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase">Status Akun</p>
                                <p className="text-emerald-400 text-sm mt-1 font-medium">{user?.is_active ? 'Aktif' : 'Non-aktif'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 mb-4">Ubah Password</h3>
                        
                        {msg.text && (
                            <div className={`p-3 rounded-lg text-sm mb-4 border ${
                                msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Password Saat Ini</label>
                                <input
                                    type="password"
                                    required
                                    value={pwdForm.current_password}
                                    onChange={e => setPwdForm({...pwdForm, current_password: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Masukkan password saat ini"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Password Baru</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={pwdForm.new_password}
                                        onChange={e => setPwdForm({...pwdForm, new_password: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Minimal 8 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Konfirmasi Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={pwdForm.new_password_confirmation}
                                        onChange={e => setPwdForm({...pwdForm, new_password_confirmation: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Ulangi password baru"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Perbarui Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Theme Settings */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Pengaturan Tampilan</h3>
                                <p className="text-slate-400 text-sm">Sesuaikan tema aplikasi (Gelap/Terang).</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-6">
                            <button 
                                onClick={() => toggleTheme('dark')}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                <span className="font-medium text-sm">Gelap (Default)</span>
                            </button>
                            <button 
                                onClick={() => toggleTheme('light')}
                                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                <span className="font-medium text-sm">Terang</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Crop Modal */}
            {imageSrc && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-white font-semibold">Sesuaikan Foto</h3>
                            <button onClick={() => setImageSrc(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="relative h-64 sm:h-80 w-full bg-slate-950">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block text-center">Geser untuk Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="w-full accent-blue-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setImageSrc(null)}
                                    className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUploadAvatar}
                                    disabled={uploading}
                                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    {uploading ? 'Menyimpan...' : 'Terapkan & Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
