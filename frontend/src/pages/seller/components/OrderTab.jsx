export default function OrderTab({ loadingOrders, orders, setShippingModalOrderId, handleConfirmPayStatus, handleUpdateOrderStatus }) {
  if (loadingOrders) {
    return <div className="bg-white border-4 border-black p-6 shadow-brutal font-black text-xs uppercase text-gray-400">Memuat pesanan...</div>;
  }

  if (orders.length === 0) {
    return <div className="bg-white border-4 border-black p-6 shadow-brutal font-black text-xs uppercase text-gray-500">Belum ada pesanan masuk.</div>;
  }

  return (
    <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
      <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Daftar Pesanan Masuk</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-4 border-black bg-gray-100 text-xs uppercase font-black">
              <th className="p-3 border-r-2 border-black">ID</th>
              <th className="p-3 border-r-2 border-black">Pembeli</th>
              <th className="p-3 border-r-2 border-black">Item</th>
              <th className="p-3 border-r-2 border-black">Total</th>
              <th className="p-3 border-r-2 border-black">Status</th>
              <th className="p-3">Aksi Seller</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black text-xs font-bold">
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-yellow-50">
                <td className="p-3 font-black border-r-2 border-black">#{String(ord.id).substring(0, 8)}...</td>
                <td className="p-3 border-r-2 border-black">{ord.customer}</td>
                <td className="p-3 border-r-2 border-black">{ord.items}</td>
                <td className="p-3 font-black border-r-2 border-black">Rp {ord.total.toLocaleString('id-ID')}</td>
                <td className="p-3 border-r-2 border-black">
                  <span className={`px-2 py-1 text-[10px] font-black border border-black uppercase ${
                    ord.status === 'Perlu Dikirim' ? 'bg-yellow-350' : ord.status === 'Dikirim' ? 'bg-blue-300' : ord.status === 'Selesai' ? 'bg-green-400' : 'bg-orange-300'
                  }`}>
                    {ord.status}
                  </span>
                  {ord.tracking_number && (
                    <div className="mt-1 text-[9px] font-black text-gray-600 uppercase">
                      {ord.courier_name} • <span className="text-black bg-yellow-100 px-1 border border-black">{ord.tracking_number}</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {ord.status !== 'Selesai' && (
                      <button type="button" onClick={() => setShippingModalOrderId(ord.id)} className="bg-black text-white px-2.5 py-1 font-black text-[10px] uppercase border border-black shadow-brutal hover:bg-yellow-300 hover:text-black cursor-pointer">
                        📦 Atur Pengiriman
                      </button>
                    )}
                    {ord.payment_status !== 'paid' && (
                      <button type="button" onClick={() => handleConfirmPayStatus(ord.id)} className="bg-green-400 text-black px-2.5 py-1 font-black text-[10px] uppercase border border-black shadow-brutal hover:bg-black hover:text-white cursor-pointer">
                        ✓ Set Lunas
                      </button>
                    )}
                    {ord.status === 'Dikirim' && (
                      <button type="button" onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')} className="bg-green-500 text-white px-2.5 py-1 font-black text-[10px] uppercase border border-black shadow-brutal hover:bg-black cursor-pointer">
                        Selesaikan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}