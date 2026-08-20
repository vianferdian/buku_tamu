const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'smkn1cirebon_buku_tamu_secret_key_2026';

function verifyToken(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak tersedia.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa.' });
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Memerlukan role Admin.' });
  }
}

function isSecurityOrAdmin(req, res, next) {
  if (req.user && (req.user.role === 'SECURITY' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak. Memerlukan role Security atau Admin.' });
  }
}

async function logActivity(userId, action, description, ipAddress = '') {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        description,
        ipAddress
      }
    });
  } catch (err) {
    console.error('Gagal menyimpan log aktivitas:', err);
  }
}

module.exports = {
  verifyToken,
  isAdmin,
  isSecurityOrAdmin,
  logActivity
};
