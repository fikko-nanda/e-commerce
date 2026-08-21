import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storeService, productService, orderService, reviewService } from '../../services';

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
    sold: Number(p.sold_count || p.sold || Math.floor(Math.random() * 50) + 5),
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

  // Tab Active State: 'products' | 'orders' | 'analytics' | 'promotions' | 'reviews' | 'wallet' | 'settings'
  const [activeTab, setActiveTab] = useState('products');

  // State Profil Toko
  const [storeInfo, setStoreInfo] = useState({
    name: user?.first_name ? `${user.first_name} Store` : 'Toko Saya',
    description: 'Penyedia streetwear & fashion lokal kualitas brutal.',
    logo: 'https://images.unsplash.com/photo-1560060141-7b9018741ced?w=400&auto=format&fit=crop&q=80',
    logoFile: null,
  });

  // Data Produk, Pesanan, & Loading
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  // State Fitur Baru Ala Shopee
  // 1. Promosi / Voucher Toko
  const [vouchers, setVouchers] = useState([
    {
      id: 1,
      code: 'NEO10K',
      discount: 'Rp 10.000',
      minSpend: 100000,
      quota: 50,
      used: 12,
      status: 'Aktif',
    },
    {
      id: 2,
      code: 'BRUTAL20',
      discount: '20%',
      minSpend: 250000,
      quota: 30,
      used: 30,
      status: 'Habis',
    },
  ]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    type: 'fixed', // 'fixed' | 'percentage'
    amount: '',
    minSpend: '',
    quota: '',
  });

  // 2. Ulasan Pembeli
  const [reviews, setReviews] = useState([
    {
      id: 101,
      productName: 'Heavyweight Tee Black',
      buyer: 'rizky_streetwear',
      rating: 5,
      comment: 'Bahan tebal mantap! Jahitan rapi banget, pengiriman super cepat.',
      date: '2026-08-15',
      reply: 'Terima kasih bosku sudah belanja! Ditunggu orderan berikutnya 🔥',
    },
    {
      id: 102,
      productName: 'Overpriced Hoodie Off-White',
      buyer: 'budi_santoso',
      rating: 4,
      comment: 'Hoodienya hangat, ukuran sesuai deskripsi. Cuma agak sedikit lama di kurir.',
      date: '2026-08-18',
      reply: '',
    },
  ]);
  const [replyInputs, setReplyInputs] = useState({});

  // 3. Saldo Toko & Penarikan
  const [wallet, setWallet] = useState({
    balance: 1450000,
    pendingBalance: 320000,
    history: [
      { id: 'WD-001', date: '2026-08-10', amount: 500000, bank: 'BCA (1234xxxx)', status: 'Selesai' },
      { id: 'WD-002', date: '2026-08-01', amount: 1200000, bank: 'BCA (1234xxxx)', status: 'Selesai' },
    ],
  });
  const [withdrawForm, setWithdrawForm] = useState({ bank: 'BCA', accountNumber: '', amount: '' });

  // Modal State Produk
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
  // LOAD DATA API
  // ============================================
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const storeRes = await storeService.getMyStore();
        if (!cancelled && (storeRes?.data?.store || storeRes?.data)) {
          const s = storeRes.data.store || storeRes.data;
          setStoreInfo((prev) => ({
            ...prev,
            name: s.store_name || s.name || prev.name,
            description: s.address || s.description || prev.description,
            logo: s.logo ? toAbsoluteUrl(s.logo) : s.image ? toAbsoluteUrl(s.image) : prev.logo,
          }));
        }
      } catch {
        // Abaikan jika belum punya toko
      }

      try {
        const res = await productService.getMyProducts();
        if (!cancelled) {
          const list = res?.data?.data || res?.data || [];
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
          const list = res?.data?.data || res?.data || [];
          setOrders(list.map(normalizeOrder));
        }
      } catch {
        // Abaikan
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }

      try {
        const revRes = await reviewService.getStoreReviews();
        if (!cancelled && revRes?.data) {
          const list = revRes.data.data || revRes.data;
          if (Array.isArray(list) && list.length > 0) setReviews(list);
        }
      } catch {
        // Fallback ke mock review
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  // Handlers
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreInfo((prev) => ({
        ...prev,
        logo: URL.createObjectURL(file),
        logoFile: file,
      }));
    }
  };

  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: URL.createObjectURL(file),
        imageFile: file,
      }));
    }
  };

  const handleSaveStore = async (e) => {
    if (e) e.preventDefault();
    setSavingStore(true);
    try {
      const payload = new FormData();
      payload.append('store_name', storeInfo.name);
      payload.append('address', storeInfo.description);
      if (storeInfo.logoFile) payload.append('logo', storeInfo.logoFile);

      await (storeService.updateMyStore || storeService.updateStore)(payload);
      showToast('Informasi Toko Berhasil Diperbarui!', 'success');
    } catch {
      showToast('Gagal memperbarui informasi toko.', 'error');
    } finally {
      setSavingStore(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '', category: 'tshirt', description: '', image: '', imageFile: null });
    setIsModalOpen(true);
  };

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

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('price', String(formData.price));
    payload.append('stock', String(formData.stock));
    payload.append('category', formData.category);
    payload.append('description', formData.description || '');
    if (formData.imageFile) payload.append('image', formData.imageFile);

    try {
      if (editingProduct) {
        const res = await productService.update(editingProduct.id, payload);
        const saved = res?.data?.data || res?.data;
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...normalizeProduct(saved) } : p)));
        showToast('Produk berhasil diperbarui!', 'success');
      } else {
        const res = await productService.create(payload);
        const saved = res?.data?.data || res?.data;
        setProducts((prev) => [normalizeProduct(saved), ...prev]);
        showToast('Produk berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
    } catch {
      showToast('Gagal menyimpan produk.', 'error');
    }
  };

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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateShipping(orderId, { shipping_status: newStatus });
      const updated = res?.data?.data || res?.data;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...normalizeOrder(updated) } : o)));
      }
      showToast('Status pesanan diperbarui.', 'success');
    } catch {
      showToast('Gagal memperbarui status pesanan.', 'error');
    }
  };

  // HANDLER FITUR BARU:
  // 1. Buat Voucher Baru
  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!voucherForm.code || !voucherForm.amount) return;

    const newVoucher = {
      id: Date.now(),
      code: voucherForm.code.toUpperCase(),
      discount: voucherForm.type === 'percentage' ? `${voucherForm.amount}%` : `Rp ${Number(voucherForm.amount).toLocaleString('id-ID')}`,
      minSpend: Number(voucherForm.minSpend || 0),
      quota: Number(voucherForm.quota || 10),
      used: 0,
      status: 'Aktif',
    };

    setVouchers([newVoucher, ...vouchers]);
    setIsVoucherModalOpen(false);
    setVoucherForm({ code: '', type: 'fixed', amount: '', minSpend: '', quota: '' });
    showToast('Voucher Toko Berhasil Dibuat!', 'success');
  };

  // 2. Balas Ulasan Pembeli
  const handleReplyReview = async (reviewId) => {
    const replyText = replyInputs[reviewId];
    if (!replyText?.trim()) return;

    try {
      await reviewService.replyReview(reviewId, replyText);
    } catch {
      // Abaikan error jika backend belum siap
    }

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, reply: replyText } : r))
    );
    setReplyInputs((prev) => ({ ...prev, [reviewId]: '' }));
    showToast('Balasan ulasan telah terkirim.', 'success');
  };

  // 3. Tarik Saldo
  const handleWithdraw = (e) => {
    e.preventDefault();
    const withdrawAmount = Number(withdrawForm.amount);
    if (withdrawAmount <= 0 || withdrawAmount > wallet.balance) {
      showToast('Nominal penarikan tidak valid atau melebihi saldo.', 'error');
      return;
    }

    const newHistory = {
      id: `WD-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      amount: withdrawAmount,
      bank: `${withdrawForm.bank} (${withdrawForm.accountNumber || 'xxxx'})`,
      status: 'Diproses',
    };

    setWallet((prev) => ({
      ...prev,
      balance: prev.balance - withdrawAmount,
      history: [newHistory, ...prev.history],
    }));

    setWithdrawForm({ bank: 'BCA', accountNumber: '', amount: '' });
    showToast('Permintaan penarikan dana berhasil diajukan!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Banner Header Dashboard */}
      <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <img
            src={storeInfo.logo}
            alt={storeInfo.name}
            className="w-16 h-16 md:w-20 md:h-20 object-cover border-4 border-black shadow-brutal bg-white flex-shrink-0"
          />
          <div>
            <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
              PUSAT PENJUAL / SHOPEE MODE
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
          <p className="text-[10px] font-black uppercase text-gray-500">Pesanan Masuk</p>
          <p className="text-xl font-black mt-1 text-red-600">
            {orders.filter((o) => o.status === 'Perlu Dikirim').length} Pesanan
          </p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <p className="text-[10px] font-black uppercase text-gray-500">Saldo Toko</p>
          <p className="text-xl font-black mt-1 text-green-700">Rp {wallet.balance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Navigation Tabs Ala Shopee */}
      <div className="flex border-b-4 border-black gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'products' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          📦 Produk ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          📑 Pesanan ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          📊 Performa Bisnis
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('promotions')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'promotions' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          🎟️ Voucher Toko
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'reviews' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          ⭐ Ulasan ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('wallet')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'wallet' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
          }`}
        >
          💰 Saldo Toko
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'
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
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 bg-yellow-300 border-2 border-black font-black px-4 py-2 text-xs uppercase shadow-brutal cursor-pointer"
              >
                + Tambah Produk Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((item) => (
                <div key={item.id} className="bg-white border-4 border-black p-4 shadow-brutal flex flex-col justify-between space-y-4">
                  <div className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover border-2 border-black flex-shrink-0 bg-gray-100" />
                    <div>
                      <span className="bg-yellow-300 border border-black px-1.5 py-0.5 text-[9px] font-black uppercase">
                        {item.category}
                      </span>
                      <h3 className="font-black text-sm uppercase line-clamp-2 mt-1">{item.name}</h3>
                      <p className="font-black text-xs text-gray-700 mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                      <div className="flex gap-2 text-[10px] font-bold text-gray-500 mt-1">
                        <span>Stok: {item.stock}</span>
                        <span>•</span>
                        <span className="text-black font-black">Terjual: {item.sold}</span>
                      </div>
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
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Daftar Pesanan Masuk</h2>
          {loadingOrders ? (
            <p className="font-black text-xs uppercase text-gray-400 py-4">Memuat pesanan...</p>
          ) : orders.length === 0 ? (
            <p className="font-black text-xs uppercase text-gray-500 py-4">Belum ada pesanan masuk.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-black bg-gray-100 text-xs uppercase font-black">
                    <th className="p-3">ID</th>
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
                        <span className={`px-2 py-1 text-[10px] font-black border border-black uppercase ${
                          ord.status === 'Perlu Dikirim' ? 'bg-yellow-300' : ord.status === 'Dikirim' ? 'bg-blue-300' : 'bg-green-300'
                        }`}>
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
                            Atur Pengiriman
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

      {/* TAB 3: PERFORMA BISNIS (BUSINESS INSIGHTS) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-4 border-black p-4 shadow-brutal">
              <span className="text-[10px] font-black uppercase text-gray-500">Pengunjung Toko (30 Hari)</span>
              <p className="text-2xl font-black mt-1">1,480 <span className="text-xs text-green-600 font-bold">+18%</span></p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-brutal">
              <span className="text-[10px] font-black uppercase text-gray-500">Tingkat Konversi</span>
              <p className="text-2xl font-black mt-1">3.4% <span className="text-xs text-green-600 font-bold">Bagus</span></p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-brutal">
              <span className="text-[10px] font-black uppercase text-gray-500">Pesanan Selesai</span>
              <p className="text-2xl font-black mt-1">{orders.length} Transaksi</p>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
            <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2">🔥 Produk Terlaris Saya</h3>
            <div className="space-y-4">
              {products.slice(0, 4).map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between gap-4 border-b pb-3 border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="bg-black text-white font-black w-6 h-6 flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover border-2 border-black" />
                    <div>
                      <p className="font-black text-xs uppercase line-clamp-1">{prod.name}</p>
                      <p className="text-[10px] font-bold text-gray-500">Terjual {prod.sold} pcs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs">Rp {(prod.price * prod.sold).toLocaleString('id-ID')}</p>
                    <span className="text-[9px] font-bold text-green-600">Total Performa</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VOUCHER & PROMOSI TOKO */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-brutal">
            <div>
              <h3 className="font-black text-base uppercase">Voucher Toko Saya</h3>
              <p className="text-xs font-bold text-gray-600">Tingkatkan penjualan dengan memberikan diskon belanja.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="bg-yellow-300 font-black px-4 py-2 text-xs uppercase border-2 border-black shadow-brutal hover:bg-black hover:text-white transition cursor-pointer"
            >
              + Buat Voucher Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((v) => (
              <div key={v.id} className="bg-white border-4 border-black p-4 shadow-brutal flex justify-between items-center bg-gradient-to-r from-yellow-100 to-white">
                <div>
                  <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                    KODE: {v.code}
                  </span>
                  <h4 className="text-xl font-black mt-2">Diskon {v.discount}</h4>
                  <p className="text-[10px] font-bold text-gray-600">Min. Belanja: Rp {v.minSpend.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] font-bold text-gray-500">Kuota Terpakai: {v.used} / {v.quota}</p>
                </div>
                <div>
                  <span className={`text-xs font-black px-3 py-1 border-2 border-black uppercase shadow-brutal ${
                    v.status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ULASAN PEMBELI */}
      {activeTab === 'reviews' && (
        <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-6">
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Ulasan Produk dari Pembeli</h2>
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="border-2 border-black p-4 bg-gray-50 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-xs uppercase bg-yellow-300 px-2 py-0.5 border border-black">{rev.productName}</span>
                    <p className="text-xs font-bold text-gray-500 mt-1">Oleh: <span className="text-black font-black">{rev.buyer}</span> • {rev.date}</p>
                  </div>
                  <div className="text-yellow-500 text-sm font-black">
                    {'⭐'.repeat(rev.rating)}
                  </div>
                </div>

                <p className="text-xs font-bold text-black bg-white p-2 border border-black">{rev.comment}</p>

                {rev.reply ? (
                  <div className="bg-yellow-100 border-l-4 border-black p-2 text-xs font-bold ml-4">
                    <p className="font-black text-[10px] uppercase text-gray-700">Balasan Toko Anda:</p>
                    <p>{rev.reply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Tulis balasan ulasan..."
                      value={replyInputs[rev.id] || ''}
                      onChange={(e) => setReplyInputs({ ...replyInputs, [rev.id]: e.target.value })}
                      className="flex-1 border-2 border-black p-1.5 text-xs font-bold focus:bg-yellow-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplyReview(rev.id)}
                      className="bg-black text-white px-3 py-1.5 text-xs font-black uppercase border border-black hover:bg-yellow-300 hover:text-black cursor-pointer"
                    >
                      Kirim
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SALDO & PENARIKAN DANA */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Form Tarik Saldo */}
          <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Dompet Penjual</h3>
            <div className="bg-green-100 border-2 border-black p-4">
              <span className="text-xs font-black uppercase text-gray-600">Saldo Siap Ditarik</span>
              <p className="text-3xl font-black text-green-800 mt-1">Rp {wallet.balance.toLocaleString('id-ID')}</p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Pilih Bank / e-Wallet</label>
                <select
                  value={withdrawForm.bank}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bank: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold bg-white"
                >
                  <option value="BCA">Bank BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="GoPay">GoPay / OVO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Nomor Rekening / HP</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 8273918239"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Minimum 50000"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-black py-3 text-xs uppercase border-2 border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
              >
                Tarik Dana Sekarang
              </button>
            </form>
          </div>

          {/* Card Riwayat Penarikan */}
          <div className="bg-white border-4 border-black p-6 shadow-brutal space-y-4">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Riwayat Penarikan</h3>
            <div className="space-y-3">
              {wallet.history.map((h) => (
                <div key={h.id} className="border-2 border-black p-3 flex justify-between items-center bg-gray-50">
                  <div>
                    <span className="font-black text-xs uppercase">{h.id}</span>
                    <p className="text-[10px] font-bold text-gray-500">{h.bank} • {h.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs text-red-600">- Rp {h.amount.toLocaleString('id-ID')}</p>
                    <span className="text-[9px] font-black uppercase bg-green-300 px-1 border border-black">{h.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PENGATURAN TOKO */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveStore} className="bg-white border-4 border-black p-6 shadow-brutal max-w-xl space-y-5">
          <h2 className="text-xl font-black uppercase border-b-2 border-black pb-2">Profil Toko</h2>
          <div className="flex items-center gap-4 border-2 border-black p-4 bg-gray-50">
            <img src={storeInfo.logo} alt="Preview Toko" className="w-20 h-20 object-cover border-4 border-black shadow-brutal bg-white flex-shrink-0" />
            <div>
              <p className="text-xs font-black uppercase">Foto Profil Toko</p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">Format: JPG, PNG, WEBP.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Upload Foto Baru</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Nama Toko</label>
            <input type="text" value={storeInfo.name} onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1">Deskripsi Toko</label>
            <textarea rows={3} value={storeInfo.description} onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
          </div>

          <button type="submit" disabled={savingStore} className="bg-black text-white font-black px-6 py-3 text-xs uppercase border-2 border-black shadow-brutal hover:bg-yellow-300 hover:text-black transition cursor-pointer">
            {savingStore ? 'Menyimpan...' : 'Simpan Perubahan Toko'}
          </button>
        </form>
      )}

      {/* MODAL BUAT VOUCHER BARU */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-brutal-lg space-y-4">
            <div className="flex justify-between items-center border-b-4 border-black pb-2">
              <h3 className="text-lg font-black uppercase">Buat Voucher Toko</h3>
              <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="font-black text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Kode Voucher</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SALE50K"
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Tipe Diskon</label>
                  <select
                    value={voucherForm.type}
                    onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value })}
                    className="w-full border-2 border-black p-2 text-xs font-bold bg-white"
                  >
                    <option value="fixed">Nominal (Rp)</option>
                    <option value="percentage">Persentase (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Nilai Diskon</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 10000"
                    value={voucherForm.amount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                    className="w-full border-2 border-black p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Minimal Belanja (Rp)</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={voucherForm.minSpend}
                  onChange={(e) => setVoucherForm({ ...voucherForm, minSpend: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kuota Voucher</label>
                <input
                  type="number"
                  placeholder="50"
                  value={voucherForm.quota}
                  onChange={(e) => setVoucherForm({ ...voucherForm, quota: e.target.value })}
                  className="w-full border-2 border-black p-2 text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white font-black py-3 text-xs uppercase border-2 border-black hover:bg-yellow-300 hover:text-black transition cursor-pointer"
              >
                Rilis Voucher Baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-lg w-full shadow-brutal-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b-4 border-black pb-2">
              <h3 className="text-lg font-black uppercase">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="font-black text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Nama Produk</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Harga (Rp)</label>
                  <input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Stok</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kategori</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs bg-white">
                  <option value="tshirt">T-Shirt / Kaos</option>
                  <option value="hoodie">Hoodie / Jaket</option>
                  <option value="pants">Celana / Pants</option>
                  <option value="shoes">Sepatu / Sneakers</option>
                  <option value="accessories">Aksesoris / Tas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Upload Gambar Produk</label>
                <input type="file" accept="image/*" onChange={handleProductImageUpload} className="w-full bg-gray-50 border-2 border-black p-2 font-bold text-xs" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Deskripsi Produk</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border-2 border-black p-2 font-bold text-xs" />
              </div>

              <button type="submit" className="w-full bg-black text-white border-2 border-black py-2 text-xs font-black uppercase hover:bg-yellow-300 hover:text-black transition cursor-pointer">
                Simpan Produk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}