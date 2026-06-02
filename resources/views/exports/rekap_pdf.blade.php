<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rekap Presensi</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: center; }
        th { background-color: #f0f0f0; }
        .text-left { text-align: left; }
    </style>
</head>
<body>
    <h2 style="text-align: center;">Laporan Rekapitulasi Presensi</h2>
    <p style="text-align: center;">Periode: {{ $bulan }} / {{ $tahun }}</p>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>NIP</th>
                <th class="text-left">Nama Lengkap</th>
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
                <td class="text-left">{{ $row->pengguna->nama_lengkap }}</td>
                <td>{{ $row->total_hadir }}</td>
                <td>{{ $row->total_terlambat }}</td>
                <td>{{ $row->total_izin }}</td>
                <td>{{ $row->total_cuti }}</td>
                <td>{{ $row->total_alpha }}</td>
                <td>{{ $row->total_menit_terlambat }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
