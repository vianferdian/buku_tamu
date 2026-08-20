import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ClipboardList, LogIn } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function GuestLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bgmain flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-navy/5 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy/5 rounded-full filter blur-3xl -ml-20 -mb-20"></div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <img src={logoImg} alt="Logo SMKN 1 Cirebon" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-bold text-navy text-lg leading-none">SMKN 1 CIREBON</h1>
            <span className="text-xs text-textsec tracking-wider font-semibold">BUKU TAMU DIGITAL</span>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 z-10 fade-in py-12">
        <div className="max-w-2xl text-center space-y-8">
          <div className="inline-flex mb-2">
            <img src={logoImg} alt="Logo SMKN 1 Cirebon" className="w-24 h-24 object-contain" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
              Aplikasi Buku Tamu Digital <br />
              <span className="text-navy-secondary text-3xl sm:text-4xl font-bold">SMK Negeri 1 Cirebon</span>
            </h2>
            <p className="text-lg text-textsec max-w-lg mx-auto">
              Selamat datang di SMK Negeri 1 Cirebon. Silakan isi data kunjungan Anda untuk mempermudah pelayanan.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate('/form')}
              className="px-8 py-5 bg-navy hover:bg-navy-secondary text-white text-lg font-bold rounded-2xl shadow-xl shadow-navy/35 hover:shadow-navy/20 transform hover:-translate-y-0.5 transition duration-150 flex items-center space-x-3 mx-auto"
            >
              <ClipboardList className="w-6 h-6" />
              <span>Mulai Isi Buku Tamu</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-textsec z-10 border-t border-bordergray/50 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© 2026 SMK Negeri 1 Cirebon. All rights reserved.</p>
        <div className="flex items-center space-x-2 text-navy/70">
          <Shield className="w-3.5 h-3.5" />
          <span>Aplikasi Aman & Terpantau</span>
        </div>
      </footer>
    </div>
  );
}
