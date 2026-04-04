import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'sans-serif', background:'#f8f9fa' }}>
          <div style={{ fontSize:'3rem', marginBottom:16 }}>⚠️</div>
          <h2 style={{ margin:'0 0 8px', color:'#111827' }}>Something went wrong</h2>
          <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:'0.9rem', textAlign:'center', maxWidth:400 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding:'10px 24px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>
            Reload Page
          </button>
          <details style={{ marginTop:16, fontSize:'0.75rem', color:'#9ca3af', maxWidth:500, wordBreak:'break-all' }}>
            <summary style={{ cursor:'pointer' }}>Error details</summary>
            <pre style={{ marginTop:8, whiteSpace:'pre-wrap' }}>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
