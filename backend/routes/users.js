const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, isAdmin, logActivity } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Remove passwords before sending
    const safeUsers = users.map(user => {
      const { password, ...safe } = user;
      return safe;
    });
    res.json(safeUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat data pengguna.' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { username, password, name, role, isActive } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ message: 'Username, password, nama, dan role wajib diisi.' });
  }

  try {
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return res.status(400).json({ message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    const { password: _, ...safeUser } = user;
    await logActivity(req.user.id, 'CREATE_USER', `Membuat pengguna baru: ${username} (${role})`);
    res.status(201).json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat pengguna.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user details (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, password, name, role, isActive } = req.body;

  try {
    const check = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    const updateData = {};
    if (username !== undefined) {
      // Check duplicate
      const exists = await prisma.user.findUnique({ where: { username } });
      if (exists && exists.id !== parseInt(id)) {
        return res.status(400).json({ message: 'Username sudah digunakan.' });
      }
      updateData.username = username;
    }
    
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    const { password: _, ...safeUser } = user;
    await logActivity(req.user.id, 'UPDATE_USER', `Mengubah data pengguna ID: ${id} (${username})`);
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah data pengguna.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const check = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!check) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    if (check.id === req.user.id) {
      return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    await logActivity(req.user.id, 'DELETE_USER', `Menghapus pengguna ID: ${id} (${check.username})`);
    res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus pengguna.' });
  }
});

module.exports = router;
