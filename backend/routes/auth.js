const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, logActivity } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'smkn1cirebon_buku_tamu_secret_key_2026';

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(400).json({ message: 'Username atau password salah.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Akun Anda dinonaktifkan. Hubungi admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(user.id, 'LOGIN', `User ${user.username} berhasil login.`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
