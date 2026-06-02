<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IzinCuti;
use App\Models\Presensi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class IzinCutiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = IzinCuti::with(['pengguna:id,nama_lengkap,nip', 'approvedBy:id,nama_lengkap']);

        if ($user->isGuru()) {
            $query->where('pengguna_id', $user->id);
        } elseif ($user->isAdmin() || $user->isKepalaSekolah()) {
            $query->whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $user->sekolah_id));
        }

        if ($request->filled('status')) {
            $query->where('status_approval', $request->status);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderByDesc('created_at')->paginate(20),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'jenis'           => 'required|in:izin,cuti,sakit,tugas_luar',
            'tanggal_mulai'   => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan'          => 'required|string|max:1000',
            'bukti_url'       => 'nullable|url|max:500',
        ]);

        $izin = IzinCuti::create([
            'pengguna_id'     => $request->user()->id,
            'jenis'           => $request->jenis,
            'tanggal_mulai'   => $request->tanggal_mulai,
            'tanggal_selesai' => $request->tanggal_selesai,
            'alasan'          => $request->alasan,
            'bukti_url'       => $request->bukti_url,
            'status_approval' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan izin/cuti berhasil dikirim.',
            'data'    => $izin,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $izin = IzinCuti::with(['pengguna', 'approvedBy'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $izin]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'action'           => 'required|in:approved,rejected',
            'catatan_approver' => 'nullable|string|max:500',
        ]);

        $izin = IzinCuti::findOrFail($id);

        if ($izin->status_approval !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan ini sudah diproses sebelumnya.',
            ], 409);
        }

        $izin->update([
            'status_approval'  => $request->action,
            'approved_by'      => $request->user()->id,
            'catatan_approver' => $request->catatan_approver,
        ]);

        // Auto-update presensi records if approved
        if ($request->action === 'approved') {
            $dates = \Carbon\CarbonPeriod::create($izin->tanggal_mulai, $izin->tanggal_selesai);
            foreach ($dates as $date) {
                Presensi::updateOrCreate(
                    ['pengguna_id' => $izin->pengguna_id, 'tanggal' => $date->toDateString()],
                    [
                        'jam_kerja_id'      => \App\Models\JamKerja::where('sekolah_id', $request->user()->sekolah_id)->value('id'),
                        'status_kehadiran'  => in_array($izin->jenis, ['cuti']) ? 'cuti' : 'izin',
                        'selfie_checkin_url' => 'system://izin-auto',
                        'keterangan'        => "Auto-approved: {$izin->jenis} - {$izin->alasan}",
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => $request->action === 'approved' ? 'Izin/cuti disetujui.' : 'Izin/cuti ditolak.',
            'data'    => $izin->fresh(['pengguna', 'approvedBy']),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $izin = IzinCuti::where('pengguna_id', $request->user()->id)
            ->where('status_approval', 'pending')
            ->findOrFail($id);

        $izin->delete();

        return response()->json(['success' => true, 'message' => 'Pengajuan berhasil dibatalkan.']);
    }
}
