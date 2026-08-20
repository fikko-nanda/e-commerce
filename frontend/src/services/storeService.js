import API from './api';

const storeService = {
  /** POST /stores/register/ — daftarkan toko untuk user aktif */
  register: (data) => API.post('/stores/register/', data),

  /** GET /stores/me/ — info toko milik user aktif */
  getMyStore: () => API.get('/stores/me/'),
};

export default storeService;