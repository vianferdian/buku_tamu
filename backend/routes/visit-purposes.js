const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');

// @route   GET /api/visit-purposes
// @desc    Get all visit purposes, optionally filtered by visitorTypeId
router.get('/', async (req, res) => {
  const { visitorTypeId, activeOnly } = req.query;
  const where = {};

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  if (visitorTypeId) {
    where.visitorTypeId = parseInt(visitorTypeId);
  }

  try {
    const purposes = await prisma.visitPurpose.findMany({
      where,
      include: {
        visitorType: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(purposes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat data keperluan.' });
  }
});

// @route   POST /api/visit-purposes
// @desc    Create a new visit purpose (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { visitorTypeId, name, isActive, sortOrder } = req.body;

  if (!visitorTypeId || !name) {
    return res.status(400).json({ message: 'Kategori kunjungan dan Nama keperluan wajib diisi.' });
  }

  try {
    const purpose = await prisma.visitPurpose.create({
      data: {
        visitorTypeId: parseInt(visitorTypeId),
        name,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0
      },
      include: {
        visitorType: true
      }
    });

    await logActivity(req.user.id, 'CREATE_PURPOSE', `Membuat keperluan: ${name}`);
    res.status(201).json(purpose);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat data keperluan.' });
  }
});

// @route   PUT /api/visit-purposes/:id
// @desc    Update a visit purpose (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { visitorTypeId, name, isActive, sortOrder } = req.body;

  try {
    const check = await prisma.visitPurpose.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Keperluan tidak ditemukan.' });
    }

    const updateData = {};
    if (visitorTypeId !== undefined) updateData.visitorTypeId = parseInt(visitorTypeId);
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);

    const purpose = await prisma.visitPurpose.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        visitorType: true
      }
    });

    await logActivity(req.user.id, 'UPDATE_PURPOSE', `Mengubah data keperluan ID: ${id} (${purpose.name})`);
    res.json(purpose);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah data keperluan.' });
  }
});

// @route   DELETE /api/visit-purposes/:id
// @desc    Delete a visit purpose (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const check = await prisma.visitPurpose.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Keperluan tidak ditemukan.' });
    }

    await prisma.visitPurpose.delete({
      where: { id: parseInt(id) }
    });

    await logActivity(req.user.id, 'DELETE_PURPOSE', `Menghapus keperluan ID: ${id} (${check.name})`);
    res.json({ message: 'Keperluan berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus keperluan. Mungkin masih terikat dengan data kunjungan.' });
  }
});

module.exports = router;
