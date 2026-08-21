export default function UsersTab({
  users,
  loading,
  actionId,
  filter,
  setFilter,
  roleLabels,
  onUserSuspend,
  formatDate,
}) {
  return (
    <div className="bg-white border-4 border-black p-6 shadow-brutal mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black uppercase">Manajemen Pengguna</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
        >
          <option value="all">Semua Peran</option>
          <option value="admin">Admin</option>
          <option value="seller">Penjual</option>
          <option value="buyer">Pembeli</option>
        </select>
      </div>

      {loading ? (
        <div className="p-4 font-black text-xs uppercase">Memuat data pengguna...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold border-collapse border-2 border-black">
            <thead>
              <tr className="bg-purple-400 text-black border-b-2 border-black uppercase">
                <th className="p-3 border-r-2 border-black">Username</th>
                <th className="p-3 border-r-2 border-black">Email</th>
                <th className="p-3 border-r-2 border-black">Role</th>
                <th className="p-3 border-r-2 border-black">Status</th>
                <th className="p-3 border-r-2 border-black">Bergabung</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black hover:bg-gray-50">
                  <td className="p-3 border-r-2 border-black font-black">@{u.username}</td>
                  <td className="p-3 border-r-2 border-black">{u.email}</td>
                  <td className="p-3 border-r-2 border-black">
                    <span className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase ${roleLabels[u.role]?.color || 'bg-gray-200'}`}>
                      {roleLabels[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td className="p-3 border-r-2 border-black">
                    <span className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase ${u.is_active ? 'bg-green-400 text-black' : 'bg-red-500 text-white'}`}>
                      {u.is_active ? 'AKTIF' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td className="p-3 border-r-2 border-black">{formatDate(u.date_joined)}</td>
                  <td className="p-3">
                    <button
                      disabled={actionId === u.id}
                      onClick={() => onUserSuspend(u, u.is_active ? 'suspend' : 'unsuspend')}
                      className={`px-2 py-1 border border-black text-[10px] font-black uppercase transition ${
                        u.is_active ? 'bg-red-500 text-white hover:bg-black' : 'bg-green-400 text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      {u.is_active ? 'Suspend' : 'Aktifkan'}
                    </button>
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