<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('izin_cuti', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('pengguna_id')->comment('Guru yang mengajukan');
            $table->uuid('approved_by')->nullable()->comment('Admin atau kepala_sekolah. NULL = pending');
            $table->enum('jenis', ['izin', 'cuti', 'sakit', 'tugas_luar'])->default('izin');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->text('alasan');
            $table->string('bukti_url', 500)->nullable()->comment('URL Minio — surat dokter, dll');
            $table->enum('status_approval', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('catatan_approver')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('pengguna_id')->references('id')->on('pengguna')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('pengguna')->onDelete('set null');
        });

        Schema::create('rekap_bulanan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('pengguna_id');
            $table->tinyInteger('bulan')->unsigned()->comment('1-12');
            $table->year('tahun');
            $table->smallInteger('total_hadir')->unsigned()->default(0);
            $table->smallInteger('total_terlambat')->unsigned()->default(0);
            $table->smallInteger('total_izin')->unsigned()->default(0);
            $table->smallInteger('total_cuti')->unsigned()->default(0);
            $table->smallInteger('total_alpha')->unsigned()->default(0)->comment('Sudah exclude hari_libur');
            $table->integer('total_menit_terlambat')->unsigned()->default(0);
            $table->smallInteger('total_flagged')->unsigned()->default(0)->comment('Check-in dengan risk_level high');
            $table->timestamp('refreshed_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['pengguna_id', 'bulan', 'tahun']);
            $table->foreign('pengguna_id')->references('id')->on('pengguna')->onDelete('cascade');
        });

        Schema::create('notifikasi_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('pengguna_id');
            $table->enum('channel', ['whatsapp', 'email', 'push'])->default('whatsapp');
            $table->text('pesan');
            $table->enum('status_kirim', ['sent', 'failed', 'pending'])->default('pending');
            $table->timestamp('sent_at')->useCurrent()->comment('Partition key — selalu sertakan di WHERE');

            $table->foreign('pengguna_id')->references('id')->on('pengguna')->onDelete('cascade');
        });

        Schema::create('audit_chain_seq', function (Blueprint $table) {
            $table->bigInteger('next_val')->unsigned()->default(1)->comment('Sequence counter untuk block_index audit_chain');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('audit_chain', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->bigInteger('block_index')->unsigned()->unique()->comment('Nomor urut blok — diambil dari audit_chain_seq');
            $table->enum('event_type', ['checkin', 'checkout', 'izin_submit', 'izin_approve', 'izin_reject', 'koreksi_manual', 'user_create', 'user_update', 'login', 'logout']);
            $table->uuid('actor_id')->nullable()->comment('NULL jika event dari system job — tanpa FK (polymorphic)');
            $table->enum('actor_type', ['user', 'admin', 'system'])->default('user');
            $table->string('ref_table_name', 100)->comment('Nama tabel terdampak: presensi, izin_cuti, dst');
            $table->uuid('ref_table_id')->comment('ID record terdampak — tanpa FK constraint (polymorphic)');
            $table->json('payload')->comment('{before:{...}, after:{...}} — snapshot perubahan');
            $table->string('current_hash', 64)->comment('SHA-256 hex dari semua field baris ini + prev_hash');
            $table->string('prev_hash', 64)->comment('current_hash blok sebelumnya — membentuk rantai');
            $table->timestamp('created_at')->useCurrent()->comment('Tidak ada updated_at — immutable absolut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_chain');
        Schema::dropIfExists('audit_chain_seq');
        Schema::dropIfExists('notifikasi_log');
        Schema::dropIfExists('rekap_bulanan');
        Schema::dropIfExists('izin_cuti');
    }
};
