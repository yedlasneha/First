import { useState, useEffect, useMemo } from 'react';
import { productApi } from '../api/axios';
import s from './ProfitCalculator.module.css';

const EMPTY_ROW = { fruitName: '', unit: 'kg', quantity: '', buyPrice: '', sellPrice: '' };

function calcRow(r) {
  const qty  = parseFloat(r.quantity)  || 0;
  const buy  = parseFloat(r.buyPrice)  || 0;
  const sell = parseFloat(r.sellPrice) || 0;
  const invest = buy * qty;
  const rev    = sell * qty;
  const profit = rev - invest;
  const margin = invest > 0 ? (profit / invest) * 100 : 0;
  return { invest, rev, profit, margin, profitUnit: sell - buy, isLoss: sell < buy };
}

export default function ProfitCalculator({ onClose }) {
  const [products,  setProducts]  = useState([]);
  const [rows,      setRows]      = useState([{ ...EMPTY_ROW, _id: Date.now() }]);
  const [history,   setHistory]   = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [tab,       setTab]       = useState('calc');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [editRow,   setEditRow]   = useState(null);

  useEffect(() => {
    productApi.get('/api/products').then(r => setProducts(r.data)).catch(() => {});
    loadHistory();
    loadSummary();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const r = await productApi.get('/api/profit');
      setHistory(r.data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadSummary = async () => {
    try {
      const r = await productApi.get('/api/profit/today/summary');
      setSummary(r.data);
    } catch {}
  };

  const updateRow = (id, field, val) => {
    setRows(prev => prev.map(r => {
      if (r._id !== id) return r;
      const u = { ...r, [field]: val };
      if (field === 'fruitName') {
        const p = products.find(p => p.name === val);
        if (p) u.unit = p.unit || 'kg';
      }
      return u;
    }));
    setSaved(false);
  };

  const calcs  = useMemo(() => rows.map(r => ({ ...r, ...calcRow(r) })), [rows]);
  const totals = useMemo(() => calcs.reduce((a, c) => ({
    invest: a.invest + c.invest,
    rev:    a.rev    + c.rev,
    profit: a.profit + c.profit,
  }), { invest: 0, rev: 0, profit: 0 }), [calcs]);

  const saveAll = async () => {
    const valid = calcs.filter(c => c.fruitName && c.quantity && c.buyPrice && c.sellPrice);
    if (!valid.length) return;
    setSaving(true);
    try {
      await Promise.all(valid.map(c =>
        productApi.post('/api/profit', {
          fruitName: c.fruitName, unit: c.unit,
          quantity: parseFloat(c.quantity),
          buyPrice: parseFloat(c.buyPrice),
          sellPrice: parseFloat(c.sellPrice),
        })
      ));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadHistory();
      await loadSummary();
    } catch {}
    finally { setSaving(false); }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await productApi.delete(`/api/profit/${id}`);
      await loadHistory();
      await loadSummary();
    } catch {}
  };

  const startEdit = (entry) => {
    setEditId(entry.id);
    setEditRow({
      fruitName: entry.fruitName, unit: entry.unit,
      quantity: entry.quantity, buyPrice: entry.buyPrice, sellPrice: entry.sellPrice,
    });
  };

  const saveEdit = async () => {
    if (!editRow.fruitName || !editRow.quantity || !editRow.buyPrice || !editRow.sellPrice) return;
    try {
      await productApi.put(`/api/profit/${editId}`, {
        fruitName: editRow.fruitName, unit: editRow.unit,
        quantity: parseFloat(editRow.quantity),
        buyPrice: parseFloat(editRow.buyPrice),
        sellPrice: parseFloat(editRow.sellPrice),
      });
      setEditId(null); setEditRow(null);
      await loadHistory();
      await loadSummary();
    } catch {}
  };

  // Insights from history
  const insights = useMemo(() => {
    if (!history.length) return null;
    const map = {};
    history.forEach(h => {
      if (!map[h.fruitName]) map[h.fruitName] = [];
      map[h.fruitName].push(parseFloat(h.profit));
    });
    const list = Object.entries(map)
      .map(([name, arr]) => ({ name, avg: arr.reduce((a,b)=>a+b,0)/arr.length }))
      .sort((a,b) => b.avg - a.avg);
    return { best: list[0], worst: list[list.length-1], list };
  }, [history]);

  const todayEntries = history.filter(h => h.entryDate === new Date().toISOString().split('T')[0]);

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <span>🧮</span>
            <span className={s.headerTitle}>Profit Calculator</span>
          </div>
          <button className={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Today summary bar */}
        {summary && (
          <div className={s.todayBar}>
            <span className={s.todayLabel}>📅 Today</span>
            <div className={s.todayStats}>
              <span>Invest <strong>₹{parseFloat(summary.totalInvestment||0).toFixed(0)}</strong></span>
              <span>Rev <strong>₹{parseFloat(summary.totalRevenue||0).toFixed(0)}</strong></span>
              <span className={parseFloat(summary.totalProfit||0) >= 0 ? s.green : s.red}>
                Profit <strong>{parseFloat(summary.totalProfit||0) >= 0 ? '+' : ''}₹{parseFloat(summary.totalProfit||0).toFixed(0)}</strong>
              </span>
              <span>Margin <strong>{parseFloat(summary.avgMargin||0).toFixed(1)}%</strong></span>
              <span className={s.todayCount}>{summary.entryCount} entries</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={s.tabs}>
          {[['calc','Calculator'],['insights','Insights'],['history','History']].map(([id,lbl]) => (
            <button key={id} className={`${s.tab} ${tab===id?s.tabOn:''}`} onClick={() => setTab(id)}>
              {lbl}{id==='history' && history.length > 0 ? ` (${history.length})` : ''}
            </button>
          ))}
        </div>

        <div className={s.body}>

          {/* ── CALCULATOR ── */}
          {tab === 'calc' && <>
            <div className={s.strip}>
              <div className={s.stripItem}>
                <span className={s.stripLbl}>Investment</span>
                <span className={s.stripVal} style={{color:'#1d4ed8'}}>₹{totals.invest.toFixed(0)}</span>
              </div>
              <div className={s.stripDiv}/>
              <div className={s.stripItem}>
                <span className={s.stripLbl}>Revenue</span>
                <span className={s.stripVal} style={{color:'#059669'}}>₹{totals.rev.toFixed(0)}</span>
              </div>
              <div className={s.stripDiv}/>
              <div className={s.stripItem}>
                <span className={s.stripLbl}>Profit</span>
                <span className={s.stripVal} style={{color: totals.profit >= 0 ? '#16a34a' : '#dc2626'}}>
                  {totals.profit >= 0 ? '+' : ''}₹{totals.profit.toFixed(0)}
                </span>
              </div>
            </div>

            <div className={s.rowList}>
              {calcs.map((row, idx) => {
                const valid = row.quantity && row.buyPrice && row.sellPrice;
                return (
                  <div key={row._id} className={`${s.rowCard} ${valid ? (row.isLoss ? s.cardLoss : s.cardProfit) : ''}`}>
                    <div className={s.rowCardHead}>
                      <span className={s.rowIdx}>#{idx+1}</span>
                      {valid && (
                        <span className={`${s.rowBadge} ${row.isLoss ? s.badgeLoss : s.badgeProfit}`}>
                          {row.isLoss ? '⚠ Loss' : '✓ Profit'} ₹{row.profit.toFixed(0)}
                        </span>
                      )}
                      <button className={s.removeBtn}
                        onClick={() => setRows(r => r.filter(x => x._id !== row._id))}>✕</button>
                    </div>
                    <div className={s.rowFields}>
                      <div className={s.field}>
                        <label>Fruit</label>
                        <select className={s.sel} value={row.fruitName}
                          onChange={e => updateRow(row._id,'fruitName',e.target.value)}>
                          <option value="">Select…</option>
                          {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className={s.field}>
                        <label>Unit</label>
                        <select className={s.sel} value={row.unit}
                          onChange={e => updateRow(row._id,'unit',e.target.value)}>
                          {['kg','dozen','tray','unit','piece'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className={s.field}>
                        <label>Qty</label>
                        <input className={s.inp} type="number" min="0" placeholder="0"
                          value={row.quantity} onChange={e => updateRow(row._id,'quantity',e.target.value)} />
                      </div>
                      <div className={s.field}>
                        <label>Buy ₹</label>
                        <input className={s.inp} type="number" min="0" placeholder="0"
                          value={row.buyPrice} onChange={e => updateRow(row._id,'buyPrice',e.target.value)} />
                      </div>
                      <div className={s.field}>
                        <label>Sell ₹</label>
                        <input className={`${s.inp} ${valid && row.isLoss ? s.inpLoss : ''}`}
                          type="number" min="0" placeholder="0"
                          value={row.sellPrice} onChange={e => updateRow(row._id,'sellPrice',e.target.value)} />
                      </div>
                    </div>
                    {valid && (
                      <div className={s.rowResult}>
                        <span>Invest <strong>₹{row.invest.toFixed(0)}</strong></span>
                        <span>Rev <strong>₹{row.rev.toFixed(0)}</strong></span>
                        <span>Margin <strong className={row.isLoss ? s.red : s.green}>{row.margin.toFixed(1)}%</strong></span>
                        <span>Per {row.unit} <strong className={row.isLoss ? s.red : s.green}>
                          {row.isLoss ? '-' : '+'}₹{Math.abs(row.profitUnit).toFixed(0)}
                        </strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={s.actions}>
              <button className={s.btnAdd}
                onClick={() => setRows(r => [...r, { ...EMPTY_ROW, _id: Date.now() }])}>
                + Add Fruit
              </button>
              <div className={s.actRight}>
                <button className={s.btnReset}
                  onClick={() => { setRows([{ ...EMPTY_ROW, _id: Date.now() }]); setSaved(false); }}>
                  ↺ Reset
                </button>
                <button className={`${s.btnSave} ${saved ? s.btnSaved : ''}`}
                  onClick={saveAll} disabled={saving}>
                  {saving ? 'Saving…' : saved ? '✅ Saved' : '💾 Save to DB'}
                </button>
              </div>
            </div>
          </>}

          {/* ── INSIGHTS ── */}
          {tab === 'insights' && (
            <div className={s.insWrap}>
              {!insights ? (
                <div className={s.noData}>📊 Save some analyses first to see insights.</div>
              ) : <>
                <div className={s.insCards}>
                  <div className={s.insCard} style={{background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
                    <span className={s.insEmoji}>🔥</span>
                    <span className={s.insLbl}>Best Fruit</span>
                    <span className={s.insName}>{insights.best?.name}</span>
                    <span className={s.insSub}>Avg ₹{insights.best?.avg.toFixed(0)} profit</span>
                  </div>
                  {insights.worst?.avg < 0 && (
                    <div className={s.insCard} style={{background:'#fef2f2',border:'1px solid #fecaca'}}>
                      <span className={s.insEmoji}>⚠️</span>
                      <span className={s.insLbl}>Avoid</span>
                      <span className={s.insName}>{insights.worst.name}</span>
                      <span className={s.insSub}>Avg ₹{Math.abs(insights.worst.avg).toFixed(0)} loss</span>
                    </div>
                  )}
                </div>
                <div className={s.rankCard}>
                  <p className={s.rankTitle}>🏆 Profitability Ranking</p>
                  {insights.list.map((f, i) => (
                    <div key={f.name} className={s.rankRow}>
                      <span className={s.rankN}>#{i+1}</span>
                      <span className={s.rankName}>{f.name}</span>
                      <div className={s.rankBar}>
                        <div className={s.rankFill} style={{
                          width: `${Math.min(100, Math.abs(f.avg) / Math.max(...insights.list.map(x=>Math.abs(x.avg))) * 100)}%`,
                          background: f.avg >= 0 ? '#16a34a' : '#dc2626',
                        }}/>
                      </div>
                      <span className={f.avg >= 0 ? s.green : s.red}
                        style={{fontSize:'.75rem',fontWeight:700,width:60,textAlign:'right'}}>
                        ₹{f.avg.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={s.tipCard}>
                  <p className={s.tipTitle}>💡 Tips</p>
                  <ul className={s.tipList}>
                    <li>Focus on <strong>{insights.best?.name}</strong> for max returns</li>
                    {insights.worst?.avg < 0 && <li>Review pricing for <strong>{insights.worst.name}</strong></li>}
                    <li>Raise sell price by 10–15% on low-margin fruits</li>
                  </ul>
                </div>
              </>}
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab === 'history' && (
            <div className={s.histWrap}>
              {loading ? (
                <div className={s.noData}>Loading…</div>
              ) : history.length === 0 ? (
                <div className={s.noData}>📋 No saved entries yet.</div>
              ) : <>
                <div className={s.histHead}>
                  <span className={s.histCount}>{history.length} total entries</span>
                  <span className={s.histCount} style={{color:'#16a34a'}}>
                    {todayEntries.length} today
                  </span>
                </div>
                <div className={s.histList}>
                  {history.map(h => (
                    <div key={h.id}>
                      {editId === h.id ? (
                        /* ── Inline edit form ── */
                        <div className={s.editCard}>
                          <div className={s.rowFields}>
                            <div className={s.field}>
                              <label>Fruit</label>
                              <select className={s.sel} value={editRow.fruitName}
                                onChange={e => setEditRow({...editRow, fruitName: e.target.value})}>
                                <option value="">Select…</option>
                                {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className={s.field}>
                              <label>Unit</label>
                              <select className={s.sel} value={editRow.unit}
                                onChange={e => setEditRow({...editRow, unit: e.target.value})}>
                                {['kg','dozen','tray','unit','piece'].map(u => <option key={u}>{u}</option>)}
                              </select>
                            </div>
                            <div className={s.field}>
                              <label>Qty</label>
                              <input className={s.inp} type="number" value={editRow.quantity}
                                onChange={e => setEditRow({...editRow, quantity: e.target.value})} />
                            </div>
                            <div className={s.field}>
                              <label>Buy ₹</label>
                              <input className={s.inp} type="number" value={editRow.buyPrice}
                                onChange={e => setEditRow({...editRow, buyPrice: e.target.value})} />
                            </div>
                            <div className={s.field}>
                              <label>Sell ₹</label>
                              <input className={s.inp} type="number" value={editRow.sellPrice}
                                onChange={e => setEditRow({...editRow, sellPrice: e.target.value})} />
                            </div>
                          </div>
                          <div className={s.editActions}>
                            <button className={s.btnSave} onClick={saveEdit}>✓ Update</button>
                            <button className={s.btnReset} onClick={() => { setEditId(null); setEditRow(null); }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`${s.histRow} ${parseFloat(h.profit) < 0 ? s.histLoss : s.histOk}`}>
                          <div className={s.histLeft}>
                            <span className={s.histFruit}>{h.fruitName}</span>
                            <span className={s.histMeta}>{h.entryDate} · {h.quantity} {h.unit} · Buy ₹{h.buyPrice} → Sell ₹{h.sellPrice}</span>
                          </div>
                          <div className={s.histRight}>
                            <span className={parseFloat(h.profit) >= 0 ? s.green : s.red}
                              style={{fontSize:'.82rem',fontWeight:800}}>
                              {parseFloat(h.profit) >= 0 ? '+' : ''}₹{parseFloat(h.profit).toFixed(0)}
                            </span>
                            <span className={s.histMeta}>{parseFloat(h.margin).toFixed(1)}%</span>
                            <div className={s.histActions}>
                              <button className={s.editBtn} onClick={() => startEdit(h)}>✏️</button>
                              <button className={s.delBtn} onClick={() => deleteEntry(h.id)}>🗑</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
