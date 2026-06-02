<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('yayasan');
        Schema::create('yayasan', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->string('nama_yayasan', 200);
            $table->string('kode_yayasan', 20)->unique();
            $table->text('alamat')->nullable();
            $table->string('no_telp', 20)->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->tinyInteger('is_active')->default(1)->comment('1=aktif, 0=nonaktif');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yayasan');
    }
};
