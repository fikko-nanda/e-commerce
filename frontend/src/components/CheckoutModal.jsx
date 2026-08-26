import { useState } from 'react';
import orderService from '../services/orderService';
import { payWithMidtrans } from '../utils/loadSnap';

export default function CheckoutModal({ product, isOpen, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [shippingAddress, setShippingAddress] = useState('Utama');
  const [customAddress, setCustomAddress] = useState('');
  const [courier, setCourier] = useState('J&T Express');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Alamat tersimpan simulasi / local
  const savedAddresses = [
    { id: 'Utama', label: '🏠 Rumah (Jl. Sudirman No. 123, Jakarta Pusat)' },
    { id: 'Kantor', label: '🏢 Kantor (Gedung Sahid Center Lt. 5, Jakarta Selatan)' },
    { id: 'Lainnya', label: '✏️ Tulis Alamat Baru...' },
  ];

  // Opsi Pilihan Ekspedisi
  const courierOptions = [
    { id: 'J&T Express', label: '🚀 J&T Express (Regular)' },
    { id: 'JNE Express', label: '📦 JNE REG' },
    { id: 'SiCepat', label: '⚡ SiCepat Halu' },
    { id: 'Shopee Express', label: '🚚 Shopee Express Standard' },
    { id: 'Pos Indonesia', label: '📮 Pos Indonesia Kilat Khusus' },
  ];

  if (!isOpen || !product) return null;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const rawAddress =
      shippingAddress === 'Lainnya'
        ? customAddress
        : savedAddresses.find((a) => a.id === shippingAddress)?.label;

    const finalAddress = `[${courier}] ${rawAddress || 'Alamat Utama'}`;

    try {
      const payload = {
        product_id: product.id,
        quantity: quantity,
        payment_method: paymentMethod, // 'midtrans' atau 'cod'
        shipping_address: finalAddress,
        courier_name: courier,
        notes: notes,
      };

      // Panggil service yang tersedia
      const submitFn = orderService.createCheckout || orderService.checkout;
      const res = await submitFn(payload);

      // Ekstrak data dari respons Django
      const resData = res?.data || res;
      const snapToken = resData?.snap_token;
      const redirectUrl = resData?.redirect_url;
      const orderData = resData?.order || resData?.data || resData;
      const activeOrderId = orderData?.id || resData?.id;

      if (paymentMethod === 'midtrans') {
        if (snapToken && typeof payWithMidtrans === 'function') {
          payWithMidtrans(
            snapToken,
            async () => {
              try {
                if (activeOrderId && typeof orderService.markSuccess === 'function') {
                  await orderService.markSuccess(activeOrderId);
                }
              } catch (err) {
                console.warn('Handling callback status update:', err);
              } finally {
                onClose();
                if (onSuccess) onSuccess();
              }
            },
            () => {
              alert('Pembayaran Gagal atau Dibatalkan.');
              setLoading(false);
            }
          );
        } else if (redirectUrl) {
          // Fallback jika menggunakan Snap Redirect URL
          window.location.href = redirectUrl;
        } else {
          alert('⚠️ Fitur Midtrans belum siap (Server Key belum diset di backend). Mengalihkan pesanan...');
          onClose();
          if (onSuccess) onSuccess();
        }
      } else {
        alert('🎉 Pesanan COD Berhasil Dibuat!');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Checkout Error:', err.response?.data || err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Gagal melakukan checkout. Periksa kembali kelengkapan data.';
      alert(`❌ ${errMsg}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-brutal-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">
          Checkout Produk
        </h3>

        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <div>
            <p className="font-black text-sm uppercase">{product.name}</p>
            <p className="text-xs font-bold text-gray-500">
              Rp {Number(product.price || 0).toLocaleString('id-ID')} / item
            </p>
          </div>

          <div>
            <label className="block font-black text-xs uppercase mb-1">Jumlah:</label>
            <input
              type="number"
              min="1"
              max={product.stock || 99}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border-2 border-black p-2 font-bold text-sm"
            />
          </div>

          {/* Opsi Pilih Alamat Pengiriman */}
          <div>
            <label className="block font-black text-xs uppercase mb-1">📍 Alamat Pengiriman:</label>
            <select
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold text-xs bg-white mb-2"
            >
              {savedAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.label}
                </option>
              ))}
            </select>

            {shippingAddress === 'Lainnya' && (
              <textarea
                placeholder="Masukkan alamat lengkap pengiriman..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                required
                className="w-full border-2 border-black p-2 font-bold text-xs h-20"
              />
            )}
          </div>

          {/* Opsi Pilih Ekspedisi Pengiriman */}
          <div>
            <label className="block font-black text-xs uppercase mb-1">🚚 Ekspedisi Pengiriman:</label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold text-xs bg-white"
            >
              {courierOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Catatan untuk Penjual */}
          <div>
            <label className="block font-black text-xs uppercase mb-1">📝 Catatan Pesanan (Opsional):</label>
            <input
              type="text"
              placeholder="Contoh: Warna merah, ukuran L"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold text-xs"
            />
          </div>

          <div>
            <label className="block font-black text-xs uppercase mb-1">💳 Metode Pembayaran:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border-2 border-black p-2 font-bold text-sm bg-white"
            >
              <option value="midtrans">Midtrans (QRIS/Transfer/GoPay)</option>
              <option value="cod">Cash On Delivery (COD)</option>
            </select>
          </div>

          <div className="pt-2 border-t-2 border-black flex justify-between items-center">
            <span className="font-black text-xs uppercase">Total Bayar:</span>
            <span className="font-black text-lg bg-yellow-300 px-2 border border-black">
              Rp {(Number(product.price || 0) * quantity).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 font-black text-xs uppercase py-2.5 border-2 border-black cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white font-black text-xs uppercase py-2.5 border-2 border-black hover:bg-green-400 hover:text-black transition cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Lanjut Bayar⚡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}