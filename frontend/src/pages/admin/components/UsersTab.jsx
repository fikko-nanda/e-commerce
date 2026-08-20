export default function UsersTab({
  users,
  loading,
  actionId,
  filter,
  setFilter,
  roleLabels,
  statusLabels,
  onUserSuspend,
  formatDate,
}) {
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="text-[10px] font-black uppercase text-gray-500">Filter Role:</span>
        {['all', 'admin', 'seller', 'buyer'].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`text-[10px] font-black uppercase px-3 py-1.5 border-2 border-black shadow-brutal transition ${
              filter === r ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'
            }`}
          >
            {r === 'all' ? 'Semua' : roleLabels[r]?.label || r}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-3 mb-6">
        Daftar User ({users.length})
      </h2>

      {loading ? (
        <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Daftar User...</div>
      ) : users.length === 0 ? (
        <div className="bg-gray-50 border-4 border-black p-12 text-center font-black text-gray-400 uppercase">
          Tidak ada user untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const roleBadge = roleLabels[u.role] || { label: u.role, color: 'bg-gray-200' };
            return (
              <div
                key={u.id}
                className="bg-white border-4 border-black p-5 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-black text-sm uppercase">{u.username}</h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 border border-black ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 border border-black ${
                        u.is_active ? 'bg-green-400 text-black' : 'bg-gray-700 text-white'
                      }`}
                    >
                      {u.is_active ? 'AKTIF' : 'SUSPEND'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-600">
                    ✉️ {u.email} | 📅 {formatDate(u.date_joined)}
                  </p>
                  {u.store_name && (
                    <p className="text-[10px] font-bold text-gray-500 mt-1">
                      🏪 {u.store_name}
                      {u.store_status ? ` (${statusLabels[u.store_status]?.label || u.store_status})` : ''}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {u.is_active ? (
                    <button
                      onClick={() => onUserSuspend(u, 'suspend')}
                      disabled={actionId === u.id}
                      className="bg-gray-700 text-white font-black text-[10px] px-4 py-2 uppercase border-2 border-black shadow-brutal hover:bg-red-500 transition disabled:opacity-50"
                    >
                      ⛔ Suspend User
                    </button>
                  ) : (
                    <button
                      onClick={() => onUserSuspend(u, 'unsuspend')}
                      disabled={actionId === u.id}
                      className="bg-green-400 font-black text-[10px] px-4 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition disabled:opacity-50"
                    >
                      ✅ Aktifkan
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