<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RekapBulanan extends Model
{
    protected $table = 'rekap_bulanan';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const UPDATED_AT = 'refreshed_at';

    protected $fillable = [
        'pengguna_id', 'bulan', 'tahun',
        'total_hadir', 'total_terlambat', 'total_izin', 'total_cuti',
        'total_alpha', 'total_menit_terlambat', 'total_flagged',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function pengguna() { return $this->belongsTo(Pengguna::class, 'pengguna_id'); }
}
