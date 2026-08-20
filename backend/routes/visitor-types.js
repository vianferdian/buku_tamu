const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');

// @route   GET /api/visitor-types
// @desc    Get all visitor types
router.get('/', async (req, res) => {
  const { activeOnly } = req.query;
  const where = {};

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  try {
    const types = await prisma.visitorType.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat jenis kunjungan.' });
  }
});

// @route   POST /api/visitor-types
// @desc    Create a new visitor type (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, isActive, sortOrder } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Nama jenis kunjungan wajib diisi.' });
  }

  try {
    const type = await prisma.visitorType.create({
      data: {
        name,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      }
    });

    await logActivity(req.user.id, 'CREATE_VISITOR_TYPE', `Membuat jenis kunjungan: ${name}`);
    res.status(201).json(type);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat jenis kunjungan.' });
  }
});

// @route   PUT /api/visitor-types/:id
// @desc    Update a visitor type (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, isActive, sortOrder } = req.body;

  try {
    const check = await prisma.visitorType.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Jenis kunjungan tidak ditemukan.' });
    }

    const type = await prisma.visitorType.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined
      }
    });

    await logActivity(req.user.id, 'UPDATE_VISITOR_TYPE', `Mengubah jenis kunjungan ID: ${id} menjadi ${name}`);
    res.json(type);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah jenis kunjungan.' });
  }
});

// @route   DELETE /api/visitor-types/:id
// @desc    Delete a visitor type (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const check = await prisma.visitorType.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Jenis kunjungan tidak ditemukan.' });
    }

    await prisma.visitorType.delete({
      where: { id: parseInt(id) }
    });

    await logActivity(req.user.id, 'DELETE_VISITOR_TYPE', `Menghapus jenis kunjungan ID: ${id} (${check.name})`);
    res.json({ message: 'Jenis kunjungan berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus jenis kunjungan. Mungkin masih terikat dengan data keperluan atau kunjungan.' });
  }
});

module.exports = router;
