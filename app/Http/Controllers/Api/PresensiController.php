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
        $query = Presensi::with([
            'pengguna:id,nama_lengkap,nip,foto_profil_url',
            'jamKerja:id,nama_shift,jam_masuk,jam_pulang',
            'gpsLog:id,presensi_id,lat_checkin,lng_checkin,accuracy_meter',
        ]);

        // Pegawai only sees own data
        if ($user->isPegawai()) {
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

        if ($request->filled('is_luar_radius')) {
            $query->where('is_luar_radius', $request->boolean('is_luar_radius'));
        }
        
        if ($request->filled('status_approval_remote')) {
            $query->where('status_approval_remote', $request->status_approval_remote);
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
            'selfie_url'       => 'nullable|string',   // Optional — required for 'face', optional for 'qr_code'
            'metode'           => 'in:qr_code,geolocation,face,manual',
            'qr_token'         => 'nullable|string',
            'ip_address'       => 'nullable|ip',
            'is_mock_detected' => 'nullable|boolean',
            'risk_score'       => 'nullable|integer|min:0|max:100',
            'is_luar_radius'   => 'nullable|boolean',
            'bukti_luar_radius'=> 'nullable|string',
            'keterangan'       => 'nullable|string',
        ]);

        $metode = $request->get('metode', 'qr_code');

        // Face mode requires selfie
        if ($metode === 'face' && !$request->filled('selfie_url')) {
            return response()->json(['success' => false, 'message' => 'Foto wajah wajib disertakan untuk metode pengenalan wajah.'], 422);
        }

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
        if ($metode === 'qr_code') {
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

            // Jika diluar radius 20m dan belum ada status luar radius
            if ($distance > 20 && !$request->boolean('is_luar_radius')) {
                return response()->json([
                    'success' => false,
                    'error_code' => 'LUAR_RADIUS',
                    'message' => 'Anda berada di luar radius sekolah (> 20m). Silakan lengkapi form bukti bekerja jarak jauh.'
                ], 428); // Precondition Required
            }
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

        // Save Base64 Images as files
        $selfiePath = null;
        if ($request->filled('selfie_url') && str_starts_with($request->selfie_url, 'data:image')) {
            $selfiePath = $this->saveBase64Image($request->selfie_url, 'selfies');
        } else {
            $selfiePath = $request->selfie_url; // fallback if already url
        }

        $buktiPath = null;
        if ($request->filled('bukti_luar_radius') && str_starts_with($request->bukti_luar_radius, 'data:image')) {
            $buktiPath = $this->saveBase64Image($request->bukti_luar_radius, 'bukti_remote');
        }

        DB::beginTransaction();
        try {
            $presensi = Presensi::create([
                'pengguna_id'        => $user->id,
                'jam_kerja_id'       => $jamKerja->id,
                'tanggal'            => $today,
                'waktu_checkin'      => $now,
                'metode_checkin'     => $metode,
                'status_kehadiran'   => $status,
                'terlambat_menit'    => $terlambatMenit,
                'selfie_checkin_url' => $selfiePath,
                'is_luar_radius'     => $request->boolean('is_luar_radius'),
                'bukti_luar_radius_url' => $buktiPath,
                'status_approval_remote'=> $request->boolean('is_luar_radius') ? 'pending' : null,
                'keterangan'         => $request->keterangan,
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

        $selfiePath = null;
        if ($request->filled('selfie_url') && str_starts_with($request->selfie_url, 'data:image')) {
            $selfiePath = $this->saveBase64Image($request->selfie_url, 'selfies');
        } else {
            $selfiePath = $request->selfie_url; // fallback if already url
        }

        $presensi->update([
            'waktu_checkout'      => now(),
            'selfie_checkout_url' => $selfiePath,
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
            'waktu_checkin'    => 'nullable|date_format:Y-m-d H:i:s',
            'waktu_checkout'   => 'nullable|date_format:Y-m-d H:i:s',
            'keterangan'       => 'nullable|string|max:1000',
        ]);

        $presensi = Presensi::findOrFail($id);
        $before   = $presensi->toArray();

        $presensi->update([
            'status_kehadiran' => $request->status_kehadiran,
            'waktu_checkin'    => $request->waktu_checkin,
            'waktu_checkout'   => $request->waktu_checkout,
            'keterangan'       => ltrim($presensi->keterangan . "\n[Koreksi Admin]: " . $request->keterangan, "\n"),
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
     * POST /api/presensi/{id}/approve-remote
     */
    public function approveRemote(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:approved,rejected',
        ]);

        $presensi = Presensi::findOrFail($id);

        if (!$presensi->is_luar_radius || $presensi->status_approval_remote !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Presensi ini bukan presensi jarak jauh atau sudah diproses.'], 400);
        }

        $presensi->update([
            'status_approval_remote' => $request->action,
            'keterangan' => ltrim($presensi->keterangan . "\n[Approval Jarak Jauh]: " . ucfirst($request->action) . " oleh " . $request->user()->nama_lengkap, "\n"),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Presensi jarak jauh berhasil diproses.',
            'data' => $presensi
        ]);
    }

    /**
     * Haversine distance formula (meters)
     */
    private function haversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // in meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    private function saveBase64Image(string $base64String, string $folder): string
    {
        // Extract base64 part
        @list($type, $file_data) = explode(';', $base64String);
        @list(, $file_data)      = explode(',', $file_data);

        // Decode
        $imageName = \Illuminate\Support\Str::random(40) . '.jpg';
        $path = $folder . '/' . $imageName;
        
        \Illuminate\Support\Facades\Storage::disk('public')->put($path, base64_decode($file_data));
        
        return '/storage/' . $path;
    }
}
