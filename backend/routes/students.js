const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');
const BankDataService = require('../services/bankDataService');

// @route   GET /api/students
// @desc    Get local students with search and className filtering (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  const { search, className, activeOnly } = req.query;
  const where = {};

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  if (className) {
    where.className = className;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { nis: { contains: search } },
      { nisn: { contains: search } },
      { className: { contains: search } }
    ];
  }

  try {
    const students = await prisma.student.findMany({
      where,
      orderBy: [
        { className: 'asc' },
        { fullName: 'asc' }
      ]
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat data siswa.' });
  }
});

// @route   POST /api/students
// @desc    Create a new student manually (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { fullName, nis, nisn, className, major, gender, birthPlace, birthDate, religion, isActive } = req.body;

  if (!fullName || !nis || !className) {
    return res.status(400).json({ message: 'Nama lengkap, NIS, dan Kelas wajib diisi.' });
  }

  try {
    const crypto = require('crypto');
    const uuid = crypto.randomUUID();

    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { nis: nis }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Siswa dengan NIS tersebut sudah terdaftar.' });
    }

    const student = await prisma.student.create({
      data: {
        uuid,
        nis,
        nisn: nisn || null,
        fullName,
        gender: gender || null,
        birthPlace: birthPlace || null,
        birthDate: birthDate || null,
        religion: religion || null,
        className,
        major: major || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    await logActivity(req.user.id, 'CREATE_STUDENT', `Membuat siswa: ${fullName} (${className})`);
    res.status(201).json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat data siswa.' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student details (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { fullName, nis, nisn, className, major, gender, birthPlace, birthDate, religion, isActive } = req.body;

  try {
    const check = await prisma.student.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    }

    if (nis && nis !== check.nis) {
      const existing = await prisma.student.findFirst({
        where: { nis: nis }
      });
      if (existing) {
        return res.status(400).json({ message: 'Siswa dengan NIS tersebut sudah terdaftar.' });
      }
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (nis !== undefined) updateData.nis = nis;
    if (nisn !== undefined) updateData.nisn = nisn || null;
    if (className !== undefined) updateData.className = className;
    if (major !== undefined) updateData.major = major || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace || null;
    if (birthDate !== undefined) updateData.birthDate = birthDate || null;
    if (religion !== undefined) updateData.religion = religion || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    await logActivity(req.user.id, 'UPDATE_STUDENT', `Mengubah siswa: ${student.fullName}`);
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui data siswa.' });
  }
});

// @route   DELETE /api/students
// @desc    Delete all students from database (Admin only)
router.delete('/', verifyToken, isAdmin, async (req, res) => {
  try {
    await prisma.student.deleteMany();
    await logActivity(req.user.id, 'DELETE_ALL_STUDENTS', 'Menghapus seluruh master data siswa');
    res.json({ message: 'Seluruh data siswa berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus data siswa.' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({ where: { id: parseInt(id) } });
    if (!student) {
      return res.status(404).json({ message: 'Siswa tidak ditemukan.' });
    }

    await prisma.student.delete({ where: { id: parseInt(id) } });
    await logActivity(req.user.id, 'DELETE_STUDENT', `Menghapus siswa: ${student.fullName}`);
    res.json({ message: 'Siswa berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus siswa.' });
  }
});

// @route   POST /api/students/sync
// @desc    Sync students from bank-data API page by page (Admin only)
router.post('/sync', verifyToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await BankDataService.fetchStudentsPage(page);
    
    if (!result.success || !result.data || result.data.length === 0) {
      return res.json({
        success: true,
        message: `Tidak ada data siswa di halaman ${page}.`,
        meta: result.meta || { current_page: page, last_page: page },
        data: { created: 0, updated: 0 }
      });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const stud of result.data) {
      const uuid = stud.uuid;
      const nis = stud.nis;
      const nisn = stud.nisn || null;
      const fullName = stud.full_name ? stud.full_name.trim() : '';
      const gender = stud.gender || null;
      const birthPlace = stud.birth_place || null;
      const birthDate = stud.birth_date || null;
      const religion = stud.religion || null;
      const className = stud.class?.name || 'Lainnya';
      const major = stud.class?.major || null;
      const isActive = stud.status === 'Aktif' || stud.status === 'Active' || stud.status === 'active';

      if (!nis || !fullName) {
        continue;
      }

      const existing = await prisma.student.findFirst({
        where: {
          OR: [
            { uuid: uuid },
            { nis: nis }
          ]
        }
      });

      if (existing) {
        await prisma.student.update({
          where: { id: existing.id },
          data: {
            uuid,
            nis,
            nisn,
            fullName,
            gender,
            birthPlace,
            birthDate,
            religion,
            className,
            major,
            isActive
          }
        });
        updatedCount++;
      } else {
        await prisma.student.create({
          data: {
            uuid,
            nis,
            nisn,
            fullName,
            gender,
            birthPlace,
            birthDate,
            religion,
            className,
            major,
            isActive
          }
        });
        createdCount++;
      }
    }

    if (page === 1 || (result.meta && page === result.meta.last_page)) {
      await logActivity(req.user.id, 'SYNC_STUDENTS', `Sinkronisasi siswa dari bank-data API Halaman ${page}/${result.meta?.last_page || '?'}`);
    }

    return res.json({
      success: true,
      message: `Halaman ${page} disinkronkan.`,
      meta: result.meta,
      data: {
        total: result.data.length,
        created: createdCount,
        updated: updatedCount
      }
    });
  } catch (error) {
    console.error('syncStudents page error:', error);
    return res.status(500).json({ message: 'Gagal melakukan sinkronisasi data siswa.' });
  }
});

module.exports = router;
