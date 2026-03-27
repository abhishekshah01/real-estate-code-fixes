import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, { email, password });
      localStorage.setItem('admin_token', response.data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
      navigate('/admin/dashboard');
    } catch (err) { setError(err.response?.data?.detail || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-5" data-testid="admin-login-page">
      <div className="max-w-sm w-full">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">EstateX</h1>
          <p className="text-stone-500 text-[13px] uppercase tracking-[0.12em] font-semibold">Admin Portal</p>
        </div>

        <div className="bg-stone-900/60 rounded-2xl border border-stone-800/50 p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-6 tracking-tight">Sign In</h2>

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center gap-2 text-red-300 text-sm" data-testid="login-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5" data-testid="admin-login-form">
            <div>
              <label className="block text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-10 pr-4 py-3 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-stone-500 transition-colors"
                  placeholder="admin@example.com" required data-testid="admin-email-input" />
              </div>
            </div>
            <div>
              <label className="block text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-10 pr-4 py-3 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-stone-500 transition-colors"
                  placeholder="Enter password" required data-testid="admin-password-input" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 bg-[#C2410C] text-white rounded-lg font-semibold text-[13px] uppercase tracking-[0.08em] hover:bg-[#9A3412] transition-colors disabled:opacity-50" data-testid="admin-login-submit">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 p-3 bg-stone-800/40 rounded-lg border border-stone-700/30">
            <p className="text-stone-500 text-xs text-center">
              Demo: <span className="text-stone-300 font-mono">admin@estatex.com</span> / <span className="text-stone-300 font-mono">admin1234</span>
            </p>
          </div>
        </div>

        <p className="text-stone-700 text-xs mt-6">&copy; {new Date().getFullYear()} EstateX</p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
