import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';

export default function UserProfile() {
  const { user, setUser } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Sinkronkan form state saat data user dari context siap / dimuat ulang
  useEffect(() => {
    if (user) {
      setName(user.first_name || user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await authService.updateMe({
        first_name: name,
        phone,
        address,
      });

      const updatedUser = res.data;

      // Perbarui context dan localStorage agar data tetap tersimpan saat refresh
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setStatus({
        type: 'success',
        message: 'Profil berhasil diperbarui!',
      });
    } catch (err) {
      console.error('Gagal update profil:', err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Gagal mengedit profil. Silakan coba lagi.';

      setStatus({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          Pengaturan Profil
        </h2>
        {user?.role && (
          <span className="bg-yellow-300 border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-brutal">
            {user.role}
          </span>
        )}
      </div>

      {/* Banner Pesan Status */}
      {status.message && (
        <div
          className={`mb-6 p-4 border-2 border-black font-bold text-sm shadow-brutal ${
            status.type === 'success' ? 'bg-green-300' : 'bg-red-300'
          }`}
        >
          {status.message}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white border-4 border-black p-8 space-y-6 shadow-brutal-lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full bg-gray-200 border-2 border-black p-2.5 font-bold text-xs cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">
              Email (Tidak dapat diubah)
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-gray-200 border-2 border-black p-2.5 font-bold text-xs cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none focus:bg-yellow-100"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase mb-1">
            Nomor Telepon
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="081234567890"
            className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none focus:bg-yellow-100"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase mb-1">
            Alamat Utama
          </label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Jl. Merdeka No. 123..."
            className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none focus:bg-yellow-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white font-black py-4 uppercase tracking-wider text-xs border-2 border-black hover:bg-yellow-300 hover:text-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}