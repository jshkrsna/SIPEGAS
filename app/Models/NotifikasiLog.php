<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class NotifikasiLog extends Model
{
    protected $table = 'notifikasi_log';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['pengguna_id', 'channel', 'pesan', 'status_kirim', 'sent_at'];

    protected $casts = ['sent_at' => 'datetime'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function pengguna() { return $this->belongsTo(Pengguna::class, 'pengguna_id'); }
}
