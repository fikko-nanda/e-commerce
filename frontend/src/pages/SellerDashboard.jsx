import { useState, useEffect } from 'react';
import { storeService, productService, orderService } from '../services';

export default function SellerDashboard() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Form Tambah Produk
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('tshirt');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Register Toko
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [regError, setRegError] = useState('');

  // Edit Modal
  const [editProduct, setEditProduct] = useState(null);

  const fetchAll = async () => {
    try {
      const storeRes = await storeService.getMyStore();
      const storeData = storeRes.data.store;
      setStore(storeData);
      if (storeData) {
        const [prodRes, ordRes] = await Promise.all([
          productService.getMyProducts(),
          orderService.getStoreOrders(),
        ]);
        setProducts(prodRes.data.data || []);
        setOrders(ordRes.data.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat data toko:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storeRes = await storeService.getMyStore();
        if (cancelled) return;
        const storeData = storeRes.data.store;
        setStore(storeData);
        if (storeData) {
          const [prodRes, ordRes] = await Promise.all([
            productService.getMyProducts(),
            orderService.getStoreOrders(),
          ]);
          if (cancelled) return;
          setProducts(prodRes.data.data || []);
          setOrders(ordRes.data.data || []);
        }
      } catch {
        if (!cancelled) console.error('Gagal memuat data toko');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRegisterStore = async (e) => {
    e.preventDefault();
    setRegError('');
    setSubmitting(true);
    try {
      await storeService.register({ store_name: storeName, phone, address });
      await fetchAll();
      setStoreName(''); setPhone(''); setAddress('');
    } catch (err) {
      setRegError(err.response?.data?.store_name?.[0] || err.response?.data?.error || 'Gagal mendaftar toko.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    if (isEdit) {
      setEditProduct({ ...editProduct, _newImage: file, image: URL.createObjectURL(file) });
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('category', category);
      formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      await productService.create(formData);
      setName(''); setPrice(''); setStock(''); setDescription('');
      setImageFile(null); setImagePreview(null);
      await fetchAll();
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'object' ? JSON.stringify(msg) : msg || 'Gagal menambah produk.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', editProduct.name);
      formData.append('price', editProduct.price);
      formData.append('stock', editProduct.stock);
      formData.append('category', editProduct.category || '');
      formData.append('description', editProduct.description || '');
      if (editProduct._newImage) formData.append('image', editProduct._newImage);

      await productService.update(editProduct.id, formData);
      setEditProduct(null);
      await fetchAll();
    } catch {
      alert('Gagal memperbarui produk.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini dari katalog?')) return;
    try {
      await productService.delete(id);
      await fetchAll();
    } catch {
      alert('Gagal menghapus produk.');
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      await orderService.updateShipping(orderId, { shipping_status: 'shipped' });
      await fetchAll();
      alert('Pesanan dikonfirmasi terkirim!');
    } catch {
      alert('Gagal mengkonfirmasi pengiriman.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-black uppercase text-gray-400">Memuat Dashboard Penjual...</div>;
  }

  // Belum punya toko — tampilkan form registrasi
  if (!store) {
    return (
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-yellow-300 border-4 border-black p-8 shadow-brutal-lg">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2 border-b-4 border-black pb-2">
            Daftar Jadi Penjual
          </h1>
          <p className="text-xs font-bold text-gray-700 mb-6">
            Buka tokomu di WARMART dan mulai jualan streetwear.
          </p>

          {regError && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 px-3 py-2 text-xs font-bold mb-4">
              {regError}
            </div>
          )}

          <form onSubmit={handleRegisterStore} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Nama Toko</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">No. WhatsApp</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="08xxxxxxxxxx"
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Alamat</label>
              <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} required
                className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:outline-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-black text-white font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition disabled:opacity-50">
              {submitting ? 'Memproses...' : 'Daftarkan Toko 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const newOrders = orders.filter((o) => o.payment_status === 'paid' && o.shipping_status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header & Stat */}
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b-4 border-black pb-6 mb-8 gap-4">
        <div>
          <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
            {store.status === 'active' ? 'TOKO AKTIF' : 'MENUNGGU VERIFIKASI'}
          </span>
          <h1 className="text-4xl font-black uppercase tracking-tighter mt-1">{store.store_name}</h1>
        </div>
        <div className="flex gap-3">
          <div className="bg-yellow-300 border-2 border-black p-3 shadow-brutal text-center min-w-[110px]">
            <span className="block text-[10px] font-black uppercase">Total Produk</span>
            <span className="text-xl font-black">{products.length}</span>
          </div>
          <div className="bg-green-400 border-2 border-black p-3 shadow-brutal text-center min-w-[110px]">
            <span className="block text-[10px] font-black uppercase">Pesanan Baru</span>
            <span className="text-xl font-black">{newOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => setActiveTab('products')}
          className={`font-black text-xs uppercase px-5 py-3 border-2 border-black shadow-brutal transition ${activeTab === 'products' ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'}`}>
          📦 Katalog ({products.length})
        </button>
        <button onClick={() => setActiveTab('orders')}
          className={`font-black text-xs uppercase px-5 py-3 border-2 border-black shadow-brutal transition ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-white hover:bg-yellow-300'}`}>
          📋 Pesanan Masuk ({orders.length})
        </button>
      </div>

      {/* TAB PRODUK */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg h-fit">
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">+ Rilis Produk Baru</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Foto Produk</label>
                <div className="bg-white border-2 border-black p-3 text-center">
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover border-2 border-black shadow-brutal mb-2" />}
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} className="w-full text-xs font-bold" />
                </div>
              </div>
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
              <button type="submit" disabled={submitting} className="w-full bg-black text-white font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-red-600 transition disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan & Publikasikan 🚀'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {products.length === 0 ? (
              <div className="bg-gray-50 border-4 border-black p-12 text-center font-black text-gray-400 uppercase">
                Belum ada produk. Tambahkan produk pertamamu!
              </div>
            ) : products.map((p) => (
              <div key={p.id} className="bg-white border-4 border-black p-4 flex justify-between items-center shadow-brutal gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-300 border-2 border-black flex items-center justify-center shrink-0 overflow-hidden shadow-brutal">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-2xl">👕</span>}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">{p.category || 'umum'}</span>
                    <h4 className="font-black text-sm uppercase mt-1">{p.name}</h4>
                    <p className="text-xs font-bold text-gray-600">Rp {Number(p.price).toLocaleString('id-ID')} | Stok: {p.stock}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditProduct(p)} className="bg-blue-400 font-black text-xs px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition">✏️ Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white font-black text-xs px-3 py-2 uppercase border-2 border-black shadow-brutal hover:bg-black transition">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB PESANAN */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-gray-50 border-4 border-black p-12 text-center font-black text-gray-400 uppercase">
              Belum ada pesanan masuk.
            </div>
          ) : orders.map((ord) => (
            <div key={ord.id} className="bg-white border-4 border-black p-6 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-black text-xs bg-yellow-300 px-2 py-0.5 border-2 border-black shadow-brutal">#{ord.id.slice(0, 8)}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 border border-black ${ord.payment_status === 'paid' ? 'bg-green-400 text-black' : ord.payment_status === 'failed' ? 'bg-red-400 text-white' : 'bg-yellow-200'}`}>
                    BAYAR: {ord.payment_status?.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 border border-black ${ord.shipping_status === 'delivered' ? 'bg-green-400 text-black' : ord.shipping_status === 'shipped' ? 'bg-blue-400 text-white' : 'bg-gray-200'}`}>
                    KIRIM: {ord.shipping_status?.toUpperCase()}
                  </span>
                </div>
                <h4 className="font-black text-base uppercase">{ord.product_name} (x{ord.quantity})</h4>
                <p className="text-xs font-bold text-gray-600">Pembeli: {ord.buyer_email}</p>
                {ord.buyer_address && <p className="text-xs font-bold text-gray-500 mt-1">Alamat: {ord.buyer_address}</p>}
                <p className="text-xs font-black mt-1">Total: Rp {Number(ord.total_price).toLocaleString('id-ID')}</p>
                {ord.courier_name && <p className="text-xs font-bold text-gray-600 mt-1">Kurir: {ord.courier_name} ({ord.tracking_number})</p>}
              </div>
              {ord.payment_status === 'paid' && ord.shipping_status === 'pending' && (
                <button onClick={() => handleShipOrder(ord.id)} className="bg-green-400 font-black text-xs px-5 py-3 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition">
                  🚚 Konfirmasi Pengiriman
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 shadow-brutal-lg max-w-md w-full relative">
            <button onClick={() => setEditProduct(null)} className="absolute top-3 right-3 bg-red-500 text-white font-black px-2.5 py-1 border-2 border-black">✕</button>
            <h3 className="text-xl font-black uppercase mb-4 border-b-2 border-black pb-2">Edit Produk</h3>
            <form onSubmit={handleUpdateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Produk</label>
                <input type="text" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga (Rp)</label>
                  <input type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" required />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Stok</label>
                  <input type="number" value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: Number(e.target.value) })} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Kategori</label>
                <select value={editProduct.category || ''} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs">
                  <option value="tshirt">T-Shirt</option>
                  <option value="hoodie">Hoodie & Jacket</option>
                  <option value="pants">Pants</option>
                  <option value="accessories">Aksesoris</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi</label>
                <textarea rows={3} value={editProduct.description || ''} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Foto Baru (Opsional)</label>
                {editProduct.image && <img src={editProduct.image} alt="current" className="w-full h-24 object-cover border-2 border-black mb-2" />}
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} className="w-full text-xs font-bold" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-yellow-300 font-black py-3 uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition mt-4 disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
