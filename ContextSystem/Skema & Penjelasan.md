![[Pasted image 20260602111533.png]]

![[Pasted image 20260602111602.png|673]]
Tentu, mari kita bedah "mentahannya" menjadi rincian fungsional yang siap dieksekusi oleh tim pengembang atau desainer. Berikut adalah detail spesifikasi fitur untuk **Sistem Presensi Pegawai Sekolah** Anda:

### **1. Fitur Utama Presensi (The Core Engine)**

|**Fitur**|**Rincian Teknis & Alur Kerja**|**Logika Anti-Fraud (Keamanan)**|
|---|---|---|
|**Dynamic QR Scanner**|Sistem men-generate QR Code unik di layar Admin/TV sekolah. QR berganti setiap 30-60 detik untuk mencegah foto QR dikirim via chat.|Validasi koordinat GPS tetap berjalan saat scan. Jika lokasi tidak sesuai, scan ditolak meskipun QR benar.|
|**Geofencing Radius**|Menggunakan Google Maps API / Leaflet. Admin menetapkan titik koordinat sekolah dan radius (misal: 50 meter).|Sistem mengunci tombol "Hadir" jika _accuracy_ GPS di atas 20m (mencegah _GPS Spoofing_ ringan).|
|**Real-time Selfie**|Kamera depan terbuka otomatis. Foto diambil secara _stream_ (bukan unggah file). Hasil foto diproses menjadi thumbnail ringan (web-p format).|**Liveness Detection:** Deteksi mata berkedip atau gerakan kepala (opsional) untuk memastikan itu manusia, bukan foto di depan kamera.|
|**Status Presensi**|Otomatis mengkategorikan: Tepat Waktu, Terlambat (berdasarkan toleransi menit), atau Pulang Awal.|Jika koneksi putus, data disimpan di _local storage_ dan dikirim otomatis saat sinyal kembali (_Offline Mode_).|

### **2. Detail Dashboard Per Role**

#### **A. Admin / HR (The Controller)**

- **Manajemen Shift:** Pengaturan jam masuk/pulang yang berbeda untuk Guru (sesuai jadwal mengajar) dan Staf (jam kantor tetap).
    
- **Log Audit:** Melihat siapa yang mengubah data presensi manual (jika ada perbaikan absen) untuk transparansi.
    
- **Export Engine:** Tombol sekali klik untuk export laporan ke Excel/PDF sesuai format Dapodik atau penggajian.
    
- **Live Map View:** Melihat sebaran pegawai yang sudah presensi di area sekolah secara visual.
    

#### **B. Kepala Sekolah (The Supervisor)**

- **Digital Signature:** Fitur untuk menandatangani (approval) pengajuan cuti/izin langsung dari smartphone.
    
- **Daily Analytics:** Grafik pie yang menunjukkan persentase kehadiran hari ini dibanding hari kemarin.
    
- **Notification Center:** Menerima notifikasi jika ada guru penting yang belum hadir saat jam pelajaran dimulai.
    

#### **C. Pegawai / Guru (The User)**

- **Personal Calendar:** Tampilan kalender dengan warna (Hijau: Masuk, Merah: Alpa, Kuning: Terlambat, Biru: Izin).
    
- **Evidence Upload:** Menu unggah surat dokter atau surat tugas luar kota sebagai syarat validasi izin.
    
- **Self-Correction:** Fitur untuk sanggah absen jika sistem salah mendeteksi lokasi (dengan lampiran bukti).
    

### **3. Sistem Integrasi & Notifikasi**

#### **WhatsApp Gateway (Fonnte/Wablas)**

- **Auto-Report:** Setiap jam 08:30 (asumsi batas masuk), sistem mengirim ringkasan ke WA Kepala Sekolah: _"Laporan Presensi 07/05/2026: 45 Hadir, 3 Terlambat, 2 Izin (Budi, Ani). Detail: [Link]"_.
    
- **User Alert:** Mengirim pesan ke pegawai yang terlambat sebagai pengingat otomatis.
    

#### **Cloud Storage & Database**

- **Image Compression:** Setiap selfie otomatis dikompres ke ukuran maksimal 100KB sebelum masuk ke storage (AWS S3/Google Cloud) untuk menghemat ruang.
    
- **Daily Backup:** Backup otomatis database setiap tengah malam untuk mencegah kehilangan data.
    

### **4. Detail UX & Interaksi Dinamis**

Untuk memastikan aplikasi tidak "berat" di HP lama, berikut rincian UX-nya:

- **Skeleton Loading:** Saat membuka aplikasi, tampilkan kerangka layout terlebih dahulu sebelum data muncul untuk mengurangi _perceived latency_.
    
- **Toast Notifications:** Munculkan pesan sukses kecil di bawah layar setelah berhasil presensi, jadi tidak perlu pindah halaman.
    
- **Haptic Feedback:** Getaran pendek saat scan QR berhasil memberikan kepuasan psikologis bagi pengguna.
    
- **High Contrast Mode:** Tombol presensi harus memiliki kontras tinggi agar tetap terlihat jelas meskipun pegawai sedang berada di bawah sinar matahari (parkiran).
    

### **5. Alur Logika Keamanan (Evolusi Spesies)**

Seperti yang Anda sebutkan tentang "evolusi spesies" yang malas, berikut rincian pengaman tambahannya:

1. **Device Binding:** Satu akun hanya bisa presensi di 1 perangkat terdaftar. Jika ganti HP, harus lapor Admin. Ini mencegah titip HP ke teman.
    
2. **Mock Location Blocker:** Sistem otomatis menolak akses jika di HP pegawai terdeteksi aplikasi "Fake GPS" atau "Zygisk/Root" yang aktif.
    
3. **Timestamp Hardening:** Waktu presensi diambil dari server (_Network Time_), bukan dari jam di HP pegawai yang bisa dimundurkan manual.
    
