export default function WalletTab({ wallet, withdrawForm, setWithdrawForm, handleWithdraw }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
        <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Dompet Penjual</h3>
        <div className="bg-green-100 border-2 border-black p-4">
          <span className="text-xs font-black uppercase text-gray-600">Saldo Siap Ditarik</span>
          <p className="text-3xl font-black text-green-800 mt-1">Rp {wallet.balance.toLocaleString('id-ID')}</p>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Pilih Bank / e-Wallet</label>
            <select
              value={withdrawForm.bank}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, bank: e.target.value })}
              className="w-full border-2 border-black p-2 text-xs font-bold bg-white"
            >
              <option value="BCA">Bank BCA</option>
              <option value="Mandiri">Bank Mandiri</option>
              <option value="BRI">Bank BRI</option>
              <option value="GoPay">GoPay / OVO</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Nomor Rekening / HP</label>
            <input
              type="text"
              required
              placeholder="Contoh: 8273918239"
              value={withdrawForm.accountNumber}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
              className="w-full border-2 border-black p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Nominal Penarikan (Rp)</label>
            <input
              type="number"
              required
              placeholder="Minimum 50000"
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
              className="w-full border-2 border-black p-2 text-xs font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white font-black py-3 text-xs uppercase border-2 border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
          >
            Tarik Dana Sekarang
          </button>
        </form>
      </div>

      <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
        <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Riwayat Penarikan</h3>
        <div className="space-y-3">
          {wallet.history.map((h) => (
            <div key={h.id} className="border-2 border-black p-3 flex justify-between items-center bg-gray-50">
              <div>
                <span className="font-black text-xs uppercase">{h.id}</span>
                <p className="text-[10px] font-bold text-gray-500">{h.bank} • {h.date}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-xs text-red-600">- Rp {h.amount.toLocaleString('id-ID')}</p>
                <span className="text-[9px] font-black uppercase bg-green-300 px-1 border border-black">{h.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}