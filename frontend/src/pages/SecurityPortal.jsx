import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logoImg from '../assets/logo.png';
import { 
  LogOut, Shield, Clock, Users, UserPlus, PhoneCall, CheckSquare, 
  Search, Filter, Phone, CheckCircle2
} from 'lucide-react';
import { visitApi } from '../utils/api';

export default function SecurityPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

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

  return (
    <div className="min-h-screen bg-bgmain flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-bordergray shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={logoImg} alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-extrabold text-navy text-sm leading-none sm:text-base">SMK Negeri 1 Cirebon</h1>
              <span className="text-[10px] text-textsec font-semibold tracking-wider block mt-0.5">BUKU TAMU SECURITY</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-navy">{user?.name}</p>
              <span className="text-[9px] font-bold text-textsec uppercase bg-slate-100 px-2 py-0.5 rounded-full">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-bordergray gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-textsec hover:text-navy'
              }`}
            >
              Antrean Aktif
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-textsec hover:text-navy'
              }`}
            >
              Riwayat Kunjungan
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-textsec text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDateText(new Date())}</span>
          </div>
        </div>

        {/* -------------------- TAB 1: DASHBOARD QUEUE -------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 mt-6">
            
            {/* statistics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-bordergray flex items-center space-x-3.5 shadow-sm">
                <div className="p-2.5 bg-slate-50 text-navy rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-textsec font-semibold block">Total Hari Ini</span>
                  <strong className="text-xl font-extrabold text-navy">{stats.todayTotal}</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-bordergray flex items-center space-x-3.5 shadow-sm">
                <div className="p-2.5 bg-blue-50/50 text-blue-600 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-textsec font-semibold block">Baru Datang</span>
                  <strong className="text-xl font-extrabold text-blue-600">{stats.newCount}</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-bordergray flex items-center space-x-3.5 shadow-sm">
                <div className="p-2.5 bg-amber-50/50 text-amber-600 rounded-lg">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-textsec font-semibold block">Dihubungi</span>
                  <strong className="text-xl font-extrabold text-amber-600">{stats.contactedCount}</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-bordergray flex items-center space-x-3.5 shadow-sm">
                <div className="p-2.5 bg-emerald-50/50 text-emerald-600 rounded-lg">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-textsec font-semibold block">Selesai</span>
                  <strong className="text-xl font-extrabold text-emerald-600">{stats.completedCount}</strong>
                </div>
              </div>
            </div>

            {/* Active Queue Cards - Minimalist clean lists */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold text-navy tracking-wider uppercase">Tamu Sedang Menunggu</h3>

              {activeVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeVisits.map(visit => {
                    const isNew = visit.status === 'NEW';
                    return (
                      <div 
                        key={visit.id}
                        className="bg-white rounded-xl shadow-sm border border-bordergray p-5 flex flex-col justify-between space-y-4 hover:shadow transition"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-bold text-textsec bg-slate-100 px-2 py-0.5 rounded-full">{visit.visitCode}</span>
                              <h4 className="font-extrabold text-navy text-base mt-1.5 leading-tight">{visit.visitorName}</h4>
                              <p className="text-[10px] text-textsec mt-0.5 font-medium">{visit.institutionName || '-'}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider ${
                              isNew ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {isNew ? 'BARU' : 'DIHUBUNGI'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px] pt-3 border-t border-slate-100 font-bold text-navy">
                            <div>
                              <span className="text-[9px] text-textsec block font-medium">Jam Masuk</span>
                              <span>{formatHour(visit.visitedAt)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-textsec block font-medium">No WhatsApp</span>
                              <span>{visit.visitorPhone}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-textsec block font-medium">Tujuan</span>
                              <span>{visit.department.name}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-textsec block font-medium">Menemui</span>
                              <span className="truncate block" title={visit.employee.name}>{visit.employee.name}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 text-[10px] font-semibold text-navy">
                            <span className="text-[9px] uppercase font-bold text-textsec block">Keperluan ({visit.visitorType.name})</span>
                            <span className="font-bold">{visit.purpose.name}</span>
                            {visit.purposeDescription && (
                              <span className="text-textsec font-medium block italic mt-0.5">"{visit.purposeDescription}"</span>
                            )}
                          </div>

                          {visit.studentName && (
                            <div className="bg-blue-50/30 p-2 rounded-lg border border-blue-100 text-[9px] font-semibold text-navy">
                              <span className="text-blue-800 font-bold block">Siswa:</span>
                              <span>{visit.studentName} (Kelas {visit.studentClass})</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleContact(visit.id)}
                            className="w-full py-2 bg-navy hover:bg-navy-secondary text-white text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1 transition"
                          >
                            <Phone className="w-3 h-3" />
                            <span>HUBUNGI WHATSAPP</span>
                          </button>
                          
                          <button
                            onClick={() => handleComplete(visit.id)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center justify-center space-x-1 transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>KUNJUNGAN SELESAI</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-bordergray">
                  <h4 className="text-navy font-bold text-sm">Tidak ada tamu aktif saat ini</h4>
                  <p className="text-textsec text-xs mt-0.5">Tamu yang mengisi formulir akan muncul otomatis di sini.</p>
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
                <span className="text-navy font-bold text-xs flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Saring Hasil</span>
                </span>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-navy hover:bg-navy-secondary text-white text-[10px] font-bold rounded-md transition"
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
        © 2026 SMK Negeri 1 Cirebon. All rights reserved.
      </footer>
    </div>
  );
}
