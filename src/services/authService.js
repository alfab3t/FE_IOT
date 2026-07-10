import apiClient from "./apiClient";

export const authService = {
  login: async (username, password) => {
    return await apiClient("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        jenisAplikasi: "Public",
      }),
    });
  },

  getPermission: async (username, appId, roleId) => {
    return await apiClient("/api/Auth/getpermission", {
      method: "POST",
      body: JSON.stringify({
        username,
        appId,
        roleId,
      }),
    });
  },

  getMenu: async (username, appId, roleId) => {
    return await apiClient("/api/Auth/getmenu", {
      method: "POST",
      body: JSON.stringify({
        username,
        appId,
        roleId,
      }),
    });
  },

  getProfilePhoto: async () => {
    return await apiClient("/api/Auth/profile/photo", {
      method: "GET",
    });
  },

  updateProfilePhoto: async (foto) => {
    return await apiClient("/api/Auth/profile/photo", {
      method: "POST",
      body: JSON.stringify({
        photo: foto,
      }),
    });
  },
};
