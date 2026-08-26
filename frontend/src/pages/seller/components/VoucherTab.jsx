export default function VoucherTab({ vouchers, setIsVoucherModalOpen }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-brutal">
        <div>
          <h3 className="font-black text-base uppercase">Voucher Toko Saya</h3>
          <p className="text-xs font-bold text-gray-600">Tingkatkan penjualan dengan memberikan diskon belanja.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsVoucherModalOpen(true)}
          className="bg-yellow-300 font-black px-4 py-2 text-xs uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
        >
          + Buat Voucher Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((v) => (
          <div key={v.id} className="bg-white border-4 border-black p-4 shadow-brutal flex justify-between items-center bg-gradient-to-r from-yellow-100 to-white">
            <div>
              <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                KODE: {v.code}
              </span>
              <h4 className="text-xl font-black mt-2">Diskon {v.discount}</h4>
              <p className="text-[10px] font-bold text-gray-600">Min. Belanja: Rp {v.minSpend.toLocaleString('id-ID')}</p>
              <p className="text-[10px] font-bold text-gray-500">Kuota Terpakai: {v.used} / {v.quota}</p>
            </div>
            <div>
              <span className={`text-xs font-black px-3 py-1 border-2 border-black uppercase shadow-brutal ${
                v.status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300'
              }`}>
                {v.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}