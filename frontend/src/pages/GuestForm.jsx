import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import logoImg from '../assets/logo.png';
import { 
  ArrowLeft, ArrowRight, User, Phone, MapPin, 
  Building2, School, Search, Briefcase, ChevronRight, Check,
  Users, Package, Camera, Globe
} from 'lucide-react';
import { visitorTypeApi, deptApi, employeeApi, purposeApi, visitApi } from '../utils/api';

const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('orang tua') || n.includes('wali')) return <Users className="w-5 h-5" />;
  if (n.includes('dunia kerja') || n.includes('industri') || n.includes('kerja sama')) return <Briefcase className="w-5 h-5" />;
  if (n.includes('vendor') || n.includes('pengiriman')) return <Package className="w-5 h-5" />;
  if (n.includes('media') || n.includes('liputan')) return <Camera className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
};

export default function GuestForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Master data
  const [visitorTypes, setVisitorTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [purposes, setPurposes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    visitorTypeId: '',
    visitorName: '',
    visitorPhone: '',
    institutionName: '',
    visitorAddress: '',
    studentName: '',
    studentClass: '',
    destinationId: '',
    employeeId: '',
    purposeId: '',
    purposeDescription: '',
    guestCount: 1
  });

  // UI Helpers
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch Master Data on Mount
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const [vtRes, depRes, empRes] = await Promise.all([
          visitorTypeApi.getAll(true),
          deptApi.getAll(true),
          employeeApi.getAll({ activeOnly: true })
        ]);
        setVisitorTypes(vtRes.data);
        setDepartments(depRes.data);
        setEmployees(empRes.data);
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: 'Gagal memuat data master. Coba segarkan halaman.',
          icon: 'error',
          confirmButtonColor: '#0F2744'
        });
      }
    };
    loadMaster();
  }, []);

  // Fetch Purposes when Visitor Type changes
  useEffect(() => {
    if (formData.visitorTypeId) {
      purposeApi.getAll({ visitorTypeId: formData.visitorTypeId, activeOnly: true })
        .then(res => setPurposes(res.data))
        .catch(err => console.error(err));
      
      // Reset purpose selection on type change
      setFormData(prev => ({ ...prev, purposeId: '', purposeDescription: '' }));
    }
  }, [formData.visitorTypeId]);

  const totalSteps = 5;

  // Validation per step
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!formData.visitorTypeId;
      case 2:
        const selectedType = visitorTypes.find(t => t.id === parseInt(formData.visitorTypeId));
        const isParent = selectedType?.name.toLowerCase().includes('orang tua') || selectedType?.name.toLowerCase().includes('wali');
        if (!formData.visitorName || !formData.visitorPhone) return false;
        if (!/^\d+$/.test(formData.visitorPhone)) return false;
        if (isParent) {
          if (!formData.studentName || !formData.studentClass) return false;
        } else {
          if (!formData.institutionName) return false;
        }
        return true;
      case 3:
        return !!formData.destinationId && !!formData.employeeId;
      case 4:
        return !!formData.purposeId;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1);
    } else {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Mohon lengkapi seluruh kolom wajib (*) sebelum melanjutkan.',
        icon: 'warning',
        confirmButtonColor: '#0F2744'
      });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await visitApi.submit(formData);
      
      await Swal.fire({
        title: 'Berhasil Terkirim!',
        text: 'Buku tamu Anda telah berhasil disimpan. Silakan menemui petugas keamanan.',
        icon: 'success',
        timer: 3500,
        timerProgressBar: true,
        showConfirmButton: true,
        confirmButtonText: 'Kembali ke Beranda',
        confirmButtonColor: '#0F2744'
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Gagal Mengirim',
        text: 'Terjadi gangguan saat menyimpan data. Coba beberapa saat lagi.',
        icon: 'error',
        confirmButtonColor: '#0F2744'
      });
    } finally {
      setLoading(false);
    }
  };



  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    const matchDept = formData.destinationId ? emp.departmentId === parseInt(formData.destinationId) : true;
    if (!searchEmployee.trim()) {
      return false;
    }
    const matchText =
      emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      (emp.expertise && emp.expertise.toLowerCase().includes(searchEmployee.toLowerCase()));
    return matchDept && matchText;
  });

  const getSelectedTypeName = () => {
    return visitorTypes.find(t => t.id === parseInt(formData.visitorTypeId))?.name || '';
  };

  const getSelectedDeptName = () => {
    return departments.find(d => d.id === parseInt(formData.destinationId))?.name || '';
  };

  const getSelectedPurposeName = () => {
    return purposes.find(p => p.id === parseInt(formData.purposeId))?.name || '';
  };

  const isParent = getSelectedTypeName().toLowerCase().includes('orang tua') || getSelectedTypeName().toLowerCase().includes('wali');



  return (
    <div className="min-h-screen bg-bgmain flex flex-col justify-between py-6 px-4">
      {/* Mini clean header */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center space-x-2">
          <img src={logoImg} alt="Logo" className="w-6 h-6 object-contain" />
          <span className="text-xs font-bold text-navy tracking-wider">SMK NEGERI 1 CIREBON</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold text-textsec hover:text-navy transition flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Batal</span>
        </button>
      </header>

      {/* Main Container - Centered and clean like a survey form */}
      <main className="flex-1 w-full max-w-xl mx-auto flex flex-col justify-center my-4">
        {/* Progress Bar (survey style) */}
        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mb-6">
          <div 
            className="bg-navy h-1 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Form Card */}
        <div className="bg-white px-6 py-8 sm:p-10 rounded-2xl shadow-sm border border-bordergray flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="text-xs font-bold text-textsec uppercase tracking-widest mb-2">Langkah {currentStep} dari {totalSteps}</div>

            {/* STEP 1: KATEGORI KUNJUNGAN */}
            {currentStep === 1 && (
              <div className="space-y-6 fade-in">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-navy tracking-tight">Kategori Kunjungan Anda</h3>
                  <p className="text-textsec text-xs">Pilih salah satu kategori tamu berikut untuk menyesuaikan isian data.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {visitorTypes.map(vt => (
                    <button
                      key={vt.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visitorTypeId: vt.id }))}
                      className={`p-4 rounded-xl border text-left flex items-center space-x-3.5 transition duration-150 ${
                        formData.visitorTypeId === vt.id
                          ? 'border-navy bg-navy/5 text-navy font-bold shadow-sm'
                          : 'border-slate-200 hover:border-navy/30 hover:bg-slate-50 text-textsec font-semibold'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.visitorTypeId === vt.id ? 'bg-navy text-white shadow-sm shadow-navy/20' : 'bg-slate-100 text-textsec'
                      }`}>
                        {getCategoryIcon(vt.name)}
                      </div>
                      <span className="text-sm">{vt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DATA TAMU */}
            {currentStep === 2 && (
              <div className="space-y-6 fade-in">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-navy tracking-tight">Informasi Data Diri</h3>
                  <p className="text-textsec text-xs">Mohon lengkapi kolom data diri di bawah ini dengan benar.</p>
                </div>

                <div className="space-y-4 pt-2 text-xs font-bold text-navy">
                  {/* Nama */}
                  <div className="space-y-1.5">
                    <label className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-textsec" />
                      <span>Nama Lengkap *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hendrik Wijaya"
                      value={formData.visitorName}
                      onChange={(e) => setFormData(p => ({ ...p, visitorName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-textsec" />
                      <span>No. WhatsApp *</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 081234567890"
                      value={formData.visitorPhone}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setFormData(p => ({ ...p, visitorPhone: numericValue }));
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                    />
                  </div>

                  {/* Institution */}
                  {!isParent && (
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-textsec" />
                        <span>Instansi / Perusahaan *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PT ABC Indonesia"
                        value={formData.institutionName}
                        onChange={(e) => setFormData(p => ({ ...p, institutionName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                      />
                    </div>
                  )}

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-textsec" />
                      <span>Alamat Rumah (Opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jl. Kesambi No. 10 Cirebon"
                      value={formData.visitorAddress}
                      onChange={(e) => setFormData(p => ({ ...p, visitorAddress: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                    />
                  </div>

                  {/* Student Details (Orang Tua / Wali) */}
                  {isParent && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <label className="flex items-center space-x-1.5">
                          <School className="w-3.5 h-3.5 text-textsec" />
                          <span>Nama Siswa *</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap anak..."
                          value={formData.studentName}
                          onChange={(e) => setFormData(p => ({ ...p, studentName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="flex items-center space-x-1.5">
                          <School className="w-3.5 h-3.5 text-textsec" />
                          <span>Kelas *</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. XII PPLG 1"
                          value={formData.studentClass}
                          onChange={(e) => setFormData(p => ({ ...p, studentClass: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: TUJUAN (PEGAWAI) */}
            {currentStep === 3 && (
              <div className="space-y-5 fade-in">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-navy tracking-tight">Siapa yang Ingin Ditemui?</h3>
                  <p className="text-textsec text-xs">Pilih Bagian lalu tentukan guru atau pegawai yang ingin dikunjungi.</p>
                </div>

                <div className="space-y-4 pt-2 text-xs font-bold text-navy">
                  {/* Select Department */}
                  <div className="space-y-1.5">
                    <label>Pilih Bagian / Unit *</label>
                    <select
                      value={formData.destinationId}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, destinationId: e.target.value, employeeId: '' }));
                        setSelectedEmployeeName('');
                      }}
                      className="w-full border border-slate-200 px-3.5 py-2.5 bg-white rounded-lg outline-none focus:border-navy text-sm font-semibold"
                    >
                      <option value="">Pilih Bagian...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search and Select Staff */}
                  <div className="space-y-1.5">
                    <label className="flex justify-between">
                      <span>Cari Nama Pegawai / Guru *</span>
                      {selectedEmployeeName && <span className="text-emerald-600 font-bold">✓ Terpilih: {selectedEmployeeName}</span>}
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-textsec absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Ketik nama untuk menyaring..."
                        value={searchEmployee}
                        onChange={(e) => setSearchEmployee(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy"
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5 max-h-[160px] overflow-y-auto pr-1 pt-1.5">
                      {!searchEmployee.trim() ? (
                        <div className="text-center text-xs text-textsec py-4 bg-slate-50 border border-dashed rounded-lg">
                          Ketik nama pegawai / guru untuk mencari...
                        </div>
                      ) : filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, employeeId: emp.id }));
                              setSelectedEmployeeName(emp.name);
                            }}
                            className={`w-full px-4 py-3 rounded-lg border text-left flex justify-between items-center transition duration-150 ${
                              formData.employeeId === emp.id
                                ? 'border-navy bg-navy/5 font-bold'
                                : 'border-slate-100 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <div>
                              <div className="text-navy text-xs font-bold">{emp.name}</div>
                              <span className="text-[10px] text-textsec block">{emp.position}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-textsec" />
                          </button>
                        ))
                      ) : (
                        <div className="text-center text-xs text-textsec py-4 bg-slate-50 border border-dashed rounded-lg">
                          Tidak ada pegawai ditemukan.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: KEPERLUAN */}
            {currentStep === 4 && (
              <div className="space-y-6 fade-in">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-navy tracking-tight">Tujuan Keperluan</h3>
                  <p className="text-textsec text-xs">Pilih keperluan utama Anda dan tambahkan rincian jika ada.</p>
                </div>

                <div className="space-y-4 pt-2 text-xs font-bold text-navy">
                  <div className="space-y-2">
                    <label>Pilih Keperluan Kunjungan *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {purposes.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, purposeId: p.id }))}
                          className={`p-3 rounded-lg border text-left text-xs font-bold transition duration-150 ${
                            formData.purposeId === p.id
                              ? 'border-navy bg-navy/5 text-navy'
                              : 'border-slate-200 hover:bg-slate-50 text-textsec'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label>Rincian Keperluan (Opsional)</label>
                    <textarea
                      rows="3"
                      placeholder="Masukkan detail keperluan..."
                      value={formData.purposeDescription}
                      onChange={(e) => setFormData(p => ({ ...p, purposeDescription: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-navy focus:border-navy focus:bg-white outline-none transition font-medium text-sm text-navy resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: KONFIRMASI */}
            {currentStep === 5 && (
              <div className="space-y-5 fade-in">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-extrabold text-navy tracking-tight">Periksa Data Anda</h3>
                  <p className="text-textsec text-xs">Tinjau kembali data Anda sebelum menekan tombol Kirim.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3.5 text-xs font-bold text-navy leading-normal">
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-textsec font-semibold">Nama Tamu</span>
                    <span>{formData.visitorName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-textsec font-semibold">No WhatsApp</span>
                    <span>{formData.visitorPhone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-textsec font-semibold">Kategori</span>
                    <span>{getSelectedTypeName()}</span>
                  </div>
                  {isParent && (
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-textsec font-semibold">Siswa (Wali)</span>
                      <span>{formData.studentName} ({formData.studentClass})</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-textsec font-semibold">Bagian</span>
                    <span>{getSelectedDeptName()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-textsec font-semibold">Bertemu</span>
                    <span>{selectedEmployeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textsec font-semibold">Keperluan</span>
                    <span>{getSelectedPurposeName()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Footer actions */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy font-bold rounded-lg flex items-center space-x-1 text-xs transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-6 py-2.5 font-bold rounded-lg flex items-center space-x-1 text-xs transition ${
                  isStepValid()
                    ? 'bg-navy hover:bg-navy-secondary text-white'
                    : 'bg-slate-100 text-textsec cursor-not-allowed border border-slate-100'
                }`}
              >
                <span>Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1"
              >
                {loading ? <span>Mengirim...</span> : <span>Kirim Buku Tamu</span>}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-textsec py-2">
        © 2026 SMK Negeri 1 Cirebon. All rights reserved.
      </footer>
    </div>
  );
}
