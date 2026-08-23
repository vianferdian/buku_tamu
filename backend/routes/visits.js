const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isSecurityOrAdmin, isAdmin, logActivity } = require('../middleware/auth');
const BankDataService = require('../services/bankDataService');

// Helper to get time-of-day greeting (Pagi/Siang/Sore/Malam)
function getGreeting() {
  const hr = new Date().getHours();
  if (hr >= 4 && hr < 11) return 'Pagi';
  if (hr >= 11 && hr < 15) return 'Siang';
  if (hr >= 15 && hr < 18) return 'Sore';
  return 'Malam';
}

// Helper to format time (HH:MM)
function formatTime(date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

// @route   GET /api/visits/bank-data/students
// @desc    Search students from local master data (originally proxying bank-data API)
router.get('/bank-data/students', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const where = { isActive: true };

    if (search.trim()) {
      where.OR = [
        { fullName: { contains: search } },
        { nis: { contains: search } },
        { className: { contains: search } }
      ];
    }

    const students = await prisma.student.findMany({
      where,
      take: 20,
      orderBy: { fullName: 'asc' }
    });

    // Map to response format frontend expects
    const mapped = students.map(s => ({
      uuid: s.uuid,
      nis: s.nis,
      nisn: s.nisn,
      full_name: s.fullName,
      gender: s.gender,
      birth_place: s.birthPlace,
      birth_date: s.birthDate,
      religion: s.religion,
      class: {
        name: s.className,
        major: s.major || ''
      }
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mencari data siswa.' });
  }
});

// @route   POST /api/visits
// @desc    Register a new guest visit (Guest self-service)
router.post('/', async (req, res) => {
  const {
    visitorName,
    visitorPhone,
    visitorTypeId,
    institutionName,
    visitorAddress,
    studentName,
    studentClass,
    destinationId, // department_id
    employeeId,
    purposeId,
    purposeDescription,
    guestCount
  } = req.body;

  if (!visitorName || !visitorPhone || !visitorTypeId || !destinationId || !employeeId || !purposeId) {
    return res.status(400).json({ message: 'Semua field wajib yang bertanda bintang harus diisi.' });
  }

  if (!/^\d+$/.test(visitorPhone)) {
    return res.status(400).json({ message: 'Nomor WhatsApp harus berupa angka saja.' });
  }

  try {
    // Generate Visit Code: T-YYYYMMDD-XXXX
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const countToday = await prisma.visit.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    let patternSetting = await prisma.setting.findUnique({
      where: { key: 'visit_code_pattern' }
    });
    const pattern = patternSetting ? patternSetting.value : 'T-{YYYY}{MM}{DD}-{SEQ}';

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const yy = yyyy.substring(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const sequence = String(countToday + 1).padStart(4, '0');

    let visitCode = pattern
      .replace(/{YYYY}/g, yyyy)
      .replace(/{YY}/g, yy)
      .replace(/{MM}/g, mm)
      .replace(/{DD}/g, dd)
      .replace(/{SEQ}/g, sequence);

    const visit = await prisma.visit.create({
      data: {
        visitCode,
        visitorName,
        visitorPhone,
        visitorTypeId: parseInt(visitorTypeId),
        institutionName: institutionName || null,
        visitorAddress: visitorAddress || null,
        studentName: studentName || null,
        studentClass: studentClass || null,
        destinationId: parseInt(destinationId),
        employeeId: parseInt(employeeId),
        purposeId: parseInt(purposeId),
        purposeDescription: purposeDescription || null,
        guestCount: guestCount ? parseInt(guestCount) : 1,
        status: 'NEW'
      },
      include: {
        visitorType: true,
        department: true,
        employee: true,
        purpose: true
      }
    });

    res.status(201).json(visit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mendaftarkan kunjungan Anda.' });
  }
});

// @route   GET /api/visits
// @desc    Get visits list for Security and Admin (Authorized)
router.get('/', verifyToken, isSecurityOrAdmin, async (req, res) => {
  const { status, activeOnly, search, range, startDate, endDate } = req.query;
  const where = {};

  // Status Filter
  if (activeOnly === 'true') {
    where.status = { in: ['NEW', 'CONTACTED'] };
  } else if (status) {
    where.status = status;
  }

  // Date Range Filter
  const now = new Date();
  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.visitedAt = { gte: start, lte: end };
  } else if (range === 'yesterday') {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    where.visitedAt = { gte: start, lte: end };
  } else if (range === '7days') {
    const start = new Date();
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    where.visitedAt = { gte: start, lte: now };
  } else if (range === 'custom' && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.visitedAt = { gte: start, lte: end };
  }

  // Search Filter
  if (search) {
    where.OR = [
      { visitorName: { contains: search } },
      { institutionName: { contains: search } },
      { visitCode: { contains: search } },
      { employee: { name: { contains: search } } },
      { studentName: { contains: search } }
    ];
  }

  try {
    const visits = await prisma.visit.findMany({
      where,
      include: {
        visitorType: true,
        department: true,
        employee: true,
        purpose: true,
        contactedBy: { select: { name: true } },
        completedBy: { select: { name: true } }
      },
      orderBy: { visitedAt: 'desc' }
    });
    res.json(visits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat data kunjungan.' });
  }
});

// @route   PATCH /api/visits/:id/contact
// @desc    Mark visit as CONTACTED and generate WhatsApp URL (Security only)
router.patch('/:id/contact', verifyToken, isSecurityOrAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) },
      include: {
        visitorType: true,
        employee: true,
        purpose: true
      }
    });

    if (!visit) {
      return res.status(404).json({ message: 'Data kunjungan tidak ditemukan.' });
    }

    // Update status to CONTACTED if it was NEW
    const updatedVisit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CONTACTED',
        contactedAt: new Date(),
        contactedById: req.user.id
      },
      include: {
        visitorType: true,
        department: true,
        employee: true,
        purpose: true,
        contactedBy: { select: { name: true } }
      }
    });

    // Load WhatsApp message template setting
    let templateSetting = await prisma.setting.findUnique({
      where: { key: 'whatsapp_template' }
    });

    const templateText = templateSetting
      ? templateSetting.value
      : 'Selamat {waktu} Bapak/Ibu {nama_pegawai}.\n\nAda tamu yang ingin menemui Bapak/Ibu.\n\nNama: {nama_tamu}\nInstansi: {instansi}\nJenis Kunjungan: {jenis_kunjungan}\nKeperluan: {keperluan}\n\nTamu saat ini sudah berada di pos security SMK Negeri 1 Cirebon.\n\nTerima kasih.';

    // Compile variables
    const greeting = getGreeting();
    const instansiVal = visit.institutionName || '-';
    const jamVal = formatTime(visit.visitedAt);
    const keperluanFull = visit.purposeDescription
      ? `${visit.purpose.name} (${visit.purposeDescription})`
      : visit.purpose.name;

    const compiledMessage = templateText
      .replace(/{waktu}/g, greeting)
      .replace(/{nama_pegawai}/g, visit.employee.name)
      .replace(/{nama_tamu}/g, visit.visitorName)
      .replace(/{instansi}/g, instansiVal)
      .replace(/{jenis_kunjungan}/g, visit.visitorType.name)
      .replace(/{keperluan}/g, keperluanFull)
      .replace(/{jam_kunjungan}/g, jamVal);

    // Format WA Link: https://wa.me/62...
    const encodedMessage = encodeURIComponent(compiledMessage);
    const waUrl = `https://wa.me/${visit.employee.phone}?text=${encodedMessage}`;

    await logActivity(
      req.user.id,
      'CONTACT_VISITOR',
      `Menghubungi pegawai: ${visit.employee.name} untuk tamu: ${visit.visitorName}`
    );

    res.json({
      visit: updatedVisit,
      waUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui status hubungi.' });
  }
});

// @route   PATCH /api/visits/:id/complete
// @desc    Mark visit as COMPLETED (Security only)
router.patch('/:id/complete', verifyToken, isSecurityOrAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) }
    });

    if (!visit) {
      return res.status(404).json({ message: 'Data kunjungan tidak ditemukan.' });
    }

    const updatedVisit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: req.user.id
      },
      include: {
        visitorType: true,
        department: true,
        employee: true,
        purpose: true,
        contactedBy: { select: { name: true } },
        completedBy: { select: { name: true } }
      }
    });

    await logActivity(
      req.user.id,
      'COMPLETE_VISIT',
      `Menyelesaikan kunjungan tamu: ${visit.visitorName} (Kode: ${visit.visitCode})`
    );

    res.json(updatedVisit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menyelesaikan kunjungan.' });
  }
});

// @route   DELETE /api/visits
// @desc    Delete all visits log history (Admin only)
router.delete('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const deleted = await prisma.visit.deleteMany();
    await logActivity(req.user.id, 'DELETE_ALL_VISITS', `Menghapus seluruh riwayat log kunjungan tamu (${deleted.count} data)`);
    res.json({ message: `Seluruh riwayat log kunjungan (${deleted.count} data) berhasil dikosongkan.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengosongkan riwayat kunjungan.' });
  }
});

// @route   DELETE /api/visits/:id
// @desc    Delete individual visit record (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) }
    });
    if (!visit) {
      return res.status(404).json({ message: 'Kunjungan tidak ditemukan.' });
    }
    await prisma.visit.delete({
      where: { id: parseInt(id) }
    });
    await logActivity(req.user.id, 'DELETE_VISIT', `Menghapus riwayat kunjungan tamu: ${visit.visitorName} (Kode: ${visit.visitCode})`);
    res.json({ message: 'Riwayat kunjungan berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus riwayat kunjungan.' });
  }
});

module.exports = router;
