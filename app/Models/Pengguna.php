<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class Pengguna extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'pengguna';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'sekolah_id', 'jabatan_id', 'nip', 'nama_lengkap', 'email',
        'no_hp_enc', 'password_hash', 'role', 'foto_profil_url',
        'qr_token', 'qr_expires_at', 'is_active',
    ];

    protected $hidden = ['password_hash', 'no_hp_enc', 'qr_token'];

    protected $casts = [
        'qr_expires_at' => 'datetime',
        'is_active'     => 'boolean',
    ];

    /**
     * Override getAuthPassword to use password_hash column.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    // ─── Relationships ───────────────────────────────────────────────────────
    public function sekolah() { return $this->belongsTo(Sekolah::class, 'sekolah_id'); }
    public function jabatan() { return $this->belongsTo(Jabatan::class, 'jabatan_id'); }
    public function presensi() { return $this->hasMany(Presensi::class, 'pengguna_id'); }
    public function izinCuti() { return $this->hasMany(IzinCuti::class, 'pengguna_id'); }
    public function rekapBulanan() { return $this->hasMany(RekapBulanan::class, 'pengguna_id'); }
    public function notifikasiLog() { return $this->hasMany(NotifikasiLog::class, 'pengguna_id'); }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function isGuru(): bool { return $this->role === 'guru'; }
    public function isKepalaSekolah(): bool { return $this->role === 'kepala_sekolah'; }
    public function isYayasan(): bool { return $this->role === 'yayasan'; }

    public function hasRole(string $role): bool { return $this->role === $role; }

    public function getInitialsAttribute(): string
    {
        return Str::of($this->nama_lengkap)
            ->explode(' ')
            ->take(2)
            ->map(fn ($w) => Str::substr($w, 0, 1))
            ->implode('');
    }
}
