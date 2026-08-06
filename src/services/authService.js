import apiClient from "./apiClient";

export const authService = {
  login: async (username, password) => {
    return apiClient("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        jenisAplikasi: "Public",
      }),
    });
  },

  getPermission: async (username, appId, roleId) => {
    return apiClient("/api/Auth/getpermission", {
      method: "POST",
      body: JSON.stringify({
        username,
        appId,
        roleId,
      }),
    });
  },

  getMenu: async (username, appId, roleId) => {
    return apiClient("/api/Auth/getmenu", {
      method: "POST",
      body: JSON.stringify({
        username,
        appId,
        roleId,
      }),
    });
  },

  getProfilePhoto: async () => {
    return apiClient("/api/Auth/profile/photo", {
      method: "GET",
    });
  },

  updateProfilePhoto: async (photo) => {
    return apiClient("/api/Auth/profile/photo", {
      method: "POST",
      body: JSON.stringify({
        photo,
      }),
    });
  },

  updateUsername: async (newUsername, currentUsername = "") => {
    return apiClient("/api/Iot/users/profile/username", {
      method: "PUT",
      body: JSON.stringify({
        currentUsername,
        newUsername,
      }),
    });
  },
};
