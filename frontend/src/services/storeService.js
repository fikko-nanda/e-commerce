import API from './api';

const storeService = {
  getMyStore: () => API.get('/stores/me/'),
  updateMyStore: (formData) =>
    API.put('/stores/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStoreById: (id) => API.get(`/stores/${id}/`),
};

export default storeService;