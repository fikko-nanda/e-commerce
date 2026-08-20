import { useState, useEffect } from 'react';
import { reviewService, storeService, userService } from '../../services';

import AdminHeader from './components/AdminHeader';
import AdminStats from './components/AdminStats';
import AdminTabs from './components/AdminTabs';
import StoresTab from './components/StoresTab';
import UsersTab from './components/UsersTab';
import ReviewsTab from './components/ReviewsTab';

// Data dummy cadangan
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
    phone: '0899',
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

const normalizeList = (res) => {
  const d = res.data;
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

  // Stores
  const [stores, setStores] = useState(DUMMY_STORES);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storeActionId, setStoreActionId] = useState(null);
  const [storeStatusFilter, setStoreStatusFilter] = useState('all');

  // Users
  const [users, setUsers] = useState(DUMMY_USERS);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionId, setUserActionId] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Reviews
  const [reviews, setReviews] = useState(DUMMY_REVIEWS);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filterRating, setFilterRating] = useState('all');

  // ---- Fetch functions ----
  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      const res = await storeService.adminGetAll();
      const list = normalizeList(res);
      if (list.length > 0) setStores(list);
    } catch {
      console.warn('Backend tidak terhubung. Menggunakan data dummy stores.');
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await userService.getAll();
      const list = normalizeList(res);
      if (list.length > 0) setUsers(list);
    } catch {
      console.warn('Backend tidak terhubung. Menggunakan data dummy users.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await reviewService.getAll();
      const list = normalizeList(res);
      if (list.length > 0) setReviews(list);
    } catch {
      console.warn('Backend tidak terhubung. Menggunakan data dummy reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (activeTab === 'stores') await fetchStores();
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'reviews') await fetchReviews();
    };

    if (isMounted) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

 // ---- Actions: Stores ----
  const handleStoreStatus = async (store, newStatus) => {
    const verb = {
      active: 'verifikasi/aktifkan',
      rejected: 'tolak',
      suspended: 'suspend',
    }[newStatus] || newStatus;
    if (!confirm(`Yakin ingin ${verb} toko "${store.store_name}"?`)) return;

    setStoreActionId(store.id);
    try {
      await storeService.adminUpdateStatus(store.id, newStatus);
      await fetchStores();
    } catch {
      // Fallback: ubah lokal bila backend offline
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s))
      );
    } finally {
      setStoreActionId(null);
    }
  };

  // ---- Actions: Users ----
  const handleUserSuspend = async (user, action) => {
    const verb = action === 'suspend' ? 'menangguhkan' : 'mengaktifkan kembali';
    if (!confirm(`Yakin ingin ${verb} user "${user.email}"?`)) return;

    setUserActionId(user.id);
    try {
      if (action === 'suspend') {
        await userService.suspend(user.id);
      } else {
        await userService.unsuspend(user.id);
      }
      await fetchUsers();
    } catch {
      // Fallback: ubah lokal bila backend offline
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: action === 'unsuspend' } : u
        )
      );
    } finally {
      setUserActionId(null);
    }
  };

  // ---- Actions: Reviews ----
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Hapus ulasan ini secara permanen? Tindakan tidak bisa dibatalkan.')) return;

    setDeletingId(reviewId);
    try {
      await reviewService.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } finally {
      setDeletingId(null);
    }
  };

  // Derived Stats
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.status === 'active').length;
  const totalUsers = users.length;
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Number(r.rating) === star).length;
    const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, percent };
  });

  // Filters
  const filteredStores = storeStatusFilter === 'all' ? stores : stores.filter((s) => s.status === storeStatusFilter);
  const filteredUsers = userRoleFilter === 'all' ? users : users.filter((u) => u.role === userRoleFilter);
  const filteredReviews = filterRating === 'all' ? reviews : reviews.filter((r) => Number(r.rating) === Number(filterRating));

  // Helpers
  const formatDate = (isoStr) => {
    try {
      return new Date(isoStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
      <AdminHeader />

      <AdminStats
        totalStores={totalStores}
        activeStores={activeStores}
        totalUsers={totalUsers}
        totalReviews={totalReviews}
        avgRating={avgRating}
      />

      <AdminTabs
        activeTab={activeTab}
        onTabSwitch={handleTabSwitch}
        totalStores={totalStores}
        totalUsers={totalUsers}
        totalReviews={totalReviews}
      />

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
          formatDate={formatDate}
          renderStars={renderStars}
        />
      )}
    </div>
  );
}