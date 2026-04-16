import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/axios';
import styles from './Auth.module.css';

const RESEND_COOLDOWN = 30;
const ADMIN_EMAIL = 'ksrfruitshelp@gmail.com';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState('');
  const [devOtp,      setDevOtp]      = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startResendTimer = () => {
    setResendTimer(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };

  const sendOtp = async (e, isResend = false) => {
    if (e) e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.match(/^[\w.+\-]+@[\w\-]+\.[a-z]{2,}$/)) {
      return setError('Enter a valid email address');
    }
    setLoading(true);
    try {
      const { data } = await authApi.post('/api/auth/admin/send-otp', { email: trimmed });
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp);
      }
      if (!isResend) setStep(2);
      startResendTimer();
    } catch (err) {
      if (!err.response) setError('Cannot connect to server. Make sure the backend is running.');
      else {
        const msg = err.response?.data?.error || err.response?.data?.message;
        setError(msg || 'Access denied. Email not authorized for admin access.');
      }
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await authApi.post('/api/auth/admin/verify-otp', { email: email.trim().toLowerCase(), otp });
      login(data);
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      setError(msg || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className={`${styles.container} ${styles.adminBg}`}>
      <div className={styles.card}>
        <div className={styles.logo}>🛡️</div>
        <h1 className={styles.brand}>Admin Portal</h1>
        <p className={styles.tagline}>KSR Fruits — Restricted Access</p>

        {step === 1 ? (
          <form onSubmit={sendOtp} className={styles.form}>
            <div className={styles.adminNotice}>
              Only <strong>{ADMIN_EMAIL}</strong> can access this portal.
            </div>
            <div className={styles.field}>
              <label>Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={ADMIN_EMAIL}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={`${styles.btn} ${styles.adminBtn}`} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className={styles.form}>
            <div className={styles.otpSentBanner}>
              OTP sent to <strong>{email}</strong>
              <button type="button" className={styles.changeBtn}
                onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); clearInterval(timerRef.current); setResendTimer(0); }}>
                Change
              </button>
            </div>
            {devOtp ? (
              <div style={{ background:'#fefce8', border:'1.5px solid #fde047', borderRadius:10, padding:'10px 14px', fontSize:'0.85rem', color:'#854d0e', fontWeight:600, textAlign:'center' }}>
                🔑 Dev OTP: <span style={{ fontSize:'1.3rem', letterSpacing:4, fontWeight:800 }}>{devOtp}</span>
                <span style={{ fontSize:'0.72rem', display:'block', fontWeight:400, color:'#a16207', marginTop:2 }}>(auto-filled — click Verify)</span>
              </div>
            ) : (
              <div className={styles.otpSuccessMsg}>✅ Check your inbox for the OTP</div>
            )}
            <div className={styles.field}>
              <label>Enter OTP</label>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                maxLength={6}
                required
                className={styles.otpInput}
                autoFocus
                inputMode="numeric"
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={`${styles.btn} ${styles.adminBtn}`} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : 'Verify & Enter Admin'}
            </button>
            <div className={styles.resendRow}>
              {resendTimer > 0
                ? <span className={styles.resendTimer}>Resend OTP in {resendTimer}s</span>
                : <button type="button" className={styles.resendBtn} onClick={() => sendOtp(null, true)} disabled={loading}>Resend OTP</button>
              }
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
