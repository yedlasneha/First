import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import logo from '../assets/icon.png';

export default function UserLogin() {
  const { sendOtp, verifyOtp } = useUserAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    setTimer(30);
    timerRef.current = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
  };

  const handleSend = async (e, resend = false) => {
    if (e) e.preventDefault();
    setError('');
    if (!email.match(/^[\w.+\-]+@[\w\-]+\.[a-z]{2,}$/)) return setError('Enter a valid email address');
    setLoading(true);
    try {
      const data = await sendOtp(email.trim().toLowerCase());
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        setOtp(data.devOtp); // auto-fill
      }
      if (!resend) setStep(2);
      startTimer();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const data = await verifyOtp(email.trim().toLowerCase(), otp);
      // Admin email → go to admin panel, everyone else → home
      if (data.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', padding:16 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'36px 28px', width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <img src={logo} alt="KSR Fruits" style={{ width:56, height:56, borderRadius:14, marginBottom:8 }} />
          <h1 style={{ margin:0, fontSize:'1.4rem', fontWeight:800 }}>
            <span style={{ color:'#16a34a' }}>KSR</span>
            <span style={{ color:'#f97316' }}> Fruits</span>
          </h1>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:'0.82rem' }}>Fresh fruits at your doorstep</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSend} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" required autoFocus
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:'0.95rem', outline:'none', boxSizing:'border-box' }} />
            </div>
            {error && <p style={{ margin:0, color:'#dc2626', fontSize:'0.82rem', background:'#fef2f2', padding:'8px 12px', borderRadius:8 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ padding:'13px', background:'#16a34a', color:'#fff', border:'none', borderRadius:12, fontSize:'0.95rem', fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
            <p style={{ margin:0, textAlign:'center', fontSize:'0.78rem', color:'#9ca3af' }}>We'll send a 6-digit OTP to your email</p>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 14px', fontSize:'0.82rem', color:'#16a34a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>OTP sent to <strong>{email}</strong></span>
              <button type="button" onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); }} style={{ background:'none', border:'none', color:'#16a34a', fontWeight:700, cursor:'pointer', fontSize:'0.78rem' }}>Change</button>
            </div>
            {devOtp && (
              <div style={{ background:'#fefce8', border:'1.5px solid #fde047', borderRadius:10, padding:'10px 14px', fontSize:'0.85rem', color:'#854d0e', fontWeight:600, textAlign:'center' }}>
                🔑 Dev OTP: <span style={{ fontSize:'1.2rem', letterSpacing:4, fontWeight:800 }}>{devOtp}</span>
                <span style={{ fontSize:'0.72rem', display:'block', fontWeight:400, color:'#a16207', marginTop:2 }}>(auto-filled — click Verify)</span>
              </div>
            )}
            <div>
              <label style={{ fontSize:'0.82rem', fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Enter 6-digit OTP</label>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))} placeholder="• • • • • •" maxLength={6} required autoFocus inputMode="numeric"
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:'1.4rem', letterSpacing:8, textAlign:'center', fontWeight:700, outline:'none', boxSizing:'border-box' }} />
            </div>
            {error && <p style={{ margin:0, color:'#dc2626', fontSize:'0.82rem', background:'#fef2f2', padding:'8px 12px', borderRadius:8 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ padding:'13px', background:'#16a34a', color:'#fff', border:'none', borderRadius:12, fontSize:'0.95rem', fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying…' : 'Verify & Login'}
            </button>
            <div style={{ textAlign:'center', fontSize:'0.82rem' }}>
              {timer > 0
                ? <span style={{ color:'#9ca3af' }}>Resend in {timer}s</span>
                : <button type="button" onClick={e => handleSend(null, true)} disabled={loading} style={{ background:'none', border:'none', color:'#16a34a', fontWeight:600, cursor:'pointer', textDecoration:'underline', fontSize:'0.82rem' }}>Resend OTP</button>
              }
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
