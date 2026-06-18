<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Presensi;
use App\Models\Pengguna;
use App\Models\IzinCuti;
use App\Models\RekapBulanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user  = $request->user();
        $today = Carbon::today()->toDateString();

        return match ($user->role) {
            'pegawai'        => $this->pegawaiStats($user, $today),
            'admin'          => $this->adminStats($user, $today),
            'kepala_sekolah' => $this->kepalaStats($user, $today),
            'yayasan'        => $this->yayasanStats($user, $today),
            default          => response()->json(['success' => false, 'message' => 'Role tidak dikenali.'], 400),
        };
    }

    private function pegawaiStats(Pengguna $user, string $today): JsonResponse
    {
        $month   = Carbon::now()->month;
        $year    = Carbon::now()->year;
        
        $monthStats = Presensi::where('pengguna_id', $user->id)
            ->whereMonth('tanggal', $month)->whereYear('tanggal', $year)
            ->select('status_kehadiran', DB::raw('count(*) as total'), DB::raw('sum(terlambat_menit) as total_menit'))
            ->groupBy('status_kehadiran')
            ->get();

        $todayPresensi = Presensi::where('pengguna_id', $user->id)
            ->whereDate('tanggal', $today)->first();

        $pendingIzin = IzinCuti::where('pengguna_id', $user->id)
            ->where('status_approval', 'pending')->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'role'            => 'pegawai',
                'today_presensi'  => $todayPresensi,
                'bulan_ini'       => [
                    'hadir'           => $monthStats->where('status_kehadiran', 'hadir')->sum('total'),
                    'terlambat'       => $monthStats->where('status_kehadiran', 'terlambat')->sum('total'),
                    'izin'            => $monthStats->where('status_kehadiran', 'izin')->sum('total'),
                    'cuti'            => $monthStats->where('status_kehadiran', 'cuti')->sum('total'),
                    'alpha'           => $monthStats->where('status_kehadiran', 'alpha')->sum('total'),
                    'menit_terlambat' => $monthStats->where('status_kehadiran', 'terlambat')->sum('total_menit'),
                ],
                'pending_izin'    => $pendingIzin,
            ],
        ]);
    }

    private function adminStats(Pengguna $user, string $today): JsonResponse
    {
        $sekolahId = $user->sekolah_id;
        $month = Carbon::now()->month;
        $year  = Carbon::now()->year;

        $totalPegawai = Pengguna::where('sekolah_id', $sekolahId)->where('is_active', 1)->where('role', 'pegawai')->count();

        $todayStats = Presensi::whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $sekolahId))
            ->whereDate('tanggal', $today)
            ->select('status_kehadiran', DB::raw('count(*) as total'))
            ->groupBy('status_kehadiran')
            ->pluck('total', 'status_kehadiran');

        $hadirCount = $todayStats->get('hadir', 0);
        $terlambatCount = $todayStats->get('terlambat', 0);
        $izinCount = $todayStats->get('izin', 0);
        $cutiCount = $todayStats->get('cuti', 0);
        $alphaCount = $todayStats->get('alpha', 0);

        $belumHadir = $totalPegawai - $hadirCount - $terlambatCount - $izinCount - $cutiCount - $alphaCount;

        $pendingIzin = IzinCuti::whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $sekolahId))
            ->where('status_approval', 'pending')->count();

        $recentCheckins = Presensi::with('pengguna:id,nama_lengkap,foto_profil_url')
            ->whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $sekolahId))
            ->whereDate('tanggal', $today)
            ->orderByDesc('waktu_checkin')
            ->limit(10)->get();

        $weeklyTrend = Presensi::whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $sekolahId))
            ->whereBetween('tanggal', [Carbon::now()->subDays(6)->toDateString(), $today])
            ->select('tanggal', 'status_kehadiran', DB::raw('count(*) as total'))
            ->groupBy('tanggal', 'status_kehadiran')
            ->orderBy('tanggal')
            ->get()
            ->groupBy('tanggal');
            
        $monthStats = Presensi::whereHas('pengguna', fn ($q) => $q->where('sekolah_id', $sekolahId))
            ->whereMonth('tanggal', $month)->whereYear('tanggal', $year)
            ->select('status_kehadiran', DB::raw('count(*) as total'))
            ->groupBy('status_kehadiran')
            ->pluck('total', 'status_kehadiran');

        return response()->json([
            'success' => true,
            'data'    => [
                'role'           => 'admin',
                'total_pegawai'  => $totalPegawai,
                'today'          => [
                    'hadir'      => $hadirCount,
                    'terlambat'  => $terlambatCount,
                    'izin'       => $izinCount,
                    'cuti'       => $cutiCount,
                    'alpha'      => $alphaCount,
                    'belum_hadir' => max(0, $belumHadir),
                ],
                'bulan_ini'      => [
                    'hadir'      => $monthStats->get('hadir', 0),
                    'terlambat'  => $monthStats->get('terlambat', 0),
                    'izin'       => $monthStats->get('izin', 0),
                    'cuti'       => $monthStats->get('cuti', 0),
                    'alpha'      => $monthStats->get('alpha', 0),
                ],
                'pending_izin'   => $pendingIzin,
                'recent_checkins' => $recentCheckins,
                'weekly_trend'   => $weeklyTrend,
            ],
        ]);
    }

    private function kepalaStats(Pengguna $user, string $today): JsonResponse
    {
        $response = $this->adminStats($user, $today);
        $data = $response->getData(true);
        $data['data']['role'] = 'kepala_sekolah';
        return response()->json($data);
    }

    private function yayasanStats(Pengguna $user, string $today): JsonResponse
    {
        $sekolahList = \App\Models\Sekolah::where('is_active', 1)->get(['id', 'nama_sekolah', 'kode_sekolah']);

        $totalSekolah = $sekolahList->count();
        $totalPegawai = Pengguna::where('is_active', 1)->whereNotNull('sekolah_id')->where('role', 'pegawai')->count();

        $todayHadir = Presensi::whereDate('tanggal', $today)
            ->whereIn('status_kehadiran', ['hadir', 'terlambat'])->count();

        // Global attendance rate this month
        $month = Carbon::now()->month;
        $year  = Carbon::now()->year;
        $totalPresensiMonth = Presensi::whereMonth('tanggal', $month)->whereYear('tanggal', $year)->count();
        $hadirMonth = Presensi::whereMonth('tanggal', $month)->whereYear('tanggal', $year)
            ->whereIn('status_kehadiran', ['hadir', 'terlambat'])->count();
        $avgKehadiran = $totalPresensiMonth > 0
            ? round(($hadirMonth / $totalPresensiMonth) * 100, 1)
            : 0;

        // Per-school comparative stats (leaderboard)
        $perSekolah = $sekolahList->map(function ($sekolah) use ($month, $year, $today) {
            $pegawaiIds = Pengguna::where('sekolah_id', $sekolah->id)
                ->where('is_active', 1)->where('role', 'pegawai')->pluck('id');
            $totalPegawai = $pegawaiIds->count();

            // This month stats
            $monthStats = Presensi::whereIn('pengguna_id', $pegawaiIds)
                ->whereMonth('tanggal', $month)->whereYear('tanggal', $year)
                ->select('status_kehadiran', DB::raw('count(*) as total'))
                ->groupBy('status_kehadiran')
                ->pluck('total', 'status_kehadiran');

            $hadir     = $monthStats->get('hadir', 0);
            $terlambat = $monthStats->get('terlambat', 0);
            $alpha     = $monthStats->get('alpha', 0);
            $total     = $monthStats->sum();
            $pctHadir  = $total > 0 ? round((($hadir + $terlambat) / $total) * 100, 1) : 0;

            // Today
            $todayHadir = Presensi::whereIn('pengguna_id', $pegawaiIds)
                ->whereDate('tanggal', $today)
                ->whereIn('status_kehadiran', ['hadir', 'terlambat'])->count();

            return [
                'id'            => $sekolah->id,
                'nama_sekolah'  => $sekolah->nama_sekolah,
                'kode_sekolah'  => $sekolah->kode_sekolah,
                'total_pegawai' => $totalPegawai,
                'today_hadir'   => $todayHadir,
                'bulan'         => [
                    'hadir'     => $hadir,
                    'terlambat' => $terlambat,
                    'alpha'     => $alpha,
                    'pct_hadir' => $pctHadir,
                ],
            ];
        })->sortByDesc('bulan.pct_hadir')->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'role'           => 'yayasan',
                'total_sekolah'  => $totalSekolah,
                'total_pegawai'  => $totalPegawai,
                'today_hadir'    => $todayHadir,
                'avg_kehadiran'  => $avgKehadiran,
                'per_sekolah'    => $perSekolah,
            ],
        ]);
    }
}
