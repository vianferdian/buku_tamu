# Buku Tamu Digital — SMK Negeri 1 Cirebon

Aplikasi Buku Tamu Digital yang dirancang untuk **SMK Negeri 1 Cirebon** dengan tampilan minimalis, bersih (*clean*), bertone warna Navy & White, serta mudah digunakan oleh Tamu, Security, dan Admin.

---

## 🚀 Fitur Utama

### 1. Kiosk Tamu (Self-Service Kiosk)
* **Survey-Inspired Stepper Form**: Pengisian data tamu bertahap yang dinamis dan minim distraksi.
* **Conditional Fields**: Isian data otomatis beradaptasi (misalnya: kolom data siswa hanya muncul jika kategori kunjungan adalah *Orang Tua / Wali*).
* **Live Search Guru & Pegawai**: Memudahkan tamu mencari guru/pegawai yang ingin ditemui secara langsung.
* **Instant SweetAlert2 Redirect**: Pendaftaran sukses langsung memicu notifikasi visual SweetAlert2 dan kembali ke beranda tanpa delay countdown halaman ekstra.

### 2. Portal Security
* **Queue Cards**: Tampilan antrean tamu aktif yang efisien dengan pembeda status (*Baru*, *Dihubungi*, *Selesai*).
* **WhatsApp Auto-Template Compiler**: Tombol integrasi WhatsApp yang otomatis menyusun pesan pemberitahuan ke guru/pegawai berdasarkan waktu (Pagi/Siang/Sore/Malam) dan detail keperluan tamu.
* **History Logs**: Pencarian dan filter log riwayat kunjungan tamu di pos jaga.

### 3. Portal Administrasi (Admin Control)
* **Dashboard Statistik**: Visualisasi grafik interaktif (Recharts) untuk kepadatan jam kunjungan, kategori tamu terpopuler, dan unit paling sering dikunjungi.
* **Master Data CRUD**: Kelola data Bagian/Unit, Guru & Pegawai, Kategori Kunjungan, Keperluan Tamu, serta Pengguna Sistem dengan SweetAlert2.
* **Excel Template & Import**: Unduh template data pegawai dalam format `.xlsx` dan impor ratusan data guru sekaligus. Bagian/unit baru yang belum terdaftar akan otomatis terbuat di database.
* **Export PDF & Excel**: Unduh log kunjungan dalam format file Excel Spreadsheet atau file PDF landscape berdesain premium.
* **Pengaturan Sistem**: Kustomisasi template pesan WhatsApp serta pola/prefix Kode Kunjungan secara dinamis (mendukung variabel `{YYYY}`, `{YY}`, `{MM}`, `{DD}`, `{SEQ}`).

---

## 🛠️ Tech Stack

* **Frontend**: React + Vite + Tailwind CSS + Lucide Icons + SweetAlert2 + Recharts + jsPDF
* **Backend**: Node.js + Express.js + Prisma ORM + ExcelJS + Multer
* **Database**: MySQL 8

---

## 📦 Petunjuk Instalasi & Pengembangan

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js** (versi >= 18) dan memiliki server **MySQL** yang aktif (misalnya menggunakan Laragon atau XAMPP).

### 2. Kloning Repositori
```bash
git clone https://github.com/vianferdian/buku_tamu.git
cd buku_tamu
```

### 3. Instalasi Dependensi
Jalankan perintah berikut di folder root untuk menginstal seluruh dependensi root, backend, dan frontend secara bersamaan:
```bash
npm run install-all
```

### 4. Konfigurasi Environment (`.env`)
Buat file `.env` di dalam folder `backend/` dan isi sebagai berikut:
```env
DATABASE_URL="mysql://root:password@localhost:3306/buku_tamu_digital"
PORT=5005
JWT_SECRET="smkn1cirebon_buku_tamu_secret_key_2026"
```
*Sesuaikan `root:password` dan nama database (`buku_tamu_digital`) dengan konfigurasi MySQL lokal Anda.*

### 5. Sinkronisasi Database (Prisma)
Jalankan perintah ini di dalam folder `backend/` untuk menyinkronkan schema database dengan MySQL:
```bash
npx prisma db push
```

### 6. Seeding Data Awal
Populasikan database dengan data awal default (kategori, departemen, guru, admin, security, dll.) dengan menjalankan perintah berikut:
```bash
npm run seed
```

### 7. Jalankan Server Development
Jalankan backend server dan frontend Vite server secara bersamaan dengan perintah:
```bash
npm run dev
```
Aplikasi Anda akan berjalan di:
* **Frontend (Kiosk Tamu)**: [http://localhost:5174/](http://localhost:5174/)
* **Backend API**: [http://localhost:5005/](http://localhost:5005/)

---

## 🔐 Akun Default Petugas

Untuk login ke Portal Security dan Portal Admin, gunakan akun berikut:

| Peran | Username | Password |
|---|---|---|
| **Admin Utama** | `admin` | `admin123` |
| **Security Pos 1** | `security` | `security123` |
