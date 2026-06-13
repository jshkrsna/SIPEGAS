<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <!-- SEO -->
    <title>SIPEGAS — Sistem Presensi Pegawai Sekolah</title>
    <meta name="description" content="Sistem Presensi Pegawai Sekolah berbasis QR Code, GPS Geofencing, dan Selfie realtime." />
    <meta name="theme-color" content="#0f172a" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}" />

    <!-- Vite Assets -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    <!-- Theme Initialization Script -->
    <script>
        if (localStorage.getItem('theme') === 'light') {
            document.documentElement.classList.add('theme-light');
        }
    </script>
</head>
<body>
    <div id="app"></div>
</body>
</html>
