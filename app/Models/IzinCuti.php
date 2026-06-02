<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class IzinCuti extends Model
{
    protected $table = 'izin_cuti';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pengguna_id', 'approved_by', 'jenis', 'tanggal_mulai', 'tanggal_selesai',
        'alasan', 'bukti_url', 'status_approval', 'catatan_approver',
    ];

    protected $casts = [
        'tanggal_mulai'   => 'date',
        'tanggal_selesai' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function pengguna() { return $this->belongsTo(Pengguna::class, 'pengguna_id'); }
    public function approvedBy() { return $this->belongsTo(Pengguna::class, 'approved_by'); }

    public function getDurasiHariAttribute(): int
    {
        return $this->tanggal_mulai->diffInDays($this->tanggal_selesai) + 1;
    }
}
