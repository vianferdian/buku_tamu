const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const ExcelJS = require('exceljs');
const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');
const BankDataService = require('../services/bankDataService');

// Normalize WhatsApp number
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// @route   GET /api/employees/template
// @desc    Download blank excel template for importing employees (Admin only)
router.get('/template', verifyToken, isAdmin, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Guru Pegawai');

    worksheet.columns = [
      { header: 'Nama Lengkap *', key: 'name', width: 25 },
      { header: 'NIP / ID Pegawai', key: 'nip', width: 20 },
      { header: 'Jabatan *', key: 'position', width: 20 },
      { header: 'Bagian / Unit *', key: 'department', width: 20 },
      { header: 'Konsentrasi Keahlian', key: 'expertise', width: 20 },
      { header: 'Nomor WhatsApp *', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Urutan Tampil', key: 'sortOrder', width: 15 }
    ];

    // Add styling to headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F2744' }
    };

    // Add sample rows
    worksheet.addRow({
      name: 'Budi Santoso, S.Kom.',
      nip: '198503112010011003',
      position: 'Guru PPLG',
      department: 'Guru',
      expertise: 'PPLG',
      phone: '081234567890',
      email: 'budi.santoso@smkn1cirebon.sch.id',
      sortOrder: 1
    });

    worksheet.addRow({
      name: 'Siti Aminah, S.Pd.',
      nip: '',
      position: 'Staf BP/BK',
      department: 'BP/BK',
      expertise: 'Konseling',
      phone: '085566778899',
      email: 'siti.aminah@smkn1cirebon.sch.id',
      sortOrder: 2
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=template_guru_pegawai.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat file template.' });
  }
});

// @route   POST /api/employees/import
// @desc    Import employees from Excel file (Admin only)
router.post('/import', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel wajib diunggah.' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const employeesToInsert = [];
    let successCount = 0;
    let skipCount = 0;
    const errors = [];

    // Pre-load departments
    const departments = await prisma.department.findMany();
    const deptMap = {};
    departments.forEach(d => {
      deptMap[d.name.toLowerCase().trim()] = d.id;
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const name = row.getCell(1).text?.trim();
      const nip = row.getCell(2).text?.trim() || null;
      const position = row.getCell(3).text?.trim();
      const departmentName = row.getCell(4).text?.trim();
      const expertise = row.getCell(5).text?.trim() || null;
      const phone = row.getCell(6).text?.trim();
      const email = row.getCell(7).text?.trim() || null;
      const sortOrderText = row.getCell(8).text?.trim();
      const sortOrder = sortOrderText ? parseInt(sortOrderText) : 0;

      if (!name || !position || !departmentName || !phone) {
        skipCount++;
        errors.push(`Baris ${rowNumber}: Kolom wajib (Nama, Jabatan, Bagian, No WA) kosong.`);
        return;
      }

      // Resolve department ID. If not exists, create it
      let departmentId = deptMap[departmentName.toLowerCase()];
      
      // We will handle on-the-fly department creations later dynamically in the async loop
      employeesToInsert.push({
        rowNum: rowNumber,
        name,
        nip,
        position,
        departmentName,
        departmentId, // might be undefined initially if new dept
        expertise,
        phone,
        email,
        sortOrder
      });
    });

    // Upsert loop
    for (const emp of employeesToInsert) {
      try {
        let finalDeptId = emp.departmentId;

        // If department name didn't map to an existing ID, create the department now
        if (!finalDeptId) {
          const deptNameLower = emp.departmentName.toLowerCase();
          
          // Double check map in case it was created in a previous iteration
          if (deptMap[deptNameLower]) {
            finalDeptId = deptMap[deptNameLower];
          } else {
            const newDept = await prisma.department.create({
              data: {
                name: emp.departmentName,
                isActive: true,
                sortOrder: 0
              }
            });
            finalDeptId = newDept.id;
            deptMap[deptNameLower] = newDept.id;
          }
        }

        const normalizedPhone = normalizePhoneNumber(emp.phone);
        if (!normalizedPhone || normalizedPhone.length < 9) {
          skipCount++;
          errors.push(`Baris ${emp.rowNum}: Format nomor WhatsApp "${emp.phone}" tidak valid.`);
          continue;
        }

        // Upsert by NIP (if exists) or by Name + Phone
        let existing = null;
        if (emp.nip) {
          existing = await prisma.employee.findFirst({
            where: { nip: emp.nip }
          });
        }
        
        if (!existing) {
          existing = await prisma.employee.findFirst({
            where: { name: emp.name, phone: normalizedPhone }
          });
        }

        if (existing) {
          await prisma.employee.update({
            where: { id: existing.id },
            data: {
              name: emp.name,
              nip: emp.nip,
              position: emp.position,
              departmentId: finalDeptId,
              expertise: emp.expertise,
              phone: normalizedPhone,
              email: emp.email,
              sortOrder: emp.sortOrder
            }
          });
        } else {
          await prisma.employee.create({
            data: {
              name: emp.name,
              nip: emp.nip,
              position: emp.position,
              departmentId: finalDeptId,
              expertise: emp.expertise,
              phone: normalizedPhone,
              email: emp.email,
              sortOrder: emp.sortOrder,
              isActive: true
            }
          });
        }
        successCount++;
      } catch (err) {
        console.error(err);
        skipCount++;
        errors.push(`Baris ${emp.rowNum}: Gagal menyimpan pegawai "${emp.name}": ${err.message}`);
      }
    }

    await logActivity(
      req.user.id,
      'IMPORT_EMPLOYEES',
      `Mengimpor pegawai dari Excel. Sukses: ${successCount}, Gagal/Skip: ${skipCount}`
    );

    res.json({
      message: `Impor selesai. Sukses: ${successCount}, Gagal/Skip: ${skipCount}`,
      successCount,
      skipCount,
      errors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memproses file Excel.' });
  }
});

// @route   GET /api/employees
// @desc    Get employees with search and department filtering
router.get('/', async (req, res) => {
  const { search, departmentId, activeOnly } = req.query;
  const where = {};

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  if (departmentId) {
    where.departmentId = parseInt(departmentId);
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { position: { contains: search } },
      { expertise: { contains: search } },
      { nip: { contains: search } }
    ];
  }

  try {
    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat data pegawai.' });
  }
});

// @route   POST /api/employees
// @desc    Create a new employee (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, nip, position, departmentId, expertise, phone, email, isActive, sortOrder } = req.body;

  if (!name || !position || !departmentId || !phone) {
    return res.status(400).json({ message: 'Nama, Jabatan, Bagian, dan No WhatsApp wajib diisi.' });
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return res.status(400).json({ message: 'Format nomor WhatsApp tidak valid.' });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        nip: nip || null,
        position,
        departmentId: parseInt(departmentId),
        expertise: expertise || null,
        phone: normalizedPhone,
        email: email || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      },
      include: {
        department: true
      }
    });

    await logActivity(req.user.id, 'CREATE_EMPLOYEE', `Membuat pegawai: ${name} (${position})`);
    res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat data pegawai.' });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee details (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, nip, position, departmentId, expertise, phone, email, isActive, sortOrder } = req.body;

  try {
    const check = await prisma.employee.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Pegawai tidak ditemukan.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nip !== undefined) updateData.nip = nip || null;
    if (position !== undefined) updateData.position = position;
    if (departmentId !== undefined) updateData.departmentId = parseInt(departmentId);
    if (expertise !== undefined) updateData.expertise = expertise || null;
    if (email !== undefined) updateData.email = email || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

    if (phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedPhone || normalizedPhone.length < 9) {
        return res.status(400).json({ message: 'Format nomor WhatsApp tidak valid.' });
      }
      updateData.phone = normalizedPhone;
    }

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        department: true
      }
    });

    await logActivity(req.user.id, 'UPDATE_EMPLOYEE', `Mengubah data pegawai ID: ${id} (${employee.name})`);
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah data pegawai.' });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const check = await prisma.employee.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Pegawai tidak ditemukan.' });
    }

    await prisma.employee.delete({
      where: { id: parseInt(id) }
    });

    await logActivity(req.user.id, 'DELETE_EMPLOYEE', `Menghapus pegawai ID: ${id} (${check.name})`);
    res.json({ message: 'Pegawai berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus pegawai. Mungkin data masih terikat dengan riwayat kunjungan.' });
  }
});

// @route   POST /api/employees/sync
// @desc    Sync employees from bank-data API (Admin only)
router.post('/sync', verifyToken, isAdmin, async (req, res) => {
  try {
    const rawEmployees = await BankDataService.fetchAllEmployees();
    if (!rawEmployees || rawEmployees.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data guru/pegawai yang ditemukan dari bank-data.' });
    }

    let createdCount = 0;
    let updatedCount = 0;

    const departments = await prisma.department.findMany();
    const deptMap = {};
    departments.forEach(d => {
      deptMap[d.name.toLowerCase()] = d.id;
    });

    const fallbackDeptId = departments[0]?.id || null;

    for (const emp of rawEmployees) {
      let deptName = 'Tata Usaha'; // Default
      const positionLower = (emp.primary_subject || emp.ptk_type || '').toLowerCase();
      
      if (positionLower.includes('kepala sekolah')) {
        deptName = 'Kepala Sekolah';
      } else if (positionLower.includes('wakil')) {
        deptName = 'Wakil Kepala Sekolah';
      } else if (positionLower.includes('bp') || positionLower.includes('bk') || positionLower.includes('konseling') || positionLower.includes('bimbingan')) {
        deptName = 'BP/BK';
      } else if (positionLower.includes('bkk') || positionLower.includes('bursa kerja')) {
        deptName = 'BKK';
      } else if (positionLower.includes('guru') || positionLower.includes('mapel') || positionLower.includes('pengajar') || positionLower.includes('pplg') || positionLower.includes('rpl') || positionLower.includes('titl') || positionLower.includes('dpib') || positionLower.includes('otomotif') || positionLower.includes('tkr') || positionLower.includes('tpm') || positionLower.includes('mesin') || positionLower.includes('listrik') || positionLower.includes('jaringan') || positionLower.includes('tjkt')) {
        deptName = 'Guru';
      } else if (positionLower.includes('kepala konsentrasi') || positionLower.includes('kaprog') || positionLower.includes('kakomli')) {
        deptName = 'Kepala Konsentrasi Keahlian';
      } else if (positionLower.includes('tendik') || positionLower.includes('administrasi') || positionLower.includes('tata usaha') || positionLower.includes('tu') || positionLower.includes('staf') || positionLower.includes('staff')) {
        deptName = 'Tata Usaha';
      } else {
        deptName = 'Lainnya';
      }

      const departmentId = deptMap[deptName.toLowerCase()] || fallbackDeptId;

      if (!departmentId) {
        continue;
      }

      const name = emp.full_name.trim();
      const nip = emp.nip ? emp.nip.trim() : null;
      
      let position = emp.ptk_type || 'Pegawai';
      if (emp.primary_subject) {
        position = `${emp.ptk_type} - ${emp.primary_subject}`;
      }

      const phone = emp.whatsapp || emp.phone || '';
      let normalizedPhone = normalizePhoneNumber(phone);
      if (!normalizedPhone) {
        normalizedPhone = '6280000000000'; // Default fallback
      }

      const email = emp.email || null;
      const isActive = emp.status === 'Aktif' || emp.status === 'Active' || emp.status === 'active' || true;
      const expertise = emp.major_expertise || null;

      let existing = null;
      if (nip) {
        existing = await prisma.employee.findFirst({
          where: {
            OR: [
              { nip: nip },
              { name: name }
            ]
          }
        });
      } else {
        existing = await prisma.employee.findFirst({
          where: { name: name }
        });
      }

      if (existing) {
        await prisma.employee.update({
          where: { id: existing.id },
          data: {
            name,
            nip,
            position,
            departmentId,
            phone: normalizedPhone,
            email,
            expertise,
            isActive
          }
        });
        updatedCount++;
      } else {
        await prisma.employee.create({
          data: {
            name,
            nip,
            position,
            departmentId,
            phone: normalizedPhone,
            email,
            expertise,
            isActive
          }
        });
        createdCount++;
      }
    }

    await logActivity(req.user.id, 'SYNC_EMPLOYEES', `Sinkronisasi pegawai dari bank-data API (${rawEmployees.length} data)`);

    return res.json({
      success: true,
      message: `Sinkronisasi selesai. Berhasil menyinkronkan ${rawEmployees.length} pegawai dari bank-data.`,
      data: {
        total: rawEmployees.length,
        created: createdCount,
        updated: updatedCount
      }
    });
  } catch (error) {
    console.error('syncEmployees error:', error);
    return res.status(500).json({ message: 'Gagal melakukan sinkronisasi data guru/pegawai.' });
  }
});

module.exports = router;
