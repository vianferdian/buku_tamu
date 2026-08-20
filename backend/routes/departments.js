const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');

// @route   GET /api/departments
// @desc    Get all departments (guests or logged-in users)
router.get('/', async (req, res) => {
  const { activeOnly } = req.query;
  const where = {};
  
  if (activeOnly === 'true') {
    where.isActive = true;
  }

  try {
    const departments = await prisma.department.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat data bagian/unit.' });
  }
});

// @route   POST /api/departments
// @desc    Create a new department (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, isActive, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama bagian wajib diisi.' });
  }

  try {
    const department = await prisma.department.create({
      data: {
        name,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      }
    });

    await logActivity(req.user.id, 'CREATE_DEPARTMENT', `Membuat bagian: ${name}`);
    res.status(201).json(department);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat bagian/unit.' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update a department (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, isActive, sortOrder } = req.body;

  try {
    const check = await prisma.department.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Bagian tidak ditemukan.' });
    }

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined
      }
    });

    await logActivity(req.user.id, 'UPDATE_DEPARTMENT', `Mengubah bagian ID: ${id} menjadi ${name}`);
    res.json(department);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah bagian/unit.' });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const check = await prisma.department.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Bagian tidak ditemukan.' });
    }

    await prisma.department.delete({
      where: { id: parseInt(id) }
    });

    await logActivity(req.user.id, 'DELETE_DEPARTMENT', `Menghapus bagian ID: ${id} (${check.name})`);
    res.json({ message: 'Bagian berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus bagian/unit. Mungkin masih terikat dengan data pegawai.' });
  }
});

module.exports = router;
