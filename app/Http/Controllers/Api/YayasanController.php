<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Yayasan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class YayasanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Yayasan::query();
        if (!$request->has('all')) {
            $query->where('is_active', 1);
        }
        $yayasan = $query->orderBy('nama_yayasan')->get();

        return response()->json([
            'success' => true,
            'data'    => $yayasan,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nama_yayasan' => 'required|string|max:200',
            'kode_yayasan' => 'required|string|max:20|unique:yayasan,kode_yayasan',
            'alamat'       => 'nullable|string',
            'no_telp'      => 'nullable|string|max:20',
        ]);

        $yayasan = Yayasan::create($request->only(['nama_yayasan', 'kode_yayasan', 'alamat', 'no_telp']) + ['is_active' => 1]);

        return response()->json(['success' => true, 'data' => $yayasan], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $yayasan = Yayasan::findOrFail($id);
        $request->validate([
            'nama_yayasan' => 'required|string|max:200',
            'kode_yayasan' => 'required|string|max:20|unique:yayasan,kode_yayasan,' . $id,
            'alamat'       => 'nullable|string',
            'no_telp'      => 'nullable|string|max:20',
            'is_active'    => 'boolean',
        ]);

        $yayasan->update($request->only(['nama_yayasan', 'kode_yayasan', 'alamat', 'no_telp', 'is_active']));

        return response()->json(['success' => true, 'data' => $yayasan]);
    }

    public function destroy(string $id): JsonResponse
    {
        $yayasan = Yayasan::findOrFail($id);
        $yayasan->is_active = 0;
        $yayasan->save();
        return response()->json(['success' => true, 'message' => 'Yayasan dinonaktifkan.']);
    }
}
