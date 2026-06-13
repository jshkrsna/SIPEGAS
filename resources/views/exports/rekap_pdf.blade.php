<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekap Presensi</title>
    <style>
        @page {
            margin: 30px 40px;
        }
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            font-size: 11px; 
            color: #333;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2563eb;
        }
        .header h2 {
            margin: 0 0 5px 0;
            color: #1e293b;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            margin: 0;
            color: #64748b;
            font-size: 12px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px; 
        }
        th, td { 
            padding: 8px 10px; 
            text-align: center; 
        }
        th { 
            background-color: #f8fafc; 
            color: #475569;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            border-bottom: 2px solid #cbd5e1;
            border-top: 1px solid #e2e8f0;
        }
        td {
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }
        tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .text-left { text-align: left; }
        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #94a3b8;
            text-align: right;
        }
    </style>
</head>
<body>
    @php
        $namaBulan = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $bulanStr = $namaBulan[(int)$bulan] ?? $bulan;
    @endphp

    <div class="header">
        <h2>Laporan Rekapitulasi Presensi</h2>
        <p>Periode: {{ $bulanStr }} {{ $tahun }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 15%;">NIP</th>
                <th class="text-left" style="width: 25%;">Nama Lengkap</th>
                <th>Hadir</th>
                <th>Terlambat</th>
                <th>Izin</th>
                <th>Cuti</th>
                <th>Alpha</th>
                <th>Menit Terlambat</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rekap as $index => $row)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $row->pengguna->nip }}</td>
                <td class="text-left"><strong>{{ $row->pengguna->nama_lengkap }}</strong></td>
                <td>{{ $row->total_hadir }}</td>
                <td style="color: #ea580c;">{{ $row->total_terlambat }}</td>
                <td style="color: #0284c7;">{{ $row->total_izin }}</td>
                <td style="color: #8b5cf6;">{{ $row->total_cuti }}</td>
                <td style="color: #dc2626;">{{ $row->total_alpha }}</td>
                <td>{{ $row->total_menit_terlambat }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Dicetak pada: {{ now()->format('d M Y H:i') }} | SIPEGAS System
    </div>
</body>
</html>
