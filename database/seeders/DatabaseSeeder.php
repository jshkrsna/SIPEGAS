<?php

namespace Database\Seeders;

use App\Models\GpsReferensi;
use App\Models\HariLibur;
use App\Models\Jabatan;
use App\Models\JamKerja;
use App\Models\Pengguna;
use App\Models\RekapBulanan;
use App\Models\Sekolah;
use App\Models\Yayasan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Truncate all tables
        $tables = ['audit_chain', 'audit_chain_seq', 'notifikasi_log', 'rekap_bulanan', 'izin_cuti', 'gps_log', 'presensi', 'pengguna', 'hari_libur', 'gps_referensi', 'jam_kerja', 'jabatan', 'sekolah', 'yayasan'];
        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ── 1. Yayasan ──────────────────────────────────────────────────────
        $yayasan = Yayasan::create([
            'id'           => Str::uuid(),
            'nama_yayasan' => 'Yayasan Pendidikan Nusantara',
            'kode_yayasan' => 'YPN-001',
            'alamat'       => 'Jl. Pendidikan No. 1, Jakarta',
            'no_telp'      => '021-123456',
            'is_active'    => 1,
        ]);

        // ── 2. Sekolah ──────────────────────────────────────────────────────
        $sekolah = Sekolah::create([
            'id'           => Str::uuid(),
            'yayasan_id'   => $yayasan->id,
            'nama_sekolah' => 'SMP Nusantara 1',
            'kode_sekolah' => 'SMPN-001',
            'alamat'       => 'Jl. Sekolah No. 10, Jakarta Selatan',
            'no_telp'      => '021-654321',
            'is_active'    => 1,
        ]);

        // ── 3. Jabatan ──────────────────────────────────────────────────────
        $jabGuru    = Jabatan::create(['id' => Str::uuid(), 'sekolah_id' => $sekolah->id, 'nama_jabatan' => 'Guru Mata Pelajaran', 'kode_jabatan' => 'GURU']);
        $jabStaf    = Jabatan::create(['id' => Str::uuid(), 'sekolah_id' => $sekolah->id, 'nama_jabatan' => 'Staf Tata Usaha', 'kode_jabatan' => 'TU']);
        $jabWaka    = Jabatan::create(['id' => Str::uuid(), 'sekolah_id' => $sekolah->id, 'nama_jabatan' => 'Wakil Kepala Sekolah', 'kode_jabatan' => 'WAKA']);

        // ── 4. Jam Kerja ─────────────────────────────────────────────────────
        $jamKerja = JamKerja::create([
            'id'              => Str::uuid(),
            'sekolah_id'      => $sekolah->id,
            'nama_shift'      => 'Shift Utama',
            'jam_masuk'       => '07:00:00',
            'jam_pulang'      => '15:00:00',
            'toleransi_menit' => 15,
            'is_default'      => 1,
        ]);

        // ── 5. GPS Referensi ─────────────────────────────────────────────────
        GpsReferensi::create([
            'id'           => Str::uuid(),
            'sekolah_id'   => $sekolah->id,
            'nama_lokasi'  => 'Gedung Utama',
            'lat'          => -6.200000,
            'lng'          => 106.816666,
            'radius_meter' => 100,
            'is_active'    => 1,
        ]);

        // ── 6. Hari Libur ─────────────────────────────────────────────────
        $tahun = now()->year;
        $libur = [
            ['01-01', 'Tahun Baru Masehi'],
            ['05-01', 'Hari Buruh Internasional'],
            ['06-01', 'Hari Lahir Pancasila'],
            ['08-17', 'HUT Kemerdekaan RI'],
            ['12-25', 'Hari Natal'],
        ];
        foreach ($libur as [$tgl, $nama]) {
            HariLibur::create([
                'id'         => Str::uuid(),
                'sekolah_id' => $sekolah->id,
                'tanggal'    => "{$tahun}-{$tgl}",
                'nama_libur' => $nama,
                'jenis'      => 'nasional',
            ]);
        }

        // ── 7. Pengguna ───────────────────────────────────────────────────────
        $yayasanUser = Pengguna::create([
            'id'            => Str::uuid(),
            'sekolah_id'    => null,
            'jabatan_id'    => null,
            'nip'           => 'YYS-001',
            'nama_lengkap'  => 'Drs. Ahmad Yayasan',
            'email'         => 'yayasan@sipegas.id',
            'password_hash' => Hash::make('password123'),
            'role'          => 'yayasan',
            'is_active'     => 1,
        ]);

        $admin = Pengguna::create([
            'id'            => Str::uuid(),
            'sekolah_id'    => $sekolah->id,
            'jabatan_id'    => null,
            'nip'           => 'ADM-001',
            'nama_lengkap'  => 'Siti Admin',
            'email'         => 'admin@sipegas.id',
            'password_hash' => Hash::make('password123'),
            'role'          => 'admin',
            'is_active'     => 1,
        ]);

        $kepala = Pengguna::create([
            'id'            => Str::uuid(),
            'sekolah_id'    => $sekolah->id,
            'jabatan_id'    => null,
            'nip'           => 'KS-001',
            'nama_lengkap'  => 'Dr. Budi Kepala Sekolah',
            'email'         => 'kepala@sipegas.id',
            'password_hash' => Hash::make('password123'),
            'role'          => 'kepala_sekolah',
            'is_active'     => 1,
        ]);

        $guruData = [
            ['NIP-0001', 'Andi Kurniawan, S.Pd', 'andi@sipegas.id'],
            ['NIP-0002', 'Budi Santoso, S.Pd', 'budi@sipegas.id'],
            ['NIP-0003', 'Citra Dewi, M.Pd', 'citra@sipegas.id'],
            ['NIP-0004', 'Dian Rahayu, S.Pd', 'dian@sipegas.id'],
            ['NIP-0005', 'Eko Prasetyo, S.Pd', 'eko@sipegas.id'],
        ];

        $guru = [];
        foreach ($guruData as [$nip, $nama, $email]) {
            $guru[] = Pengguna::create([
                'id'            => Str::uuid(),
                'sekolah_id'    => $sekolah->id,
                'jabatan_id'    => $jabGuru->id,
                'nip'           => $nip,
                'nama_lengkap'  => $nama,
                'email'         => $email,
                'password_hash' => Hash::make('password123'),
                'role'          => 'guru',
                'qr_token'      => Str::random(32),
                'qr_expires_at' => now()->addDay(),
                'is_active'     => 1,
            ]);
        }

        // ── 8. Init audit_chain_seq ───────────────────────────────────────────
        DB::table('audit_chain_seq')->insert(['next_val' => 1]);

        $this->command->info('✅ SIPEGAS Database seeded successfully!');
        $this->command->info('');
        $this->command->info('📧 Login Credentials:');
        $this->command->info('   Admin        : admin@sipegas.id / password123');
        $this->command->info('   Kepala Sekolah: kepala@sipegas.id / password123');
        $this->command->info('   Guru         : andi@sipegas.id / password123');
        $this->command->info('   Yayasan      : yayasan@sipegas.id / password123');
    }
}
