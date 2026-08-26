export default function StoresTab({
  stores,
  loading,
  actionId,
  filter,
  setFilter,
  statusLabels,
  onStatusChange,
  formatDate,
}) {
  return (
    <div className="bg-white border-4 border-black p-6 shadow-brutal mt-4 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black pb-4">
        <div>
          <h2 className="text-xl font-black uppercase">Manajemen Toko</h2>
          <p className="text-xs text-gray-600 font-bold">Verifikasi atau tangguhkan toko yang melanggar aturan.</p>
        </div>

        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border-2 border-black px-3 py-2 text-xs font-black uppercase focus:outline-none shadow-brutal cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending_review">Menunggu Review</option>
            <option value="suspended">Suspend</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 font-black text-gray-400 uppercase">Memuat Data Toko...</div>
      ) : stores.length === 0 ? (
        <div className="text-center py-10 font-black text-gray-500 uppercase">Tidak ada toko ditemukan.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold border-collapse border-2 border-black">
            <thead>
              <tr className="bg-yellow-300 border-b-2 border-black text-black uppercase">
                <th className="p-3 border-r-2 border-black">Nama Toko</th>
                <th className="p-3 border-r-2 border-black">Pemilik</th>
                <th className="p-3 border-r-2 border-black">Status</th>
                <th className="p-3 border-r-2 border-black">Tanggal</th>
                <th className="p-3">Aksi Moderasi</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => {
                const currentStatus = store.status || 'pending_review';
                const statusMeta = statusLabels[currentStatus] || {
                  label: currentStatus.toUpperCase(),
                  color: 'bg-gray-200 text-black',
                };
                
                const isPending = currentStatus === 'pending_review' || currentStatus === 'pending';
                const isSuspended = currentStatus === 'suspended';
                const isLoading = actionId === store.id;

                return (
                  <tr key={store.id || store.store_name} className="border-b border-black hover:bg-gray-50">
                    <td className="p-3 border-r-2 border-black font-black uppercase">{store.store_name}</td>
                    <td className="p-3 border-r-2 border-black">{store.owner_email || store.email || '-'}</td>
                    <td className="p-3 border-r-2 border-black">
                      <span className={`px-2 py-1 text-[10px] font-black border border-black uppercase ${
                        isSuspended ? 'bg-red-500 text-white' : isPending ? 'bg-orange-300 text-black' : statusMeta.color
                      }`}>
                        {isSuspended ? 'TER-SUSPEND' : isPending ? 'MENUNGGU ACC' : statusMeta.label}
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-black">{formatDate(store.created_at || new Date())}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {isLoading ? (
                          <span className="text-[10px] font-black uppercase text-gray-500">Memproses...</span>
                        ) : isPending ? (
                          /* Jika toko baru mendaftar / PENDING ACC */
                          <>
                            <button
                              type="button"
                              onClick={() => onStatusChange(store, 'active')}
                              className="px-3 py-1 bg-green-400 text-black border border-black text-[10px] uppercase font-black transition shadow-brutal hover:bg-black hover:text-white cursor-pointer"
                            >
                              ✓ Setujui (ACC)
                            </button>
                            <button
                              type="button"
                              onClick={() => onStatusChange(store, 'rejected')}
                              className="px-3 py-1 bg-red-500 text-white border border-black text-[10px] uppercase font-black transition shadow-brutal hover:bg-black cursor-pointer"
                            >
                              ✕ Tolak
                            </button>
                          </>
                        ) : (
                          /* Jika toko sudah AKTIF atau SUSPEND */
                          <button
                            type="button"
                            onClick={() => onStatusChange(store, isSuspended ? 'active' : 'suspended')}
                            className={`px-3 py-1 border border-black text-[10px] uppercase font-black transition shadow-brutal cursor-pointer ${
                              isSuspended
                                ? 'bg-green-400 text-black hover:bg-black hover:text-white'
                                : 'bg-red-500 text-white hover:bg-black'
                            }`}
                          >
                            {isSuspended ? '✓ Aktifkan Kembali' : '🚫 Suspend'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}