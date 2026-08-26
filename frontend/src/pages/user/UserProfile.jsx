import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services';

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext) || {};
  const { addToCart } = useContext(CartContext) || {};
  const { showToast } = useToast() || {};

  const [activeTab, setActiveTab] = useState('profile');

  // 1. Inisialisasi Wishlist via Lazy State (Bebas dari Warning useEffect)
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('warmart_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 2. Inisialisasi Form Data langsung dari object user
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phone_number || '',
    bio: user?.bio || '',
  });

  // 3. Update Form Data jika user berganti/di-fetch ulang (Hanya saat tidak dalam mode edit)
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || user.phone_number || '',
        bio: user.bio || '',
      });
    }
  }, [user?.first_name, user?.last_name, user?.email, user?.phone, user?.phone_number, user?.bio, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let updatedUserData = { ...user, ...formData };

      try {
        const res = await userService.updateProfile(formData);
        if (res?.data?.data) {
          updatedUserData = res.data.data;
        } else if (res?.data) {
          updatedUserData = { ...user, ...res.data };
        }
      } catch (err) {
        console.warn('Gagal sync ke API, memperbarui profil secara lokal:', err);
      }

      if (setUser) setUser(updatedUserData);
      localStorage.setItem('user', JSON.stringify(updatedUserData));

      if (showToast) showToast('Profil berhasil diperbarui! 🎉', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Gagal memperbarui profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || user?.phone_number || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  const handleRemoveFromWishlist = (productId) => {
    const updated = wishlist.filter((item) => String(item.id) !== String(productId));
    localStorage.setItem('warmart_wishlist', JSON.stringify(updated));
    setWishlist(updated);
    if (showToast) showToast('Produk dihapus dari wishlist', 'info');
  };

  const handleAddToCart = (product) => {
    if (addToCart) {
      addToCart({ ...product, quantity: 1 });
      if (showToast) showToast(`${product.name} masuk keranjang!`, 'success');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header Halaman */}
      <div className="flex flex-wrap justify-between items-center mb-8 border-b-4 border-black pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">👤 Profil Saya</h1>
          <p className="text-xs font-bold text-gray-600 mt-1">Kelola data diri & daftar produk favorit Anda</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-white font-black text-xs uppercase px-4 py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
        >
          ← Kembali Belanja
        </button>
      </div>

      {/* Tab Navigasi */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`font-black text-xs uppercase px-5 py-2.5 border-2 border-black shadow-brutal transition ${
            activeTab === 'profile' ? 'bg-yellow-300 text-black' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          ⚙️ Pengaturan Profil
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`font-black text-xs uppercase px-5 py-2.5 border-2 border-black shadow-brutal transition flex items-center gap-2 ${
            activeTab === 'wishlist' ? 'bg-yellow-300 text-black' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          ❤️ Wishlist Saya
          {wishlist.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 border border-black font-black">
              {wishlist.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: INFORMASI & EDIT PROFIL */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card Avatar / Ringkasan Akun */}
          <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center font-black text-4xl mb-4 shadow-brutal">
              👤
            </div>
            <h3 className="font-black text-lg uppercase mb-1">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Pengguna'}
            </h3>
            <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 uppercase mb-4">
              Role: {user?.role || 'BUYER'}
            </span>
            <p className="text-xs font-bold text-gray-800 break-all">{user?.email || 'email@example.com'}</p>
          </div>

          {/* Form Detail & Edit Profil */}
          <div className="md:col-span-2 bg-white border-4 border-black p-6 shadow-brutal-lg">
            <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
              <h3 className="font-black text-base uppercase">Informasi Akun</h3>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-yellow-300 font-black text-xs uppercase px-3 py-1.5 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
                >
                  ✏️ Edit Profil
                </button>
              ) : (
                <span className="bg-red-500 text-white font-black text-[10px] uppercase px-2 py-1 border border-black">
                  Mode Edit Aktif
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block font-black text-xs uppercase mb-1 text-gray-600">Username (Tidak dapat diubah)</label>
                <input
                  type="text"
                  disabled
                  value={user?.username || '-'}
                  className="w-full border-2 border-black p-2 font-bold text-xs bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-xs uppercase mb-1">Nama Depan</label>
                  <input
                    type="text"
                    name="first_name"
                    disabled={!isEditing}
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama depan"
                    className={`w-full border-2 border-black p-2 font-bold text-xs ${
                      isEditing ? 'bg-white' : 'bg-gray-100'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase mb-1">Nama Belakang</label>
                  <input
                    type="text"
                    name="last_name"
                    disabled={!isEditing}
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama belakang"
                    className={`w-full border-2 border-black p-2 font-bold text-xs ${
                      isEditing ? 'bg-white' : 'bg-gray-100'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-xs uppercase mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full border-2 border-black p-2 font-bold text-xs ${
                      isEditing ? 'bg-white' : 'bg-gray-100'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-black text-xs uppercase mb-1">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    name="phone"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08123456789"
                    className={`w-full border-2 border-black p-2 font-bold text-xs ${
                      isEditing ? 'bg-white' : 'bg-gray-100'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-xs uppercase mb-1">Bio / Catatan Alamat Singkat</label>
                <textarea
                  name="bio"
                  rows="2"
                  disabled={!isEditing}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Contoh: Domisili Jakarta Selatan, siap COD area Blok M"
                  className={`w-full border-2 border-black p-2 font-bold text-xs ${
                    isEditing ? 'bg-white' : 'bg-gray-100'
                  }`}
                />
              </div>

              {isEditing ? (
                <div className="flex gap-3 pt-4 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 bg-gray-200 font-black text-xs uppercase py-2.5 border-2 border-black shadow-brutal hover:bg-gray-300 transition"
                  >
                    ✕ Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-yellow-300 text-black font-black text-xs uppercase py-2.5 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
                  >
                    {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t-2 border-black flex flex-wrap justify-between items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">
                    Otentikasi Akun Terverifikasi
                  </span>
                  <Link
                    to="/user/orders"
                    className="bg-yellow-300 text-black font-black text-xs uppercase px-4 py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
                  >
                    📦 Lihat Riwayat Pesanan →
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="bg-white border-4 border-black p-12 text-center shadow-brutal">
              <p className="text-4xl mb-3">❤️</p>
              <p className="text-xl font-black uppercase text-gray-400 mb-2">Belum Ada Produk di Wishlist</p>
              <p className="text-xs font-bold text-gray-600 mb-6">
                Klik tombol "❤️ Simpan Favorit" pada halaman detail produk untuk menyimpannya di sini.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-yellow-300 font-black text-xs uppercase px-6 py-3 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
              >
                Mulai Cari Produk⚡
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div key={item.id} className="bg-white border-4 border-black p-4 shadow-brutal flex flex-col justify-between">
                  <div>
                    <div className="bg-yellow-300 border-2 border-black aspect-video flex items-center justify-center font-black text-4xl mb-3 overflow-hidden relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>🛍️</span>
                      )}
                      <button
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        title="Hapus dari Wishlist"
                        className="absolute top-2 right-2 bg-red-500 text-white font-black text-xs w-7 h-7 border border-black flex items-center justify-center shadow-brutal hover:bg-black transition"
                      >
                        ✕
                      </button>
                    </div>

                    <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider inline-block mb-1">
                      🏬 {item.store_name || 'Toko'}
                    </span>
                    <h4 className="font-black text-sm uppercase line-clamp-1 mb-2">{item.name}</h4>
                    <p className="text-lg font-black bg-yellow-300 inline-block px-2 border border-black mb-4">
                      Rp {Number(item.price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t-2 border-black">
                    <button
                      onClick={() => navigate(`/product/${item.id}`)}
                      className="flex-1 bg-white font-black text-[10px] uppercase py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition text-center"
                    >
                      Lihat Detail
                    </button>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-yellow-300 font-black text-[10px] uppercase py-2 border-2 border-black shadow-brutal hover:bg-black hover:text-white transition"
                    >
                      + Keranjang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}