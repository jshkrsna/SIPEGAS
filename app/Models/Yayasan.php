<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Yayasan extends Model
{
    protected $table = 'yayasan';
    protected $keyType = 'string';
    public $incrementing = false;
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'nama_yayasan', 'kode_yayasan', 'alamat', 'no_telp', 'logo_url', 'is_active',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function sekolah()
    {
        return $this->hasMany(Sekolah::class, 'yayasan_id');
    }

    public function pengguna()
    {
        return $this->hasMany(Pengguna::class, 'sekolah_id')
            ->whereHas('sekolah', fn ($q) => $q->where('yayasan_id', $this->id));
    }
}
