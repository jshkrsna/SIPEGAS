<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Presensi extends Model
{
    protected $table = 'presensi';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pengguna_id', 'jam_kerja_id', 'tanggal', 'waktu_checkin', 'waktu_checkout',
        'metode_checkin', 'status_kehadiran', 'terlambat_menit',
        'selfie_checkin_url', 'selfie_checkout_url', 'keterangan',
    ];

    protected $casts = [
        'tanggal'        => 'date',
        'waktu_checkin'  => 'datetime',
        'waktu_checkout' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function pengguna() { return $this->belongsTo(Pengguna::class, 'pengguna_id'); }
    public function jamKerja() { return $this->belongsTo(JamKerja::class, 'jam_kerja_id'); }
    public function gpsLog() { return $this->hasOne(GpsLog::class, 'presensi_id'); }

    public function getMetodeAttribute(): ?string
    {
        return $this->metode_checkin;
    }

    public function getSelfieUrlAttribute(): ?string
    {
        return $this->selfie_checkin_url;
    }

    public function getLatCheckinAttribute(): ?string
    {
        return $this->gpsLog?->lat_checkin;
    }

    public function getLngCheckinAttribute(): ?string
    {
        return $this->gpsLog?->lng_checkin;
    }

    protected $appends = ['metode', 'selfie_url', 'lat_checkin', 'lng_checkin'];
}
