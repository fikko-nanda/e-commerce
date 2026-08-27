import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { storeService, productService, orderService, reviewService } from '../../services';

// Import komponen anak
import ShippingModal from './components/ShippingModal';
import ProductTab from './components/ProductTab';
import OrderTab from './components/OrderTab';
import AnalyticsTab from './components/AnalyticsTab';
import VoucherTab from './components/VoucherTab';
import ReviewTab from './components/ReviewTab';
import WalletTab from './components/WalletTab';
import SettingsTab from './components/SettingsTab';

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
    sold: Number(p.sold_count || p.sold || 0),
  };
}

function getOrderStatus(order) {
  const shipStatus = (order.shipping_status || '').toLowerCase();
  const payStatus = (order.payment_status || '').toLowerCase();
  const payMethod = (order.payment_method || '').toLowerCase();

  if (shipStatus === 'shipped') return 'Dikirim';
  if (shipStatus === 'delivered' || shipStatus === 'selesai') return 'Selesai';
  if (payStatus === 'paid' || payMethod === 'cod') return 'Perlu Dikirim';
  if (payStatus === 'failed') return 'Gagal';
  if (payStatus === 'expired') return 'Kadaluarsa';

  return 'Pending';
}

function extractCourier(order) {
  if (order.courier_name) return order.courier_name;
  if (order.courier) return order.courier;

  const address = order.shipping_address || '';
  if (address.startsWith('[')) {
    const match = address.match(/^\[(.*?)\]/);
    if (match && match[1]) {
      return match[1].replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    }
  }

  return 'J&T Express';
}

function normalizeOrder(o) {
  return {
    id: o.id,
    customer: o.buyer_username || o.buyer_email || 'Pembeli',
    items: `${o.product_name || o.product?.name || 'Produk'} (${o.quantity || 1} pcs)`,
    total: Number(o.total_price || 0),
    status: getOrderStatus(o),
    shipping_status: o.shipping_status,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    tracking_number: o.tracking_number || o.resi || o.tracking_code || '',
    courier_name: extractCourier(o),
    date: (o.created_at || '').split('T')[0],
  };
}

function normalizeReview(r) {
  return {
    id: r.id,
    productName: r.product_name || r.product?.name || 'Produk WarMart',
    buyer: r.username || r.user?.username || r.buyer_username || 'Pembeli',
    rating: Number(r.rating || 5),
    comment: r.comment || r.review_text || '',
    date: (r.created_at || '').split('T')[0],
    reply: r.reply || r.seller_reply || '',
  };
}

export default function SellerDashboard() {
  const { user } = useContext(AuthContext) || {};
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('products');
  const [isSuspended, setIsSuspended] = useState(false);

  const [storeInfo, setStoreInfo] = useState({
    name: user?.first_name ? `${user.first_name} Store` : 'Toko Saya',
    description: 'Penyedia streetwear & fashion lokal kualitas brutal.',
    phone: user?.phone || '',
    logo: 'https://images.unsplash.com/photo-1560060141-7b9018741ced?w=400&auto=format&fit=crop&q=80',
    logoFile: null,
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  const [shippingModalOrderId, setShippingModalOrderId] = useState(null);

  const [vouchers, setVouchers] = useState([
    { id: 1, code: 'NEO10K', discount: 'Rp 10.000', minSpend: 100000, quota: 50, used: 12, status: 'Aktif' },
    { id: 2, code: 'BRUTAL20', discount: '20%', minSpend: 250000, quota: 30, used: 30, status: 'Habis' },
  ]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherForm, setVoucherForm] = useState({ code: '', type: 'fixed', amount: '', minSpend: '', quota: '' });

  const [reviews, setReviews] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});

  const [wallet, setWallet] = useState({
    balance: 1450000,
    pendingBalance: 320000,
    history: [
      { id: 'WD-001', date: '2026-08-10', amount: 500000, bank: 'BCA (1234xxxx)', status: 'Selesai' },
    ],
  });
  const [withdrawForm, setWithdrawForm] = useState({ bank: 'BCA', accountNumber: '', amount: '' });

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
            phone: s.phone || prev.phone,
            logo: s.logo ? toAbsoluteUrl(s.logo) : s.image ? toAbsoluteUrl(s.image) : prev.logo,
          }));

          if (s.status === 'suspended') {
            setIsSuspended(true);
          }
        }
      } catch {
        // Abaikan
      }

      try {
        const res = await productService.getMyProducts();
        if (!cancelled) {
          const list = res?.data?.results || res?.data?.data || res?.data || [];
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
          const list = res?.data?.results || res?.data?.data || res?.data || [];
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
          const rawData = revRes.data.results || revRes.data.data || revRes.data;
          const list = Array.isArray(rawData) ? rawData : [];
          setReviews(list.map(normalizeReview));
        }
      } catch {
        // Abaikan
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

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
      if (storeInfo.phone) payload.append('phone', storeInfo.phone);
      if (storeInfo.logoFile) payload.append('logo', storeInfo.logoFile);

      const res = await (storeService.updateMyStore || storeService.updateStore)(payload);
      const saved = res?.data?.store;
      if (saved?.logo) {
        setStoreInfo((prev) => ({ ...prev, logo: toAbsoluteUrl(saved.logo), logoFile: null }));
      }
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

  const handleConfirmShippingFromModal = async ({ courierName, trackingNumber }) => {
    if (!shippingModalOrderId) return;
    try {
      const res = await orderService.updateShipping(shippingModalOrderId, {
        courier_name: courierName,
        tracking_number: trackingNumber,
        shipping_status: 'shipped',
      });
      const updated = res?.data?.data || res?.data;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === shippingModalOrderId ? { ...o, ...normalizeOrder(updated) } : o)));
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === shippingModalOrderId
              ? { ...o, shipping_status: 'shipped', status: 'Dikirim', tracking_number: trackingNumber, courier_name: courierName }
              : o
          )
        );
      }
      showToast('🚀 Resi pengiriman berhasil disimpan & status diperbarui!', 'success');
      setShippingModalOrderId(null);
    } catch {
      showToast('Gagal memperbarui resi pengiriman.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const activeOrder = orders.find((o) => o.id === orderId);
      const resiCode = activeOrder?.tracking_number || `RESI-${String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;
      const courier = activeOrder?.courier_name || 'J&T Express';

      const res = await orderService.updateShipping(orderId, {
        courier_name: courier,
        tracking_number: resiCode,
        shipping_status: newStatus,
        payment_status: newStatus === 'delivered' ? 'paid' : activeOrder?.payment_status,
      });
      const updated = res?.data?.data || res?.data;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...normalizeOrder(updated) } : o)));
      }
      showToast('Status pesanan berhasil diperbarui!', 'success');
    } catch {
      showToast('Gagal memperbarui status pesanan.', 'error');
    }
  };

  const handleConfirmPayStatus = async (orderId) => {
    try {
      const activeOrder = orders.find((o) => o.id === orderId);
      const courier = activeOrder?.courier_name || 'J&T Express';
      const resiCode = activeOrder?.tracking_number || `RESI-${String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

      await orderService.updateShipping(orderId, {
        courier_name: courier,
        tracking_number: resiCode,
        shipping_status: 'delivered',
        payment_status: 'paid',
      });

      showToast('Status pesanan berhasil dikonfirmasi Lunas & Selesai!', 'success');

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'paid', status: 'Selesai', shipping_status: 'delivered', tracking_number: resiCode } : o))
      );
    } catch {
      showToast('Gagal mengubah status pesanan.', 'error');
    }
  };

  const handleReplyReview = async (reviewId) => {
    const replyText = replyInputs[reviewId];
    if (!replyText?.trim()) return;

    try {
      await reviewService.replyReview(reviewId, replyText);
    } catch {
      // Abaikan
    }

    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply: replyText } : r)));
    setReplyInputs((prev) => ({ ...prev, [reviewId]: '' }));
    showToast('Balasan ulasan telah terkirim.', 'success');
  };

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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
                PUSAT PENJUAL / SHOPEE MODE
              </span>

              {isSuspended && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 uppercase tracking-widest border border-black animate-pulse">
                  ⚠️ AKUN ANDA TER-SUSPEND
                </span>
              )}
            </div>

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
            {orders.filter((o) => o.status === 'Perlu Dikirim' || o.status === 'Pending').length} Pesanan
          </p>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-brutal">
          <p className="text-[10px] font-black uppercase text-gray-500">Saldo Toko</p>
          <p className="text-xl font-black mt-1 text-green-700">Rp {wallet.balance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b-4 border-black gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setActiveTab('products')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'products' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          📦 Produk ({products.length})
        </button>
        <button type="button" onClick={() => setActiveTab('orders')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'orders' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          📑 Pesanan ({orders.length})
        </button>
        <button type="button" onClick={() => setActiveTab('analytics')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'analytics' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          📊 Performa Bisnis
        </button>
        <button type="button" onClick={() => setActiveTab('promotions')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'promotions' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          🎟️ Voucher Toko
        </button>
        <button type="button" onClick={() => setActiveTab('reviews')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'reviews' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          ⭐ Ulasan ({reviews.length})
        </button>
        <button type="button" onClick={() => setActiveTab('wallet')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'wallet' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          💰 Saldo Toko
        </button>
        <button type="button" onClick={() => setActiveTab('settings')} className={`px-5 py-3 font-black text-xs uppercase border-t-4 border-x-4 border-black cursor-pointer transition whitespace-nowrap ${activeTab === 'settings' ? 'bg-black text-white -mb-1 pb-4' : 'bg-gray-100 hover:bg-yellow-300'}`}>
          ⚙️ Pengaturan Toko
        </button>
      </div>

      {/* RENDER TAB BERDASARKAN STATE */}
      {activeTab === 'products' && (
        <ProductTab
          loadingProducts={loadingProducts}
          products={products}
          handleOpenAddModal={handleOpenAddModal}
          handleOpenEditModal={handleOpenEditModal}
          handleDeleteProduct={handleDeleteProduct}
        />
      )}

      {activeTab === 'orders' && (
        <OrderTab
          loadingOrders={loadingOrders}
          orders={orders}
          setShippingModalOrderId={setShippingModalOrderId}
          handleConfirmPayStatus={handleConfirmPayStatus}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab orders={orders} products={products} />
      )}

      {activeTab === 'promotions' && (
        <VoucherTab vouchers={vouchers} setIsVoucherModalOpen={setIsVoucherModalOpen} />
      )}

      {activeTab === 'reviews' && (
        <ReviewTab
          reviews={reviews}
          replyInputs={replyInputs}
          setReplyInputs={setReplyInputs}
          handleReplyReview={handleReplyReview}
        />
      )}

      {activeTab === 'wallet' && (
        <WalletTab
          wallet={wallet}
          withdrawForm={withdrawForm}
          setWithdrawForm={setWithdrawForm}
          handleWithdraw={handleWithdraw}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          storeInfo={storeInfo}
          setStoreInfo={setStoreInfo}
          handleSaveStore={handleSaveStore}
          handleLogoUpload={handleLogoUpload}
          savingStore={savingStore}
        />
      )}

      {/* MODAL BUAT VOUCHER BARU */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-brutal-lg space-y-4">
            <div className="flex justify-between items-center border-b-4 border-black pb-2">
              <h3 className="text-lg font-black uppercase">Buat Voucher Toko</h3>
              <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="font-black text-lg cursor-pointer">✕</button>
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

      {/* POP-UP MODAL INPUT RESI PENGIRIMAN */}
      <ShippingModal
        isOpen={Boolean(shippingModalOrderId)}
        selectedCourier={
          orders.find((o) => o.id === shippingModalOrderId)?.courier_name || 'J&T Express'
        }
        onClose={() => setShippingModalOrderId(null)}
        onSubmit={handleConfirmShippingFromModal}
      />
    </div>
  );
}