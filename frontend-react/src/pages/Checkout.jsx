import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUserAuth } from '../context/UserAuthContext';
import { useToast } from '../context/ToastContext';
import { useLocation2, FAST_DELIVERY_KM } from '../context/LocationContext';
import { authApi, orderApi, miscApi } from '../api/services';

const inputCls = "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:bg-gray-700 dark:text-white transition-all";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user }    = useUserAuth();
  const { show }    = useToast();
  const { location, isInFastZone, setShowModal } = useLocation2();
  const navigate    = useNavigate();

  const [paySettings,   setPaySettings]   = useState(null);
  const [houseNo,       setHouseNo]       = useState('');
  const [street,        setStreet]        = useState('');
  const [city,          setCity]          = useState('');
  const [pincode,       setPincode]       = useState('');
  const [receiverName,  setReceiverName]  = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [orderType,     setOrderType]     = useState('fast');
  const [payMethod,     setPayMethod]     = useState('COD');
  const [utrRef,        setUtrRef]        = useState('');
  const [placing,       setPlacing]       = useState(false);
  const [loadProfile,   setLoadProfile]   = useState(true);

  const deliveryFee        = total >= 299 ? 0 : 30;
  const grandTotal         = total + deliveryFee;
  const isBlocked          = isInFastZone === false && orderType !== 'bulk';
  const fullAddressPreview = [houseNo, street, city, pincode].filter(Boolean).join(', ');

  useEffect(() => {
    if (!user?.userId) return;
    authApi.getProfile(user.userId)
      .then(r => {
        setStreet(r.data.address || '');
        setCity(location?.label || '');
        setReceiverName(r.data.receiverName || r.data.name || '');
        setReceiverPhone(r.data.receiverMobile || '');
      })
      .catch(() => setCity(location?.label || ''))
      .finally(() => setLoadProfile(false));
    miscApi.getPaySettings().then(r => setPaySettings(r.data)).catch(() => {});
  }, [user?.userId]);

  useEffect(() => { if (items.length === 0 && !placing) navigate('/cart'); }, [items.length]);

  const placeOrder = async () => {
    if (isBlocked)                              { show('Delivery not available at your location', 'error'); return; }
    if (!houseNo.trim())                        { show('Please enter house / flat number', 'error'); return; }
    if (!city.trim())                           { show('Please enter city', 'error'); return; }
    if (!pincode.trim() || pincode.length < 6)  { show('Please enter a valid 6-digit pincode', 'error'); return; }
    if (!receiverName.trim())                   { show('Please enter receiver name', 'error'); return; }
    if (!receiverPhone.trim())                  { show('Please enter receiver phone', 'error'); return; }
    if (payMethod === 'ONLINE' && !utrRef.trim()) { show('Please enter UTR / transaction reference', 'error'); return; }

    setPlacing(true);
    try {
      const tag = orderType === 'bulk' ? '[BULK] ' : '';
      const fullAddress = `${tag}${receiverName} · ${receiverPhone} | ${fullAddressPreview}`;
      const payload = {
        userId:          user.userId,
        totalAmount:     grandTotal.toFixed(2),
        deliveryAddress: fullAddress,
        paymentMethod:   payMethod,
        paymentId:       payMethod === 'ONLINE' ? utrRef.trim() : 'COD',
        items: items.map(i => ({
          productId:   i.productId,
          productName: i.productName,
          quantity:    i.quantity,
          price:       parseFloat(i.price).toFixed(2),
        })),
      };
      const r = await orderApi.place(payload);
      navigate('/order-success', { state: { order: r.data }, replace: true });
      clearCart();
    } catch (err) {
      show(err.response?.data?.message || err.response?.data?.error || 'Failed to place order', 'error');
    } finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-36">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/cart')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-base font-black text-gray-900 dark:text-white flex-1">Checkout</h1>
          <span className="text-xs text-gray-400 shrink-0">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Single centered column */}
      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">

        {/* Delivery zone banner */}
        {location && (
          <div className={`rounded-2xl p-3.5 border flex items-start gap-3 ${
            isInFastZone === false
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <span className="text-lg shrink-0">{isInFastZone === false ? '⚠️' : '⚡'}</span>
            <div className="flex-1 min-w-0">
              {isInFastZone === false ? (
                <>
                  <p className="font-bold text-orange-700 dark:text-orange-400 text-sm">Outside fast delivery zone</p>
                  <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                    {location.label}{location.distKm ? ` (${location.distKm} km)` : ''} — beyond {FAST_DELIVERY_KM} km from Warangal.
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button onClick={() => setOrderType('bulk')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${orderType === 'bulk' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-gray-800 text-orange-600 border-orange-300'}`}>
                      📦 Bulk Order
                    </button>
                    <button onClick={() => setShowModal(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                      📍 Change location
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  ⚡ Fast delivery to {location.label}
                  {location.distKm != null && <span className="font-normal text-xs text-green-600 dark:text-green-500"> · {location.distKm} km</span>}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Hard block */}
        {isBlocked ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-3">😔</div>
            <h3 className="font-black text-red-700 dark:text-red-400 text-base mb-2">Sorry, we don't deliver here yet</h3>
            <p className="text-sm text-red-600 dark:text-red-500 mb-4">Fast delivery within <strong>{FAST_DELIVERY_KM} km</strong> of Warangal only.</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={() => setOrderType('bulk')} className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm">📦 Bulk Order</button>
              <button onClick={() => setShowModal(true)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm">📍 Change Location</button>
            </div>
          </div>
        ) : (
          <>
            {/* Bulk notice */}
            {orderType === 'bulk' && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Bulk Order</p>
                  <p className="text-xs text-orange-600 dark:text-orange-500">Delivery anywhere · longer lead time</p>
                </div>
                <button onClick={() => setOrderType('fast')} className="text-xs text-gray-400 underline shrink-0">Switch</button>
              </div>
            )}

            {/* Step 1 — Address */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                Delivery Address
              </h2>

              {/* GPS quick-fill */}
              {location?.label && !city && (
                <button type="button" onClick={() => setCity(location.label)}
                  className="w-full flex items-center gap-2.5 p-3 mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">Use current location for city</p>
                    <p className="text-xs text-green-600 dark:text-green-500 truncate">{location.label}</p>
                  </div>
                  <span className="text-xs text-green-600 font-semibold shrink-0">Use →</span>
                </button>
              )}

              {loadProfile ? <div className="h-40 skeleton rounded-xl" /> : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">House / Flat No. *</label>
                    <input value={houseNo} onChange={e => setHouseNo(e.target.value)} placeholder="e.g. 48-2-67, Flat 3B" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Street / Area / Landmark</label>
                    <input value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. Mogilicherla, Near Bus Stand" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">City *</label>
                      <input value={city} onChange={e => setCity(e.target.value)} placeholder="Warangal" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Pincode *</label>
                      <input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="506001" inputMode="numeric" maxLength={6} className={inputCls} />
                    </div>
                  </div>
                  {fullAddressPreview && (
                    <div className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className="text-green-600 text-sm shrink-0">📍</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{fullAddressPreview}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2 — Receiver */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                Receiver Details
              </h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Name *</label>
                  <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Full name of receiver" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 block">Phone *</label>
                  <input value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" inputMode="tel" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Step 3 — Payment */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">3</span>
                Payment
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'COD',    label: '💵 Cash on Delivery', sub: 'Pay when order arrives' },
                  { val: 'ONLINE', label: '📱 UPI / GPay',        sub: 'Pay now & enter transaction ID' },
                ].map(opt => (
                  <label key={opt.val} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${payMethod === opt.val ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                    <input type="radio" name="pay" value={opt.val} checked={payMethod === opt.val} onChange={() => setPayMethod(opt.val)} className="accent-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              {payMethod === 'ONLINE' && (
                <div className="mt-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  {paySettings ? (
                    <>
                      {paySettings.upiId && <p className="text-sm mb-1"><span className="text-xs text-gray-500">UPI: </span><span className="font-bold text-blue-700 dark:text-blue-400">{paySettings.upiId}</span></p>}
                      {paySettings.upiName && <p className="text-sm mb-2"><span className="text-xs text-gray-500">Name: </span><span className="font-semibold text-gray-700 dark:text-gray-300">{paySettings.upiName}</span></p>}
                      {paySettings.qrImage && <img src={paySettings.qrImage} alt="QR" className="w-28 h-28 object-contain rounded-lg border border-gray-200 mb-3" />}
                      {paySettings.instructions && <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{paySettings.instructions}</p>}
                    </>
                  ) : <p className="text-xs text-gray-500 mb-2">Loading payment details…</p>}
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">UTR / Transaction ID *</label>
                  <input value={utrRef} onChange={e => setUtrRef(e.target.value)} placeholder="Enter UTR after payment" className={inputCls} />
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Order Summary</h2>
              <div className="flex flex-col gap-1.5 mb-3">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">{item.productName} × {item.quantity}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200 shrink-0">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-gray-100 dark:border-gray-700 mb-2" />
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>₹{total.toFixed(0)}</span></div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                {deliveryFee > 0 && <p className="text-[10px] text-gray-400">Add ₹{(299 - total).toFixed(0)} more for free delivery</p>}
                <hr className="border-gray-100 dark:border-gray-700" />
                <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base"><span>Total</span><span>₹{grandTotal.toFixed(0)}</span></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Place Order button — bottom, above bottom nav */}
      {!isBlocked && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t-2 border-gray-100 dark:border-gray-800 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Total payable</span>
                {deliveryFee > 0 && <p className="text-[10px] text-gray-400">Incl. ₹{deliveryFee} delivery</p>}
              </div>
              <span className="font-black text-gray-900 dark:text-white text-xl">₹{grandTotal.toFixed(0)}</span>
            </div>
            <button onClick={placeOrder} disabled={placing}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg text-base">
              {placing
                ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" /> Placing Order…</>
                : <>🛒 Place Order — ₹{grandTotal.toFixed(0)}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
