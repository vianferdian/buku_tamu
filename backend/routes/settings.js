const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');

// @route   GET /api/settings/:key
// @desc    Get setting by key
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });
    if (!setting) {
      return res.status(404).json({ message: 'Setting tidak ditemukan.' });
    }
    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat setting.' });
  }
});

// @route   PUT /api/settings/:key
// @desc    Create or update setting by key (Admin only)
router.put('/:key', verifyToken, isAdmin, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({ message: 'Nilai setting wajib diisi.' });
  }

  try {
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    await logActivity(req.user.id, 'UPDATE_SETTING', `Mengubah setting: ${key}`);
    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah setting.' });
  }
});

module.exports = router;
