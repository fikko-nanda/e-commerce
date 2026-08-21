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
    <div className="bg-white border-4 border-black p-6 shadow-brutal mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black uppercase">Manajemen Toko</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="pending_review">Menunggu Verifikasi</option>
          <option value="rejected">Ditolak</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="p-4 font-black text-xs uppercase">Memuat data toko...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold border-collapse border-2 border-black">
            <thead>
              <tr className="bg-yellow-300 text-black border-b-2 border-black uppercase">
                <th className="p-3 border-r-2 border-black">Nama Toko</th>
                <th className="p-3 border-r-2 border-black">Pemilik</th>
                <th className="p-3 border-r-2 border-black">Status</th>
                <th className="p-3 border-r-2 border-black">Tanggal</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-black hover:bg-gray-50">
                  <td className="p-3 border-r-2 border-black font-black">{s.store_name}</td>
                  <td className="p-3 border-r-2 border-black">{s.owner_email}</td>
                  <td className="p-3 border-r-2 border-black">
                    <span className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase ${statusLabels[s.status]?.color || 'bg-gray-200'}`}>
                      {statusLabels[s.status]?.label || s.status}
                    </span>
                  </td>
                  <td className="p-3 border-r-2 border-black">{formatDate(s.created_at)}</td>
                  <td className="p-3 flex gap-1">
                    {s.status !== 'active' && (
                      <button
                        disabled={actionId === s.id}
                        onClick={() => onStatusChange(s, 'active')}
                        className="bg-green-400 text-black px-2 py-1 border border-black text-[10px] font-black uppercase hover:bg-black hover:text-white transition"
                      >
                        Aktifkan
                      </button>
                    )}
                    {s.status !== 'suspended' && (
                      <button
                        disabled={actionId === s.id}
                        onClick={() => onStatusChange(s, 'suspended')}
                        className="bg-red-500 text-white px-2 py-1 border border-black text-[10px] font-black uppercase hover:bg-black transition"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}