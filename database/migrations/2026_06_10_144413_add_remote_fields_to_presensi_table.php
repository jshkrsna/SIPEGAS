<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('presensi', function (Blueprint $table) {
            $table->boolean('is_luar_radius')->default(false)->after('keterangan');
            $table->string('bukti_luar_radius_url', 500)->nullable()->after('is_luar_radius');
            $table->enum('status_approval_remote', ['pending', 'approved', 'rejected'])->nullable()->after('bukti_luar_radius_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presensi', function (Blueprint $table) {
            $table->dropColumn(['is_luar_radius', 'bukti_luar_radius_url', 'status_approval_remote']);
        });
    }
};
