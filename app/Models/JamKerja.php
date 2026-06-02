<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class JamKerja extends Model
{
    protected $table = 'jam_kerja';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'sekolah_id', 'nama_shift', 'jam_masuk', 'jam_pulang', 'toleransi_menit', 'is_default',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function sekolah() { return $this->belongsTo(Sekolah::class); }
    public function presensi() { return $this->hasMany(Presensi::class, 'jam_kerja_id'); }
}
