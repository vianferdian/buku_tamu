import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logoImg from '../assets/logo.png';
import bgImg from '../assets/DJI_0085.webp';
import { 
  ArrowLeft, Search, User, Phone, Package, Utensils, 
  Send, CheckCircle2, Shield, Building2, ChevronRight, MessageSquare
} from 'lucide-react';
import { employeeApi, deptApi, visitorTypeApi, purposeApi, visitApi } from '../utils/api';

export default function DeliveryForm() {
  const navigate = useNavigate();

  // Master Data
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [visitorTypes, setVisitorTypes] = useState([]);

  // Form State
  const [deliveryType, setDeliveryType] = useState('Paket / Barang'); // 'Paket / Barang' or 'Pesanan Makanan / Minuman'
  const [courierService, setCourierService] = useState('GoFood');
  const [customCourier, setCustomCourier] = useState('');
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [packageNotes, setPackageNotes] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Search UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(false);

  // Submission Result State (for WA direct link modal / card)
  const [submittedVisit, setSubmittedVisit] = useState(null);
  const [waUrl, setWaUrl] = useState('');

  // Fetch Master Data on Mount
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const [empRes, depRes, vtRes] = await Promise.all([
          employeeApi.getAll({ activeOnly: true }),
          deptApi.getAll(true),
          visitorTypeApi.getAll(true)
        ]);
        setEmployees(empRes.data || []);
        setDepartments(depRes.data || []);
        setVisitorTypes(vtRes.data || []);
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    };
    loadMaster();
  }, []);

  // Quick preset courier service list
  const courierPresets = [
    'GoFood', 'GrabFood', 'ShopeeFood', 
    'Gojek Express', 'GrabExpress', 'Maxim',
    'J&T Express', 'JNE', 'SiCepat', 'Pos Indonesia', 'Lainnya'
  ];

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    const matchDept = selectedDeptId ? emp.departmentId === parseInt(selectedDeptId) : true;
    if (!searchQuery.trim()) return matchDept;
    const q = searchQuery.toLowerCase();
    const matchName = emp.name.toLowerCase().includes(q);
    const matchPos = emp.position.toLowerCase().includes(q);
    const matchDeptName = emp.department?.name?.toLowerCase().includes(q);
    return matchDept && (matchName || matchPos || matchDeptName);
  });

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 11) return 'Pagi';
    if (hr >= 11 && hr < 15) return 'Siang';
    if (hr >= 15 && hr < 18) return 'Sore';
    return 'Malam';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      Swal.fire({
        title: 'Pilih Guru / Staf',
        text: 'Silakan pilih guru atau staf yang dituju terlebih dahulu.',
        icon: 'warning',
        confirmButtonColor: '#0F2744'
      });
      return;
    }

    if (!courierName.trim()) {
      Swal.fire({
        title: 'Nama Pengirim Wajib Diisi',
        text: 'Silakan isi Nama Pengirim / Kurir terlebih dahulu.',
        icon: 'warning',
        confirmButtonColor: '#0F2744'
      });
      return;
    }

    if (!packageNotes.trim()) {
      Swal.fire({
        title: 'Catatan Paket Wajib Diisi',
        text: 'Silakan isi Catatan Paket / Isi Pesanan terlebih dahulu.',
        icon: 'warning',
        confirmButtonColor: '#0F2744'
      });
      return;
    }

    const activeCourierService = courierService === 'Lainnya' ? customCourier : courierService;
    const finalCourierName = courierName.trim();
    const finalNotes = packageNotes.trim();

    // Find or fallback visitor type & purpose ID
    let vt = visitorTypes.find(t => 
      t.name.toLowerCase().includes('paket') || 
      t.name.toLowerCase().includes('vendor') || 
      t.name.toLowerCase().includes('umum')
    ) || visitorTypes[0];

    const visitorTypeId = vt ? vt.id : 1;

    setLoading(true);
    try {
      // First fetch purpose for this visitorTypeId
      const purpRes = await purposeApi.getAll({ visitorTypeId, activeOnly: true });
      const purposeList = purpRes.data || [];
      const purposeId = purposeList.length > 0 ? purposeList[0].id : 1;

      const fullPurposeDesc = `[${deliveryType.toUpperCase()}] Pengirim: ${finalCourierName} (${activeCourierService}). Catatan: ${finalNotes}`;

      const payload = {
        visitorName: `${finalCourierName} (${activeCourierService})`,
        visitorPhone: courierPhone.replace(/[^0-9]/g, '') || '080000000000',
        visitorTypeId: visitorTypeId,
        institutionName: activeCourierService,
        visitorAddress: 'Pos Satpam SMKN 1 Cirebon',
        destinationId: selectedEmployee.departmentId,
        employeeId: selectedEmployee.id,
        purposeId: purposeId,
        purposeDescription: fullPurposeDesc,
        guestCount: 1
      };

      const res = await visitApi.submit(payload);
      const createdVisit = res.data;

      // Construct direct WA message link with clear Sender Name (using clean bullets to avoid URL encoding issues)
      const greeting = getGreeting();
      const cleanPhone = selectedEmployee.phone.replace(/[^0-9]/g, '');
      
      const messageText = `Selamat ${greeting} Bapak/Ibu ${selectedEmployee.name}.\n\n` +
        `Ada *${deliveryType}* atas nama Bapak/Ibu yang telah disimpan di *Pos Satpam SMK Negeri 1 Cirebon*.\n\n` +
        `- *Nama Pengirim / Kurir:* ${finalCourierName}\n` +
        `- *Layanan / Ekspedisi:* ${activeCourierService}\n` +
        `- *Isi Pesanan / Catatan:* ${finalNotes}\n` +
        `- *Lokasi:* Pos Satpam (Sudah bisa diambil di Pos Satpam)\n\n` +
        `Terima kasih!`;

      const generatedWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

      setSubmittedVisit(createdVisit);
      setWaUrl(generatedWaUrl);

      // DIRECTLY OPEN WHATSAPP LINK IMMEDIATELY!
      window.open(generatedWaUrl, '_blank');

    } catch (err) {
      console.error('Error submitting delivery:', err);
      Swal.fire({
        title: 'Gagal Mengirim',
        text: err.response?.data?.message || 'Terjadi gangguan saat menyimpan data. Coba beberapa saat lagi.',
        icon: 'error',
        confirmButtonColor: '#0F2744'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWA = () => {
    if (waUrl) {
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div 
      className="min-h-screen text-white flex flex-col justify-between py-6 px-4 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(11, 31, 58, 0.85), rgba(11, 31, 58, 0.94)), url(${bgImg})` }}
    >
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center space-x-2">
          <img src={logoImg} alt="Logo" className="w-6 h-6 object-contain bg-white/10 p-0.5 rounded" />
          <span className="text-xs font-bold text-white tracking-wider">SMK NEGERI 1 CIREBON</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold text-slate-300 hover:text-white transition flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col justify-center my-4">
        {!submittedVisit ? (
          /* Delivery Form Card */
          <div className="bg-[#0B1F3A]/90 backdrop-blur-md px-6 py-8 sm:p-10 rounded-2xl shadow-2xl border border-white/10 text-white space-y-6 fade-in">
            
            <div className="space-y-1 border-b border-white/10 pb-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                <Package className="w-3.5 h-3.5" />
                <span>Pengantaran Paket & Pesanan Makanan Online</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
                Layanan Antar Paket / Makanan
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm">
                Pilih guru yang dituju & kirim pemberitahuan otomatis ke WhatsApp guru bahwa paket ada di pos satpam.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* STEP 1: PILIH GURU YANG DITUJU */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-sky-300 flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>1. Pilih Guru / Staf Penerima Paket *</span>
                  </span>
                  {selectedEmployee && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Terpilih</span>
                    </span>
                  )}
                </label>

                {/* Filter and Search Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Cari nama guru atau jabatan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs sm:text-sm text-white placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-white/15 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-white"
                    >
                      <option value="">Semua Bagian / Jurusan</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employee Selection List */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar pt-1">
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-6 bg-white/5 rounded-xl text-slate-400 text-xs">
                      Tidak ada guru/staf yang cocok dengan pencarian.
                    </div>
                  ) : (
                    filteredEmployees.map(emp => {
                      const isSelected = selectedEmployee?.id === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold shadow-md'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold">{emp.name}</div>
                            <div className="text-xs text-slate-400 font-medium">
                              {emp.position} {emp.department?.name ? `• ${emp.department.name}` : ''}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-500'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedEmployee && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                    <div>
                      Penerima: <span className="font-bold text-white">{selectedEmployee.name}</span> ({selectedEmployee.position})
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(null)}
                      className="text-slate-400 hover:text-white underline text-[11px]"
                    >
                      Ubah Guru
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: JENIS KIRIMAN & LAYANAN */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="text-sm font-bold text-sky-300 flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>2. Detail Paket / Pesanan Makanan *</span>
                </label>

                {/* Switch Category */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('Paket / Barang')}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition ${
                      deliveryType === 'Paket / Barang'
                        ? 'bg-sky-500 border-sky-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>📦 Paket / Barang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('Pesanan Makanan / Minuman')}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition ${
                      deliveryType === 'Pesanan Makanan / Minuman'
                        ? 'bg-amber-500 border-amber-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>🍱 Makanan / Minuman</span>
                  </button>
                </div>

                {/* Preset Layanan */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs text-slate-300 font-semibold">Pilih Layanan / Ekspedisi:</span>
                  <div className="flex flex-wrap gap-2">
                    {courierPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCourierService(preset)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                          courierService === preset
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {courierService === 'Lainnya' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Masukkan nama ekspedisi / pengirim..."
                      value={customCourier}
                      onChange={(e) => setCustomCourier(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white/5 border border-white/15 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-white"
                      required
                    />
                  </div>
                )}

                {/* Additional Info Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold flex items-center space-x-1">
                      <span>Nama Pengirim / Kurir *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pak Budi (Gojek) / PT ABC"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder-slate-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold flex items-center space-x-1">
                      <span>Catatan Paket / Isi Pesanan *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nasi Goreng 2 Bungkus / Kardus Cokelat"
                      value={packageNotes}
                      onChange={(e) => setPackageNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder-slate-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={loading || !selectedEmployee}
                  className={`w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center space-x-2 transition shadow-xl ${
                    loading || !selectedEmployee
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-white/5'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/30 shadow-emerald-500/25 active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <span>Menyimpan & Menyiapkan Pesan...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Simpan & Langsung Kirim ke WA Guru</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* SUCCESS MODAL / CARD WITH DIRECT WHATSAPP NOTIFICATION */
          <div className="bg-[#0B1F3A]/95 backdrop-blur-md px-6 py-8 sm:p-10 rounded-2xl shadow-2xl border border-emerald-500/30 text-white space-y-6 text-center fade-in">
            
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Paket / Pesanan Berhasil Dicatat & Terkirim!
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
                Data kiriman untuk <span className="font-bold text-white">{selectedEmployee?.name}</span> telah disimpan di Pos Satpam dan tab WhatsApp telah dibuka.
              </p>
            </div>

            {/* Message Preview Box */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2 text-xs text-slate-200">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Pesan WhatsApp yang Dikirim ke Guru:</span>
              </div>
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 font-mono text-xs whitespace-pre-line text-slate-300 leading-relaxed">
                {`Selamat ${getGreeting()} Bapak/Ibu ${selectedEmployee?.name}.\n\n` +
                 `Ada *${deliveryType}* atas nama Bapak/Ibu yang telah disimpan di *Pos Satpam SMK Negeri 1 Cirebon*.\n\n` +
                 `- *Nama Pengirim / Kurir:* ${courierName}\n` +
                 `- *Layanan / Ekspedisi:* ${courierService === 'Lainnya' ? customCourier : courierService}\n` +
                 `- *Isi Pesanan / Catatan:* ${packageNotes}\n` +
                 `- *Lokasi:* Pos Satpam (Sudah bisa diambil di Pos Satpam)\n\n` +
                 `Terima kasih!`}
              </div>
            </div>

            {/* WhatsApp Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleOpenWA}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-xl shadow-emerald-500/30 transition flex items-center justify-center space-x-2 text-base sm:text-lg transform hover:-translate-y-0.5"
              >
                <MessageSquare className="w-6 h-6" />
                <span>Kirim Pesan WhatsApp Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Kembali ke Halaman Beranda
              </button>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto px-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
        <Shield className="w-4 h-4 text-sky-400" />
        <span>Sistem Informasi Pos Security SMK Negeri 1 Cirebon</span>
      </footer>
    </div>
  );
}
