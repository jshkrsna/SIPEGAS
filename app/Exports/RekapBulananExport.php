<?php

namespace App\Exports;

use App\Models\RekapBulanan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RekapBulananExport implements FromCollection, WithHeadings, WithMapping
{
    protected $sekolahId;
    protected $bulan;
    protected $tahun;

    public function __construct($sekolahId, $bulan, $tahun)
    {
        $this->sekolahId = $sekolahId;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
    }

    public function collection()
    {
        return RekapBulanan::with('pengguna')
            ->whereHas('pengguna', function ($q) {
                $q->where('sekolah_id', $this->sekolahId);
            })
            ->where('bulan', $this->bulan)
            ->where('tahun', $this->tahun)
            ->get();
    }

    public function headings(): array
    {
        return [
            'NIP',
            'Nama Lengkap',
            'Bulan',
            'Tahun',
            'Total Hadir',
            'Total Terlambat',
            'Total Izin',
            'Total Cuti',
            'Total Alpha',
            'Total Terlambat (Menit)'
        ];
    }

    public function map($rekap): array
    {
        return [
            $rekap->pengguna->nip,
            $rekap->pengguna->nama_lengkap,
            $rekap->bulan,
            $rekap->tahun,
            $rekap->total_hadir,
            $rekap->total_terlambat,
            $rekap->total_izin,
            $rekap->total_cuti,
            $rekap->total_alpha,
            $rekap->total_menit_terlambat
        ];
    }
}
