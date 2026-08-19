import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function SellerDashboard() {
  const { user } = useContext(AuthContext);
  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('tshirt');
  const [description, setDescription] = useState('');
  // Form registrasi toko
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const fetchSellerProducts = () => {
    API.get('/products/?mine=true')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setProducts(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    API.get('/stores/me/')
      .then((res) => {
        setStore(res.data);
        fetchSellerProducts();
      })
      .catch(() => setStore(null))
      .finally(() => setStoreLoading(false));
  }, [user]);

  const handleRegisterStore = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/stores/register/', {
        store_name: storeName,
        phone,
        address,
        user_email: user.email,
      });
      alert('Toko berhasil didaftarkan! Menunggu review admin.');
      // Ambil ulang data toko
      const res = await API.get('/stores/me/');
      setStore(res.data);
      fetchSellerProducts();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Gagal mendaftarkan toko.';
      setError(msg);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/products/', {
        name,
        price: Number(price),
        stock: Number(stock),
        category,
        description,
      });
      setName(''); setPrice(''); setStock(''); setDescription('');
      fetchSellerProducts();
      alert('Produk berhasil ditambahkan!');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Gagal menambahkan produk.';
      setError(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await API.delete(`/products/${id}/`);
      fetchSellerProducts();
    } catch {
      alert('Gagal menghapus produk.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="font-black text-gray-400 uppercase">Silakan login terlebih dahulu untuk mengakses dashboard penjual.</p>
      </div>
    );
  }

  if (storeLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="font-black text-gray-400 uppercase">Memuat data toko...</p>
      </div>
    );
  }

  // User belum punya toko → form registrasi
  if (!store) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-8">
          Daftarkan Toko Anda
        </h2>
        <div className="max-w-lg">
          {error && (
            <div className="bg-red-100 border-2 border-red-600 text-red-700 font-bold text-xs p-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleRegisterStore} className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nama Toko</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">No. Telepon</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Alamat Toko</label>
              <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-black text-white font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-red-600 transition">
              Daftarkan Toko
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-2">
        Dashboard Penjual
      </h2>
      <p className="text-xs font-bold text-gray-500 mb-8">
        Toko: <span className="font-black text-black">{store.store_name}</span> |
        Status: <span className={`font-black ${store.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{store.status}</span>
      </p>

      {error && (
        <div className="bg-red-100 border-2 border-red-600 text-red-700 font-bold text-xs p-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Produk */}
        <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg h-fit">
          <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">
            + Tambah Produk Baru
          </h3>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nama Produk</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Harga (Rp)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Stok</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none">
                <option value="tshirt">T-Shirt</option>
                <option value="hoodie">Hoodie & Jacket</option>
                <option value="pants">Pants</option>
                <option value="accessories">Aksesoris</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white border-2 border-black p-2 font-bold text-xs focus:outline-none" />
            </div>
            <button type="submit" className="w-full bg-black text-white font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-red-600 transition">
              Rilis Produk 🚀
            </button>
          </form>
        </div>

        {/* Daftar Produk Penjual */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black uppercase mb-4">Katalog Saya ({products.length})</h3>
          {products.length === 0 && (
            <p className="font-black text-gray-400 uppercase">Belum ada produk. Tambahkan produk pertama Anda!</p>
          )}
          {products.map((p) => (
            <div key={p.id} className="bg-white border-4 border-black p-4 flex justify-between items-center shadow-brutal">
              <div>
                <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{p.category}</span>
                <h4 className="font-black text-base uppercase mt-1">{p.name}</h4>
                <p className="text-xs font-bold text-gray-600">
                  Rp {Number(p.price).toLocaleString('id-ID')} | Stok: {p.stock} pcs
                </p>
              </div>
              <button 
                onClick={() => handleDelete(p.id)}
                className="bg-red-500 text-white font-black px-3 py-2 text-xs uppercase border-2 border-black shadow-brutal hover:bg-black transition"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}