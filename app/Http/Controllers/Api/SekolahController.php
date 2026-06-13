<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SekolahController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Sekolah::query();

        if ($user->isYayasan()) {
            $query->where('yayasan_id', $user->yayasan_id);
        } elseif ($user->isAdmin() || $user->isKepalaSekolah() || $user->isGuru() || $user->isPegawai()) {
            $query->where('id', $user->sekolah_id);
        }

        $sekolah = $query->get();

        return response()->json([
            'success' => true,
            'data' => $sekolah,
        ]);
    }
}
