import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storeService, productService, orderService } from '../../services';

const API_ORIGIN = 'http://127.0.0.1:8000';

function toAbsoluteUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price || 0),
    stock: Number(p.stock || 0),
    category: p.category || 'tshirt',
    description: p.description || '',
    image: toAbsoluteUrl(p.image),
  };
}

function getOrderStatus(order) {
  if (order.shipping_status === 'shipped') return 'Dikirim';
  if (order.shipping_status === 'delivered') return 'Selesai';
  if (order.payment_status === 'paid') return 'Perlu Dikirim';
  const map = { pending: 'Pending', failed: 'Gagal', expired: 'Kadaluarsa' };
  return map[order.payment_status] || 'Pending';
}

function normalizeOrder(o) {
  return {
    id: o.id,
    customer: o.buyer_username || o.buyer_email || 'Pembeli',
    items: `${o.product_name} (${o.quantity} pcs)`,
    total: Number(o.total_price || 0),
    status: getOrderStatus(o),
    shipping_status: o.shipping_status,
    payment_status: o.payment_status,
    date: (o.created_at || '').split('T')[0],
  };
}

export default function SellerDashboard() {
  const { user } = useContext(AuthContext) || {};
  const { showToast } = useToast();

  // Tab State: 'products' | 'orders' | 'settings'
  const [activeTab, setActiveTab] = useState('products');

  // State Informasi Toko
  const [storeInfo, setStoreInfo] = useState({
    name: user?.first_name ? `${user.first_name} Store` : 'Toko Saya',
    description: 'Penyedia streetwear & fashion lokal kualitas brutal.',
    logo: 'https://images.unsplash.com/photo-1560060141-7b9018741ced?w=400&auto=format&fit=crop&q=80',
    logoFile: null,
  });

  // Data Produk & Pesanan dari API Backend
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Modal State Tambah / Edit Produk
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'tshirt',
    description: '',
    image: '',
    imageFile: null,
  });

  // ============================================
  // AMBIL DATA DARI API SAAT KOMPONEN DIMUAT
  // ============================================
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const storeRes = await storeService.getMyStore();
        if (!cancelled && storeRes?.data?.store) {
          const s = storeRes.data.store;
          setStoreInfo((prev) => ({
            ...prev,
            name: s.store_name || prev.name,
            description: s.address || prev.description,
          }));
        }
      } catch {
        // Abaikan jika belum punya toko
      }

      try {
        const res = await productService.getMyProducts();
        if (!cancelled) {
          const list = res?.data?.data || [];
          setProducts(list.map(normalizeProduct));
        }
      } catch {
        if (!cancelled) showToast('Gagal memuat produk.', 'error');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }

      try {
        const res = await orderService.getStoreOrders();
        if (!cancelled) {
          const list = res?.data?.data || [];
          setOrders(list.map(normalizeOrder));
        }
      } catch {
        // Abaikan jika belum punya toko
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hitung Total Penjualan secara Dinamis
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  // Handler Upload Foto Profil Toko
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setStoreInfo((prev) => ({
        ...prev,
        logo: previewUrl,
        logoFile: file,
      }));
    }
  };

  // Handler Upload Gambar Produk Baru/Edit
  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: previewUrl,
        imageFile: file,
      }));
    }
  };

  // Buka Modal Tambah Produk
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      stock: '',
      category: 'tshirt',
      description: '',
      image: '',
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit Produk
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description || '',
      image: product.image,
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  // Simpan Produk (Tambah / Edit) — Kirim ke API Backend
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const hasFile = Boolean(formData.imageFile);
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('price', String(formData.price));
    payload.append('stock', String(formData.stock));
    payload.append('category', formData.category);
    payload.append('description', formData.description || '');
    if (hasFile) {
      payload.append('image', formData.imageFile);
    }

    try {
      let saved;
      if (editingProduct) {
        const res = await productService.update(editingProduct.id, payload);
        saved = res?.data?.data || res?.data;
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...normalizeProduct(saved) } : p))
        );
        showToast('Produk berhasil diperbarui!', 'success');
      } else {
        const res = await productService.create(payload);
        saved = res?.data?.data || res?.data;
        setProducts((prev) => [normalizeProduct(saved), ...prev]);
        showToast('Produk berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.price?.[0] ||
        err?.response?.data?.stock?.[0] ||
        err?.response?.data?.error ||
        'Gagal menyimpan produk.';
      showToast(msg, 'error');
    }
  };

  // Hapus Produk — Hapus dari API Backend
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await productService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Produk berhasil dihapus.', 'success');
    } catch {
      showToast('Gagal menghapus produk.', 'error');
    }
  };

  // Ubah Status Pesanan — Kirim ke API Backend
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateShipping(orderId, {
        shipping_status: newStatus,
      });
      const updated = res?.data?.data;
      if (updated) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...normalizeOrder(updated) } : o))
        );
      }
      showToast('Status pesanan diperbarui.', 'success');
    } catch {
      showToast('Gagal memperbarui status pesanan.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Dashboard Penjual */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <img
            src={storeInfo.logo}
            alt={storeInfo.name}
            className="w-16 h-16 md:w-20 md:h-20 object-cover border-4 border-black shadow-brutal bg-white flex-shrink-0"
          />
          <div>
            <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
              MODE PENJUAL
            </span>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mt-1">
              {storeInfo.name}
            </h1>
            <p className="text-xs font-bold text-black/80">{storeInfo.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-black text-white font-black px-5 py-3 text-xs uppercase border-2 border-black hover:bg-white hover:text-black shadow-brutal transition cursor-pointer"
        >
          + Tambah Produk Baru
        </button>
      </div>

      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <p className="text-[10px] font-black uppercase text-gray-500">Total Penjualan</p>
          <p className="text-xl font-black mt-1">Rp {totalSales.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <p className="text-[10px] font-black uppercase text-gray-500">Produk Aktif</p>
          <p className="text-xl font-black mt-1">{products.length} Produk</p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <p className="text-[10px] font-black uppercase text-gray-500">Pesanan Baru</p>
          <p className="text-xl font-black mt-1 text-red-600">
            {orders.filter((o) => o.status === 'Perlu Dikirim').length} Pesanan
          </p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <p className="text-[10px] font-black uppercase text-gray-500">Rating Toko</p>
          <p className="text-xl font-black mt-1">⭐ 4.9 / 5.0</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b-4 border-black gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-black text-white -mb-1 pb-4'
              : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          📦 Kelola Produk ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-black text-white -mb-1 pb-4'
              : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          📑 Pesanan Masuk ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-black text-white -mb-1 pb-4'
              : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          ⚙️ Pengaturan Toko
        </button>
      </div>

      {/* TAB 1: KELOLA PRODUK */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {loadingProducts ? (
            <div className="bg-white border-4 border-black p-8 text-center shadow-brutal">
              <p className="font-black text-sm uppercase text-gray-400">Memuat produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border-4 border-black p-8 text-center shadow-brutal">
              <p className="font-black text-sm uppercase">Belum ada produk yang ditambahkan.</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 bg-yellow-300 border-2 border-black font-black px-4 py-2 text-xs uppercase shadow-brutal"
              >
                + Tambah Produk Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border-4 border-black p-4 shadow-brutal flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover border-2 border-black flex-shrink-0 bg-gray-100"
                    />
                    <div>
                      <span className="bg-yellow-300 border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
                        {item.category}
                      </span>
                      <h3 className="font-black text-sm uppercase line-clamp-2 mt-1">{item.name}</h3>
                      <p className="font-black text-xs text-gray-700 mt-1">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500">Stok: {item.stock} pcs</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t-2 border-black">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="flex-1 bg-yellow-300 border-2 border-black py-1.5 text-xs font-black uppercase shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(item.id)}
                      className="flex-1 bg-red-500 text-white border-2 border-black py-1.5 text-xs font-black uppercase shadow-brutal hover:bg-black transition cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PESANAN MASUK */}
      {activeTab === 'orders' && (
        <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Daftar Transaksi</h2>
          {loadingOrders ? (
            <p className="font-black text-xs uppercase text-gray-400 py-4">Memuat pesanan...</p>
          ) : orders.length === 0 ? (
            <p className="font-black text-xs uppercase text-gray-500 py-4">Belum ada pesanan masuk.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-black bg-gray-100 text-xs uppercase font-black">
                    <th className="p-3">ID Pesanan</th>
                    <th className="p-3">Pembeli</th>
                    <th className="p-3">Item</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-xs font-bold">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-yellow-50">
                      <td className="p-3 font-black">{ord.id}</td>
                      <td className="p-3">{ord.customer}</td>
                      <td className="p-3">{ord.items}</td>
                      <td className="p-3 font-black">Rp {ord.total.toLocaleString('id-ID')}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-[10px] font-black border border-black uppercase ${
                            ord.status === 'Perlu Dikirim'
                              ? 'bg-yellow-300'
                              : ord.status === 'Dikirim'
                              ? 'bg-blue-300'
                              : 'bg-green-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {ord.status === 'Perlu Dikirim' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                            className="bg-black text-white px-3 py-1 font-black text-[10px] uppercase border border-black shadow-brutal hover:bg-yellow-300 hover:text-black cursor-pointer"
                          >
                            Tandai Dikirim
                          </button>
                        )}
                        {ord.status === 'Dikirim' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                            className="bg-green-500 text-white px-3 py-1 font-black text-[10px] uppercase border border-black shadow-brutal hover:bg-black cursor-pointer"
                          >
                            Selesaikan
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
      )}

      {/* TAB 3: PENGATURAN TOKO */}
      {activeTab === 'settings' && (
        <div className="bg-white border-4 border-black p-6 shadow-brutal max-w-xl space-y-5">
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Profil Toko</h2>

          <div className="flex items-center gap-4 border-2 border-black p-4 bg-gray-50">
            <img
              src={storeInfo.logo}
              alt="Preview Toko"
              className="w-20 h-20 object-cover border-4 border-black shadow-brutal bg-white flex-shrink-0"
            />
            <div>
              <p className="text-xs font-black uppercase">Foto Profil Toko</p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                Format: JPG, PNG, WEBP (Maksimal 2MB).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Upload Foto Toko Baru</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs focus:outline-none file:mr-4 file:py-1 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-yellow-300 file:uppercase file:cursor-pointer hover:file:bg-black hover:file:text-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Nama Toko</label>
            <input
              type="text"
              value={storeInfo.name}
              onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
              className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs focus:outline-none focus:bg-yellow-100"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Deskripsi Toko</label>
            <textarea
              rows={3}
              value={storeInfo.description}
              onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })}
              className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs focus:outline-none focus:bg-yellow-100"
            />
          </div>

          <button
            type="button"
            onClick={() => alert('Informasi Toko Berhasil Diperbarui!')}
            className="bg-black text-white font-black px-6 py-3 text-xs uppercase border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition cursor-pointer"
          >
            Simpan Perubahan Toko
          </button>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-lg w-full shadow-brutal-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b-4 border-black pb-2">
              <h3 className="text-lg font-black uppercase">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="font-black text-lg hover:text-red-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Heavyweight Tee Black"
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="189000"
                    className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Stok</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="10"
                    className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border-2 border-black p-2 font-bold text-xs bg-white focus:bg-yellow-100 cursor-pointer"
                >
                  <option value="tshirt">T-Shirt / Kaos</option>
                  <option value="hoodie">Hoodie / Jaket</option>
                  <option value="pants">Celana / Pants</option>
                  <option value="shoes">Sepatu / Sneakers</option>
                  <option value="accessories">Aksesoris / Tas</option>
                </select>
              </div>

              {/* UPLOAD FOTO PRODUK */}
              <div>
                <label className="block text-xs font-black uppercase mb-1">Upload Gambar Produk</label>
                {formData.image && (
                  <div className="mb-2 flex items-center gap-3 p-2 border-2 border-black bg-gray-50">
                    <img
                      src={formData.image}
                      alt="Preview Produk"
                      className="w-16 h-16 object-cover border-2 border-black shadow-brutal bg-white flex-shrink-0"
                    />
                    <span className="text-[10px] font-bold text-gray-600">
                      Gambar produk saat ini / yang terpilih.
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageUpload}
                  className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs focus:outline-none file:mr-4 file:py-1 file:px-3 file:border-2 file:border-black file:text-xs file:font-black file:bg-yellow-300 file:uppercase file:cursor-pointer hover:file:bg-black hover:file:text-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi Produk</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bahan 100% Cotton..."
                  className="w-full border-2 border-black p-2 font-bold text-xs focus:bg-yellow-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-gray-200 border-2 border-black py-2 text-xs font-black uppercase cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-black text-white border-2 border-black py-2 text-xs font-black uppercase hover:bg-yellow-300 hover:text-black transition cursor-pointer"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}