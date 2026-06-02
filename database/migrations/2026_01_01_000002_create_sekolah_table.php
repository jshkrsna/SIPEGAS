<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sekolah', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->uuid('yayasan_id');
            $table->string('nama_sekolah', 200);
            $table->string('kode_sekolah', 20)->unique();
            $table->text('alamat')->nullable();
            $table->string('no_telp', 20)->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->tinyInteger('is_active')->default(1);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('yayasan_id')->references('id')->on('yayasan')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sekolah');
    }
};
