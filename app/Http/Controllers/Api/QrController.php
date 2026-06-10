<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class QrController extends Controller
{
    /**
     * GET /api/qr/generate
     * Menghasilkan token dinamis untuk sekolah tertentu. Berlaku 10 menit.
     */
    public function generate(Request $request): JsonResponse
    {
        $user = $request->user();

        // Hanya admin/kepala sekolah yang bisa generate
        if (!$user->isAdmin() && !$user->isKepalaSekolah()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $sekolahId = $user->sekolah_id;
        if (!$sekolahId) {
            return response()->json(['success' => false, 'message' => 'User tidak tertaut ke sekolah.'], 400);
        }

        // Generate a random token
        $token = Str::random(32);
        
        // Simpan token ke Cache dengan nama key khusus untuk sekolah ini
        // TTL (Time To Live): 10 menit
        $cacheKey = "qr_sekolah_{$sekolahId}";
        Cache::put($cacheKey, $token, now()->addMinutes(10));

        return response()->json([
            'success' => true,
            'message' => 'QR token berhasil digenerate.',
            'data' => [
                'token'            => $token,
                'expires_in_seconds' => 600, // 10 menit
                'sekolah_id'       => $sekolahId
            ]
        ]);
    }
}
