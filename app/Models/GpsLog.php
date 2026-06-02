<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class GpsLog extends Model
{
    protected $table = 'gps_log';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'presensi_id', 'gps_ref_id', 'lat_checkin', 'lng_checkin',
        'accuracy_meter', 'altitude_m', 'speed_mps', 'is_mock_detected',
        'ip_lat', 'ip_lng', 'ip_address', 'wifi_bssid', 'risk_score', 'risk_level',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function presensi() { return $this->belongsTo(Presensi::class, 'presensi_id'); }
    public function gpsReferensi() { return $this->belongsTo(GpsReferensi::class, 'gps_ref_id'); }
}
