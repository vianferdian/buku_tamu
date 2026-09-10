const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Mulai seeding data...');

  // 1. Create Default Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const securityPassword = await bcrypt.hash('security123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin Utama',
      role: 'ADMIN',
      isActive: true
    }
  });

  const security = await prisma.user.upsert({
    where: { username: 'security' },
    update: {},
    create: {
      username: 'security',
      password: securityPassword,
      name: 'Security Pos 1',
      role: 'SECURITY',
      isActive: true
    }
  });

  console.log('User admin & security berhasil dibuat.');

  // 2. Create Departments
  const departmentsData = [
    { name: 'Kepala Sekolah', sortOrder: 1 },
    { name: 'Wakil Kepala Sekolah', sortOrder: 2 },
    { name: 'Guru', sortOrder: 3 },
    { name: 'Kepala Konsentrasi Keahlian', sortOrder: 4 },
    { name: 'BKK', sortOrder: 5 },
    { name: 'BP/BK', sortOrder: 6 },
    { name: 'Tata Usaha', sortOrder: 7 },
    { name: 'Lainnya', sortOrder: 8 }
  ];

  const departments = [];
  for (const dep of departmentsData) {
    const d = await prisma.department.create({
      data: {
        name: dep.name,
        sortOrder: dep.sortOrder,
        isActive: true
      }
    });
    departments.push(d);
  }
  console.log(`${departments.length} Bagian/Unit berhasil dibuat.`);

  // 3. Create Visitor Types and Purposes
  const visitorTypesData = [
    {
      name: 'Orang Tua / Wali',
      sortOrder: 1,
      purposes: [
        'Bertemu Wali Kelas',
        'Konsultasi Siswa',
        'Administrasi',
        'Perizinan',
        'Lainnya'
      ]
    },
    {
      name: 'Dunia Kerja / Industri',
      sortOrder: 2,
      purposes: [
        'Kerja Sama',
        'PKL',
        'Rekrutmen',
        'Kunjungan Industri',
        'Teaching Factory',
        'Lainnya'
      ]
    },
    {
      name: 'Vendor',
      sortOrder: 3,
      purposes: [
        'Pengiriman Barang',
        'Penawaran Produk / Jasa',
        'Maintenance',
        'Lainnya'
      ]
    },
    {
      name: 'Pengiriman Paket & Makanan Online',
      sortOrder: 4,
      purposes: [
        'Titip Paket di Pos Satpam',
        'Titip Pesanan Makanan Online',
        'Pengiriman Dokumen / Barang',
        'Lainnya'
      ]
    },
    {
      name: 'Media',
      sortOrder: 4,
      purposes: [
        'Liputan',
        'Wawancara',
        'Dokumentasi',
        'Lainnya'
      ]
    },
    {
      name: 'Umum',
      sortOrder: 5,
      purposes: [
        'Kunjungan Dinas',
        'Konsultasi Umum',
        'Lainnya'
      ]
    }
  ];

  for (const vt of visitorTypesData) {
    const createdType = await prisma.visitorType.create({
      data: {
        name: vt.name,
        sortOrder: vt.sortOrder,
        isActive: true
      }
    });

    for (let i = 0; i < vt.purposes.length; i++) {
      await prisma.visitPurpose.create({
        data: {
          visitorTypeId: createdType.id,
          name: vt.purposes[i],
          sortOrder: i + 1,
          isActive: true
        }
      });
    }
  }
  console.log('Kategori Tamu & Keperluan berhasil dibuat.');

  // 4. Create Default Employees
  const depMap = {};
  departments.forEach(d => {
    depMap[d.name] = d.id;
  });

  const employeesData = [
    {
      name: 'Budi Santoso, S.Kom.',
      nip: '198503112010011003',
      position: 'Guru PPLG',
      departmentId: depMap['Guru'] || departments[2].id,
      expertise: 'PPLG',
      phone: '6281234567890',
      email: 'budi.santoso@smkn1cirebon.sch.id',
      sortOrder: 1
    },
    {
      name: 'Ahmad Fauzi, S.Pd.',
      nip: '198704222012011005',
      position: 'Guru Matematika',
      departmentId: depMap['Guru'] || departments[2].id,
      expertise: 'Umum',
      phone: '6289876543210',
      email: 'ahmad.fauzi@smkn1cirebon.sch.id',
      sortOrder: 2
    },
    {
      name: 'Siti Aminah, S.Pd.',
      nip: '199001152015022002',
      position: 'BP/BK',
      departmentId: depMap['BP/BK'] || departments[5].id,
      expertise: 'Konseling',
      phone: '6281111111111',
      email: 'siti.aminah@smkn1cirebon.sch.id',
      sortOrder: 3
    },
    {
      name: 'Drs. H. Sartono',
      nip: '196808121994031004',
      position: 'Kepala Sekolah',
      departmentId: depMap['Kepala Sekolah'] || departments[0].id,
      expertise: 'Manajemen Sekolah',
      phone: '6282222222222',
      email: 'sartono@smkn1cirebon.sch.id',
      sortOrder: 4
    }
  ];

  for (const emp of employeesData) {
    await prisma.employee.create({
      data: {
        name: emp.name,
        nip: emp.nip,
        position: emp.position,
        departmentId: emp.departmentId,
        expertise: emp.expertise,
        phone: emp.phone,
        email: emp.email,
        sortOrder: emp.sortOrder,
        isActive: true
      }
    });
  }
  console.log('Sample data Pegawai berhasil dibuat.');

  // 5. Create Default Settings
  const defaultTemplate = 'Selamat {waktu} Bapak/Ibu {nama_pegawai}.\n\nAda tamu yang ingin menemui Bapak/Ibu.\n\nNama: {nama_tamu}\nInstansi: {instansi}\nJenis Kunjungan: {jenis_kunjungan}\nKeperluan: {keperluan}\n\nTamu saat ini sudah berada di pos security SMK Negeri 1 Cirebon.\n\nTerima kasih.';
  
  await prisma.setting.create({
    data: {
      key: 'whatsapp_template',
      value: defaultTemplate
    }
  });

  console.log('Default settings berhasil dibuat.');
  console.log('Seeding selesai sukses!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
