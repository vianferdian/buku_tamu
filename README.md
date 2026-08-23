# 📋 Buku Tamu Digital — SMK Negeri 1 Cirebon

Aplikasi **Buku Tamu Digital** berbasis web yang dirancang untuk **SMK Negeri 1 Cirebon**. Dibangun dengan tampilan modern, bersih (*clean*), bertone warna Navy & White, serta mudah digunakan oleh Tamu, Petugas Keamanan, dan Admin.

---

## 🛠️ Dibuat Dengan (Tech Stack)

Proyek ini dibangun menggunakan teknologi-teknologi berikut:

### Frontend
| Teknologi | Versi | Keterangan |
|---|---|---|
| **JavaScript (JSX)** | ES2022+ | Bahasa utama frontend |
| **React** | v18 | Library UI berbasis komponen |
| **Vite** | v5 | Build tool & dev server ultra cepat |
| **Tailwind CSS** | v3 | Utility-first CSS framework |
| **Lucide React** | Latest | Library ikon SVG |
| **SweetAlert2** | v11 | Notifikasi & dialog interaktif |
| **Recharts** | v2 | Visualisasi grafik statistik |
| **jsPDF + autotable** | Latest | Export laporan ke PDF |
| **React Router DOM** | v6 | Client-side routing |
| **Axios** | Latest | HTTP client untuk API requests |

### Backend
| Teknologi | Versi | Keterangan |
|---|---|---|
| **JavaScript (Node.js)** | v18+ | Bahasa utama backend |
| **Express.js** | v4 | Web framework Node.js |
| **Prisma ORM** | v5 | ORM untuk akses database |
| **MySQL** | v8 | Database relasional utama |
| **JSON Web Token (JWT)** | Latest | Autentikasi berbasis token |
| **Bcrypt.js** | Latest | Enkripsi password |
| **ExcelJS** | Latest | Baca/tulis file Excel di server |
| **Multer** | Latest | Middleware upload file |

### Infrastruktur & Tools
| Teknologi | Keterangan |
|---|---|
| **Laragon / XAMPP** | Local server environment |
| **Nodemon** | Auto-restart server saat development |
| **Git** | Version control |

---

## 🚀 Fitur Utama

### 1. Kiosk Tamu (Self-Service Kiosk)
- **Survey-Inspired Stepper Form** — Pengisian data tamu bertahap yang dinamis dan minim distraksi.
- **Conditional Fields** — Kolom data siswa hanya muncul jika kategori kunjungan adalah *Orang Tua / Wali*.
- **Live Search Guru & Pegawai** — Pencarian guru/pegawai langsung dari database lokal.
- **Live Search Siswa** — Pencarian siswa dari master data lokal yang telah disinkronkan dari API Bank Data.
- **SweetAlert2 Feedback** — Notifikasi sukses/gagal secara visual.

### 2. Portal Petugas Keamanan (Security Portal)
- **Antrean Aktif Real-time** — Kartu tamu aktif diperbarui otomatis setiap 10 detik.
- **Elapsed Timer** — Tampilan waktu tunggu tamu sejak pertama datang, dengan peringatan otomatis jika > 10 menit.
- **WhatsApp Integration** — Tombol kirim pesan WA otomatis ke guru/pegawai dengan template dinamis.
- **Riwayat Kunjungan** — Filter log kunjungan berdasarkan tanggal, status, dan kata kunci.
- **Jam Real-time** — Jam digital berdetak di header portal.

### 3. Portal Administrasi (Admin Portal)
- **Dashboard Statistik** — Grafik interaktif (Recharts) untuk kepadatan jam kunjungan, kategori tamu, dan unit terpopuler.
- **Master Data Lengkap** — CRUD Bagian/Unit, Guru & Pegawai, Siswa, Kategori Kunjungan, Keperluan Tamu (dikelompokkan per kategori), dan Pengguna Sistem.
- **Master Data Siswa** — Sinkronisasi bertahap (*chunked page-by-page*) dari API Bank Data Eksternal dengan progress bar real-time. Delay otomatis untuk mematuhi *rate limit* API (60 req/menit).
- **Import Excel** — Import massal data guru dari file `.xlsx` dengan template yang dapat diunduh.
- **Export PDF & Excel** — Unduh log kunjungan dalam format Excel atau PDF landscape berdesain premium.
- **Pengaturan Sistem** — Kustomisasi template pesan WhatsApp & pola Kode Kunjungan (`{YYYY}`, `{MM}`, `{DD}`, `{SEQ}`).

---

## 📦 Petunjuk Instalasi

### 1. Prasyarat
- **Node.js** >= 18
- **MySQL** 8 aktif (Laragon / XAMPP)

### 2. Kloning Repositori
```bash
git clone https://github.com/vianferdian/buku_tamu2.git
cd buku_tamu2
```

### 3. Instalasi Dependensi
```bash
npm run install-all
```

### 4. Konfigurasi Environment (`.env`)
Buat file `.env` di dalam folder `backend/`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/buku_tamu_digital"
PORT=5005
JWT_SECRET="smkn1cirebon_buku_tamu_secret_key_2026"
```

### 5. Sinkronisasi Database
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 6. Seeding Data Awal
```bash
npm run seed
```

### 7. Jalankan Server Development
```bash
npm run dev
```

Aplikasi akan berjalan di:
- **Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:5005/](http://localhost:5005/)

---

## 🗺️ Routing Halaman

| URL | Halaman |
|---|---|
| `/` | Halaman Kiosk Tamu (Landing) |
| `/form` | Form Registrasi Tamu |
| `/login` | Halaman Login Petugas |
| `/security` | Portal Petugas Keamanan |
| `/admin` | Portal Administrasi |

---

## 🔐 Akun Default Petugas

| Peran | Username | Password |
|---|---|---|
| **Admin Utama** | `admin` | `admin123` |
| **Security Pos 1** | `security` | `security123` |

---

© 2026 SMK Negeri 1 Cirebon — Buku Tamu Digital
