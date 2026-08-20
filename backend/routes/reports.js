const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const { verifyToken, isAdmin } = require('../middleware/auth');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard metrics and statistics (Admin only)
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
  try {
    const now = new Date();

    // Start dates
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Queries for Counts
    const todayCount = await prisma.visit.count({ where: { visitedAt: { gte: startOfToday } } });
    const weekCount = await prisma.visit.count({ where: { visitedAt: { gte: startOfWeek } } });
    const monthCount = await prisma.visit.count({ where: { visitedAt: { gte: startOfMonth } } });
    const yearCount = await prisma.visit.count({ where: { visitedAt: { gte: startOfYear } } });

    // 1. Visit by Kategori Tamu (Visitor Type)
    const byVisitorType = await prisma.visit.groupBy({
      by: ['visitorTypeId'],
      _count: { id: true }
    });

    const visitorTypes = await prisma.visitorType.findMany();
    const visitorTypeStats = visitorTypes.map(vt => {
      const match = byVisitorType.find(b => b.visitorTypeId === vt.id);
      return {
        name: vt.name,
        count: match ? match._count.id : 0
      };
    }).sort((a, b) => b.count - a.count);

    // 2. Visit by Department (Tujuan)
    const byDept = await prisma.visit.groupBy({
      by: ['destinationId'],
      _count: { id: true }
    });

    const departments = await prisma.department.findMany();
    const deptStats = departments.map(d => {
      const match = byDept.find(b => b.destinationId === d.id);
      return {
        name: d.name,
        count: match ? match._count.id : 0
      };
    }).sort((a, b) => b.count - a.count);

    // 3. Top Employees (Pegawai Paling Sering Dikunjungi)
    const topEmployeesGroup = await prisma.visit.groupBy({
      by: ['employeeId'],
      _count: { id: true },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const employeeIds = topEmployeesGroup.map(g => g.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } }
    });

    const employeeStats = topEmployeesGroup.map(g => {
      const emp = employees.find(e => e.id === g.employeeId);
      return {
        name: emp ? emp.name : 'Tidak Diketahui',
        position: emp ? emp.position : '-',
        count: g._count.id
      };
    }).sort((a, b) => b.count - a.count);

    // 4. Peak Hours (Jam Kunjungan Paling Ramai)
    // We fetch all visits and parse hours in JS to make it database provider agnostic
    const allVisits = await prisma.visit.findMany({
      select: { visitedAt: true }
    });

    const hoursMap = {};
    for (let i = 0; i < 24; i++) hoursMap[`${String(i).padStart(2, '0')}:00`] = 0;
    
    allVisits.forEach(v => {
      const hour = new Date(v.visitedAt).getHours();
      const key = `${String(hour).padStart(2, '0')}:00`;
      hoursMap[key]++;
    });

    const hourStats = Object.keys(hoursMap).map(key => ({
      hour: key,
      count: hoursMap[key]
    }));

    // 5. Peak Days (Hari Kunjungan Paling Ramai)
    const daysMap = { 'Minggu': 0, 'Senin': 0, 'Selasa': 0, 'Rabu': 0, 'Kamis': 0, 'Jumat': 0, 'Sabtu': 0 };
    const dayKeys = Object.keys(daysMap);

    allVisits.forEach(v => {
      const dayIndex = new Date(v.visitedAt).getDay();
      const key = dayKeys[dayIndex];
      daysMap[key]++;
    });

    const dayStats = dayKeys.map(key => ({
      day: key,
      count: daysMap[key]
    }));

    res.json({
      summary: {
        today: todayCount,
        week: weekCount,
        month: monthCount,
        year: yearCount
      },
      charts: {
        visitorTypes: visitorTypeStats,
        departments: deptStats,
        employees: employeeStats,
        hours: hourStats,
        days: dayStats
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memuat statistik laporan.' });
  }
});

// @route   GET /api/reports/export-excel
// @desc    Export visit log to Excel (Admin only)
router.get('/export-excel', verifyToken, isAdmin, async (req, res) => {
  const { startDate, endDate, status, visitorTypeId, destinationId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (visitorTypeId) where.visitorTypeId = parseInt(visitorTypeId);
  if (destinationId) where.destinationId = parseInt(destinationId);

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.visitedAt = { gte: start, lte: end };
  }

  try {
    const visits = await prisma.visit.findMany({
      where,
      include: {
        visitorType: true,
        department: true,
        employee: true,
        purpose: true,
        contactedBy: true,
        completedBy: true
      },
      orderBy: { visitedAt: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Buku Tamu');

    worksheet.columns = [
      { header: 'No', key: 'index', width: 5 },
      { header: 'Kode Kunjungan', key: 'visitCode', width: 20 },
      { header: 'Waktu Masuk', key: 'visitedAt', width: 22 },
      { header: 'Nama Tamu', key: 'visitorName', width: 25 },
      { header: 'WhatsApp Tamu', key: 'visitorPhone', width: 18 },
      { header: 'Kategori', key: 'visitorType', width: 22 },
      { header: 'Instansi/Perusahaan', key: 'institution', width: 25 },
      { header: 'Alamat', key: 'address', width: 30 },
      { header: 'Nama Siswa (Ortu)', key: 'studentName', width: 25 },
      { header: 'Kelas Siswa (Ortu)', key: 'studentClass', width: 15 },
      { header: 'Tujuan (Bagian)', key: 'destination', width: 20 },
      { header: 'Pegawai yang Dituju', key: 'employee', width: 25 },
      { header: 'Keperluan', key: 'purpose', width: 25 },
      { header: 'Keterangan', key: 'purposeDesc', width: 30 },
      { header: 'Jumlah Tamu', key: 'guestCount', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Dihubungi Pada', key: 'contactedAt', width: 22 },
      { header: 'Dihubungi Oleh', key: 'contactedBy', width: 20 },
      { header: 'Selesai Pada', key: 'completedAt', width: 22 },
      { header: 'Selesai Oleh', key: 'completedBy', width: 20 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F2744' } // Navy Theme color
    };

    // Format dates helper
    const formatDate = (date) => {
      if (!date) return '-';
      const d = new Date(date);
      return d.toLocaleString('id-ID', { timeZone: 'UTC' }) + ' WIB';
    };

    visits.forEach((v, index) => {
      worksheet.addRow({
        index: index + 1,
        visitCode: v.visitCode,
        visitedAt: formatDate(v.visitedAt),
        visitorName: v.visitorName,
        visitorPhone: v.visitorPhone,
        visitorType: v.visitorType.name,
        institution: v.institutionName || '-',
        address: v.visitorAddress || '-',
        studentName: v.studentName || '-',
        studentClass: v.studentClass || '-',
        destination: v.department.name,
        employee: v.employee.name,
        purpose: v.purpose.name,
        purposeDesc: v.purposeDescription || '-',
        guestCount: v.guestCount,
        status: v.status === 'NEW' ? 'BARU' : v.status === 'CONTACTED' ? 'DIHUBUNGI' : 'SELESAI',
        contactedAt: formatDate(v.contactedAt),
        contactedBy: v.contactedBy ? v.contactedBy.name : '-',
        completedAt: formatDate(v.completedAt),
        completedBy: v.completedBy ? v.completedBy.name : '-'
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `Buku_Tamu_Report_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengekspor file Excel.' });
  }
});

module.exports = router;
