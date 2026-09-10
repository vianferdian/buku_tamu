import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ClipboardList, LogIn, Package } from 'lucide-react';
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

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              onClick={() => navigate('/form')}
              className="px-6 py-5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-2xl shadow-xl shadow-sky-500/30 hover:shadow-sky-500/20 transform hover:-translate-y-1 transition duration-150 flex flex-col items-center justify-center space-y-2 text-center border border-sky-400/30 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition duration-150">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg block font-extrabold">Isi Buku Tamu</span>
                <span className="text-xs font-normal text-sky-100 block mt-0.5">Orang Tua, Dinas, Vendor & Tamu Umum</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/delivery')}
              className="px-6 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/20 transform hover:-translate-y-1 transition duration-150 flex flex-col items-center justify-center space-y-2 text-center border border-emerald-400/30 group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition duration-150">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg block font-extrabold">Antar Paket / Makanan</span>
                <span className="text-xs font-normal text-emerald-100 block mt-0.5">GoFood, Grab, ShopeeFood, J&T, Kurir</span>
              </div>
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
