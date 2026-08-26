import { useState, useEffect } from 'react';
import { reviewService, storeService, userService } from '../../services';

import AdminHeader from './components/AdminHeader';
import AdminStats from './components/AdminStats';
import AdminTabs from './components/AdminTabs';
import StoresTab from './components/StoresTab';
import UsersTab from './components/UsersTab';
import ReviewsTab from './components/ReviewsTab';

// Data dummy cadangan bila API Backend offline / Unauthenticated
const DUMMY_STORES = [
  {
    id: 'store-1',
    store_name: 'WARMART OFFICIAL',
    owner_email: 'budi@warmart.com',
    owner_username: 'budi',
    status: 'active',
    phone: '081234567890',
    address: 'Jl. Sudirman No. 123, Jakarta',
    created_at: new Date('2026-01-05').toISOString(),
  },
  {
    id: 'store-2',
    store_name: 'URBAN CORE',
    owner_email: 'siti@urbancore.com',
    owner_username: 'siti',
    status: 'pending_review',
    phone: '0899123456',
    address: 'Jl. Asia Afrika No. 8, Bandung',
    created_at: new Date('2026-01-12').toISOString(),
  },
];

const DUMMY_USERS = [
  {
    id: 'user-1',
    email: 'budi@warmart.com',
    username: 'budi',
    role: 'seller',
    is_active: true,
    date_joined: new Date('2026-01-05').toISOString(),
    store_name: 'WARMART OFFICIAL',
    store_status: 'active',
  },
  {
    id: 'user-2',
    email: 'siti@urbancore.com',
    username: 'siti',
    role: 'buyer',
    is_active: true,
    date_joined: new Date('2026-01-12').toISOString(),
    store_name: 'URBAN CORE',
    store_status: 'pending_review',
  },
  {
    id: 'user-3',
    email: 'troll@spam.com',
    username: 'trollking',
    role: 'buyer',
    is_active: false,
    date_joined: new Date('2026-01-20').toISOString(),
    store_name: null,
    store_status: null,
  },
];

const DUMMY_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'WARMART Heavyweight Graphic Tee',
    price: 189000,
    stock: 45,
    category: 'tshirt',
    store_name: 'WARMART OFFICIAL',
    sold_count: 120,
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Cyberpunk Black Pullover Hoodie',
    price: 349000,
    stock: 12,
    category: 'hoodie',
    store_name: 'WARMART OFFICIAL',
    sold_count: 85,
    created_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Tactical Cargo Pants Black',
    price: 279000,
    stock: 0,
    category: 'pants',
    store_name: 'URBAN CORE',
    sold_count: 40,
    created_at: new Date('2026-01-15').toISOString(),
  },
];

const DUMMY_TRANSACTIONS = [
  {
    id: 'TRX-9901',
    buyer_name: 'street_kid',
    store_name: 'WARMART OFFICIAL',
    total_amount: 378000,
    status: 'completed',
    payment_method: 'QRIS',
    created_at: new Date('2026-02-01').toISOString(),
  },
  {
    id: 'TRX-9902',
    buyer_name: 'hypebeast_user',
    store_name: 'URBAN CORE',
    total_amount: 349000,
    status: 'paid',
    payment_method: 'Transfer Bank',
    created_at: new Date('2026-02-10').toISOString(),
  },
  {
    id: 'TRX-9903',
    buyer_name: 'budi',
    store_name: 'WARMART OFFICIAL',
    total_amount: 149000,
    status: 'pending',
    payment_method: 'E-Wallet',
    created_at: new Date('2026-02-18').toISOString(),
  },
];

const DUMMY_REVIEWS = [
  {
    id: 'rev-1',
    username: 'street_kid',
    product_name: 'WARMART Heavyweight Graphic Tee',
    store_name: 'WARMART OFFICIAL',
    rating: 5,
    comment: 'Sablon awet, bahan tebal sesuai deskripsi. Recommended seller!',
    created_at: new Date('2026-01-20').toISOString(),
  },
  {
    id: 'rev-2',
    username: 'hypebeast_user',
    product_name: 'Cyberpunk Black Pullover Hoodie',
    store_name: 'URBAN CORE',
    rating: 4,
    comment: 'Desain keren, tapi jahitan lengan sedikit longgar. Overall mantap.',
    created_at: new Date('2026-01-22').toISOString(),
  },
  {
    id: 'rev-3',
    username: 'buyer.anonim',
    product_name: 'Tactical Cargo Pants Black',
    store_name: 'WARMART OFFICIAL',
    rating: 2,
    comment: 'Ukuran tidak sesuai tabel. Kecewa dengan kualitas jahitan.',
    created_at: new Date('2026-01-25').toISOString(),
  },
];

const DUMMY_VOUCHERS = [
  {
    id: 'v-1',
    code: 'WARMART2026',
    discount_type: 'percentage',
    discount_value: 20,
    min_purchase: 100000,
    max_uses: 100,
    used_count: 42,
    valid_until: '2026-12-31',
    is_active: true,
  },
  {
    id: 'v-2',
    code: 'GAJIANHEMAT',
    discount_type: 'fixed',
    discount_value: 50000,
    min_purchase: 250000,
    max_uses: 50,
    used_count: 50,
    valid_until: '2026-02-28',
    is_active: false,
  },
];

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

  // Stores State
  const [stores, setStores] = useState(DUMMY_STORES);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeActionId, setStoreActionId] = useState(null);
  const [storeStatusFilter, setStoreStatusFilter] = useState('all');

  // Users State
  const [users, setUsers] = useState(DUMMY_USERS);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionId, setUserActionId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Products & Transactions State
  const [products, setProducts] = useState(DUMMY_PRODUCTS);
  const [transactions] = useState(DUMMY_TRANSACTIONS);

  // Vouchers State
  const [vouchers, setVouchers] = useState(DUMMY_VOUCHERS);
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_uses: '',
    valid_until: '',
  });

  // Reviews State
  const [reviews, setReviews] = useState(DUMMY_REVIEWS);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterRating, setFilterRating] = useState('all');

  // ---- Fetch Stores Dengan Membaca Status Permanen LocalStorage ----
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

      // 1. Masukkan pendaftaran toko pending lokal
      pendingLocal.forEach((s) => {
        if (s && s.store_name) {
          const nameKey = s.store_name.toLowerCase();
          combinedMap.set(nameKey, {
            ...s,
            status: savedStatuses[nameKey] || s.status || 'pending_review',
          });
        }
      });

      // 2. Masukkan toko dari backend
      fetchedList.forEach((s) => {
        const nameKey = (s.store_name || s.name || '').toLowerCase();
        if (nameKey) {
          const currentStatus = savedStatuses[nameKey] || s.status || 'active';
          if (!combinedMap.has(nameKey)) {
            combinedMap.set(nameKey, { ...s, status: currentStatus });
          }
        }
      });

      const finalStores = Array.from(combinedMap.values());
      setStores(finalStores.length > 0 ? finalStores : DUMMY_STORES);
    } catch (err) {
      console.warn('Gagal memuat API Stores, menggunakan fallback local:', err);
      setStores(DUMMY_STORES);
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      if (userService && typeof userService.getAll === 'function') {
        const res = await userService.getAll();
        const list = normalizeList(res);
        if (list.length > 0) setUsers(list);
      }
    } catch (err) {
      console.warn('Gagal memuat API Users (Gunakan Data Dummy):', err?.message || err);
      setUsers(DUMMY_USERS);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      if (reviewService && typeof reviewService.getAll === 'function') {
        const res = await reviewService.getAll();
        const list = normalizeList(res);
        if (list.length > 0) setReviews(list);
      }
    } catch (err) {
      console.warn('Gagal memuat API Reviews:', err);
      setReviews(DUMMY_REVIEWS);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!isMounted) return;
      if (activeTab === 'stores') await fetchStores();
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'reviews') await fetchReviews();
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // ---- Aksi Suspend / Aktifkan Toko Permanen ----
  const handleStoreStatus = async (store, newStatus) => {
    const verb =
      {
        active: 'verifikasi/aktifkan',
        rejected: 'tolak',
        suspended: 'suspend',
      }[newStatus] || newStatus;

    if (!confirm(`Yakin ingin ${verb} toko "${store.store_name}"?`)) return;

    setStoreActionId(store.id);

    // 1. Update UI secara langsung
    setStores((prev) =>
      prev.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s))
    );

    // 2. Simpan status ke LocalStorage secara permanen berdasarkan NAMA TOKO
    try {
      const storeKey = store.store_name.toLowerCase();
      const savedStatuses = JSON.parse(localStorage.getItem('warmart_store_statuses') || '{}');
      savedStatuses[storeKey] = newStatus;
      localStorage.setItem('warmart_store_statuses', JSON.stringify(savedStatuses));
    } catch (e) {
      console.error(e);
    }

    // 3. Panggil service secara aman
    try {
      if (storeService && typeof storeService.adminUpdateStatus === 'function') {
        await storeService.adminUpdateStatus(store.id, newStatus);
      }
    } catch (err) {
      console.warn('Simpan status lokal aktif.', err);
    } finally {
      setStoreActionId(null);
    }
  };

  // ---- Aksi Users ----
  const handleUserSuspend = async (user, action) => {
    const verb = action === 'suspend' ? 'menangguhkan' : 'mengaktifkan kembali';
    if (!confirm(`Yakin ingin ${verb} user "${user.email}"?`)) return;

    setUserActionId(user.id);
    try {
      if (userService) {
        if (action === 'suspend' && typeof userService.suspend === 'function') {
          await userService.suspend(user.id);
        } else if (typeof userService.unsuspend === 'function') {
          await userService.unsuspend(user.id);
        }
      }
      await fetchUsers();
    } catch {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: action === 'unsuspend' } : u
        )
      );
    } finally {
      setUserActionId(null);
    }
  };

  // ---- Aksi Products & Reviews ----
  const handleDeleteProduct = (prodId) => {
    if (!confirm('Take down produk ini dari platform?')) return;
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Hapus ulasan ini secara permanen? Tindakan tidak bisa dibatalkan.')) return;

    setDeletingId(reviewId);
    try {
      if (reviewService && typeof reviewService.delete === 'function') {
        await reviewService.delete(reviewId);
      }
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Aksi Vouchers ----
  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!newVoucher.code || !newVoucher.discount_value) {
      alert('Isi kode voucher dan nilai diskon!');
      return;
    }

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
    alert(`Voucher ${created.code} berhasil dibuat!`);
  };

  const handleToggleVoucher = (id) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, is_active: !v.is_active } : v))
    );
  };

  const handleDeleteVoucher = (id) => {
    if (!confirm('Hapus voucher ini?')) return;
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  // ---- Export CSV ----
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

  // Derived Stats
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.status === 'active').length;
  const totalUsers = users.length;
  const totalReviews = reviews.length;
  const totalGMV = transactions.reduce((acc, t) => acc + t.total_amount, 0);
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
      : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Number(r.rating) === star).length;
    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, percent };
  });

  // Filtered Lists
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

  // Helpers
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
        <span>⚡ MODE ADMIN DEV / TESTING (AKSES BYPASS AKTIF)</span>
        <a href="/" className="bg-black text-white px-2 py-1 hover:bg-red-500 transition">
          ← Kembali ke Home
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
          className="w-full sm:w-auto bg-green-400 text-black px-4 py-2 border-2 border-black font-black text-xs uppercase hover:bg-green-300 transition shadow-brutal"
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
          className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase ${
            activeTab === 'products' ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
          }`}
        >
          📦 Produk ({products.length})
        </button>
        <button
          onClick={() => handleTabSwitch('transactions')}
          className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase ${
            activeTab === 'transactions' ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
          }`}
        >
          💳 Transaksi ({transactions.length})
        </button>
        <button
          onClick={() => handleTabSwitch('vouchers')}
          className={`px-3 py-1.5 border-2 border-black font-black text-xs uppercase ${
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
                  className="w-full bg-black text-white p-3 border-2 border-black font-black text-xs uppercase hover:bg-red-500 transition shadow-brutal"
                >
                  🚀 Terbitkan Voucher
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-brutal">
            <h2 className="text-xl font-black uppercase mb-4">Daftar Voucher Aktif & Kategori</h2>
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
                  {filteredVouchers.map((v) => (
                    <tr key={v.id} className="border-b border-black hover:bg-gray-50">
                      <td className="p-3 border-r-2 border-black font-mono font-black text-sm">{v.code}</td>
                      <td className="p-3 border-r-2 border-black">
                        {v.discount_type === 'percentage'
                          ? `${v.discount_value}%`
                          : `Rp ${v.discount_value.toLocaleString('id-ID')}`}
                      </td>
                      <td className="p-3 border-r-2 border-black">Rp {v.min_purchase.toLocaleString('id-ID')}</td>
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
                          onClick={() => handleToggleVoucher(v.id)}
                          className="bg-yellow-300 text-black px-2 py-1 border border-black text-[10px] uppercase font-black hover:bg-black hover:text-white transition"
                        >
                          {v.is_active ? 'Matikan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.id)}
                          className="bg-red-500 text-white px-2 py-1 border border-black text-[10px] uppercase font-black hover:bg-black transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
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
                    <td className="p-3 border-r-2 border-black">Rp {p.price.toLocaleString('id-ID')}</td>
                    <td className="p-3 border-r-2 border-black">{p.stock} pcs</td>
                    <td className="p-3 border-r-2 border-black">{p.sold_count}x</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-red-500 text-white px-3 py-1 border border-black text-[10px] uppercase font-black hover:bg-black transition"
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
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-black hover:bg-gray-50">
                    <td className="p-3 border-r-2 border-black font-mono font-black">{t.id}</td>
                    <td className="p-3 border-r-2 border-black">@{t.buyer_name}</td>
                    <td className="p-3 border-r-2 border-black">{t.store_name}</td>
                    <td className="p-3 border-r-2 border-black">{t.payment_method}</td>
                    <td className="p-3 border-r-2 border-black font-black">Rp {t.total_amount.toLocaleString('id-ID')}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 border border-black text-[10px] uppercase font-black ${
                          t.status === 'completed'
                            ? 'bg-green-400 text-black'
                            : t.status === 'paid'
                            ? 'bg-blue-300 text-black'
                            : 'bg-yellow-300 text-black'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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