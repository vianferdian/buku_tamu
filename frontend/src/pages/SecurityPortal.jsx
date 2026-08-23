import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logoImg from '../assets/logo.png';
import { 
  LogOut, Shield, Clock, Users, UserPlus, PhoneCall, CheckSquare, 
  Search, Filter, Phone, CheckCircle2, Activity, Calendar, AlertTriangle
} from 'lucide-react';
import { visitApi } from '../utils/api';

export default function SecurityPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  // Real-time clock
  const [now, setNow] = useState(new Date());

  // Statistics
  const [stats, setStats] = useState({
    todayTotal: 0,
    newCount: 0,
    contactedCount: 0,
    completedCount: 0
  });

  // Visit Data
  const [activeVisits, setActiveVisits] = useState([]);
  const [historyVisits, setHistoryVisits] = useState([]);

  // Filters for History
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRange, setFilterRange] = useState('today');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [loading, setLoading] = useState(false);

  // Real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check login
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  // Load Active Queue and Stats
  const loadDashboardData = async () => {
    try {
      const activeRes = await visitApi.getAll({ activeOnly: true });
      setActiveVisits(activeRes.data);

      const todayRes = await visitApi.getAll({ range: 'today' });
      const todayData = todayRes.data;

      setStats({
        todayTotal: todayData.length,
        newCount: todayData.filter(v => v.status === 'NEW').length,
        contactedCount: todayData.filter(v => v.status === 'CONTACTED').length,
        completedCount: todayData.filter(v => v.status === 'COMPLETED').length
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Load History Log
  const loadHistoryData = async () => {
    setLoading(true);
    try {
      const params = {
        range: filterRange,
        search: filterSearch,
        status: filterStatus,
      };
      if (filterRange === 'custom') {
        params.startDate = filterStartDate;
        params.endDate = filterEndDate;
      }
      const res = await visitApi.getAll(params);
      setHistoryVisits(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat riwayat kunjungan.',
        icon: 'error',
        confirmButtonColor: '#0F2744'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'dashboard') {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 10000);
        return () => clearInterval(interval);
      } else {
        loadHistoryData();
      }
    }
  }, [user, activeTab, filterRange, filterStartDate, filterEndDate, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistoryData();
  };

  // Action: Contact WA
  const handleContact = async (visitId) => {
    try {
      const res = await visitApi.contact(visitId);
      const { waUrl } = res.data;
      
      // Open link
      window.open(waUrl, '_blank');

      // Reload
      loadDashboardData();
      
      Swal.fire({
        title: 'WhatsApp Dibuka',
        text: 'Mengalihkan ke WhatsApp. Status kunjungan diubah menjadi DIHUBUNGI.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Gagal menghubungkan ke nomor pegawai.', 'error');
    }
  };

  // Action: Complete Visit
  const handleComplete = (visitId) => {
    Swal.fire({
      title: 'Selesaikan Kunjungan?',
      text: 'Tandai kunjungan tamu ini telah selesai dilayani.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0F2744',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Selesai!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await visitApi.complete(visitId);
          loadDashboardData();
          Swal.fire({
            title: 'Kunjungan Selesai',
            text: 'Kunjungan telah ditandai selesai.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        } catch (err) {
          console.error(err);
          Swal.fire('Gagal', 'Gagal memproses perubahan status.', 'error');
        }
      }
    });
  };

  // Logout
  const handleLogout = () => {
    Swal.fire({
      title: 'Apakah Anda ingin keluar?',
      text: 'Anda akan keluar dari sesi security.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Logout!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    });
  };

  const formatHour = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  const formatDateText = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Elapsed time since visit arrived
  const getElapsed = (visitedAt) => {
    const diffMs = now - new Date(visitedAt);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hrs = Math.floor(mins / 60);
    return `${hrs} jam ${mins % 60} menit lalu`;
  };

  const getElapsedMinutes = (visitedAt) => {
    return Math.floor((now - new Date(visitedAt)) / 60000);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-bgmain flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-bordergray shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          {/* Left: Logo + title */}
          <div className="flex items-center space-x-3">
            <img src={logoImg} alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-extrabold text-navy text-sm leading-none">SMK Negeri 1 Cirebon</h1>
              <span className="text-[9px] text-textsec font-bold tracking-widest block mt-0.5 uppercase">Portal Petugas Keamanan</span>
            </div>
          </div>

          {/* Center: Real-time clock */}
          <div className="hidden md:flex flex-col items-center">
            <span className="text-xl font-extrabold text-navy tabular-nums leading-none">
              {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[9px] text-textsec font-semibold mt-0.5">
              {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Right: User info + logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center text-xs font-extrabold shadow">
                {getInitials(user?.name)}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-navy leading-none">{user?.name}</p>
                <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wide">Security</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition text-[10px] font-bold"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-bordergray gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-navy text-white shadow'
                  : 'text-textsec hover:text-navy hover:bg-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Antrean Aktif</span>
              {activeVisits.length > 0 && (
                <span className={`ml-1 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center ${
                  activeTab === 'dashboard' ? 'bg-white text-navy' : 'bg-navy text-white'
                }`}>
                  {activeVisits.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-navy text-white shadow'
                  : 'text-textsec hover:text-navy hover:bg-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Riwayat Kunjungan</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-textsec text-[10px] font-semibold md:hidden">
            <Clock className="w-3 h-3" />
            <span>{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
          </div>
        </div>

        {/* -------------------- TAB 1: DASHBOARD QUEUE -------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 mt-6 fade-in">
            
            {/* statistics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total */}
              <div className="bg-gradient-to-br from-slate-700 to-navy p-4 rounded-xl flex items-center space-x-3.5 shadow text-white">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-white/60 font-semibold block">Total Hari Ini</span>
                  <strong className="text-2xl font-extrabold">{stats.todayTotal}</strong>
                </div>
              </div>

              {/* Baru */}
              <div className={`bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-xl flex items-center space-x-3.5 shadow text-white ${
                stats.newCount > 0 ? 'pulse-glow' : ''
              }`}>
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-white/70 font-semibold block">Baru Datang</span>
                  <strong className="text-2xl font-extrabold">{stats.newCount}</strong>
                </div>
              </div>

              {/* Dihubungi */}
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-4 rounded-xl flex items-center space-x-3.5 shadow text-white">
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-white/70 font-semibold block">Dihubungi</span>
                  <strong className="text-2xl font-extrabold">{stats.contactedCount}</strong>
                </div>
              </div>

              {/* Selesai */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-xl flex items-center space-x-3.5 shadow text-white">
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-white/70 font-semibold block">Selesai</span>
                  <strong className="text-2xl font-extrabold">{stats.completedCount}</strong>
                </div>
              </div>
            </div>

            {/* Active Queue Cards */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-navy tracking-wider uppercase flex items-center space-x-1.5">
                  <span>Tamu Sedang Menunggu</span>
                  {activeVisits.length > 0 && (
                    <span className="bg-navy text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">{activeVisits.length}</span>
                  )}
                </h3>
                <span className="text-[9px] text-textsec">Auto-refresh setiap 10 detik</span>
              </div>

              {activeVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeVisits.map(visit => {
                    const isNew = visit.status === 'NEW';
                    const elapsedMins = getElapsedMinutes(visit.visitedAt);
                    const isLongWait = elapsedMins >= 10;
                    return (
                      <div 
                        key={visit.id}
                        className={`bg-white rounded-xl border p-5 flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                          isLongWait ? 'border-rose-300 pulse-border shadow-sm' : 'border-bordergray shadow-sm'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="text-[9px] font-bold text-textsec bg-slate-100 px-2 py-0.5 rounded-full">{visit.visitCode}</span>
                              <h4 className="font-extrabold text-navy text-lg mt-1.5 leading-tight truncate">{visit.visitorName}</h4>
                              <p className="text-[10px] text-textsec mt-0.5 font-medium">{visit.institutionName || 'Tidak ada instansi'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider ${
                                isNew ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {isNew ? '● BARU' : '✦ DIHUBUNGI'}
                              </span>
                              {isLongWait && (
                                <span className="flex items-center space-x-0.5 text-rose-500 text-[8px] font-bold">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>Terlama</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Elapsed Timer */}
                          <div className={`flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${
                            isLongWait ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-textsec'
                          }`}>
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>Masuk {formatHour(visit.visitedAt)} — {getElapsed(visit.visitedAt)}</span>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[10px] pt-3 border-t border-slate-100 font-bold text-navy">
                            <div>
                              <span className="text-[9px] text-textsec block font-medium mb-0.5">No WhatsApp</span>
                              <span>{visit.visitorPhone}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-textsec block font-medium mb-0.5">Tujuan Bagian</span>
                              <span>{visit.department.name}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] text-textsec block font-medium mb-0.5">Menemui</span>
                              <span className="truncate block" title={visit.employee.name}>{visit.employee.name}</span>
                            </div>
                          </div>

                          {/* Purpose */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[10px] font-semibold text-navy">
                            <span className="text-[9px] uppercase font-bold text-textsec block mb-0.5">Keperluan ({visit.visitorType.name})</span>
                            <span className="font-bold text-navy">{visit.purpose.name}</span>
                            {visit.purposeDescription && (
                              <span className="text-textsec font-medium block italic mt-0.5 text-[9px]">&quot;{visit.purposeDescription}&quot;</span>
                            )}
                          </div>

                          {/* Student Badge */}
                          {visit.studentName && (
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-[9px] font-semibold text-navy">
                              <span className="text-blue-700 font-extrabold block">🎓 Siswa:</span>
                              <span>{visit.studentName} — Kelas {visit.studentClass}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleContact(visit.id)}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>HUBUNGI via WhatsApp</span>
                          </button>
                          
                          <button
                            onClick={() => handleComplete(visit.id)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xl flex items-center justify-center space-x-2 transition shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>TANDAI SELESAI</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-bordergray">
                  <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <h4 className="text-navy font-bold text-sm">Tidak ada tamu aktif saat ini</h4>
                  <p className="text-textsec text-xs mt-1">Tamu yang mengisi formulir akan muncul otomatis di sini.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* -------------------- TAB 2: HISTORY LIST -------------------- */}
        {activeTab === 'history' && (
          <div className="space-y-5 mt-6 fade-in">
            
            {/* Filter Log Bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-bordergray shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-navy font-bold text-xs flex items-center space-x-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter Riwayat</span>
                </span>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-navy hover:bg-navy-secondary text-white text-[10px] font-bold rounded-lg transition"
                >
                  Terapkan Filter
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-bold">
                
                {/* Search Text */}
                <div className="space-y-1">
                  <label className="text-textsec block">Cari Kata Kunci</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-textsec absolute left-2 top-2" />
                    <input
                      type="text"
                      placeholder="Nama, instansi, pegawai..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-bordergray rounded-lg outline-none focus:border-navy text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Date range selection */}
                <div className="space-y-1">
                  <label className="text-textsec block">Periode</label>
                  <select
                    value={filterRange}
                    onChange={(e) => setFilterRange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-bordergray rounded-lg outline-none focus:border-navy bg-white text-xs font-semibold"
                  >
                    <option value="today">Hari Ini</option>
                    <option value="yesterday">Kemarin</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="custom">Custom Tanggal</option>
                  </select>
                </div>

                {/* Custom Dates */}
                {filterRange === 'custom' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-textsec block">Mulai</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-bordergray rounded-lg outline-none focus:border-navy text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-textsec block">Sampai</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-bordergray rounded-lg outline-none focus:border-navy text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Status Filter */}
                <div className="space-y-1">
                  <label className="text-textsec block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-bordergray rounded-lg outline-none focus:border-navy bg-white text-xs font-semibold"
                  >
                    <option value="">Semua Status</option>
                    <option value="NEW">BARU</option>
                    <option value="CONTACTED">DIHUBUNGI</option>
                    <option value="COMPLETED">SELESAI</option>
                  </select>
                </div>

              </div>
            </form>

            {/* List log */}
            <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase tracking-wider">
                      <th className="p-3">Kode</th>
                      <th className="p-3">Tamu</th>
                      <th className="p-3">Tujuan / Guru</th>
                      <th className="p-3">Masuk</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Dihubungi</th>
                      <th className="p-3">Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyVisits.length > 0 ? (
                      historyVisits.map((visit, index) => (
                        <tr 
                          key={visit.id} 
                          className={`border-b border-bordergray font-semibold hover:bg-slate-50/50 transition ${
                            index % 2 === 1 ? 'bg-slate-50/10' : ''
                          }`}
                        >
                          <td className="p-3 text-textsec font-bold">{visit.visitCode}</td>
                          <td className="p-3">
                            <div className="font-extrabold text-navy">{visit.visitorName}</div>
                            <div className="text-[9px] text-textsec">{visit.institutionName || '-'} • {visit.visitorPhone}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-navy">{visit.employee.name}</div>
                            <div className="text-[9px] text-textsec">{visit.employee.position} ({visit.department.name})</div>
                          </td>
                          <td className="p-3">
                            <div>{formatHour(visit.visitedAt)}</div>
                            <div className="text-[9px] text-textsec mt-0.5">
                              {new Date(visit.visitedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              visit.status === 'NEW'
                                ? 'bg-blue-50 text-blue-600'
                                : visit.status === 'CONTACTED'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {visit.status === 'NEW' ? 'BARU' : visit.status === 'CONTACTED' ? 'DIHUBUNGI' : 'SELESAI'}
                            </span>
                          </td>
                          <td className="p-3 text-textsec">
                            {visit.contactedAt ? (
                              <>
                                <div>{formatHour(visit.contactedAt)}</div>
                                <div className="text-[9px] text-textsec">Oleh: {visit.contactedBy?.name || '-'}</div>
                              </>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-3 text-textsec">
                            {visit.completedAt ? (
                              <>
                                <div>{formatHour(visit.completedAt)}</div>
                                <div className="text-[9px] text-textsec">Oleh: {visit.completedBy?.name || '-'}</div>
                              </>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-textsec font-semibold">
                          Tidak ada data kunjungan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-textsec py-4 bg-white border-t border-bordergray">
        © 2026 SMK Negeri 1 Cirebon — Portal Petugas Keamanan. All rights reserved.
      </footer>
    </div>
  );
}
