import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { authApi } from '../api/services';

const COOLDOWN = 30;

export default function UserLogin() {
  const { login, isLoggedIn } = useUserAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/home';

  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [devOtp,  setDevOtp]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [timer,   setTimer]   = useState(0);
  const timerRef = useRef(null);

  useEffect(() => { if (isLoggedIn) navigate(from, { replace: true }); }, [isLoggedIn]);
  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    setTimer(COOLDOWN);
    timerRef.current = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
  };

  const sendOtp = async (e, resend = false) => {
    if (e) e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!/^[\w.+\-]+@[\w\-]+\.[a-z]{2,}$/.test(trimmed)) return setError('Enter a valid email address');
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(trimmed);
      if (data.devOtp) { setDevOtp(data.devOtp); setOtp(data.devOtp); }
      if (!resend) setStep(2);
      startTimer();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      setError(msg || (!err.response ? 'Cannot connect to server.' : 'Failed to send OTP.'));
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(email.trim().toLowerCase(), otp);
      // If the verified user is ADMIN, redirect to admin panel
      if (data.role === 'ADMIN') {
        // Store in admin slot so ProtectedRoute recognises it
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_data', JSON.stringify(data));
        navigate('/admin', { replace: true });
        return;
      }
      login(data);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      setError(msg || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-black text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">KSR Fruits</h1>
          <p className="text-gray-500 text-sm mt-1">Fresh fruits delivered fast 🍎</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 ? (
            <form onSubmit={sendOtp} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in</h2>
                <p className="text-sm text-gray-500">We'll send an OTP to your email</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoFocus autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin" /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enter OTP</h2>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">{email}</p>
                </div>
                <button type="button" onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); clearInterval(timerRef.current); setTimer(0); }}
                  className="text-sm text-green-600 font-semibold hover:underline">Change</button>
              </div>
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-700 font-medium mb-1">Dev Mode OTP</p>
                  <p className="text-2xl font-black text-amber-800 tracking-widest">{devOtp}</p>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">6-digit OTP</label>
                <input
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •" maxLength={6} required autoFocus inputMode="numeric"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-xl font-bold tracking-widest outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin" /> : 'Verify & Login'}
              </button>
              <div className="text-center text-sm">
                {timer > 0
                  ? <span className="text-gray-400">Resend in {timer}s</span>
                  : <button type="button" onClick={() => sendOtp(null, true)} disabled={loading}
                      className="text-green-600 font-semibold hover:underline">Resend OTP</button>}
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Admin?{' '}
          <Link to="/admin-login" className="text-green-600 font-semibold hover:underline">Admin Login</Link>
        </p>
      </div>
    </div>
  );
}
