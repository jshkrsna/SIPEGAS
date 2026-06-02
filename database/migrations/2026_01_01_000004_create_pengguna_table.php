<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengguna', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('sekolah_id')->nullable()->comment('NULL untuk role yayasan');
            $table->uuid('jabatan_id')->nullable()->comment('NULL untuk yayasan dan admin sistem');
            $table->string('nip', 30)->unique();
            $table->string('nama_lengkap', 200);
            $table->string('email', 254)->unique();
            $table->text('no_hp_enc')->nullable()->comment('Terenkripsi di app layer (Laravel Crypt)');
            $table->string('password_hash', 255)->comment('bcrypt via Laravel Hash::make()');
            $table->enum('role', ['guru', 'admin', 'kepala_sekolah', 'yayasan'])->default('guru');
            $table->string('foto_profil_url', 500)->nullable()->comment('URL Minio storage');
            $table->string('qr_token', 100)->nullable()->unique()->comment('NULL untuk non-guru. UNIQUE multi-NULL diizinkan MySQL');
            $table->timestamp('qr_expires_at')->nullable()->comment('Rotasi harian oleh Laravel Scheduler');
            $table->tinyInteger('is_active')->default(1);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('sekolah_id')->references('id')->on('sekolah')->onDelete('set null');
            $table->foreign('jabatan_id')->references('id')->on('jabatan')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengguna');
    }
};
