import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ClipboardList, LogIn } from 'lucide-react';
import logoImg from '../assets/logo.png';
import bgImg from '../assets/DJI_0085.webp';

export default function GuestLanding() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen text-white flex flex-col justify-between relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(11, 31, 58, 0.80), rgba(11, 31, 58, 0.92)), url(${bgImg})` }}
    >



      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 z-10 fade-in py-12">
        <div className="max-w-2xl text-center space-y-8">
          <div className="inline-flex mb-2">
            <img src={logoImg} alt="Logo SMKN 1 Cirebon" className="w-24 h-24 object-contain drop-shadow-lg" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Aplikasi Buku Tamu Digital <br />
              <span className="text-sky-300 text-2xl sm:text-3xl font-bold mt-1 block">SMK Negeri 1 Cirebon</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
              Selamat datang di SMK Negeri 1 Cirebon. Silakan isi data kunjungan Anda untuk mempermudah pelayanan.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/form')}
              className="px-10 py-5 bg-sky-500 hover:bg-sky-600 text-white text-lg sm:text-xl font-extrabold rounded-2xl shadow-xl shadow-sky-500/30 hover:shadow-sky-500/15 transform hover:-translate-y-0.5 transition duration-150 flex items-center space-x-3 mx-auto"
            >
              <ClipboardList className="w-6 h-6" />
              <span>Mulai Isi Buku Tamu</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-400 z-10 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/10">
        <p className="font-semibold">© 2026 SMK Negeri 1 Cirebon. All rights reserved.</p>
        <div className="flex items-center space-x-2 font-semibold">
          <Shield className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>Aplikasi Aman & Terpantau</span>
        </div>
      </footer>
    </div>
  );
}
