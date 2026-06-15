<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * POST /api/auth/forgot-password
     * Generate a password reset token for the given email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $pengguna = Pengguna::where('email', $request->email)
            ->where('is_active', 1)
            ->first();

        if (! $pengguna) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan atau akun tidak aktif.',
            ], 404);
        }

        // Generate a 6-digit OTP code
        $token = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Insert new token
        DB::table('password_reset_tokens')->insert([
            'email'      => $request->email,
            'token'      => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        // In production, you would send this via email.
        // For development/demo purposes, we return the token in the response.
        return response()->json([
            'success' => true,
            'message' => 'Kode verifikasi telah dibuat. Gunakan kode tersebut untuk mereset password Anda.',
            'data'    => [
                'email' => $request->email,
                // NOTE: In production, remove the line below and send via email instead
                'token' => $token,
            ],
        ]);
    }

    /**
     * POST /api/auth/reset-password
     * Verify the token and reset the password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'token'    => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $record) {
            return response()->json([
                'success' => false,
                'message' => 'Token reset tidak ditemukan. Silakan minta ulang.',
            ], 404);
        }

        // Check if token is expired (60 minutes)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'success' => false,
                'message' => 'Token telah kedaluwarsa. Silakan minta ulang.',
            ], 422);
        }

        // Verify the token
        if (! Hash::check($request->token, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode verifikasi tidak valid.',
            ], 422);
        }

        // Update the password
        $pengguna = Pengguna::where('email', $request->email)->first();
        if (! $pengguna) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $pengguna->update(['password_hash' => Hash::make($request->password)]);

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Revoke all existing tokens (force re-login)
        $pengguna->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru Anda.',
        ]);
    }
}
