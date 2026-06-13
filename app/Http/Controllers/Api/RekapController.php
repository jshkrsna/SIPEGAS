<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Presensi;
use App\Models\RekapBulanan;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RekapController extends Controller
{
    /**
     * GET /api/rekap — Monthly summary list
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'bulan' => 'nullable|integer|between:1,12',
            'tahun' => 'nullable|integer|min:2020',
        ]);

        $user  = $request->user();
        $bulan = $request->get('bulan', now()->month);
        $tahun = $request->get('tahun', now()->year);

        $query = RekapBulanan::with('pengguna:id,nama_lengkap,nip,jabatan_id,foto_profil_url')
            ->where('bulan', $bulan)
            ->where('tahun', $tahun);

        if ($user->isGuru()) {
            $query->where('pengguna_id', $user->id);
        } elseif ($user->isAdmin() || $user->isKepalaSekolah()) {
            $query->whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $user->sekolah_id));
        }
        // yayasan → no additional filter (sees all schools)

        $data = $query->orderBy(function ($q) {
            $q->from('pengguna')->select('nama_lengkap')
                ->whereColumn('pengguna.id', 'rekap_bulanan.pengguna_id')
                ->limit(1);
        })->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * POST /api/rekap/refresh — Recalculate monthly recap
     */
    public function refresh(Request $request): JsonResponse
    {
        $bulan = $request->get('bulan', now()->month);
        $tahun = $request->get('tahun', now()->year);
        $sekolahId = $request->user()->sekolah_id;

        $this->syncRekap($sekolahId, $bulan, $tahun);

        return response()->json(['success' => true, 'message' => "Rekap {$bulan}/{$tahun} berhasil diperbarui."]);
    }

    protected function syncRekap($sekolahId, $bulan, $tahun, $penggunaId = null)
    {
        $start = Carbon::createFromDate($tahun, $bulan, 1)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        $query = Pengguna::where('sekolah_id', $sekolahId)->where('is_active', 1);
        if ($penggunaId) {
            $query->where('id', $penggunaId);
        }
        $pengguna = $query->get();

        foreach ($pengguna as $p) {
            $presensiData = Presensi::where('pengguna_id', $p->id)
                ->whereBetween('tanggal', [$start, $end])
                ->select('status_kehadiran', 'terlambat_menit')
                ->get();

            $presensiByStatus = $presensiData->groupBy('status_kehadiran');

            RekapBulanan::updateOrCreate(
                ['pengguna_id' => $p->id, 'bulan' => $bulan, 'tahun' => $tahun],
                [
                    'total_hadir'          => $presensiByStatus->get('hadir', collect())->count(),
                    'total_terlambat'      => $presensiByStatus->get('terlambat', collect())->count(),
                    'total_izin'           => $presensiByStatus->get('izin', collect())->count(),
                    'total_cuti'           => $presensiByStatus->get('cuti', collect())->count(),
                    'total_alpha'          => $presensiByStatus->get('alpha', collect())->count(),
                    'total_menit_terlambat' => max(0, (int) $presensiData->sum('terlambat_menit')),
                ]
            );
        }
    }

    /**
     * GET /api/rekap/detail/{penggunaId} — Detailed daily records for a month
     */
    public function detail(Request $request, string $penggunaId): JsonResponse
    {
        $bulan = $request->get('bulan', now()->month);
        $tahun = $request->get('tahun', now()->year);

        $start = Carbon::createFromDate($tahun, $bulan, 1)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        $user = $request->user();

        // Access check
        if ($user->isGuru() && $user->id !== $penggunaId) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $presensi = Presensi::with(['jamKerja:id,nama_shift,jam_masuk,jam_pulang', 'gpsLog'])
            ->where('pengguna_id', $penggunaId)
            ->whereBetween('tanggal', [$start, $end])
            ->orderBy('tanggal')
            ->get();

        $pengguna = Pengguna::with(['jabatan', 'sekolah'])->findOrFail($penggunaId);

        return response()->json([
            'success' => true,
            'data'    => [
                'pengguna' => $pengguna,
                'presensi' => $presensi,
                'bulan'    => $bulan,
                'tahun'    => $tahun,
            ],
        ]);
    }

    /**
     * GET /api/rekap/export/excel — Export to Excel
     */
    public function exportExcel(Request $request)
    {
        $bulan = $request->get('bulan', now()->month);
        $tahun = $request->get('tahun', now()->year);
        $user = $request->user();
        $sekolahId = $user->isYayasan() ? $request->get('sekolah_id') : $user->sekolah_id;

        if (!$sekolahId) {
            return response()->json(['message' => 'sekolah_id diperlukan untuk Yayasan'], 400);
        }

        $penggunaId = $user->isPegawai() ? $user->id : null;

        // Sync data before export
        $this->syncRekap($sekolahId, $bulan, $tahun, $penggunaId);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\RekapBulananExport($sekolahId, $bulan, $tahun, $penggunaId), 
            "Rekap_Presensi_{$bulan}_{$tahun}.xlsx"
        );
    }

    /**
     * GET /api/rekap/export/pdf — Export to PDF
     */
    public function exportPdf(Request $request)
    {
        $bulan = $request->get('bulan', now()->month);
        $tahun = $request->get('tahun', now()->year);
        $user = $request->user();
        $sekolahId = $user->isYayasan() ? $request->get('sekolah_id') : $user->sekolah_id;

        if (!$sekolahId) {
            return response()->json(['message' => 'sekolah_id diperlukan untuk Yayasan'], 400);
        }

        $penggunaId = $user->isPegawai() ? $user->id : null;

        // Sync data before export
        $this->syncRekap($sekolahId, $bulan, $tahun, $penggunaId);

        $query = RekapBulanan::with('pengguna')
            ->whereHas('pengguna', function ($q) use ($sekolahId) {
                $q->where('sekolah_id', $sekolahId);
            })
            ->where('bulan', $bulan)
            ->where('tahun', $tahun);

        if ($user->isPegawai()) {
            $query->where('pengguna_id', $user->id);
        }

        $rekap = $query->get();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.rekap_pdf', compact('rekap', 'bulan', 'tahun'));
        return $pdf->download("Rekap_Presensi_{$bulan}_{$tahun}.pdf");
    }
}
