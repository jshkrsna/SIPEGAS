<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Jabatan extends Model
{
    protected $table = 'jabatan';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = ['sekolah_id', 'nama_jabatan', 'kode_jabatan'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    public function sekolah() { return $this->belongsTo(Sekolah::class); }
    public function pengguna() { return $this->hasMany(Pengguna::class, 'jabatan_id'); }
}
