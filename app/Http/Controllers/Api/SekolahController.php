<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SekolahController extends Controller
{
    /**
     * List sekolah accessible by the current user.
     * - Admin / Kepala Sekolah / Pegawai → their own school only
     * - Yayasan → all active schools
     */
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Sekolah::with('yayasan:id,nama_yayasan,kode_yayasan');

        if ($user->isYayasan()) {
            $query->where('is_active', 1);
        } elseif ($user->isAdmin() || $user->isKepalaSekolah() || $user->isPegawai()) {
            $query->where('id', $user->sekolah_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('nama_sekolah')->get(),
        ]);
    }

    /**
     * List all schools within the same yayasan as the admin's school.
     * Used by Admin to see & manage schools in their yayasan.
     */
    public function byYayasan(Request $request): JsonResponse
    {
        $user    = $request->user();
        $sekolah = Sekolah::find($user->sekolah_id);

        if (!$sekolah) {
            return response()->json(['success' => false, 'message' => 'Sekolah tidak ditemukan.'], 404);
        }

        $list = Sekolah::with(['yayasan:id,nama_yayasan', 'pengguna' => function ($q) {
            $q->where('is_active', 1)->whereIn('role', ['pegawai', 'kepala_sekolah']);
        }])
            ->where('yayasan_id', $sekolah->yayasan_id)
            ->orderBy('nama_sekolah')
            ->get()
            ->map(function ($s) {
                return [
                    'id'            => $s->id,
                    'nama_sekolah'  => $s->nama_sekolah,
                    'kode_sekolah'  => $s->kode_sekolah,
                    'alamat'        => $s->alamat,
                    'no_telp'       => $s->no_telp,
                    'is_active'     => $s->is_active,
                    'yayasan'       => $s->yayasan,
                    'total_pegawai' => $s->pengguna->where('role', 'pegawai')->count(),
                    'kepala_sekolah' => $s->pengguna->firstWhere('role', 'kepala_sekolah'),
                ];
            });

        return response()->json([
            'success'     => true,
            'data'        => $list,
            'yayasan_id'  => $sekolah->yayasan_id,
        ]);
    }

    /**
     * Create a new school within the same yayasan.
     */
    public function store(Request $request): JsonResponse
    {
        $user    = $request->user();
        $sekolah = Sekolah::find($user->sekolah_id);

        $request->validate([
            'nama_sekolah' => 'required|string|max:200',
            'kode_sekolah' => 'required|string|max:20|unique:sekolah,kode_sekolah',
            'alamat'       => 'nullable|string|max:500',
            'no_telp'      => 'nullable|string|max:20',
            'yayasan_id'   => 'nullable|exists:yayasan,id',
            'logo_base64'  => 'nullable|string',
            'jumlah_hari_kerja' => 'nullable|in:5,6',
        ], [
            'kode_sekolah.unique' => 'Kode sekolah sudah digunakan.',
        ]);

        $yayasanId = $request->yayasan_id ?? ($sekolah?->yayasan_id);

        $logoUrl = null;
        if ($request->filled('logo_base64')) {
            $imageData = $request->logo_base64;
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]);
                if (in_array($type, ['jpg', 'jpeg', 'png'])) {
                    $imageData = base64_decode($imageData);
                    if ($imageData !== false) {
                        $fileName = 'sekolah/' . Str::uuid() . '_' . time() . '.' . $type;
                        Storage::disk('public')->put($fileName, $imageData);
                        $logoUrl = asset('storage/' . $fileName);
                    }
                }
            }
        }

        $newSekolah = Sekolah::create([
            'yayasan_id'   => $yayasanId,
            'nama_sekolah' => $request->nama_sekolah,
            'kode_sekolah' => strtoupper($request->kode_sekolah),
            'alamat'       => $request->alamat,
            'no_telp'      => $request->no_telp,
            'logo_url'     => $logoUrl,
            'is_active'    => 1,
            'jumlah_hari_kerja' => $request->jumlah_hari_kerja ?? 5,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sekolah berhasil ditambahkan.',
            'data'    => $newSekolah->load('yayasan:id,nama_yayasan'),
        ], 201);
    }

    /**
     * Update an existing school (must be in same yayasan).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user         = $request->user();
        $adminSekolah = Sekolah::find($user->sekolah_id);

        $sekolah = Sekolah::findOrFail($id);

        // Security: admin can only update schools within same yayasan
        if ($adminSekolah && $sekolah->yayasan_id !== $adminSekolah->yayasan_id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan.'], 403);
        }

        $request->validate([
            'nama_sekolah' => 'sometimes|string|max:200',
            'kode_sekolah' => "sometimes|string|max:20|unique:sekolah,kode_sekolah,{$id}",
            'alamat'       => 'nullable|string|max:500',
            'no_telp'      => 'nullable|string|max:20',
            'is_active'    => 'sometimes|boolean',
            'yayasan_id'   => 'nullable|exists:yayasan,id',
            'logo_base64'  => 'nullable|string',
            'jumlah_hari_kerja' => 'sometimes|in:5,6',
        ]);

        $updateData = $request->only(['nama_sekolah', 'kode_sekolah', 'alamat', 'no_telp', 'is_active', 'yayasan_id', 'jumlah_hari_kerja']);

        if ($request->filled('logo_base64')) {
            $imageData = $request->logo_base64;
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $type = strtolower($type[1]);
                if (in_array($type, ['jpg', 'jpeg', 'png'])) {
                    $imageData = base64_decode($imageData);
                    if ($imageData !== false) {
                        $fileName = 'sekolah/' . $sekolah->id . '_' . time() . '.' . $type;
                        Storage::disk('public')->put($fileName, $imageData);
                        
                        if ($sekolah->logo_url) {
                            $oldPath = str_replace(asset('storage') . '/', '', $sekolah->logo_url);
                            if (Storage::disk('public')->exists($oldPath)) {
                                Storage::disk('public')->delete($oldPath);
                            }
                        }
                        
                        $updateData['logo_url'] = asset('storage/' . $fileName);
                    }
                }
            }
        }

        $sekolah->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Data sekolah berhasil diperbarui.',
            'data'    => $sekolah->fresh(['yayasan']),
        ]);
    }

    /**
     * Soft-delete (deactivate) a school.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user         = $request->user();
        $adminSekolah = Sekolah::find($user->sekolah_id);
        $sekolah      = Sekolah::findOrFail($id);

        if ($adminSekolah && $sekolah->yayasan_id !== $adminSekolah->yayasan_id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan.'], 403);
        }

        $sekolah->update(['is_active' => 0]);

        return response()->json(['success' => true, 'message' => 'Sekolah berhasil dinonaktifkan.']);
    }
}
