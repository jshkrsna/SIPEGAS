<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Sekolah extends Model
{
    protected $table = 'sekolah';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'yayasan_id', 'nama_sekolah', 'kode_sekolah', 'alamat', 'no_telp', 'logo_url', 'is_active', 'jumlah_hari_kerja',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function yayasan() { return $this->belongsTo(Yayasan::class, 'yayasan_id'); }
    public function pengguna() { return $this->hasMany(Pengguna::class, 'sekolah_id'); }
    public function jabatan() { return $this->hasMany(Jabatan::class, 'sekolah_id'); }
    public function jamKerja() { return $this->hasMany(JamKerja::class, 'sekolah_id'); }
    public function gpsReferensi() { return $this->hasMany(GpsReferensi::class, 'sekolah_id'); }
    public function hariLibur() { return $this->hasMany(HariLibur::class, 'sekolah_id'); }
}
