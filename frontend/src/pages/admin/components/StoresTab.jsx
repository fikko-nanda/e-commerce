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
    <>
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="text-[10px] font-black uppercase text-gray-500">Filter:</span>
        {['all', 'active', 'pending_review', 'suspended', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-[10px] font-black uppercase px-3 py-1.5 border-2 border-black shadow-brutal transition ${
              filter === s ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
            }`}
          >
            {s === 'all' ? 'Semua' : statusLabels[s]?.label || s}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-3 mb-6">
        Daftar Toko / Seller ({stores.length})
      </h2>

      {loading ? (
        <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Daftar Toko...</div>
      ) : stores.length === 0 ? (
        <div className="bg-gray-50 border-4 border-black p-12 text-center font-black text-gray-400 uppercase">
          Tidak ada toko untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => {
            const badge = statusLabels[store.status] || { label: store.status, color: 'bg-gray-200' };
            return (
              <div
                key={store.id}
                className="bg-white border-4 border-black p-5 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-black text-base uppercase">{store.store_name}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 border border-black ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-600">
                    👤 {store.owner_username || store.owner_email} | 📞 {store.phone}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1">
                    📅 {formatDate(store.created_at)} | 📍 {store.address}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {store.status !== 'active' && (
                    <button
                      onClick={() => onStatusChange(store, 'active')}
                      disabled={actionId === store.id}
                      className="bg-green-400 font-black text-[10px] px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition disabled:opacity-50"
                    >
                      ✅ Aktifkan
                    </button>
                  )}
                  {store.status !== 'suspended' && (
                    <button
                      onClick={() => onStatusChange(store, 'suspended')}
                      disabled={actionId === store.id}
                      className="bg-gray-700 text-white font-black text-[10px] px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black transition disabled:opacity-50"
                    >
                      ⛔ Suspend
                    </button>
                  )}
                  {store.status !== 'rejected' && (
                    <button
                      onClick={() => onStatusChange(store, 'rejected')}
                      disabled={actionId === store.id}
                      className="bg-red-400 text-white font-black text-[10px] px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black transition disabled:opacity-50"
                    >
                      🚫 Tolak
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}