import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authService } from '../../services';

export default function UserProfile() {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // name adalah property (first_name or username) — kirim sebagai first_name
      const res = await authService.updateMe({
        first_name: name,
        phone,
        address,
      });
      setUser(res.data);
      alert('Profil berhasil diperbarui!');
    } catch (err) {
      console.error('Gagal update profil:', err);
      alert('Gagal mengedit profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-8">
        Pengaturan Profil
      </h2>

      <form onSubmit={handleSave} className="bg-white border-4 border-black p-8 space-y-6 shadow-brutal">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Email (Tidak dapat diubah)</label>
          <input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            className="w-full bg-gray-200 border-2 border-black p-2.5 font-bold text-sm cursor-not-allowed" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Nama Lengkap</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none focus:bg-yellow-100" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Nomor Telepon</label>
          <input 
            type="text" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none focus:bg-yellow-100" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Alamat Utama</label>
          <textarea 
            rows={3} 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="w-full bg-gray-50 border-2 border-black p-2.5 font-bold text-sm focus:outline-none focus:bg-yellow-100" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-black text-white font-black py-4 uppercase tracking-wider hover:bg-yellow-300 hover:text-black border-2 border-black transition disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}