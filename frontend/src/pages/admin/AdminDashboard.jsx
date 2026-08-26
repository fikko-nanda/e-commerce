import { useState, useEffect } from 'react';
import { reviewService, storeService, userService, productService, orderService } from '../../services';

import AdminHeader from './components/AdminHeader';
import AdminStats from './components/AdminStats';
import AdminTabs from './components/AdminTabs';
import StoresTab from './components/StoresTab';
import UsersTab from './components/UsersTab';
import ReviewsTab from './components/ReviewsTab';

const normalizeList = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const STATUS_LABELS = {
  active: { label: 'AKTIF', color: 'bg-green-400 text-black' },
  pending_review: { label: 'MENUNGGU', color: 'bg-yellow-300 text-black' },
  rejected: { label: 'DITOLAK', color: 'bg-red-400 text-white' },
  suspended: { label: 'SUSPEND', color: 'bg-gray-700 text-white' },
};

const ROLE_LABELS = {
  admin: { label: 'ADMIN', color: 'bg-red-500 text-white' },
  seller: { label: 'PENJUAL', color: 'bg-purple-400 text-black' },
  buyer: { label: 'PEMBELI', color: 'bg-blue-300 text-black' },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stores');
  const [searchQuery, setSearchQuery] = useState('');

  // States
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeActionId, setStoreActionId] = useState(null);
  const [storeStatusFilter, setStoreStatusFilter] = useState('all');

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionId, setUserActionId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const [products, setProducts] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [vouchers, setVouchers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('warmart_vouchers') || '[]');
    } catch {
      return [];
    }
  });

  const [newVoucher, setNewVoucher] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_uses: '',
    valid_until: '',
  });

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    localStorage.setItem('warmart_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  // Fetch API Functions
  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      let fetchedList = [];
      if (storeService && typeof storeService.adminGetAll === 'function') {
        const res = await storeService.adminGetAll();
        fetchedList = normalizeList(res);
      }

      let pendingLocal = [];
      let savedStatuses = {};
      try {
        pendingLocal = JSON.parse(localStorage.getItem('warmart_pending_stores') || '[]');
        savedStatuses = JSON.parse(localStorage.getItem('warmart_store_statuses') || '{}');
      } catch (e) {
        console.error(e);
      }

      const combinedMap = new Map();

      pendingLocal.forEach((s) => {
        if (s && s.store_name) {
          const nameKey = s.store_name.toLowerCase();
          combinedMap.set(nameKey, {
            ...s,
            status: savedStatuses[nameKey] || s.status || 'pending_review',
          });
        }
      });

      fetchedList.forEach((s) => {
        const nameKey = (s.store_name || s.name || '').toLowerCase();
        if (nameKey) {
          const currentStatus = savedStatuses[nameKey] || s.status || 'active';
          if (!combinedMap.has(nameKey)) {
            combinedMap.set(nameKey, { ...s, status: currentStatus });
          }
        }
      });

      setStores(Array.from(combinedMap.values()));
    } catch (err) {
      console.warn('Gagal memuat API Stores:', err);
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      if (userService && typeof userService.getAll === 'function') {
        const res = await userService.getAll();
        setUsers(normalizeList(res));
      }
    } catch (err) {
      console.warn('Gagal memuat API Users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      if (orderService && typeof orderService.getOrders === 'function') {
        const res = await orderService.getOrders();
        const list = normalizeList(res);
        const formatted = list.map((t, idx) => {
          let actualBuyer =
            t.buyer_username ||
            (typeof t.buyer === 'object' ? t.buyer?.username || t.buyer?.email : null) ||
            t.customer_name ||
            'Pembeli';

          const payStatus = String(t.payment_status || t.status || '').toLowerCase();
          const shipStatus = String(t.shipping_status || '').toLowerCase();

          let displayStatus = 'PENDING';
          if (['paid', 'lunas', 'success'].includes(payStatus) || ['delivered', 'selesai', 'completed'].includes(shipStatus)) {
            displayStatus = 'PAID';
          } else if (['failed', 'batal', 'cancelled', 'deny', 'expire'].includes(payStatus)) {
            displayStatus = 'FAILED';
          }

          return {
            id: t.id || t.order_id || t.order_number || `TRX-${idx + 1}`,
            buyer_name: actualBuyer,
            store_name: t.store_name || t.product?.store_name || t.product?.store?.store_name || 'Toko WarMart',
            total_amount: Number(t.total_price || t.price || t.amount || t.grand_total || 0),
            status: displayStatus,
            payment_method: t.payment_method || 'Online Payment',
            created_at: t.created_at || new Date().toISOString(),
          };
        });
        setTransactions(formatted);
      }
    } catch (err) {
      console.warn('Gagal memuat API Transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      if (productService) {
        const fetchFn = productService.getAll || productService.getProducts;
        if (typeof fetchFn === 'function') {
          const res = await fetchFn();
          const list = normalizeList(res);

          let currentOrders = [];
          try {
            if (orderService && typeof orderService.getOrders === 'function') {
              const resOrders = await orderService.getOrders();
              currentOrders = normalizeList(resOrders);
            }
          } catch (e) {
            console.warn('Gagal kalkulasi orders:', e);
          }

          const formatted = list.map((p) => {
            const productStock = p.stock ?? p.stok ?? 0;
            let productSold = p.sold_count ?? p.sold ?? p.total_sold ?? p.sales ?? p.sales_count ?? 0;

            if (Number(productSold) === 0 && currentOrders.length > 0) {
              const matchedOrders = currentOrders.filter((ord) => {
                const ordProductId = ord.product?.id || ord.product_id || ord.product;
                const isMatch = String(ordProductId) === String(p.id);
                const isPaid = ['paid', 'shipped', 'delivered', 'completed', 'success', 'lunas', 'selesai'].includes(
                  (ord.payment_status || ord.shipping_status || ord.status || '').toLowerCase()
                );
                return isMatch && isPaid;
              });

              productSold = matchedOrders.reduce((sum, ord) => sum + Number(ord.quantity || 1), 0);
            }

            return {
              id: p.id,
              name: p.name || p.title || 'Produk Noname',
              price: Number(p.price || 0),
              stock: productStock,
              category: p.category || 'fashion',
              store_name: p.store_name || p.store?.store_name || 'WARMART STORE',
              sold_count: productSold,
              created_at: p.created_at || new Date().toISOString(),
            };
          });
          setProducts(formatted);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat API Products:', err);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      if (reviewService && typeof reviewService.getAll === 'function') {
        const res = await reviewService.getAll();
        const list = normalizeList(res);
        const formatted = list.map((r) => ({
          id: r.id,
          username: r.username || r.user?.username || 'Pembeli',
          product_name: r.product_name || r.product?.name || 'Produk',
          store_name: r.store_name || r.product?.store?.store_name || 'Toko',
          rating: Number(r.rating || 5),
          comment: r.comment || '-',
          created_at: r.created_at || new Date().toISOString(),
        }));
        setReviews(formatted);
      }
    } catch (err) {
      console.warn('Gagal memuat API Reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // 1. Trigger saat tab aktif berganti
  useEffect(() => {
    const loadData = () => {
      if (activeTab === 'stores') fetchStores();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'transactions') fetchTransactions();
      if (activeTab === 'reviews') fetchReviews();
    };

    loadData();
  }, [activeTab]);

  // 2. Auto-Polling 5 detik & Auto-Refresh saat tab difokuskan kembali
  useEffect(() => {
    const refreshData = () => {
      if (activeTab === 'stores') fetchStores();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'products') fetchProducts();
      if (activeTab === 'transactions') fetchTransactions();
      if (activeTab === 'reviews') fetchReviews();
    };

    const interval = setInterval(refreshData, 5000);

    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Actions
  const handleStoreStatus = async (store, newStatus) => {
    if (!confirm(`Yakin ingin mengubah status toko "${store.store_name}"?`)) return;

    setStoreActionId(store.id);
    try {
      const storeKey = store.store_name.toLowerCase();
      const savedStatuses = JSON.parse(localStorage.getItem('warmart_store_statuses') || '{}');
      savedStatuses[storeKey] = newStatus;
      localStorage.setItem('warmart_store_statuses', JSON.stringify(savedStatuses));

      if (storeService && typeof storeService.adminUpdateStatus === 'function') {
        await storeService.adminUpdateStatus(store.id, newStatus);
      }
      fetchStores();
    } catch (err) {
      console.warn(err);
    } finally {
      setStoreActionId(null);
    }
  };

  const handleUserSuspend = async (user, action) => {
    if (!confirm(`Yakin ingin memproses akun "${user.email}"?`)) return;

    setUserActionId(user.id);
    try {
      if (userService) {
        if (action === 'suspend') await userService.suspend(user.id);
        else await userService.unsuspend(user.id);
      }
      fetchUsers();
    } catch {
      console.warn('Gagal ubah status user');
    } finally {
      setUserActionId(null);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!confirm('Take down produk ini dari platform?')) return;
    try {
      if (productService && typeof productService.delete === 'function') {
        await productService.delete(prodId);
      }
      fetchProducts();
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Hapus ulasan ini secara permanen?')) return;
    setDeletingId(reviewId);
    try {
      if (reviewService && typeof reviewService.delete === 'function') {
        await reviewService.delete(reviewId);
      }
      fetchReviews();
    } catch {
      console.warn('Gagal hapus ulasan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.discount_value) return;

    const created = {
      id: `v-${Date.now()}`,
      code: newVoucher.code.toUpperCase().trim(),
      discount_type: newVoucher.discount_type,
      discount_value: Number(newVoucher.discount_value),
      min_purchase: Number(newVoucher.min_purchase || 0),
      max_uses: Number(newVoucher.max_uses || 100),
      used_count: 0,
      valid_until: newVoucher.valid_until || '2026-12-31',
      is_active: true,
    };

    setVouchers((prev) => [created, ...prev]);
    setNewVoucher({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_uses: '',
      valid_until: '',
    });
    alert(`Voucher ${created.code} diterbitkan!`);
  };

  const handleExportCSV = () => {
    let exportData = [];
    if (activeTab === 'stores') exportData = stores;
    else if (activeTab === 'users') exportData = users;
    else if (activeTab === 'products') exportData = products;
    else if (activeTab === 'transactions') exportData = transactions;
    else if (activeTab === 'vouchers') exportData = vouchers;
    else if (activeTab === 'reviews') exportData = reviews;

    if (!exportData.length) return alert('Tidak ada data untuk diexport.');

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `warmart_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.status === 'active').length;
  const totalUsers = users.length;
  const totalReviews = reviews.length;
  const totalGMV = transactions.reduce((acc, t) => acc + (t.total_amount || 0), 0);
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
      : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Number(r.rating) === star).length;
    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, percent };
  });

  // Filter Data
  const filteredStores = stores
    .filter((s) => storeStatusFilter === 'all' || s.status === storeStatusFilter)
    .filter(
      (s) =>
        (s.store_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.owner_email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredUsers = users
    .filter((u) => userRoleFilter === 'all' || u.role === userRoleFilter)
    .filter(
      (u) =>
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredProducts = products.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.store_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(
    (t) =>
      (t.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.store_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.buyer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVouchers = vouchers.filter((v) =>
    (v.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews
    .filter((r) => filterRating === 'all' || Number(r.rating) === Number(filterRating))
    .filter(
      (r) =>
        (r.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.product_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const formatDate = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const renderStars = (rating) => {
    const n = Number(rating || 0);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6 bg-yellow-300 border-4 border-black p-3 text-xs font-black uppercase flex justify-between items-center shadow-brutal">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
          ⚡ PANEL KONTROL ADMIN WARMART (AUTO-SYNC LIVE)
        </span>
        <a href="/" className="bg-black text-white px-3 py-1 border border-black hover:bg-red-500 transition">
          ← Ke Halaman Utama
        </a>
      </div>

      <AdminHeader />

      <AdminStats
        totalStores={totalStores}
        activeStores={activeStores}
        totalUsers={totalUsers}
        totalReviews={totalReviews}
        avgRating={avgRating}
      />

      <div className="my-6 bg-gray-100 border-4 border-black p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-brutal">
        <div className="w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`🔍 Cari di tab ${activeTab.toUpperCase()}...`}
            className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold focus:outline-none"
          />
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto bg-green-400 text-black px-4 py-2 border-2 border-black font-black text-xs uppercase hover:bg-green-300 transition shadow-brutal cursor-pointer"
        >
          📥 Export CSV ({activeTab.toUpperCase()})
        </button>
      </div>

      <AdminTabs
        activeTab={activeTab}
        onTabSwitch={handleTabSwitch}
        totalStores={totalStores}
        totalUsers={totalUsers}
        totalReviews={totalReviews}
      />

      <div className="flex flex-wrap gap-2 my-4">
        <button
          onClick={() => handleTabSwitch('products')}
          className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase cursor-pointer ${
            activeTab === 'products' ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
          }`}
        >
          📦 Produk ({products.length})
        </button>
        <button
          onClick={() => handleTabSwitch('transactions')}
          className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase cursor-pointer ${
            activeTab === 'transactions' ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
          }`}
        >
          💳 Transaksi ({transactions.length})
        </button>
        <button
          onClick={() => handleTabSwitch('vouchers')}
          className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase cursor-pointer ${
            activeTab === 'vouchers' ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
          }`}
        >
          🎟️ Voucher Promo ({vouchers.length})
        </button>
      </div>

      {activeTab === 'stores' && (
        <StoresTab
          stores={filteredStores}
          loading={storesLoading}
          actionId={storeActionId}
          filter={storeStatusFilter}
          setFilter={setStoreStatusFilter}
          statusLabels={STATUS_LABELS}
          onStatusChange={handleStoreStatus}
          formatDate={formatDate}
        />
      )}

      {activeTab === 'users' && (
        <UsersTab
          users={filteredUsers}
          loading={usersLoading}
          actionId={userActionId}
          filter={userRoleFilter}
          setFilter={setUserRoleFilter}
          roleLabels={ROLE_LABELS}
          statusLabels={STATUS_LABELS}
          onUserSuspend={handleUserSuspend}
          formatDate={formatDate}
        />
      )}

      {activeTab === 'vouchers' && (
        <div className="space-y-6 mt-4">
          <div className="bg-yellow-300 border-4 border-black p-6 shadow-brutal">
            <h2 className="text-xl font-black uppercase mb-4">➕ Buat Voucher Promo Baru</h2>
            <form onSubmit={handleCreateVoucher} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Kode Voucher</label>
                <input
                  type="text"
                  placeholder="MISAL: WARMART50"
                  value={newVoucher.code}
                  onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold uppercase focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Tipe Diskon</label>
                <select
                  value={newVoucher.discount_type}
                  onChange={(e) => setNewVoucher({ ...newVoucher, discount_type: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Nilai Diskon</label>
                <input
                  type="number"
                  placeholder={newVoucher.discount_type === 'percentage' ? '20 (%)' : '25000 (Rp)'}
                  value={newVoucher.discount_value}
                  onChange={(e) => setNewVoucher({ ...newVoucher, discount_value: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Min. Belanja (Rp)</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={newVoucher.min_purchase}
                  onChange={(e) => setNewVoucher({ ...newVoucher, min_purchase: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Kuota Pakai</label>
                <input
                  type="number"
                  placeholder="100"
                  value={newVoucher.max_uses}
                  onChange={(e) => setNewVoucher({ ...newVoucher, max_uses: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-1">Berlaku Sampai</label>
                <input
                  type="date"
                  value={newVoucher.valid_until}
                  onChange={(e) => setNewVoucher({ ...newVoucher, valid_until: e.target.value })}
                  className="w-full bg-white border-2 border-black p-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-black text-white p-3 border-2 border-black font-black text-xs uppercase hover:bg-red-500 transition shadow-brutal cursor-pointer"
                >
                  🚀 Terbitkan Voucher
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-brutal">
            <h2 className="text-xl font-black uppercase mb-4">Daftar Voucher Aktif</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-purple-400 text-black border-b-2 border-black uppercase">
                    <th className="p-3 border-r-2 border-black">Kode</th>
                    <th className="p-3 border-r-2 border-black">Diskon</th>
                    <th className="p-3 border-r-2 border-black">Min. Belanja</th>
                    <th className="p-3 border-r-2 border-black">Penggunaan</th>
                    <th className="p-3 border-r-2 border-black">Kadaluarsa</th>
                    <th className="p-3 border-r-2 border-black">Status</th>
                    <th className="p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500 uppercase font-black">
                        Belum ada voucher diterbitkan.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => (
                      <tr key={v.id} className="border-b border-black hover:bg-gray-50">
                        <td className="p-3 border-r-2 border-black font-mono font-black text-sm">{v.code}</td>
                        <td className="p-3 border-r-2 border-black">
                          {v.discount_type === 'percentage'
                            ? `${v.discount_value}%`
                            : `Rp ${Number(v.discount_value).toLocaleString('id-ID')}`}
                        </td>
                        <td className="p-3 border-r-2 border-black">Rp {Number(v.min_purchase).toLocaleString('id-ID')}</td>
                        <td className="p-3 border-r-2 border-black">
                          {v.used_count} / {v.max_uses}
                        </td>
                        <td className="p-3 border-r-2 border-black">{v.valid_until}</td>
                        <td className="p-3 border-r-2 border-black">
                          <span
                            className={`px-2 py-0.5 border border-black text-[10px] uppercase font-black ${
                              v.is_active ? 'bg-green-400 text-black' : 'bg-red-400 text-white'
                            }`}
                          >
                            {v.is_active ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </td>
                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() =>
                              setVouchers((prev) =>
                                prev.map((item) => (item.id === v.id ? { ...item, is_active: !item.is_active } : item))
                              )
                            }
                            className="bg-yellow-300 text-black px-2 py-1 border border-black text-[10px] uppercase font-black hover:bg-black hover:text-white transition cursor-pointer"
                          >
                            {v.is_active ? 'Matikan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Hapus voucher ini?')) {
                                setVouchers((prev) => prev.filter((item) => item.id !== v.id));
                              }
                            }}
                            className="bg-red-500 text-white px-2 py-1 border border-black text-[10px] uppercase font-black hover:bg-black transition cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white border-4 border-black p-6 shadow-brutal mt-4">
          <h2 className="text-xl font-black uppercase mb-4">Moderasi Katalog Produk</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold border-collapse border-2 border-black">
              <thead>
                <tr className="bg-yellow-300 border-b-2 border-black text-black uppercase">
                  <th className="p-3 border-r-2 border-black">Produk</th>
                  <th className="p-3 border-r-2 border-black">Toko</th>
                  <th className="p-3 border-r-2 border-black">Harga</th>
                  <th className="p-3 border-r-2 border-black">Stok</th>
                  <th className="p-3 border-r-2 border-black">Terjual</th>
                  <th className="p-3">Aksi Moderasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-black hover:bg-gray-50">
                    <td className="p-3 border-r-2 border-black font-black">{p.name}</td>
                    <td className="p-3 border-r-2 border-black">{p.store_name}</td>
                    <td className="p-3 border-r-2 border-black">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                    <td className="p-3 border-r-2 border-black font-black">{p.stock} pcs</td>
                    <td className="p-3 border-r-2 border-black font-black bg-green-100">{p.sold_count}x</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-red-500 text-white px-3 py-1 border border-black text-[10px] uppercase font-black hover:bg-black transition cursor-pointer"
                      >
                        🗑 Take Down
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white border-4 border-black p-6 shadow-brutal mt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-black gap-4">
            <div>
              <h2 className="text-xl font-black uppercase">Monitor Transaksi Platform</h2>
              <p className="text-xs text-gray-600 font-bold">Ringkasan perputaran uang di platform WARMART.</p>
            </div>
            <div className="bg-black text-yellow-300 p-3 border-2 border-black text-xs font-black uppercase">
              Total GMV: Rp {totalGMV.toLocaleString('id-ID')}
            </div>
          </div>

          {transactionsLoading && transactions.length === 0 ? (
            <div className="p-8 text-center font-black uppercase text-gray-500">Memuat Data Transaksi Terbaru...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-black text-white border-b-2 border-black uppercase">
                    <th className="p-3 border-r-2 border-white">ID Transaksi</th>
                    <th className="p-3 border-r-2 border-white">Pembeli</th>
                    <th className="p-3 border-r-2 border-white">Toko Penjual</th>
                    <th className="p-3 border-r-2 border-white">Metode</th>
                    <th className="p-3 border-r-2 border-white">Total</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500 uppercase font-black">
                        Belum ada riwayat transaksi.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="border-b border-black hover:bg-gray-50">
                        <td className="p-3 border-r-2 border-black font-mono font-black">{t.id}</td>
                        <td className="p-3 border-r-2 border-black">@{t.buyer_name}</td>
                        <td className="p-3 border-r-2 border-black">{t.store_name}</td>
                        <td className="p-3 border-r-2 border-black">{t.payment_method}</td>
                        <td className="p-3 border-r-2 border-black font-black">Rp {Number(t.total_amount).toLocaleString('id-ID')}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 border border-black text-[10px] uppercase font-black ${
                              t.status === 'PAID'
                                ? 'bg-green-400 text-black'
                                : t.status === 'FAILED'
                                ? 'bg-red-500 text-white'
                                : 'bg-yellow-300 text-black'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <ReviewsTab
          reviews={filteredReviews}
          loading={reviewsLoading}
          deletingId={deletingId}
          filter={filterRating}
          setFilter={setFilterRating}
          avgRating={avgRating}
          totalReviews={totalReviews}
          ratingDistribution={ratingDistribution}
          onDeleteReview={handleDeleteReview}
          renderStars={renderStars}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}