import API from './api';

const userService = {
  /** GET /auth/admin/users/ — daftar seluruh user (hanya admin). Filter: ?role=buyer|seller|admin */
  getAll: (role) => {
    let url = '/auth/admin/users/';
    if (role && role !== 'all') {
      url += `?role=${role}`;
    }
    return API.get(url);
  },

  /** PATCH /auth/admin/users/<id>/suspend/ — tangguhkan user. Body: { action: 'suspend' | 'unsuspend' } */
  suspend: (id) => API.patch(`/auth/admin/users/${id}/suspend/`, { action: 'suspend' }),

  /** PATCH /auth/admin/users/<id>/suspend/ — aktifkan kembali user. Body: { action: 'unsuspend' } */
  unsuspend: (id) => API.patch(`/auth/admin/users/${id}/suspend/`, { action: 'unsuspend' }),
};

export default userService;
