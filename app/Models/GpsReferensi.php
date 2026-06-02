<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class GpsReferensi extends Model
{
    protected $table = 'gps_referensi';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'sekolah_id', 'nama_lokasi', 'lat', 'lng', 'radius_meter', 'is_active',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function sekolah() { return $this->belongsTo(Sekolah::class); }
    public function gpsLog() { return $this->hasMany(GpsLog::class, 'gps_ref_id'); }
}
