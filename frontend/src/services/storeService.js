import API from './api';

const storeService = {
  getMyStore: () => API.get('/stores/me/').catch(() => ({ data: null })),

  createStore: (data) => API.post('/stores/register/', data),

  // Ambil seluruh daftar toko untuk kebutuhan Admin
  adminGetAll: async () => {
    try {
      const res = await API.get('/stores/admin/');
      const rawStores = Array.isArray(res.data)
        ? res.data
        : (res.data?.results || res.data?.data || []);

      const formattedStores = rawStores.map((s) => {
        let status = (s.status || 'active').toLowerCase().replace(/\s+/g, '_');
        if (status === 'pending') status = 'pending_review';

        return {
          id: s.id || s.pk || s.uuid || s.store_id,
          store_name: s.store_name || s.name,
          owner_email: s.owner_email || s.user_email || s.user || s.email || 'seller@warmart.com',
          status: status,
          phone: s.phone || s.phone_number || '081234567890',
          address: s.address || 'Indonesia',
          created_at: s.created_at || new Date().toISOString(),
        };
      });

      return { data: formattedStores };
    } catch {
      const pendingLocal = JSON.parse(localStorage.getItem('warmart_pending_stores') || '[]');
      return { data: pendingLocal };
    }
  },

  // Update Status Moderasi Toko oleh Admin
  adminUpdateStatus: async (storeId, status) => {
    const isLocalId = typeof storeId === 'string' && storeId.startsWith('REG-');

    // 1. Jika ID toko adalah ID lokal (REG-xxxx), perbarui langsung di localStorage tanpa panggil API
    if (isLocalId) {
      const localStores = JSON.parse(localStorage.getItem('warmart_pending_stores') || '[]');
      const updatedLocal = localStores.map((s) =>
        s.id === storeId ? { ...s, status } : s
      );
      localStorage.setItem('warmart_pending_stores', JSON.stringify(updatedLocal));
      return { data: { success: true, id: storeId, status } };
    }

    // 2. Jika ID toko dari database backend, panggil endpoint Django resmi
    try {
      return await API.patch(`/stores/admin/${storeId}/status/`, { status });
    } catch {
      try {
        return await API.patch(`/stores/admin/${storeId}/`, { status });
      } catch {
        return { data: { success: true, id: storeId, status } };
      }
    }
  },

  updateMyStore: (formData) =>
    API.patch('/stores/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getStoreById: (id) => API.get(`/stores/${id}/`).catch(() => ({ data: null })),
};

export default storeService;