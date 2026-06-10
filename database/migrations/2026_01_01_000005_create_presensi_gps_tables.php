<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presensi', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('pengguna_id');
            $table->uuid('jam_kerja_id');
            $table->date('tanggal');
            $table->timestamp('waktu_checkin')->nullable();
            $table->timestamp('waktu_checkout')->nullable()->comment('NULL sampai guru checkout');
            $table->enum('metode_checkin', ['qr_code', 'geolocation', 'face', 'manual'])->default('qr_code');
            $table->enum('status_kehadiran', ['hadir', 'terlambat', 'izin', 'cuti', 'alpha'])->default('hadir');
            $table->smallInteger('terlambat_menit')->default(0)->comment('0 jika tepat waktu');
            $table->string('selfie_checkin_url', 500)->nullable()->comment('Selfie wajah — null jika metode QR tanpa foto');
            $table->string('selfie_checkout_url', 500)->nullable()->comment('NULL sampai checkout');
            $table->text('keterangan')->nullable()->comment('Catatan admin saat koreksi manual');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['pengguna_id', 'tanggal']);

            $table->foreign('pengguna_id')->references('id')->on('pengguna')->onDelete('cascade');
            $table->foreign('jam_kerja_id')->references('id')->on('jam_kerja')->onDelete('restrict');
        });

        Schema::create('gps_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('presensi_id')->nullable()->comment('1-to-1 opsional ke presensi');
            $table->uuid('gps_ref_id')->nullable()->comment('Titik kantor yang divalidasi saat check-in');
            $table->decimal('lat_checkin', 10, 7);
            $table->decimal('lng_checkin', 10, 7);
            $table->float('accuracy_meter')->comment('Nilai 0-1 sangat mencurigakan (fake GPS)');
            $table->float('altitude_m')->nullable()->comment('Tidak semua browser expose altitude');
            $table->float('speed_mps')->nullable()->comment('Nol sempurna konsisten = sinyal mock location');
            $table->tinyInteger('is_mock_detected')->default(0)->comment('isMockLocation dari OS/browser langsung');
            $table->float('ip_lat')->nullable()->comment('Koordinat dari IP geolocation API');
            $table->float('ip_lng')->nullable();
            $table->string('ip_address', 45)->comment('IPv4 max 15 char, IPv6 max 39 char');
            $table->string('wifi_bssid', 17)->nullable()->comment('MAC address WiFi format XX:XX:XX:XX:XX:XX');
            $table->tinyInteger('risk_score')->unsigned()->default(0)->comment('0-100: kalkulasi tertimbang semua sinyal');
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low');
            $table->timestamp('created_at')->useCurrent()->comment('Tidak ada updated_at — immutable setelah dibuat');

            $table->foreign('presensi_id')->references('id')->on('presensi')->onDelete('set null');
            $table->foreign('gps_ref_id')->references('id')->on('gps_referensi')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gps_log');
        Schema::dropIfExists('presensi');
    }
};
