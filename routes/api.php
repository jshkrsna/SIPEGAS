<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\IzinCutiController;
use App\Http\Controllers\Api\PenggunaController;
use App\Http\Controllers\Api\PresensiController;
use App\Http\Controllers\Api\RekapController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SIPEGAS API Routes
|--------------------------------------------------------------------------
*/

// ─── Auth (Public) ───────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/update-avatar', [AuthController::class, 'updateAvatar']);
    });

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Presensi
    Route::prefix('presensi')->group(function () {
        Route::get('/', [PresensiController::class, 'index']);
        Route::get('/today', [PresensiController::class, 'today']);
        Route::post('/checkin', [PresensiController::class, 'checkin']);
        Route::post('/checkout', [PresensiController::class, 'checkout']);

        // Admin only
        Route::patch('/{id}/koreksi', [PresensiController::class, 'koreksi'])
            ->middleware('role:admin,kepala_sekolah');
    });

    // Izin / Cuti
    Route::prefix('izin-cuti')->group(function () {
        Route::get('/', [IzinCutiController::class, 'index']);
        Route::post('/', [IzinCutiController::class, 'store']);
        Route::get('/{id}', [IzinCutiController::class, 'show']);
        Route::delete('/{id}', [IzinCutiController::class, 'destroy']);

        // Approval: kepala sekolah & admin only
        Route::patch('/{id}/approve', [IzinCutiController::class, 'approve'])
            ->middleware('role:kepala_sekolah,admin');
    });

    // Rekap Bulanan
    Route::prefix('rekap')->group(function () {
        Route::get('/', [RekapController::class, 'index']);
        Route::get('/export/excel', [RekapController::class, 'exportExcel'])
            ->middleware('role:admin,kepala_sekolah,yayasan');
        Route::get('/export/pdf', [RekapController::class, 'exportPdf'])
            ->middleware('role:admin,kepala_sekolah,yayasan');
        Route::get('/detail/{penggunaId}', [RekapController::class, 'detail']);
        Route::post('/refresh', [RekapController::class, 'refresh'])
            ->middleware('role:admin');
    });

    // QR Code
    Route::get('/qr/generate', [\App\Http\Controllers\Api\QrController::class, 'generate'])
        ->middleware('role:admin,kepala_sekolah');


    // ─── Admin / Kepala Sekolah Only ─────────────────────────────────────────

    // Manajemen Pengguna
    Route::prefix('pengguna')->middleware('role:admin')->group(function () {
        Route::get('/', [PenggunaController::class, 'index']);
        Route::post('/', [PenggunaController::class, 'store']);
        Route::get('/{id}', [PenggunaController::class, 'show']);
        Route::put('/{id}', [PenggunaController::class, 'update']);
        Route::delete('/{id}', [PenggunaController::class, 'destroy']);
    });

    // Settings (Admin only)
    Route::middleware('role:admin')->prefix('settings')->group(function () {
        // Jam Kerja
        Route::get('/jam-kerja', [SettingsController::class, 'indexJamKerja']);
        Route::post('/jam-kerja', [SettingsController::class, 'storeJamKerja']);
        Route::put('/jam-kerja/{id}', [SettingsController::class, 'updateJamKerja']);
        Route::delete('/jam-kerja/{id}', [SettingsController::class, 'destroyJamKerja']);

        // Hari Libur
        Route::get('/hari-libur', [SettingsController::class, 'indexHariLibur']);
        Route::post('/hari-libur', [SettingsController::class, 'storeHariLibur']);
        Route::delete('/hari-libur/{id}', [SettingsController::class, 'destroyHariLibur']);

        // GPS Referensi
        Route::get('/gps', [SettingsController::class, 'indexGps']);
        Route::post('/gps', [SettingsController::class, 'storeGps']);
        Route::put('/gps/{id}', [SettingsController::class, 'updateGps']);
        Route::delete('/gps/{id}', [SettingsController::class, 'destroyGps']);

        // Jabatan
        Route::get('/jabatan', [SettingsController::class, 'indexJabatan']);
        Route::post('/jabatan', [SettingsController::class, 'storeJabatan']);
    });
});
