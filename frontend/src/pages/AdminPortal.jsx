import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../assets/logo.png';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, Users, UserCog, Settings, FolderTree, FileSpreadsheet, 
  HelpCircle, UserCheck, LogOut, Plus, Edit, Trash2, CheckCircle, XCircle, 
  FileText, ShieldAlert, Key, Calendar, RefreshCw, GraduationCap,
  TrendingUp, CalendarDays, CalendarRange, Clock
} from 'lucide-react';
import { 
  deptApi, employeeApi, visitorTypeApi, purposeApi, userApi, settingApi, visitApi, reportApi, studentApi 
} from '../utils/api';

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [adminUser, setAdminUser] = useState(null);

  // Real-time clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // General State
  const [loading, setLoading] = useState(false);

  // 1. Dashboard State
  const [dashSummary, setDashSummary] = useState({ today: 0, week: 0, month: 0, year: 0 });
  const [dashCharts, setDashCharts] = useState({ visitorTypes: [], departments: [], employees: [], hours: [], days: [] });

  // 2. Visits Log State
  const [visits, setVisits] = useState([]);
  const [visitFilters, setVisitFilters] = useState({
    startDate: '', endDate: '', status: '', visitorTypeId: '', destinationId: '', range: 'today'
  });

  // 3. Master Data Lists
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [visitorTypes, setVisitorTypes] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsFilter, setStudentsFilter] = useState({ search: '' });

  // 4. Settings State
  const [waTemplate, setWaTemplate] = useState('');
  const [visitCodePattern, setVisitCodePattern] = useState('T-{YYYY}{MM}{DD}-{SEQ}');
  const [importingExcel, setImportingExcel] = useState(false);
  const [bankDataApiUrl, setBankDataApiUrl] = useState('');
  const [bankDataClientId, setBankDataClientId] = useState('');
  const [bankDataClientSecret, setBankDataClientSecret] = useState('');
  const [syncingEmployees, setSyncingEmployees] = useState(false);
  const [syncingStudents, setSyncingStudents] = useState(false);

  // Pagination states
  const [visitsPage, setVisitsPage] = useState(1);
  const [employeesPage, setEmployeesPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);

  // CRUD Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editId, setEditId] = useState(null);
  
  // Dynamic Form Field States
  const [deptForm, setDeptForm] = useState({ name: '', isActive: true, sortOrder: 0 });
  const [empForm, setEmpForm] = useState({ name: '', nip: '', position: '', departmentId: '', expertise: '', phone: '', email: '', isActive: true, sortOrder: 0 });
  const [vTypeForm, setVTypeForm] = useState({ name: '', isActive: true, sortOrder: 0 });
  const [purposeForm, setPurposeForm] = useState({ visitorTypeId: '', name: '', isActive: true, sortOrder: 0 });
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'SECURITY', isActive: true });
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    nis: '',
    nisn: '',
    className: '',
    major: '',
    gender: 'L',
    birthPlace: '',
    birthDate: '',
    religion: '',
    isActive: true
  });

  // Validate admin token
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(savedUser);
    if (parsed.role !== 'ADMIN') {
      navigate('/security');
      return;
    }
    setAdminUser(parsed);
  }, [navigate]);

  // Alert triggers
  const triggerSuccess = (msg) => {
    Swal.fire({
      title: 'Sukses',
      text: msg,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const triggerError = (msg) => {
    Swal.fire({
      title: 'Terjadi Kesalahan',
      text: msg,
      icon: 'error',
      confirmButtonColor: '#0F2744'
    });
  };

  // Dashboard Metrics
  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getDashboard();
      setDashSummary(res.data.summary);
      setDashCharts(res.data.charts);
    } catch (err) {
      console.error(err);
      triggerError('Gagal memuat statistik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Visits Log
  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await visitApi.getAll({ ...visitFilters, activeOnly: false });
      setVisits(res.data);
    } catch (err) {
      console.error(err);
      triggerError('Gagal memuat log kunjungan.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await deptApi.getAll(false);
      setDepartments(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeeApi.getAll();
      setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchVisitorTypes = async () => {
    try {
      const res = await visitorTypeApi.getAll(false);
      setVisitorTypes(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPurposes = async () => {
    try {
      const res = await purposeApi.getAll();
      setPurposes(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await settingApi.get('whatsapp_template');
      setWaTemplate(res.data.value);
    } catch (err) { console.error(err); }

    try {
      const resPattern = await settingApi.get('visit_code_pattern');
      setVisitCodePattern(resPattern.data.value);
    } catch (err) {
      console.error(err);
      setVisitCodePattern('T-{YYYY}{MM}{DD}-{SEQ}');
    }

    try {
      const resUrl = await settingApi.get('bank_data_api_url');
      setBankDataApiUrl(resUrl.data.value);
    } catch (err) {
      console.error(err);
      setBankDataApiUrl('https://data.vianferdian.web.id/api/v1');
    }

    try {
      const resId = await settingApi.get('bank_data_client_id');
      setBankDataClientId(resId.data.value);
    } catch (err) {
      console.error(err);
      setBankDataClientId('BUKU_TAMU_FHOB');
    }

    try {
      const resSecret = await settingApi.get('bank_data_client_secret');
      setBankDataClientSecret(resSecret.data.value);
    } catch (err) {
      console.error(err);
      setBankDataClientSecret('0bgDccJDHpt6sOTS4u31SM84NZ78jFIQ');
    }
  };

  const fetchStudentsList = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getAll(studentsFilter);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      triggerError('Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  };

  // Master Loader
  useEffect(() => {
    if (adminUser) {
      if (activeMenu === 'dashboard') fetchDashboardMetrics();
      else if (activeMenu === 'visits') {
        fetchVisits();
        fetchVisitorTypes();
        fetchDepartments();
      }
      else if (activeMenu === 'departments') fetchDepartments();
      else if (activeMenu === 'employees') {
        fetchEmployees();
        fetchDepartments();
      }
      else if (activeMenu === 'visitorTypes') fetchVisitorTypes();
      else if (activeMenu === 'purposes') {
        fetchPurposes();
        fetchVisitorTypes();
      }
      else if (activeMenu === 'users') fetchUsers();
      else if (activeMenu === 'students') fetchStudentsList();
      else if (activeMenu === 'settings') fetchSettings();
    }
  }, [adminUser, activeMenu, visitFilters, studentsFilter]);

  // Reset page indices on list changes
  useEffect(() => {
    setVisitsPage(1);
  }, [visits.length]);

  useEffect(() => {
    setEmployeesPage(1);
  }, [employees.length]);

  useEffect(() => {
    setStudentsPage(1);
  }, [students.length]);

  // Handle Logout
  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar dari Portal Admin?',
      text: 'Anda akan mengakhiri sesi administrasi.',
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

  // -------------------- EXPORT LOGS --------------------
  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    const baseUrl = reportApi.getExportUrl(visitFilters);
    const url = `${baseUrl}&token=${token}`;
    window.open(url, '_blank');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      // Title Header
      doc.setFontSize(16);
      doc.setTextColor(15, 39, 68); // Navy
      doc.text('LAPORAN REKAP BUKU TAMU DIGITAL', 14, 15);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate
      doc.text(`SMK Negeri 1 Cirebon - Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

      // Columns
      const tableColumn = [
        'Kode',
        'Nama Tamu',
        'Instansi',
        'WhatsApp',
        'Kategori',
        'Tujuan',
        'Menemui',
        'Keperluan',
        'Waktu Masuk',
        'Status'
      ];

      // Rows
      const tableRows = [];

      visits.forEach(v => {
        const rowData = [
          v.visitCode || '-',
          v.visitorName || '-',
          v.institutionName || '-',
          v.visitorPhone || '-',
          v.visitorType?.name || '-',
          v.department?.name || '-',
          v.employee?.name || '-',
          `${v.purpose?.name || '-'}${v.purposeDescription ? ` (${v.purposeDescription})` : ''}`,
          v.visitedAt ? new Date(v.visitedAt).toLocaleString('id-ID') : '-',
          v.status === 'NEW' ? 'BARU' : v.status === 'CONTACTED' ? 'DIHUBUNGI' : 'SELESAI'
        ];
        tableRows.push(rowData);
      });

      // AutoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 39, 68], // Navy
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slatebg
        }
      });

      // Save
      doc.save(`Rekap_Buku_Tamu_${Date.now()}.pdf`);
      
      Swal.fire({
        title: 'Unduh PDF Berhasil',
        text: 'Laporan PDF rekap kunjungan berhasil diunduh.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Terjadi kesalahan saat mengekspor laporan ke PDF.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // -------------------- CRUD ACTIONS --------------------
  const openModal = (type, mode, item = null) => {
    setModalType(mode);
    setEditId(item?.id || null);

    if (type === 'departments') {
      setDeptForm({
        name: item ? item.name : '',
        isActive: item ? item.isActive : true,
        sortOrder: item ? item.sortOrder : 0
      });
    } else if (type === 'employees') {
      setEmpForm({
        name: item ? item.name : '',
        nip: item ? item.nip || '' : '',
        position: item ? item.position : '',
        departmentId: item ? item.departmentId : '',
        expertise: item ? item.expertise || '' : '',
        phone: item ? item.phone : '',
        email: item ? item.email || '' : '',
        isActive: item ? item.isActive : true,
        sortOrder: item ? item.sortOrder : 0
      });
    } else if (type === 'visitorTypes') {
      setVTypeForm({
        name: item ? item.name : '',
        isActive: item ? item.isActive : true,
        sortOrder: item ? item.sortOrder : 0
      });
    } else if (type === 'purposes') {
      setPurposeForm({
        visitorTypeId: item ? item.visitorTypeId : '',
        name: item ? item.name : '',
        isActive: item ? item.isActive : true,
        sortOrder: item ? item.sortOrder : 0
      });
    } else if (type === 'users') {
      setUserForm({
        name: item ? item.name : '',
        username: item ? item.username : '',
        password: '',
        role: item ? item.role : 'SECURITY',
        isActive: item ? item.isActive : true
      });
    } else if (type === 'students') {
      setStudentForm({
        fullName: item ? item.fullName : '',
        nis: item ? item.nis : '',
        nisn: item ? item.nisn || '' : '',
        className: item ? item.className : '',
        major: item ? item.major || '' : '',
        gender: item ? item.gender || 'L' : 'L',
        birthPlace: item ? item.birthPlace || '' : '',
        birthDate: item ? item.birthDate || '' : '',
        religion: item ? item.religion || '' : '',
        isActive: item ? item.isActive : true
      });
    }

    setShowModal(type);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showModal === 'departments') {
        if (modalType === 'create') {
          await deptApi.create(deptForm);
          triggerSuccess('Bagian berhasil dibuat.');
        } else {
          await deptApi.update(editId, deptForm);
          triggerSuccess('Bagian berhasil diubah.');
        }
        fetchDepartments();
      } 
      else if (showModal === 'employees') {
        if (modalType === 'create') {
          await employeeApi.create(empForm);
          triggerSuccess('Pegawai berhasil dibuat.');
        } else {
          await employeeApi.update(editId, empForm);
          triggerSuccess('Pegawai berhasil diubah.');
        }
        fetchEmployees();
      } 
      else if (showModal === 'visitorTypes') {
        if (modalType === 'create') {
          await visitorTypeApi.create(vTypeForm);
          triggerSuccess('Kategori tamu berhasil dibuat.');
        } else {
          await visitorTypeApi.update(editId, vTypeForm);
          triggerSuccess('Kategori tamu berhasil diubah.');
        }
        fetchVisitorTypes();
      } 
      else if (showModal === 'purposes') {
        if (modalType === 'create') {
          await purposeApi.create(purposeForm);
          triggerSuccess('Keperluan berhasil dibuat.');
        } else {
          await purposeApi.update(editId, purposeForm);
          triggerSuccess('Keperluan berhasil diubah.');
        }
        fetchPurposes();
      } 
      else if (showModal === 'users') {
        if (modalType === 'create') {
          await userApi.create(userForm);
          triggerSuccess('Pengguna berhasil dibuat.');
        } else {
          const payload = { ...userForm };
          if (!payload.password) delete payload.password;
          await userApi.update(editId, payload);
          triggerSuccess('Pengguna berhasil diubah.');
        }
        fetchUsers();
      }
      else if (showModal === 'students') {
        if (modalType === 'create') {
          await studentApi.create(studentForm);
          triggerSuccess('Siswa berhasil dibuat.');
        } else {
          await studentApi.update(editId, studentForm);
          triggerSuccess('Siswa berhasil diubah.');
        }
        fetchStudentsList();
      }
      
      setShowModal(false);
    } catch (err) {
      console.error(err);
      triggerError(err.response?.data?.message || 'Gagal menyimpan data.');
    }
  };

  const handleDelete = (type, id) => {
    Swal.fire({
      title: 'Hapus Data ini?',
      text: 'Data yang telah dihapus tidak dapat dipulihkan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (type === 'departments') {
            await deptApi.delete(id);
            fetchDepartments();
          } else if (type === 'employees') {
            await employeeApi.delete(id);
            fetchEmployees();
          } else if (type === 'visitorTypes') {
            await visitorTypeApi.delete(id);
            fetchVisitorTypes();
          } else if (type === 'purposes') {
            await purposeApi.delete(id);
            fetchPurposes();
          } else if (type === 'users') {
            await userApi.delete(id);
            fetchUsers();
          } else if (type === 'students') {
            await studentApi.delete(id);
            fetchStudentsList();
          }
          triggerSuccess('Data berhasil dihapus.');
        } catch (err) {
          console.error(err);
          triggerError(err.response?.data?.message || 'Gagal menghapus data. Data mungkin terikat dengan modul lain.');
        }
      }
    });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await settingApi.update('whatsapp_template', waTemplate);
      await settingApi.update('visit_code_pattern', visitCodePattern);
      await settingApi.update('bank_data_api_url', bankDataApiUrl);
      await settingApi.update('bank_data_client_id', bankDataClientId);
      await settingApi.update('bank_data_client_secret', bankDataClientSecret);
      triggerSuccess('Pengaturan sistem berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      triggerError('Gagal memperbarui pengaturan.');
    }
  };

  const handleSyncEmployees = async () => {
    Swal.fire({
      title: 'Sinkronisasi Data...',
      text: 'Menarik data guru dan pegawai dari API Bank Data, mohon tunggu.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setSyncingEmployees(true);
    try {
      const res = await employeeApi.syncEmployees();
      Swal.fire({
        title: 'Sukses',
        text: res.data.message || 'Sinkronisasi berhasil diselesaikan.',
        icon: 'success',
        confirmButtonColor: '#0F2744'
      });
      fetchEmployees();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal menyinkronkan data guru & pegawai.',
        icon: 'error',
        confirmButtonColor: '#0F2744'
      });
    } finally {
      setSyncingEmployees(false);
    }
  };

  const handleSyncStudents = async () => {
    let currentPage = 1;
    let lastPage = 1;
    let totalCreated = 0;
    let totalUpdated = 0;

    Swal.fire({
      title: 'Sinkronisasi Data Siswa',
      html: `Menghubungkan ke API Bank Data...<br/>
             <div class="w-full bg-slate-200 h-2.5 rounded-full mt-3 overflow-hidden">
               <div id="sync-progress-bar" class="bg-emerald-600 h-full rounded-full transition-all duration-300" style="width: 0%"></div>
             </div>
             <div id="sync-progress-text" class="text-[10px] text-slate-500 mt-1.5 font-bold">Mempersiapkan...</div>`,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setSyncingStudents(true);
    try {
      do {
        const res = await studentApi.syncStudents(currentPage);
        if (!res.data.success) {
          throw new Error(res.data.message || 'Gagal menyinkronkan data.');
        }

        const meta = res.data.meta || {};
        lastPage = meta.last_page || 1;
        totalCreated += res.data.data.created;
        totalUpdated += res.data.data.updated;

        const percent = Math.round((currentPage / lastPage) * 100);

        const progressBar = document.getElementById('sync-progress-bar');
        const progressText = document.getElementById('sync-progress-text');
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) {
          progressText.innerText = `Menyimpan Halaman ${currentPage} dari ${lastPage} (${percent}%)`;
        }

        currentPage++;

        if (currentPage <= lastPage) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      } while (currentPage <= lastPage);

      Swal.fire({
        title: 'Sinkronisasi Sukses',
        text: `Berhasil menyinkronkan total ${totalCreated + totalUpdated} siswa. (Baru: ${totalCreated}, Diperbarui: ${totalUpdated})`,
        icon: 'success',
        confirmButtonColor: '#0F2744'
      });
      fetchStudentsList();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Gagal',
        text: err.response?.data?.message || err.message || 'Gagal menyinkronkan data siswa.',
        icon: 'error',
        confirmButtonColor: '#0F2744'
      });
    } finally {
      setSyncingStudents(false);
    }
  };

  const handleDeleteAllStudents = () => {
    Swal.fire({
      title: 'Kosongkan Data Siswa?',
      text: 'Tindakan ini akan menghapus seluruh data siswa lokal secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Kosongkan!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Konfirmasi Terakhir',
          text: 'Apakah Anda benar-benar yakin ingin mengosongkan seluruh data siswa?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#64748B',
          confirmButtonText: 'Ya, Hapus Semua!',
          cancelButtonText: 'Batal'
        }).then(async (res2) => {
          if (res2.isConfirmed) {
            try {
              await studentApi.deleteAll();
              triggerSuccess('Seluruh data siswa berhasil dihapus.');
              fetchStudentsList();
            } catch (err) {
              console.error(err);
              triggerError(err.response?.data?.message || 'Gagal menghapus data siswa.');
            }
          }
        });
      }
    });
  };

  const handleDownloadTemplate = () => {
    const url = employeeApi.getTemplateUrl();
    window.open(url, '_blank');
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Swal.fire({
      title: 'Memproses Berkas...',
      text: 'Mengimpor data guru dan pegawai dari Excel, mohon tunggu.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setImportingExcel(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await employeeApi.importExcel(formData);
      const { message, successCount, skipCount, errors } = res.data;

      Swal.close();

      if (skipCount > 0) {
        Swal.fire({
          title: 'Impor Selesai dengan Catatan',
          html: `<p class="text-xs font-semibold text-textsec">${message}</p>
                 <div class="mt-3 text-left max-h-[150px] overflow-y-auto bg-slate-50 border p-2 rounded text-[10px] text-rose-600 font-mono space-y-1">
                   ${errors.map(err => `<div>• ${err}</div>`).join('')}
                 </div>`,
          icon: 'warning'
        });
      } else {
        Swal.fire({
          title: 'Impor Berhasil!',
          text: message,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      fetchEmployees();
      fetchDepartments();
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat mengimpor file Excel.', 'error');
    } finally {
      setImportingExcel(false);
      e.target.value = '';
    }
  };

  const handleDeleteAllVisits = () => {
    Swal.fire({
      title: 'Kosongkan Seluruh Riwayat?',
      text: 'Tindakan ini akan menghapus permanen seluruh riwayat log kunjungan tamu dan data statistik di dashboard!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Kosongkan!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Konfirmasi Terakhir',
          text: 'Apakah Anda benar-benar yakin ingin menghapus seluruh log kunjungan?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#64748B',
          confirmButtonText: 'Ya, Hapus Semua!',
          cancelButtonText: 'Batal'
        }).then(async (res2) => {
          if (res2.isConfirmed) {
            try {
              await visitApi.deleteAll();
              triggerSuccess('Seluruh riwayat kunjungan berhasil dikosongkan.');
              fetchVisits();
            } catch (err) {
              console.error(err);
              triggerError(err.response?.data?.message || 'Gagal menghapus riwayat kunjungan.');
            }
          }
        });
      }
    });
  };

  const handleDeleteVisit = (id, name) => {
    Swal.fire({
      title: 'Hapus Riwayat Kunjungan?',
      text: `Hapus log kunjungan tamu "${name}" secara permanen?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await visitApi.delete(id);
          triggerSuccess('Log kunjungan berhasil dihapus.');
          fetchVisits();
        } catch (err) {
          console.error(err);
          triggerError(err.response?.data?.message || 'Gagal menghapus log kunjungan.');
        }
      }
    });
  };

  const formatHour = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Pagination variables
  const visitsPerPage = 10;
  const totalVisitsPages = Math.max(Math.ceil(visits.length / visitsPerPage), 1);
  const paginatedVisits = visits.slice((visitsPage - 1) * visitsPerPage, visitsPage * visitsPerPage);

  const employeesPerPage = 10;
  const totalEmployeesPages = Math.max(Math.ceil(employees.length / employeesPerPage), 1);
  const paginatedEmployees = employees.slice((employeesPage - 1) * employeesPerPage, employeesPage * employeesPerPage);

  const studentsPerPage = 10;
  const totalStudentsPages = Math.max(Math.ceil(students.length / studentsPerPage), 1);
  const paginatedStudents = students.slice((studentsPage - 1) * studentsPerPage, studentsPage * studentsPerPage);

  const getMenuTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return 'Dashboard Analisis';
      case 'visits': return 'Rekap Data Kunjungan';
      case 'departments': return 'Master Bagian / Unit';
      case 'employees': return 'Master Guru & Pegawai';
      case 'students': return 'Master Data Siswa';
      case 'visitorTypes': return 'Master Jenis Kunjungan';
      case 'purposes': return 'Master Keperluan Tamu';
      case 'users': return 'Master Pengguna Sistem';
      case 'settings': return 'Pengaturan Sistem';
      default: return 'Panel Administrasi';
    }
  };

  const getMenuIcon = () => {
    switch (activeMenu) {
      case 'dashboard': return <LayoutDashboard className="w-4 h-4" />;
      case 'visits':    return <FileSpreadsheet className="w-4 h-4" />;
      case 'departments': return <FolderTree className="w-4 h-4" />;
      case 'employees': return <Users className="w-4 h-4" />;
      case 'students':  return <GraduationCap className="w-4 h-4" />;
      case 'visitorTypes': return <UserCheck className="w-4 h-4" />;
      case 'purposes':  return <HelpCircle className="w-4 h-4" />;
      case 'users':     return <UserCog className="w-4 h-4" />;
      case 'settings':  return <Settings className="w-4 h-4" />;
      default: return null;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-bgmain flex flex-col md:flex-row">
      {/* -------------------- SIDEBAR MENU -------------------- */}
      <aside className="w-full md:w-56 bg-[#0B1F3A] text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center space-x-2.5 border-b border-white/5">
          <img src={logoImg} alt="Logo" className="w-7 h-7 object-contain bg-white/90 p-0.5 rounded-md" />
          <div>
            <h1 className="font-bold text-[11px] leading-none tracking-wide">SMKN 1 CIREBON</h1>
            <span className="text-[9px] text-sky-400/70 font-medium tracking-widest">ADMIN PANEL</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 text-[11px] font-semibold overflow-y-auto">
          {/* Group: Main */}
          <div className="pt-1 pb-1 px-2 text-[9px] text-white/30 tracking-widest uppercase font-bold">Menu Utama</div>

          {[
            { key: 'dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: 'Dashboard' },
            { key: 'visits',    icon: <FileSpreadsheet className="w-3.5 h-3.5" />, label: 'Data Kunjungan' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveMenu(key)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeMenu === key
                  ? 'bg-sky-500/15 text-white border-l-2 border-sky-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}

          {/* Group: Master Data */}
          <div className="pt-4 pb-1 px-2 text-[9px] text-white/30 tracking-widest uppercase font-bold">Master Data</div>

          {[
            { key: 'departments',  icon: <FolderTree className="w-3.5 h-3.5" />,     label: 'Bagian / Unit' },
            { key: 'employees',   icon: <Users className="w-3.5 h-3.5" />,          label: 'Guru & Pegawai' },
            { key: 'students',    icon: <GraduationCap className="w-3.5 h-3.5" />,  label: 'Siswa' },
            { key: 'visitorTypes',icon: <UserCheck className="w-3.5 h-3.5" />,      label: 'Jenis Kunjungan' },
            { key: 'purposes',    icon: <HelpCircle className="w-3.5 h-3.5" />,     label: 'Keperluan Tamu' },
            { key: 'users',       icon: <UserCog className="w-3.5 h-3.5" />,        label: 'Pengguna' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveMenu(key)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeMenu === key
                  ? 'bg-sky-500/15 text-white border-l-2 border-sky-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}

          {/* Group: System */}
          <div className="pt-4 pb-1 px-2 text-[9px] text-white/30 tracking-widest uppercase font-bold">Sistem</div>

          {[
            { key: 'settings', icon: <Settings className="w-3.5 h-3.5" />, label: 'Pengaturan' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveMenu(key)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                activeMenu === key
                  ? 'bg-sky-500/15 text-white border-l-2 border-sky-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom user badge */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center text-[10px] font-extrabold shadow">
              {getInitials(adminUser?.name)}
            </div>
            <div>
              <span className="text-[10px] text-white font-semibold block truncate max-w-[90px]">{adminUser?.name}</span>
              <span className="text-[8px] text-sky-400/80 font-bold uppercase tracking-wide">Administrator</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-md"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-7 flex flex-col justify-between overflow-x-hidden relative">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-bordergray gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-navy/5 text-navy rounded-lg">
                {getMenuIcon()}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-navy tracking-tight">{getMenuTitle()}</h2>
                <p className="text-[10px] text-textsec mt-0.5">SMK Negeri 1 Cirebon — Buku Tamu Digital</p>
              </div>
            </div>
            {/* Real-time clock */}
            <div className="hidden lg:flex items-center space-x-2 text-right">
              <div className="p-2 bg-slate-50 border border-bordergray rounded-lg">
                <div className="flex items-center space-x-1.5 text-navy">
                  <Clock className="w-3.5 h-3.5 text-textsec" />
                  <span className="text-sm font-extrabold tabular-nums">
                    {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-[9px] text-textsec text-right mt-0.5">
                  {now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* ==================== 1. PANEL: DASHBOARD METRICS ==================== */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 mt-6 fade-in">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Hari Ini */}
                <div className="bg-gradient-to-br from-navy to-navy-secondary p-5 rounded-xl flex items-center justify-between shadow text-white">
                  <div>
                    <span className="text-[10px] text-white/60 font-bold block">Hari Ini</span>
                    <strong className="text-2xl font-extrabold">{dashSummary.today}</strong>
                    <span className="text-[9px] text-white/50 block mt-0.5">kunjungan</span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                </div>

                {/* Minggu Ini */}
                <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-5 rounded-xl flex items-center justify-between shadow text-white">
                  <div>
                    <span className="text-[10px] text-white/60 font-bold block">Minggu Ini</span>
                    <strong className="text-2xl font-extrabold">{dashSummary.week}</strong>
                    <span className="text-[9px] text-white/50 block mt-0.5">kunjungan</span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CalendarRange className="w-5 h-5" />
                  </div>
                </div>

                {/* Bulan Ini */}
                <div className="bg-gradient-to-br from-violet-500 to-violet-700 p-5 rounded-xl flex items-center justify-between shadow text-white">
                  <div>
                    <span className="text-[10px] text-white/60 font-bold block">Bulan Ini</span>
                    <strong className="text-2xl font-extrabold">{dashSummary.month}</strong>
                    <span className="text-[9px] text-white/50 block mt-0.5">kunjungan</span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                {/* Tahun Ini */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-xl flex items-center justify-between shadow text-white">
                  <div>
                    <span className="text-[10px] text-white/60 font-bold block">Tahun Ini</span>
                    <strong className="text-2xl font-extrabold">{dashSummary.year}</strong>
                    <span className="text-[9px] text-white/50 block mt-0.5">kunjungan</span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Graphic Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-bordergray shadow-sm space-y-4">
                  <h4 className="font-bold text-navy text-xs border-b pb-2">Kunjungan Berdasarkan Kategori Tamu</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashCharts.visitorTypes}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0F2744" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-bordergray shadow-sm space-y-4">
                  <h4 className="font-bold text-navy text-xs border-b pb-2">Tujuan Kunjungan Per Bagian / Unit</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashCharts.departments}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#163A63" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-bordergray shadow-sm space-y-4 lg:col-span-2">
                  <h4 className="font-bold text-navy text-xs border-b pb-2">Kepadatan Jam Kunjungan Tamu</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashCharts.hours}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#0F2744" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-bordergray shadow-sm space-y-3">
                  <h4 className="font-bold text-navy text-xs border-b pb-2">Top 5 Pegawai Paling Sering Dikunjungi</h4>
                  <div className="space-y-2">
                    {dashCharts.employees.length > 0 ? (
                      dashCharts.employees.map((emp, index) => (
                        <div key={index} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-xs font-semibold">
                          <div>
                            <span className="font-bold text-navy">{emp.name}</span>
                            <p className="text-[9px] text-textsec mt-0.5">{emp.position}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-navy/5 text-navy text-[10px] font-bold rounded">{emp.count} Kali</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-textsec py-4 text-center">Belum ada data kunjungan.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-bordergray shadow-sm space-y-4">
                  <h4 className="font-bold text-navy text-xs border-b pb-2">Kunjungan Berdasarkan Hari Kerja</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashCharts.days}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== 2. PANEL: VISITS FULL LOG ==================== */}
          {activeMenu === 'visits' && (
            <div className="space-y-6 mt-6 fade-in">
              <div className="bg-white p-4 rounded-xl border border-bordergray shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 gap-2">
                  <span className="font-bold text-navy text-xs flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Saring Laporan</span>
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleExportPDF}
                      className="px-3 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ekspor PDF</span>
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Ekspor Excel</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 border border-bordergray text-textsec hover:bg-slate-50 text-[10px] font-bold rounded-lg transition"
                    >
                      Cetak Laporan
                    </button>
                    <button
                      onClick={handleDeleteAllVisits}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Kosongkan Riwayat</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[10px] font-bold">
                  <div className="space-y-1">
                    <label className="text-textsec">Waktu</label>
                    <select
                      value={visitFilters.range}
                      onChange={(e) => setVisitFilters(p => ({ ...p, range: e.target.value }))}
                      className="w-full border border-bordergray px-2 py-1.5 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="today">Hari Ini</option>
                      <option value="yesterday">Kemarin</option>
                      <option value="7days">7 Hari Terakhir</option>
                      <option value="custom">Custom Tanggal</option>
                    </select>
                  </div>

                  {visitFilters.range === 'custom' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-textsec">Mulai</label>
                        <input
                          type="date"
                          value={visitFilters.startDate}
                          onChange={(e) => setVisitFilters(p => ({ ...p, startDate: e.target.value }))}
                          className="w-full border border-bordergray px-2 py-1.5 rounded-lg text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-textsec">Sampai</label>
                        <input
                          type="date"
                          value={visitFilters.endDate}
                          onChange={(e) => setVisitFilters(p => ({ ...p, endDate: e.target.value }))}
                          className="w-full border border-bordergray px-2 py-1.5 rounded-lg text-xs"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-textsec">Status</label>
                    <select
                      value={visitFilters.status}
                      onChange={(e) => setVisitFilters(p => ({ ...p, status: e.target.value }))}
                      className="w-full border border-bordergray px-2 py-1.5 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="">Semua Status</option>
                      <option value="NEW">BARU</option>
                      <option value="CONTACTED">DIHUBUNGI</option>
                      <option value="COMPLETED">SELESAI</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-textsec">Kategori Tamu</label>
                    <select
                      value={visitFilters.visitorTypeId}
                      onChange={(e) => setVisitFilters(p => ({ ...p, visitorTypeId: e.target.value }))}
                      className="w-full border border-bordergray px-2 py-1.5 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="">Semua Kategori</option>
                      {visitorTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-textsec">Bagian/Tujuan</label>
                    <select
                      value={visitFilters.destinationId}
                      onChange={(e) => setVisitFilters(p => ({ ...p, destinationId: e.target.value }))}
                      className="w-full border border-bordergray px-2 py-1.5 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="">Semua Bagian</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div id="print-area" className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase tracking-wider">
                        <th className="p-3">Kode</th>
                        <th className="p-3">Tamu</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3">Bertemu</th>
                        <th className="p-3">Keperluan</th>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Petugas WA</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVisits.length > 0 ? (
                        paginatedVisits.map((v, i) => (
                          <tr key={v.id} className={`border-b border-bordergray hover:bg-slate-50 font-semibold ${
                            i % 2 === 1 ? 'bg-slate-50/10' : ''
                          }`}>
                            <td className="p-3 font-bold text-navy">{v.visitCode}</td>
                            <td className="p-3">
                              <div className="font-extrabold text-navy">{v.visitorName}</div>
                              <p className="text-[10px] text-textsec">{v.institutionName || '-'}</p>
                              <span className="text-[9px] text-textsec block">{v.visitorPhone}</span>
                            </td>
                            <td className="p-3 text-textsec">{v.visitorType.name}</td>
                            <td className="p-3">
                              <div className="font-bold text-navy">{v.employee.name}</div>
                              <p className="text-[10px] text-textsec">{v.employee.position} ({v.department.name})</p>
                            </td>
                            <td className="p-3 max-w-[180px] truncate">
                              <div className="font-bold text-navy">{v.purpose.name}</div>
                              {v.purposeDescription && (
                                <p className="text-[9px] text-textsec italic">"{v.purposeDescription}"</p>
                              )}
                            </td>
                            <td className="p-3">
                              <div>{formatHour(v.visitedAt)}</div>
                              <p className="text-[10px] text-textsec">{formatDate(v.visitedAt)}</p>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                v.status === 'NEW' ? 'bg-blue-50 text-blue-600' : v.status === 'CONTACTED' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {v.status === 'NEW' ? 'BARU' : v.status === 'CONTACTED' ? 'DIHUBUNGI' : 'SELESAI'}
                              </span>
                            </td>
                            <td className="p-3 text-textsec">
                              {v.contactedBy ? v.contactedBy.name : '-'}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteVisit(v.id, v.visitorName)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Hapus log kunjungan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-8 text-textsec font-semibold">Tidak ada data.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalVisitsPages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-bordergray text-xs font-bold text-navy">
                    <button
                      onClick={() => setVisitsPage(p => Math.max(p - 1, 1))}
                      disabled={visitsPage === 1}
                      className="px-3 py-1.5 border border-bordergray rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-textsec">
                      Halaman {visitsPage} dari {totalVisitsPages} ({visits.length} Total)
                    </span>
                    <button
                      onClick={() => setVisitsPage(p => Math.min(p + 1, totalVisitsPages))}
                      disabled={visitsPage === totalVisitsPages}
                      className="px-3 py-1.5 border border-bordergray rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. PANEL: MASTER BAGIAN / UNIT ==================== */}
          {activeMenu === 'departments' && (
            <div className="space-y-5 mt-6 fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-textsec uppercase">Bagian / Unit Sekolah</span>
                <button
                  onClick={() => openModal('departments', 'create')}
                  className="px-3.5 py-2 bg-navy hover:bg-navy-secondary text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase">
                      <th className="p-3">Nama Bagian</th>
                      <th className="p-3">Urutan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d, index) => (
                      <tr key={d.id} className={`border-b border-bordergray hover:bg-slate-50 font-semibold ${
                        index % 2 === 1 ? 'bg-slate-50/10' : ''
                      }`}>
                        <td className="p-3 text-navy font-bold text-sm">{d.name}</td>
                        <td className="p-3 text-textsec">{d.sortOrder}</td>
                        <td className="p-3">
                          {d.isActive ? (
                            <span className="text-emerald-600 flex items-center space-x-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="text-rose-500 flex items-center space-x-1 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> <span>Nonaktif</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => openModal('departments', 'edit', d)}
                            className="p-1.5 text-navy hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete('departments', d.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 4. PANEL: MASTER GURU & PEGAWAI ==================== */}
          {activeMenu === 'employees' && (
            <div className="space-y-5 mt-6 fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xs font-bold text-textsec uppercase">Daftar Guru / Pegawai</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 border border-navy text-navy hover:bg-navy hover:text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    title="Unduh file Excel kosong untuk template data guru"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Template</span>
                  </button>
                  
                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{importingExcel ? 'Mengimpor...' : 'Impor Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleImportExcel}
                      disabled={importingExcel}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleSyncEmployees}
                    disabled={syncingEmployees}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    title="Sinkronisasi seluruh data guru & pegawai dari API Bank Data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingEmployees ? 'animate-spin' : ''}`} />
                    <span>{syncingEmployees ? 'Menyinkronkan...' : 'Sinkronisasi API'}</span>
                  </button>

                  <button
                    onClick={() => openModal('employees', 'create')}
                    className="px-3.5 py-1.5 bg-navy hover:bg-navy-secondary text-white text-[10px] font-bold rounded-lg flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase">
                        <th className="p-3">Nama Pegawai</th>
                        <th className="p-3">NIP</th>
                        <th className="p-3">Jabatan</th>
                        <th className="p-3">Bagian</th>
                        <th className="p-3">WhatsApp</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((emp, index) => (
                          <tr key={emp.id} className={`border-b border-bordergray hover:bg-slate-50 font-semibold ${
                            index % 2 === 1 ? 'bg-slate-50/10' : ''
                          }`}>
                            <td className="p-3 text-navy font-bold text-sm">
                              <div>{emp.name}</div>
                              {emp.expertise && <span className="text-[9px] text-textsec bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">Keahlian: {emp.expertise}</span>}
                            </td>
                            <td className="p-3 text-textsec">{emp.nip || '-'}</td>
                            <td className="p-3 text-navy font-bold">{emp.position}</td>
                            <td className="p-3 text-textsec">{emp.department.name}</td>
                            <td className="p-3 text-emerald-600 font-bold">{emp.phone}</td>
                            <td className="p-3">
                              {emp.isActive ? (
                                <span className="text-emerald-600 flex items-center space-x-1 text-xs">
                                  <CheckCircle className="w-3.5 h-3.5" /> <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="text-rose-500 flex items-center space-x-1 text-xs">
                                  <XCircle className="w-3.5 h-3.5" /> <span>Nonaktif</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => openModal('employees', 'edit', emp)}
                                className="p-1.5 text-navy hover:bg-slate-100 rounded-lg transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete('employees', emp.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-textsec font-semibold">Tidak ada data.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalEmployeesPages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-bordergray text-xs font-bold text-navy">
                    <button
                      onClick={() => setEmployeesPage(p => Math.max(p - 1, 1))}
                      disabled={employeesPage === 1}
                      className="px-3 py-1.5 border border-bordergray rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-textsec">
                      Halaman {employeesPage} dari {totalEmployeesPages} ({employees.length} Total)
                    </span>
                    <button
                      onClick={() => setEmployeesPage(p => Math.min(p + 1, totalEmployeesPages))}
                      disabled={employeesPage === totalEmployeesPages}
                      className="px-3 py-1.5 border border-bordergray rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== PANEL: MASTER DATA SISWA ==================== */}
          {activeMenu === 'students' && (
            <div className="space-y-5 mt-6 fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xs font-bold text-textsec uppercase">Daftar Siswa (Master Data)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSyncStudents}
                    disabled={syncingStudents}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    title="Sinkronisasi seluruh data siswa dari API Bank Data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingStudents ? 'animate-spin' : ''}`} />
                    <span>{syncingStudents ? 'Menyinkronkan...' : 'Sinkronisasi API'}</span>
                  </button>

                  <button
                    onClick={handleDeleteAllStudents}
                    disabled={syncingStudents}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                    title="Kosongkan seluruh data siswa dari database lokal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Data</span>
                  </button>

                  <button
                    onClick={() => openModal('students', 'create')}
                    className="px-3.5 py-1.5 bg-navy hover:bg-navy-secondary text-white text-[10px] font-bold rounded-lg flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="bg-white p-4 rounded-xl border border-bordergray shadow-sm">
                <input
                  type="text"
                  placeholder="Cari nama, NIS, NISN, atau kelas..."
                  value={studentsFilter.search}
                  onChange={(e) => setStudentsFilter({ search: e.target.value })}
                  className="w-full px-3 py-2 border border-bordergray rounded-lg text-xs outline-none focus:border-navy"
                />
              </div>

              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase">
                        <th className="p-3">Nama Siswa</th>
                        <th className="p-3">NIS / NISN</th>
                        <th className="p-3">Kelas / Jurusan</th>
                        <th className="p-3">JK</th>
                        <th className="p-3">Agama</th>
                        <th className="p-3">Tempat, Tgl Lahir</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.length > 0 ? (
                        paginatedStudents.map((stud, index) => (
                          <tr key={stud.id} className={`border-b border-bordergray hover:bg-slate-50 font-semibold ${
                            index % 2 === 1 ? 'bg-slate-50/10' : ''
                          }`}>
                            <td className="p-3 text-navy font-bold text-sm">
                              {stud.fullName}
                            </td>
                            <td className="p-3 text-textsec">
                              <div>NIS: {stud.nis}</div>
                              <div className="text-[10px]">NISN: {stud.nisn || '-'}</div>
                            </td>
                            <td className="p-3 text-navy font-bold">
                              <div>{stud.className}</div>
                              {stud.major && <span className="text-[9px] text-textsec bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">{stud.major}</span>}
                            </td>
                            <td className="p-3 text-textsec">{stud.gender || '-'}</td>
                            <td className="p-3 text-textsec">{stud.religion || '-'}</td>
                            <td className="p-3 text-textsec">
                              {stud.birthPlace || stud.birthDate ? (
                                `${stud.birthPlace || ''}${stud.birthPlace && stud.birthDate ? ', ' : ''}${stud.birthDate || ''}`
                              ) : '-'}
                            </td>
                            <td className="p-3">
                              {stud.isActive ? (
                                <span className="text-emerald-600 flex items-center space-x-1 text-xs">
                                  <CheckCircle className="w-3.5 h-3.5" /> <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="text-rose-500 flex items-center space-x-1 text-xs">
                                  <XCircle className="w-3.5 h-3.5" /> <span>Nonaktif</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => openModal('students', 'edit', stud)}
                                className="p-1.5 text-navy hover:bg-slate-100 rounded-lg transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete('students', stud.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-8 text-textsec font-semibold">Tidak ada data siswa ditemukan.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalStudentsPages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-bordergray text-xs font-bold text-navy">
                    <button
                      onClick={() => setStudentsPage(p => Math.max(p - 1, 1))}
                      disabled={studentsPage === 1}
                      className="px-3 py-1.5 border border-bordergray rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-textsec">
                      Halaman {studentsPage} dari {totalStudentsPages} ({students.length} Total)
                    </span>
                    <button
                      onClick={() => setStudentsPage(p => Math.min(p + 1, totalStudentsPages))}
                      disabled={studentsPage === totalStudentsPages}
                      className="px-3 py-1.5 border border-bordergray rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 5. PANEL: MASTER JENIS KUNJUNGAN ==================== */}
          {activeMenu === 'visitorTypes' && (
            <div className="space-y-5 mt-6 fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-textsec uppercase">Kategori Jenis Kunjungan</span>
                <button
                  onClick={() => openModal('visitorTypes', 'create')}
                  className="px-3.5 py-2 bg-navy hover:bg-navy-secondary text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase">
                      <th className="p-3">Nama Kategori</th>
                      <th className="p-3">Urutan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitorTypes.map((t, index) => (
                      <tr key={t.id} className={`border-b border-bordergray hover:bg-slate-50 font-semibold ${
                        index % 2 === 1 ? 'bg-slate-50/10' : ''
                      }`}>
                        <td className="p-3 text-navy font-bold text-sm">{t.name}</td>
                        <td className="p-3 text-textsec">{t.sortOrder}</td>
                        <td className="p-3">
                          {t.isActive ? (
                            <span className="text-emerald-600 flex items-center space-x-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="text-rose-500 flex items-center space-x-1 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> <span>Nonaktif</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => openModal('visitorTypes', 'edit', t)}
                            className="p-1.5 text-navy hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete('visitorTypes', t.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 6. PANEL: MASTER KEPERLUAN TAMU ==================== */}
          {activeMenu === 'purposes' && (
            <div className="space-y-5 mt-6 fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-textsec uppercase">Daftar Keperluan Tamu</span>
                  <p className="text-[10px] text-textsec mt-0.5">Dikelompokkan berdasarkan kategori tamu</p>
                </div>
                <button
                  onClick={() => openModal('purposes', 'create')}
                  className="px-3.5 py-2 bg-navy hover:bg-navy-secondary text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Group purposes by visitorType */}
              {(() => {
                const grouped = purposes.reduce((acc, p) => {
                  const key = p.visitorType?.name || 'Tidak Berkategori';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(p);
                  return acc;
                }, {});

                const groupColors = [
                  'from-navy to-navy-secondary',
                  'from-sky-500 to-sky-700',
                  'from-violet-500 to-violet-700',
                  'from-amber-500 to-amber-600',
                  'from-emerald-500 to-emerald-700',
                  'from-rose-500 to-rose-700',
                ];

                return Object.entries(grouped).map(([typeName, items], groupIdx) => (
                  <div key={typeName} className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                    {/* Group Header */}
                    <div className={`bg-gradient-to-r ${groupColors[groupIdx % groupColors.length]} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-white/80" />
                        <span className="text-white font-extrabold text-xs tracking-wide">{typeName}</span>
                        <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {items.length} keperluan
                        </span>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase text-[10px]">
                          <th className="p-3">Nama Keperluan</th>
                          <th className="p-3 w-24">Urutan</th>
                          <th className="p-3 w-28">Status</th>
                          <th className="p-3 text-right w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((p, index) => (
                          <tr key={p.id} className={`border-b border-bordergray hover:bg-slate-50/70 font-semibold transition ${
                            index % 2 === 1 ? 'bg-slate-50/30' : ''
                          }`}>
                            <td className="p-3 text-navy font-bold">{p.name}</td>
                            <td className="p-3 text-textsec">{p.sortOrder}</td>
                            <td className="p-3">
                              {p.isActive ? (
                                <span className="text-emerald-600 flex items-center space-x-1 text-xs">
                                  <CheckCircle className="w-3.5 h-3.5" /> <span>Aktif</span>
                                </span>
                              ) : (
                                <span className="text-rose-500 flex items-center space-x-1 text-xs">
                                  <XCircle className="w-3.5 h-3.5" /> <span>Nonaktif</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => openModal('purposes', 'edit', p)}
                                className="p-1.5 text-navy hover:bg-slate-100 rounded-lg transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete('purposes', p.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()}

              {purposes.length === 0 && (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-bordergray">
                  <p className="text-textsec text-xs font-semibold">Belum ada data keperluan tamu.</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== 7. PANEL: MASTER PENGGUNA SISTEM ==================== */}
          {activeMenu === 'users' && (
            <div className="space-y-5 mt-6 fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-textsec uppercase">Daftar Pengguna Sistem</span>
                <button
                  onClick={() => openModal('users', 'create')}
                  className="px-3.5 py-2 bg-navy hover:bg-navy-secondary text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-bordergray text-navy font-bold uppercase">
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Role Hak Akses</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, index) => (
                      <tr key={u.id} className={`border-b border-bordergray hover:bg-slate-50 font-semibold ${
                        index % 2 === 1 ? 'bg-slate-50/10' : ''
                      }`}>
                        <td className="p-3 text-navy font-bold text-sm">{u.name}</td>
                        <td className="p-3 text-textsec font-bold">{u.username}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {u.role.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.isActive ? (
                            <span className="text-emerald-600 flex items-center space-x-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="text-rose-500 flex items-center space-x-1 text-xs">
                              <XCircle className="w-3.5 h-3.5" /> <span>Nonaktif</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => openModal('users', 'edit', u)}
                            className="p-1.5 text-navy hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete('users', u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            disabled={u.id === adminUser?.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== 8. PANEL: SYSTEM SETTINGS ==================== */}
          {activeMenu === 'settings' && (
            <div className="mt-6 max-w-2xl space-y-4 fade-in">

              {/* Card 1: WhatsApp Template */}
              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <div className="flex items-center space-x-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-3 h-3" />
                  </div>
                  <h4 className="text-xs font-bold text-navy">Template Pesan WhatsApp</h4>
                </div>
                <div className="p-5">
                  <form onSubmit={handleUpdateSettings} className="space-y-4" id="form-settings">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-textsec uppercase tracking-wider">Format Pesan</label>
                      <textarea
                        rows="5"
                        value={waTemplate}
                        onChange={(e) => setWaTemplate(e.target.value)}
                        className="w-full border border-bordergray p-3 rounded-lg outline-none focus:border-navy text-xs font-medium resize-none leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['{waktu}','{nama_pegawai}','{nama_tamu}','{instansi}','{jenis_kunjungan}','{keperluan}','{jam_kunjungan}'].map(v => (
                        <code key={v} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{v}</code>
                      ))}
                    </div>
                  </form>
                </div>
              </div>

              {/* Card 2: Visit Code Pattern */}
              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <div className="flex items-center space-x-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Key className="w-3 h-3" />
                  </div>
                  <h4 className="text-xs font-bold text-navy">Format Kode Kunjungan</h4>
                </div>
                <div className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-textsec uppercase tracking-wider">Pola Kode</label>
                    <input
                      form="form-settings"
                      type="text"
                      value={visitCodePattern}
                      onChange={(e) => setVisitCodePattern(e.target.value)}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg outline-none focus:border-navy text-xs font-medium font-mono"
                      placeholder="e.g. T-{YYYY}{MM}{DD}-{SEQ}"
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['{YYYY}','{YY}','{MM}','{DD}','{SEQ}'].map(v => (
                      <code key={v} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{v}</code>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: API Bank Data */}
              <div className="bg-white rounded-xl border border-bordergray shadow-sm overflow-hidden">
                <div className="flex items-center space-x-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                  <div className="w-5 h-5 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center">
                    <RefreshCw className="w-3 h-3" />
                  </div>
                  <h4 className="text-xs font-bold text-navy">Integrasi API Bank Data <span className="text-slate-400 font-medium">(Sidata Neper)</span></h4>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-textsec uppercase tracking-wider">URL Base API</label>
                    <input
                      form="form-settings"
                      type="text"
                      value={bankDataApiUrl}
                      onChange={(e) => setBankDataApiUrl(e.target.value)}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg outline-none focus:border-navy text-xs font-medium font-mono"
                      placeholder="https://data.vianferdian.web.id/api/v1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-textsec uppercase tracking-wider">X-Client-ID</label>
                      <input
                        form="form-settings"
                        type="text"
                        value={bankDataClientId}
                        onChange={(e) => setBankDataClientId(e.target.value)}
                        className="w-full border border-bordergray px-3 py-2 rounded-lg outline-none focus:border-navy text-xs font-medium font-mono"
                        placeholder="Client ID"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-textsec uppercase tracking-wider">X-Client-Secret</label>
                      <input
                        form="form-settings"
                        type="password"
                        value={bankDataClientSecret}
                        onChange={(e) => setBankDataClientSecret(e.target.value)}
                        className="w-full border border-bordergray px-3 py-2 rounded-lg outline-none focus:border-navy text-xs font-medium"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-textsec leading-relaxed">
                    Digunakan untuk pencarian data <strong>Siswa</strong> di form tamu dan <strong>sinkronisasi Guru & Tendik</strong> di menu Pegawai. Nilai disimpan di database dan tidak perlu mengubah file <code className="bg-slate-100 px-1 rounded">.env</code>.
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  form="form-settings"
                  type="submit"
                  className="px-5 py-2 bg-navy hover:bg-navy-secondary text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-2"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Simpan Semua Pengaturan</span>
                </button>
              </div>

            </div>
          )}



        </div>

        <footer className="text-center text-[10px] text-textsec mt-12 py-2">
          © 2026 SMK Negeri 1 Cirebon. All rights reserved.
        </footer>
      </main>

      {/* -------------------- DYNAMIC CRUD MODAL DIALOGS -------------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl relative fade-in border border-bordergray">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-xs font-bold hover:bg-slate-100 p-1.5 rounded-lg text-textsec"
            >
              ✕
            </button>

            <div>
              <h3 className="font-extrabold text-navy text-sm uppercase tracking-tight">{modalType} {showModal.replace('visitorTypes', 'Kategori Kunjungan').replace('purposes', 'Keperluan').replace('departments', 'Bagian')}</h3>
              <p className="text-[9px] text-textsec mt-0.5">Isi seluruh informasi dengan benar.</p>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3.5 text-[11px] font-bold text-navy">
              
              {/* --- DEPARTMENT FORM --- */}
              {showModal === 'departments' && (
                <>
                  <div className="space-y-1">
                    <label>Nama Bagian / Unit *</label>
                    <input
                      type="text"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Urutan</label>
                    <input
                      type="number"
                      value={deptForm.sortOrder}
                      onChange={(e) => setDeptForm(p => ({ ...p, sortOrder: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="dept-active"
                      checked={deptForm.isActive}
                      onChange={(e) => setDeptForm(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="dept-active">Aktif</label>
                  </div>
                </>
              )}

              {/* --- EMPLOYEE FORM --- */}
              {showModal === 'employees' && (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label>Nama Lengkap *</label>
                    <input
                      type="text"
                      value={empForm.name}
                      onChange={(e) => setEmpForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>NIP</label>
                    <input
                      type="text"
                      value={empForm.nip}
                      onChange={(e) => setEmpForm(p => ({ ...p, nip: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Jabatan *</label>
                    <input
                      type="text"
                      value={empForm.position}
                      onChange={(e) => setEmpForm(p => ({ ...p, position: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Bagian / Unit *</label>
                    <select
                      value={empForm.departmentId}
                      onChange={(e) => setEmpForm(p => ({ ...p, departmentId: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg bg-white text-xs"
                      required
                    >
                      <option value="">Pilih Bagian...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Keahlian (Opsional)</label>
                    <input
                      type="text"
                      value={empForm.expertise}
                      onChange={(e) => setEmpForm(p => ({ ...p, expertise: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Nomor WhatsApp *</label>
                    <input
                      type="text"
                      value={empForm.phone}
                      onChange={(e) => setEmpForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Email</label>
                    <input
                      type="email"
                      value={empForm.email}
                      onChange={(e) => setEmpForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Urutan</label>
                    <input
                      type="number"
                      value={empForm.sortOrder}
                      onChange={(e) => setEmpForm(p => ({ ...p, sortOrder: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="emp-active"
                      checked={empForm.isActive}
                      onChange={(e) => setEmpForm(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="emp-active">Aktif</label>
                  </div>
                </div>
              )}

              {/* --- VISITOR TYPE FORM --- */}
              {showModal === 'visitorTypes' && (
                <>
                  <div className="space-y-1">
                    <label>Nama Kategori *</label>
                    <input
                      type="text"
                      value={vTypeForm.name}
                      onChange={(e) => setVTypeForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Urutan</label>
                    <input
                      type="number"
                      value={vTypeForm.sortOrder}
                      onChange={(e) => setVTypeForm(p => ({ ...p, sortOrder: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="vt-active"
                      checked={vTypeForm.isActive}
                      onChange={(e) => setVTypeForm(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="vt-active">Aktif</label>
                  </div>
                </>
              )}

              {/* --- PURPOSE FORM --- */}
              {showModal === 'purposes' && (
                <>
                  <div className="space-y-1">
                    <label>Kategori Tamu *</label>
                    <select
                      value={purposeForm.visitorTypeId}
                      onChange={(e) => setPurposeForm(p => ({ ...p, visitorTypeId: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg bg-white text-xs"
                      required
                    >
                      <option value="">Pilih Kategori...</option>
                      {visitorTypes.map(vt => (
                        <option key={vt.id} value={vt.id}>{vt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>Nama Keperluan *</label>
                    <input
                      type="text"
                      value={purposeForm.name}
                      onChange={(e) => setPurposeForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Urutan</label>
                    <input
                      type="number"
                      value={purposeForm.sortOrder}
                      onChange={(e) => setPurposeForm(p => ({ ...p, sortOrder: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="purpose-active"
                      checked={purposeForm.isActive}
                      onChange={(e) => setPurposeForm(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="purpose-active">Aktif</label>
                  </div>
                </>
              )}

              {/* --- USER ACCOUNT FORM --- */}
              {showModal === 'users' && (
                <>
                  <div className="space-y-1">
                    <label>Nama Lengkap *</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Username Login *</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm(p => ({ ...p, username: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Password {modalType === 'edit' ? '(Kosongkan jika tidak diganti)' : '*'}</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required={modalType === 'create'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Hak Akses / Role *</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm(p => ({ ...p, role: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg bg-white text-xs"
                      required
                    >
                      <option value="SECURITY">SECURITY</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="user-active"
                      checked={userForm.isActive}
                      onChange={(e) => setUserForm(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="user-active">Aktif</label>
                  </div>
                </>
              )}

              {/* --- STUDENT FORM --- */}
              {showModal === 'students' && (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  <div className="space-y-1">
                    <label>Nama Lengkap Siswa *</label>
                    <input
                      type="text"
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm(p => ({ ...p, fullName: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>NIS *</label>
                    <input
                      type="text"
                      value={studentForm.nis}
                      onChange={(e) => setStudentForm(p => ({ ...p, nis: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>NISN</label>
                    <input
                      type="text"
                      value={studentForm.nisn}
                      onChange={(e) => setStudentForm(p => ({ ...p, nisn: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Kelas *</label>
                    <input
                      type="text"
                      value={studentForm.className}
                      onChange={(e) => setStudentForm(p => ({ ...p, className: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      placeholder="e.g. X PPLG 1"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Kompetensi Keahlian / Jurusan</label>
                    <input
                      type="text"
                      value={studentForm.major}
                      onChange={(e) => setStudentForm(p => ({ ...p, major: e.target.value }))}
                      className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      placeholder="e.g. PPLG"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label>Jenis Kelamin</label>
                      <select
                        value={studentForm.gender}
                        onChange={(e) => setStudentForm(p => ({ ...p, gender: e.target.value }))}
                        className="w-full border border-bordergray px-3 py-2 rounded-lg bg-white text-xs"
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label>Agama</label>
                      <input
                        type="text"
                        value={studentForm.religion}
                        onChange={(e) => setStudentForm(p => ({ ...p, religion: e.target.value }))}
                        className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                        placeholder="e.g. Islam"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label>Tempat Lahir</label>
                      <input
                        type="text"
                        value={studentForm.birthPlace}
                        onChange={(e) => setStudentForm(p => ({ ...p, birthPlace: e.target.value }))}
                        className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Tanggal Lahir</label>
                      <input
                        type="text"
                        value={studentForm.birthDate}
                        onChange={(e) => setStudentForm(p => ({ ...p, birthDate: e.target.value }))}
                        className="w-full border border-bordergray px-3 py-2 rounded-lg text-xs"
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id="student-active"
                      checked={studentForm.isActive}
                      onChange={(e) => setStudentForm(p => ({ ...p, isActive: e.target.checked }))}
                    />
                    <label htmlFor="student-active">Aktif</label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy hover:bg-navy-secondary text-white rounded-lg transition font-bold"
                >
                  Simpan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
