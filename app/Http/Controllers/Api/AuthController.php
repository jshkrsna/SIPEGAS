<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $pengguna = Pengguna::where('email', $request->email)
            ->where('is_active', 1)
            ->first();

        if (! $pengguna || ! Hash::check($request->password, $pengguna->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        // Revoke old tokens & issue new one
        $pengguna->tokens()->delete();
        $token = $pengguna->createToken('sipegas-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'token' => $token,
                'user'  => $this->formatUser($pengguna),
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['success' => true, 'message' => 'Logout berhasil.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['sekolah', 'jabatan']);

        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user),
        ]);
    }

    /**
     * POST /api/auth/change-password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Password saat ini tidak cocok.',
            ], 422);
        }

        $user->update(['password_hash' => Hash::make($request->new_password)]);

        return response()->json(['success' => true, 'message' => 'Password berhasil diubah.']);
    }

    /**
     * POST /api/auth/update-avatar
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'foto_base64' => 'required|string',
        ]);

        $user = $request->user();
        $imageData = $request->foto_base64;

        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif
            
            if (!in_array($type, ['jpg', 'jpeg', 'png'])) {
                return response()->json(['success' => false, 'message' => 'Format gambar tidak didukung.'], 422);
            }

            $imageData = base64_decode($imageData);
            if ($imageData === false) {
                return response()->json(['success' => false, 'message' => 'Gagal memproses gambar base64.'], 422);
            }
        } else {
            return response()->json(['success' => false, 'message' => 'Data gambar tidak valid.'], 422);
        }

        $fileName = 'avatars/' . $user->id . '_' . time() . '.' . $type;
        \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $imageData);
        
        // Delete old avatar if exists
        if ($user->foto_profil_url) {
            $oldPath = str_replace(asset('storage') . '/', '', $user->foto_profil_url);
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($oldPath)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
        }

        $url = asset('storage/' . $fileName);
        $user->update(['foto_profil_url' => $url]);

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diperbarui.',
            'data'    => $this->formatUser($user)
        ]);
    }

    private function formatUser(Pengguna $p): array
    {
        return [
            'id'             => $p->id,
            'nip'            => $p->nip,
            'nama_lengkap'   => $p->nama_lengkap,
            'email'          => $p->email,
            'role'           => $p->role,
            'foto_profil_url' => $p->foto_profil_url,
            'initials'       => $p->initials,
            'is_active'      => $p->is_active,
            'sekolah'        => $p->relationLoaded('sekolah') ? [
                'id'          => $p->sekolah?->id,
                'nama_sekolah' => $p->sekolah?->nama_sekolah,
                'logo_url'    => $p->sekolah?->logo_url,
            ] : null,
            'jabatan'        => $p->relationLoaded('jabatan') ? [
                'id'          => $p->jabatan?->id,
                'nama_jabatan' => $p->jabatan?->nama_jabatan,
            ] : null,
        ];
    }
}
