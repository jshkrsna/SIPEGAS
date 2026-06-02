<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class HariLibur extends Model
{
    protected $table = 'hari_libur';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'sekolah_id', 'created_by', 'tanggal', 'nama_libur', 'jenis',
    ];

    protected $casts = ['tanggal' => 'date'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function sekolah() { return $this->belongsTo(Sekolah::class); }
    public function createdBy() { return $this->belongsTo(Pengguna::class, 'created_by'); }
}
