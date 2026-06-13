<?php

namespace App\Exports;

use App\Models\RekapBulanan;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RekapBulananExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithCustomStartCell, WithEvents
{
    protected $sekolahId;
    protected $bulan;
    protected $tahun;
    protected $penggunaId;

    public function __construct($sekolahId, $bulan, $tahun, $penggunaId = null)
    {
        $this->sekolahId = $sekolahId;
        $this->bulan = $bulan;
        $this->tahun = $tahun;
        $this->penggunaId = $penggunaId;
    }

    public function startCell(): string
    {
        return 'A4';
    }

    public function collection()
    {
        $query = RekapBulanan::with('pengguna')
            ->whereHas('pengguna', function ($q) {
                $q->where('sekolah_id', $this->sekolahId);
            })
            ->where('bulan', $this->bulan)
            ->where('tahun', $this->tahun);

        if ($this->penggunaId) {
            $query->where('pengguna_id', $this->penggunaId);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'NIP',
            'Nama Lengkap',
            'Hadir',
            'Terlambat',
            'Izin',
            'Cuti',
            'Alpha',
            'Menit Terlambat'
        ];
    }

    private $rowNumber = 1;

    public function map($rekap): array
    {
        return [
            $this->rowNumber++,
            $rekap->pengguna->nip,
            $rekap->pengguna->nama_lengkap,
            $rekap->total_hadir,
            $rekap->total_terlambat,
            $rekap->total_izin,
            $rekap->total_cuti,
            $rekap->total_alpha,
            $rekap->total_menit_terlambat
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            4 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '1e293b']]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                $namaBulan = [
                    1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
                    7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
                ];
                $bulanStr = $namaBulan[(int)$this->bulan] ?? $this->bulan;

                $sheet->mergeCells('A1:I1');
                $sheet->setCellValue('A1', 'LAPORAN REKAPITULASI PRESENSI');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                $sheet->mergeCells('A2:I2');
                $sheet->setCellValue('A2', "Periode: {$bulanStr} {$this->tahun}");
                $sheet->getStyle('A2')->getFont()->setSize(12);
                $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

                $sheet->getStyle('A4:I4')->getAlignment()->setHorizontal('center');
            },
        ];
    }
}
