<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GpsReferensi;
use App\Models\HariLibur;
use App\Models\JamKerja;
use App\Models\Jabatan;
use App\Models\Pengguna;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    // ─── Jam Kerja ───────────────────────────────────────────────────────────

    public function indexJamKerja(Request $request): JsonResponse
    {
        $data = JamKerja::where('sekolah_id', $request->user()->sekolah_id)->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function storeJamKerja(Request $request): JsonResponse
    {
        $request->validate([
            'nama_shift'       => 'required|string|max:50',
            'jam_masuk'        => 'required|date_format:H:i',
            'jam_pulang'       => 'required|date_format:H:i',
            'toleransi_menit'  => 'integer|min:0|max:60',
            'is_default'       => 'boolean',
        ]);

        if ($request->get('is_default', false)) {
            JamKerja::where('sekolah_id', $request->user()->sekolah_id)->update(['is_default' => 0]);
        }

        $jam = JamKerja::create([
            'sekolah_id'      => $request->user()->sekolah_id,
            'nama_shift'      => $request->nama_shift,
            'jam_masuk'       => $request->jam_masuk . ':00',
            'jam_pulang'      => $request->jam_pulang . ':00',
            'toleransi_menit' => $request->get('toleransi_menit', 0),
            'is_default'      => $request->get('is_default', 0),
        ]);

        return response()->json(['success' => true, 'message' => 'Shift kerja berhasil ditambahkan.', 'data' => $jam], 201);
    }

    public function updateJamKerja(Request $request, string $id): JsonResponse
    {
        $jam = JamKerja::where('sekolah_id', $request->user()->sekolah_id)->findOrFail($id);
        $jam->update($request->only(['nama_shift', 'jam_masuk', 'jam_pulang', 'toleransi_menit', 'is_default']));
        return response()->json(['success' => true, 'data' => $jam]);
    }

    public function destroyJamKerja(Request $request, string $id): JsonResponse
    {
        JamKerja::where('sekolah_id', $request->user()->sekolah_id)->findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Shift dihapus.']);
    }

    // ─── Hari Libur ──────────────────────────────────────────────────────────

    public function indexHariLibur(Request $request): JsonResponse
    {
        $query = HariLibur::where('sekolah_id', $request->user()->sekolah_id);
        if ($request->filled('tahun')) {
            $query->whereYear('tanggal', $request->tahun);
        }
        return response()->json(['success' => true, 'data' => $query->orderBy('tanggal')->get()]);
    }

    public function storeHariLibur(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal'    => 'required|date',
            'nama_libur' => 'required|string|max:200',
            'jenis'      => 'in:nasional,sekolah',
        ]);

        $libur = HariLibur::create([
            'sekolah_id'  => $request->user()->sekolah_id,
            'created_by'  => $request->user()->id,
            'tanggal'     => $request->tanggal,
            'nama_libur'  => $request->nama_libur,
            'jenis'       => $request->get('jenis', 'sekolah'),
        ]);

        return response()->json(['success' => true, 'data' => $libur], 201);
    }

    public function destroyHariLibur(Request $request, string $id): JsonResponse
    {
        HariLibur::where('sekolah_id', $request->user()->sekolah_id)->findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Hari libur dihapus.']);
    }

    // ─── GPS Referensi ───────────────────────────────────────────────────────

    public function indexGps(Request $request): JsonResponse
    {
        $data = GpsReferensi::where('sekolah_id', $request->user()->sekolah_id)->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function storeGps(Request $request): JsonResponse
    {
        $request->validate([
            'nama_lokasi'  => 'nullable|string|max:100',
            'lat'          => 'required|numeric|between:-90,90',
            'lng'          => 'required|numeric|between:-180,180',
            'radius_meter' => 'required|numeric|min:10|max:1000',
        ]);

        $gps = GpsReferensi::create([
            'sekolah_id'   => $request->user()->sekolah_id,
            'nama_lokasi'  => $request->nama_lokasi,
            'lat'          => $request->lat,
            'lng'          => $request->lng,
            'radius_meter' => $request->radius_meter,
            'is_active'    => 1,
        ]);

        return response()->json(['success' => true, 'data' => $gps], 201);
    }

    public function updateGps(Request $request, string $id): JsonResponse
    {
        $gps = GpsReferensi::where('sekolah_id', $request->user()->sekolah_id)->findOrFail($id);
        $gps->update($request->only(['nama_lokasi', 'lat', 'lng', 'radius_meter', 'is_active']));
        return response()->json(['success' => true, 'data' => $gps]);
    }

    public function destroyGps(Request $request, string $id): JsonResponse
    {
        GpsReferensi::where('sekolah_id', $request->user()->sekolah_id)->findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Lokasi GPS dihapus.']);
    }

    // ─── Jabatan ─────────────────────────────────────────────────────────────

    public function indexJabatan(Request $request): JsonResponse
    {
        $data = Jabatan::where('sekolah_id', $request->user()->sekolah_id)->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function storeJabatan(Request $request): JsonResponse
    {
        $request->validate([
            'nama_jabatan' => 'required|string|max:150',
            'kode_jabatan' => 'required|string|max:20',
        ]);

        $jabatan = Jabatan::create([
            'sekolah_id'   => $request->user()->sekolah_id,
            'nama_jabatan' => $request->nama_jabatan,
            'kode_jabatan' => $request->kode_jabatan,
        ]);

        return response()->json(['success' => true, 'data' => $jabatan], 201);
    }
}
