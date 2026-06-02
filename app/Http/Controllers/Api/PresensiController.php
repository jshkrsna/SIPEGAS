<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GpsLog;
use App\Models\GpsReferensi;
use App\Models\JamKerja;
use App\Models\Presensi;
use App\Models\AuditChain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PresensiController extends Controller
{
    /**
     * GET /api/presensi
     */
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Presensi::with(['pengguna:id,nama_lengkap,nip,foto_profil_url', 'jamKerja:id,nama_shift,jam_masuk,jam_pulang']);

        // Guru only sees own data
        if ($user->isGuru()) {
            $query->where('pengguna_id', $user->id);
        } elseif ($user->isAdmin() || $user->isKepalaSekolah()) {
            // filter by sekolah
            $query->whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $user->sekolah_id));
        }

        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal', $request->tanggal);
        }
        if ($request->filled('bulan') && $request->filled('tahun')) {
            $query->whereMonth('tanggal', $request->bulan)->whereYear('tanggal', $request->tahun);
        }
        if ($request->filled('status')) {
            $query->where('status_kehadiran', $request->status);
        }
        if ($request->filled('pengguna_id') && ! $user->isGuru()) {
            $query->where('pengguna_id', $request->pengguna_id);
        }

        $data = $query->orderByDesc('tanggal')->paginate($request->get('per_page', 20));

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * POST /api/presensi/checkin
     */
    public function checkin(Request $request): JsonResponse
    {
        $request->validate([
            'lat'              => 'required|numeric',
            'lng'              => 'required|numeric',
            'accuracy_meter'   => 'required|numeric',
            'selfie_url'       => 'required|string',
            'metode'           => 'in:qr_code,geolocation,manual',
            'qr_token'         => 'nullable|string',
            'ip_address'       => 'nullable|ip',
            'is_mock_detected' => 'nullable|boolean',
            'risk_score'       => 'nullable|integer|min:0|max:100',
        ]);

        $user  = $request->user();
        $today = Carbon::today()->toDateString();

        // Prevent double check-in
        $existing = Presensi::where('pengguna_id', $user->id)->whereDate('tanggal', $today)->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah melakukan check-in hari ini.',
                'data'    => $existing,
            ], 409);
        }

        // Validate QR token if method is qr_code
        if ($request->metode === 'qr_code') {
            if (!$request->filled('qr_token')) {
                return response()->json(['success' => false, 'message' => 'QR token wajib disertakan untuk metode ini.'], 422);
            }
            
            $cacheKey = "qr_sekolah_{$user->sekolah_id}";
            $validToken = \Illuminate\Support\Facades\Cache::get($cacheKey);
            
            if (!$validToken || $validToken !== $request->qr_token) {
                return response()->json(['success' => false, 'message' => 'QR Code tidak valid atau sudah kedaluwarsa.'], 422);
            }
        }

        // Geofencing validation
        $gpsRef = GpsReferensi::where('sekolah_id', $user->sekolah_id)
            ->where('is_active', 1)
            ->first();

        $riskLevel = 'low';
        $riskScore = $request->get('risk_score', 0);
        $inRadius  = true;

        if ($gpsRef) {
            $distance = $this->haversineDistance(
                $request->lat, $request->lng,
                (float) $gpsRef->lat, (float) $gpsRef->lng
            );
            $inRadius = $distance <= $gpsRef->radius_meter;
        }

        if (! $inRadius) {
            $riskScore = max($riskScore, 60);
            $riskLevel = 'high';
        } elseif ($request->is_mock_detected) {
            $riskScore = max($riskScore, 80);
            $riskLevel = 'high';
        } elseif ($riskScore > 40) {
            $riskLevel = 'medium';
        }

        // Get default shift
        $jamKerja = JamKerja::where('sekolah_id', $user->sekolah_id)
            ->where('is_default', 1)
            ->first() ?? JamKerja::where('sekolah_id', $user->sekolah_id)->first();

        if (! $jamKerja) {
            return response()->json(['success' => false, 'message' => 'Jam kerja belum dikonfigurasi.'], 422);
        }

        // Calculate late minutes
        $now          = Carbon::now();
        $jamMasuk     = Carbon::createFromFormat('H:i:s', $jamKerja->jam_masuk);
        $batasLambat  = $jamMasuk->copy()->addMinutes($jamKerja->toleransi_menit);
        $terlambatMenit = 0;
        $status       = 'hadir';

        if ($now->gt($batasLambat)) {
            $terlambatMenit = (int) $now->diffInMinutes($jamMasuk);
            $status         = 'terlambat';
        }

        DB::beginTransaction();
        try {
            $presensi = Presensi::create([
                'pengguna_id'       => $user->id,
                'jam_kerja_id'      => $jamKerja->id,
                'tanggal'           => $today,
                'waktu_checkin'     => $now,
                'metode_checkin'    => $request->get('metode', 'qr_code'),
                'status_kehadiran'  => $status,
                'terlambat_menit'   => $terlambatMenit,
                'selfie_checkin_url' => $request->selfie_url,
            ]);

            GpsLog::create([
                'presensi_id'      => $presensi->id,
                'gps_ref_id'       => $gpsRef?->id,
                'lat_checkin'      => $request->lat,
                'lng_checkin'      => $request->lng,
                'accuracy_meter'   => $request->accuracy_meter,
                'is_mock_detected' => $request->get('is_mock_detected', 0),
                'ip_address'       => $request->get('ip_address', $request->ip()) ?? '127.0.0.1',
                'risk_score'       => $riskScore,
                'risk_level'       => $riskLevel,
            ]);

            // Audit log
            $prevHash = AuditChain::latestHash();
            $payload  = ['after' => $presensi->toArray()];
            $hash     = AuditChain::calculateHash($payload, $prevHash);

            AuditChain::create([
                'block_index'    => DB::table('audit_chain_seq')->value('next_val') ?? 1,
                'event_type'     => 'checkin',
                'actor_id'       => $user->id,
                'actor_type'     => 'user',
                'ref_table_name' => 'presensi',
                'ref_table_id'   => $presensi->id,
                'payload'        => $payload,
                'current_hash'   => $hash,
                'prev_hash'      => $prevHash,
            ]);
            DB::table('audit_chain_seq')->update(['next_val' => DB::raw('next_val + 1')]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $status === 'terlambat'
                    ? "Check-in berhasil. Anda terlambat {$terlambatMenit} menit."
                    : 'Check-in berhasil. Tepat waktu!',
                'data'    => [
                    'presensi'       => $presensi,
                    'status'         => $status,
                    'terlambat_menit' => $terlambatMenit,
                    'risk_level'     => $riskLevel,
                    'in_radius'      => $inRadius,
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/presensi/checkout
     */
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'selfie_url' => 'required|string',
            'lat'        => 'nullable|numeric',
            'lng'        => 'nullable|numeric',
        ]);

        $user  = $request->user();
        $today = Carbon::today()->toDateString();

        $presensi = Presensi::where('pengguna_id', $user->id)
            ->whereDate('tanggal', $today)
            ->whereNull('waktu_checkout')
            ->first();

        if (! $presensi) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada sesi check-in aktif hari ini.',
            ], 404);
        }

        $presensi->update([
            'waktu_checkout'      => now(),
            'selfie_checkout_url' => $request->selfie_url,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out berhasil.',
            'data'    => $presensi->fresh(),
        ]);
    }

    /**
     * GET /api/presensi/today
     */
    public function today(Request $request): JsonResponse
    {
        $user     = $request->user();
        $presensi = Presensi::with(['gpsLog', 'jamKerja'])
            ->where('pengguna_id', $user->id)
            ->whereDate('tanggal', today())
            ->first();

        return response()->json(['success' => true, 'data' => $presensi]);
    }

    /**
     * PATCH /api/presensi/{id}/koreksi
     */
    public function koreksi(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status_kehadiran' => 'required|in:hadir,terlambat,izin,cuti,alpha',
            'keterangan'       => 'required|string',
        ]);

        $presensi = Presensi::findOrFail($id);
        $before   = $presensi->toArray();

        $presensi->update([
            'status_kehadiran' => $request->status_kehadiran,
            'keterangan'       => $request->keterangan,
        ]);

        // Audit trail
        $actor    = $request->user();
        $prevHash = AuditChain::latestHash();
        $payload  = ['before' => $before, 'after' => $presensi->fresh()->toArray()];
        $hash     = AuditChain::calculateHash($payload, $prevHash);

        AuditChain::create([
            'block_index'    => DB::table('audit_chain_seq')->value('next_val') ?? 1,
            'event_type'     => 'koreksi_manual',
            'actor_id'       => $actor->id,
            'actor_type'     => 'admin',
            'ref_table_name' => 'presensi',
            'ref_table_id'   => $presensi->id,
            'payload'        => $payload,
            'current_hash'   => $hash,
            'prev_hash'      => $prevHash,
        ]);
        DB::table('audit_chain_seq')->update(['next_val' => DB::raw('next_val + 1')]);

        return response()->json([
            'success' => true,
            'message' => 'Data presensi berhasil dikoreksi.',
            'data'    => $presensi->fresh(['pengguna', 'jamKerja']),
        ]);
    }

    /**
     * Haversine distance formula (meters)
     */
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371000; // Earth radius in meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
