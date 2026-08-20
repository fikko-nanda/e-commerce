import API from './api';

const storeService = {
  /** POST /stores/register/ — daftarkan toko untuk user aktif */
  register: (data) => API.post('/stores/register/', data),

  /** GET /stores/me/ — info toko milik user aktif */
  getMyStore: () => API.get('/stores/me/'),

  // ============ ADMIN: Manajemen Toko ============

  /** GET /stores/admin/ — daftar seluruh toko (hanya admin). Filter: ?status=active|pending_review|rejected|suspended */
  adminGetAll: (status) => {
    let url = '/stores/admin/';
    if (status && status !== 'all') {
      url += `?status=${status}`;
    }
    return API.get(url);
  },

  /** PATCH /stores/admin/<id>/status/ — ubah status toko (admin). Body: { status } */
  adminUpdateStatus: (id, status) => API.patch(`/stores/admin/${id}/status/`, { status }),
};

export default storeService;