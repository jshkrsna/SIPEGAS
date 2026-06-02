<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jabatan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('sekolah_id');
            $table->string('nama_jabatan', 150);
            $table->string('kode_jabatan', 20);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('sekolah_id')->references('id')->on('sekolah')->onDelete('cascade');
        });

        Schema::create('jam_kerja', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('sekolah_id');
            $table->string('nama_shift', 50);
            $table->time('jam_masuk');
            $table->time('jam_pulang');
            $table->smallInteger('toleransi_menit')->default(0)->comment('Grace period menit sebelum dihitung terlambat');
            $table->tinyInteger('is_default')->default(0)->comment('Hanya satu per sekolah — dijaga app layer');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('sekolah_id')->references('id')->on('sekolah')->onDelete('cascade');
        });

        Schema::create('gps_referensi', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('sekolah_id');
            $table->string('nama_lokasi', 100)->nullable();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->float('radius_meter')->comment('Jarak maksimum yang dianggap valid dari pusat');
            $table->tinyInteger('is_active')->default(1);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('sekolah_id')->references('id')->on('sekolah')->onDelete('cascade');
        });

        Schema::create('hari_libur', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('sekolah_id');
            $table->uuid('created_by')->nullable()->comment('Admin yang mendaftarkan. NULL = seeded otomatis');
            $table->date('tanggal');
            $table->string('nama_libur', 200);
            $table->enum('jenis', ['nasional', 'sekolah'])->default('nasional');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('sekolah_id')->references('id')->on('sekolah')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hari_libur');
        Schema::dropIfExists('gps_referensi');
        Schema::dropIfExists('jam_kerja');
        Schema::dropIfExists('jabatan');
    }
};
