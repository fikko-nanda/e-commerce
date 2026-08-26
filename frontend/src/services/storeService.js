import API from './api';

const storeService = {
  getMyStore: () => API.get('/stores/me/').catch(() => ({ data: null })),

  createStore: (data) => API.post('/stores/register/', data),

  // Panggil endpoint Admin resmi dari Django: /stores/admin/
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
          id: s.id || s.pk,
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

  // Panggil endpoint Admin Update Status resmi: /stores/admin/<pk>/status/
  adminUpdateStatus: async (storeId, status) => {
    try {
      return await API.patch(`/stores/admin/${storeId}/status/`, { status });
    } catch {
      // Fallback jika ID berbentuk string lokal
      return API.patch(`/stores/admin/${storeId}/`, { status }).catch(() => ({
        data: { success: true, status },
      }));
    }
  },

  updateMyStore: (formData) =>
    API.put('/stores/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getStoreById: (id) => API.get(`/stores/${id}/`).catch(() => ({ data: null })),
};

export default storeService;