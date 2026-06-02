<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuditChain extends Model
{
    protected $table = 'audit_chain';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'block_index', 'event_type', 'actor_id', 'actor_type',
        'ref_table_name', 'ref_table_id', 'payload',
        'current_hash', 'prev_hash',
    ];

    protected $casts = ['payload' => 'array'];

    protected static function boot()
    {
        parent::boot();
        static::creating(fn ($m) => $m->id = (string) Str::uuid());
    }

    /**
     * Calculate SHA-256 hash for this block.
     */
    public static function calculateHash(array $data, string $prevHash): string
    {
        $content = json_encode($data) . $prevHash;
        return hash('sha256', $content);
    }

    /**
     * Get the latest block hash (genesis if empty).
     */
    public static function latestHash(): string
    {
        $latest = static::orderByDesc('block_index')->first();
        return $latest ? $latest->current_hash : str_repeat('0', 64);
    }
}
