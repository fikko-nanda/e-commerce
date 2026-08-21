import { useState } from 'react';
import { orderService } from '../services';
import { payWithMidtrans } from '../utils/loadSnap';

export default function CheckoutModal({ product, isOpen, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('midtrans');
  const [shippingAddress, setShippingAddress] = useState('Utama');
  const [customAddress, setCustomAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Alamat tersimpan simulasi / local
  const savedAddresses = [
    { id: 'Utama', label: '🏠 Rumah (Jl. Sudirman No. 123, Jakarta Pusat)' },
    { id: 'Kantor', label: '🏢 Kantor (Gedung Sahid Center Lt. 5, Jakarta Selatan)' },
    { id: 'Lainnya', label: '✏️ Tulis Alamat Baru...' },
  ];

  if (!isOpen || !product) return null;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalAddress = shippingAddress === 'Lainnya' 
      ? customAddress 
      : savedAddresses.find(a => a.id === shippingAddress)?.label;

    try {
      const payload = {
        product_id: product.id,
        quantity: quantity,
        payment_method: paymentMethod,
        shipping_address: finalAddress || 'Alamat Utama',
        notes: notes,
      };

      const res = await orderService.checkout(payload);
      const { order, snap_token } = res.data;

      if (paymentMethod === 'midtrans' && snap_token) {
        payWithMidtrans(
          snap_token,
          async () => {
            try {
              await orderService.markSuccess(order.id);
            } catch (err) {
              console.error('Gagal memperbarui status ke PAID:', err);
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
      } else {
        alert('Pesanan COD Berhasil Dibuat!');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal melakukan checkout');
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
              Rp {Number(product.price).toLocaleString('id-ID')} / item
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
                <option key={addr.id} value={addr.id}>{addr.label}</option>
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
              Rp {(product.price * quantity).toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 font-black text-xs uppercase py-2.5 border-2 border-black"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white font-black text-xs uppercase py-2.5 border-2 border-black hover:bg-green-400 hover:text-black transition"
            >
              {loading ? 'Memproses...' : 'Lanjut Bayar⚡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}