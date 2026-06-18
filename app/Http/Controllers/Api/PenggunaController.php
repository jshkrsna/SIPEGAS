<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use App\Models\Sekolah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PenggunaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Pengguna::with(['jabatan:id,nama_jabatan', 'sekolah:id,nama_sekolah']);

        if ($user->isAdmin()) {
            // If a specific sekolah_id is requested, filter by that (cross-school within same yayasan)
            if ($request->filled('sekolah_id')) {
                $query->where('sekolah_id', $request->sekolah_id);
            } else {
                $query->where('sekolah_id', $user->sekolah_id);
            }
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('search')) {
            $query->where(fn ($q) => $q
                ->where('nama_lengkap', 'like', "%{$request->search}%")
                ->orWhere('nip', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"));
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('nama_lengkap')->paginate(50),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nip'          => 'required|string|unique:pengguna,nip|max:30',
            'nama_lengkap' => 'required|string|max:200',
            'email'        => 'required|email|unique:pengguna,email',
            'password'     => 'required|string|min:8',
            'role'         => 'required|in:pegawai,admin,kepala_sekolah,yayasan',
            'jabatan_id'   => 'nullable|exists:jabatan,id',
            'no_hp'        => 'nullable|string|max:20',
        ], [
            'nip.unique'   => 'NIP sudah digunakan oleh pengguna lain.',
            'email.unique' => 'Email sudah digunakan.',
            'password.min' => 'Password minimal 8 karakter.',
            'role.in'      => 'Pilihan role tidak valid.',
        ]);

        $sekolahId = $request->sekolah_id ?? $request->user()->sekolah_id;

        $pengguna = Pengguna::create([
            'sekolah_id'    => $sekolahId,
            'jabatan_id'    => $request->jabatan_id,
            'nip'           => $request->nip,
            'nama_lengkap'  => $request->nama_lengkap,
            'email'         => $request->email,
            'password_hash' => Hash::make($request->password),
            'role'          => $request->role,
            'no_hp_enc'     => $request->no_hp ? encrypt($request->no_hp) : null,
            'is_active'     => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan.',
            'data'    => $pengguna->load(['jabatan', 'sekolah']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $pengguna = Pengguna::with(['jabatan', 'sekolah'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $pengguna]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $pengguna = Pengguna::findOrFail($id);

        $request->validate([
            'nama_lengkap' => 'sometimes|string|max:200',
            'email'        => "sometimes|email|unique:pengguna,email,{$id}",
            'nip'          => "sometimes|string|unique:pengguna,nip,{$id}|max:30",
            'role'         => 'sometimes|in:pegawai,admin,kepala_sekolah,yayasan',
            'jabatan_id'   => 'nullable|exists:jabatan,id',
            'is_active'    => 'sometimes|boolean',
            'password'     => 'nullable|string|min:8',
        ], [
            'nip.unique'   => 'NIP sudah digunakan oleh pengguna lain.',
            'email.unique' => 'Email sudah digunakan.',
            'password.min' => 'Password minimal 8 karakter.',
            'role.in'      => 'Pilihan role tidak valid.',
        ]);

        $updateData = $request->only(['nama_lengkap', 'email', 'nip', 'role', 'jabatan_id', 'is_active']);

        if ($request->filled('password')) {
            $updateData['password_hash'] = Hash::make($request->password);
        }

        $pengguna->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data'    => $pengguna->fresh(['jabatan', 'sekolah']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $pengguna = Pengguna::findOrFail($id);
        $pengguna->update(['is_active' => 0]);

        return response()->json(['success' => true, 'message' => 'Pengguna berhasil dinonaktifkan.']);
    }
}
