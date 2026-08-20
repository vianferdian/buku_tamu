import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../utils/api';
import logoImg from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.login({ username, password });
      const { token, user } = res.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/security');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa kembali username & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgmain flex flex-col justify-between py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative Blur BG */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-navy/5 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy/5 rounded-full filter blur-3xl -ml-20 -mb-20"></div>

      {/* Top Header back arrow */}
      <div className="w-full max-w-md mx-auto z-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-textsec hover:text-navy transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Kiosk</span>
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md mx-auto my-auto z-10 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-bordergray">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex">
            <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-navy">LOGIN PETUGAS</h2>
            <p className="text-textsec text-xs mt-1">Buku Tamu Digital SMK Negeri 1 Cirebon</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy flex items-center space-x-1.5">
              <User className="w-4 h-4 text-textsec" />
              <span>Username</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan username Anda..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-bordergray rounded-xl focus:ring-2 focus:ring-navy/10 focus:border-navy outline-none transition"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-textsec" />
              <span>Password</span>
            </label>
            <input
              type="password"
              placeholder="Masukkan password Anda..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-bordergray rounded-xl focus:ring-2 focus:ring-navy/10 focus:border-navy outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-navy hover:bg-navy-secondary text-white font-bold rounded-xl shadow-lg shadow-navy/20 transition duration-150 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Memproses...' : 'Masuk Ke Sistem'}</span>
            <LogIn className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-textsec py-4 z-10">
        © 2026 SMK Negeri 1 Cirebon. All rights reserved.
      </footer>
    </div>
  );
}
