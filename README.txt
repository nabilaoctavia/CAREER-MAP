CAREER MAP — STARTER PROTOTYPE

ISI FOLDER
- index.html: struktur halaman
- style.css: desain responsif
- app.js: interaksi dan data contoh
- manifest.json: identitas PWA
- sw.js: cache/offline dasar
- icons/: ikon aplikasi

CARA MENCOBA DI LAPTOP
1. Ekstrak ZIP.
2. Buka index.html dengan browser untuk melihat tampilan dasar.
3. Untuk uji PWA/service worker, website harus dijalankan lewat localhost atau HTTPS.
   Cara mudah: pasang Visual Studio Code dan ekstensi Live Server, lalu klik kanan index.html > Open with Live Server.

CARA PUBLIKASI
1. Buat repositori PUBLIC baru di GitHub, misalnya career-map.
2. Upload semua isi folder ini (bukan folder pembungkusnya) ke repositori.
3. Settings > Pages > Build and deployment > Deploy from a branch.
4. Pilih branch main dan folder /(root), lalu Save.
5. Tunggu alamat https://USERNAME.github.io/career-map/ aktif.
6. Pastikan manifest dan service worker terbaca. Untuk project Pages, path relatif pada starter ini sudah disiapkan.

PWA DI ANDROID
Buka alamat website HTTPS di Chrome Android. Gunakan menu browser > Install app atau Add to Home screen (nama menu bisa berbeda). Uji saat online dahulu, lalu coba offline.

APK
Setelah PWA online dan memenuhi pemeriksaan PWABuilder:
1. Buka https://www.pwabuilder.com/
2. Masukkan URL website HTTPS.
3. Periksa manifest, ikon, dan service worker.
4. Pilih Package for stores > Android > Generate Package.
5. Unduh paket, lalu gunakan APK untuk pengujian di perangkat Android.
Catatan: ketersediaan opsi paket dapat berubah. Google Play memerlukan akun developer berbayar; file APK untuk pengujian tidak sama dengan publikasi Play Store.

BATAS PROTOTIPE
- Jawaban refleksi dan rencana disimpan di localStorage browser pada perangkat itu saja.
- Tidak ada akun, sinkronisasi antarperangkat, database, atau pengiriman data ke Guru BK.
- Isi karier dan studi lanjut adalah contoh edukatif awal, perlu ditinjau dan diperbarui dengan sumber resmi sebelum digunakan siswa.
- Refleksi bukan tes psikologi dan tidak menentukan karier final.
- Service worker menyimpan aset inti untuk penggunaan offline dasar; Google Fonts membutuhkan internet dan mungkin tidak tampil offline.
