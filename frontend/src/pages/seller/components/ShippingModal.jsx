import { useState } from 'react';

export default function ShippingModal({ isOpen, onClose, onSubmit, selectedCourier = 'Reguler' }) {
  const [trackingNumber, setTrackingNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Auto-generate resi jika seller mengosongkan input
    const finalTracking = trackingNumber.trim() || `RESI-${Date.now().toString().slice(-8)}`;

    onSubmit({ 
      courierName: selectedCourier, 
      trackingNumber: finalTracking 
    });

    setTrackingNumber('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-brutal-lg space-y-4">
        <div className="flex justify-between items-center border-b-4 border-black pb-2">
          <h3 className="text-base font-black uppercase">📦 Input Resi Pengiriman</h3>
          <button
            type="button"
            onClick={onClose}
            className="font-black text-lg hover:text-red-500 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Menampilkan Ekspedisi Yang Dipilih Customer */}
          <div className="bg-yellow-100 border-2 border-black p-3">
            <span className="block text-[10px] font-black uppercase text-gray-600">Ekspedisi Pilihan Pembeli:</span>
            <p className="text-sm font-black uppercase text-black mt-0.5">🚚 {selectedCourier}</p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Nomor Resi Pengiriman</label>
            <input
              type="text"
              placeholder="Contoh: JNT123456789 (Kosongkan utk auto)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full border-2 border-black p-2 text-xs font-bold uppercase focus:bg-yellow-100"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-gray-200 border-2 border-black py-2 text-xs font-black uppercase shadow-brutal hover:bg-gray-300 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-1/2 bg-yellow-300 border-2 border-black py-2 text-xs font-black uppercase shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
            >
              Simpan Resi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}