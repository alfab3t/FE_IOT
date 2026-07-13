import apiClient from "./apiClient";

export const iotService = {
  getDashboardLatest: async () => {
    return await apiClient("/api/Iot/dashboard/latest", {
      method: "GET",
    });
  },

  getDashboardStats: async () => {
    return await apiClient("/api/Iot/dashboard/stats", {
      method: "GET",
    });
  },

  getDeviceById: async (id) => {
    return await apiClient(`/api/Iot/devices/${id}`, {
      method: "GET",
    });
  },

  setDeviceStatus: async (id, status) => {
    return await apiClient(`/api/Iot/devices/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(status), // raw string status (e.g. "ON" / "OFF")
    });
  },

  controlDevice: async (id, status) => {
    return await iotService.setDeviceStatus(id, status);
  },

  getDevices: async (searchKeyword = "", category = "", status = "") => {
    const params = {};
    if (searchKeyword) params.SearchKeyword = searchKeyword;
    if (category) params.Category = category;
    if (status) params.Status = status;

    return await apiClient("/api/Iot/devices", {
      method: "GET",
      // apiClient will append params to URL if it's GET
    }, params);
  },

  getLocations: async (keyword = "", status = "") => {
    const params = {};
    if (keyword) params.Keyword = keyword;
    if (status) params.Status = status;

    return await apiClient("/api/Iot/locations", {
      method: "GET",
    }, params);
  },

  getNotifications: async () => {
    return await apiClient("/api/Iot/notifications", {
      method: "GET",
    });
  },

  markNotificationRead: async (id) => {
    return await apiClient(`/api/Iot/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markNotificationsReadBulk: async (ids) => {
    return await apiClient("/api/Iot/notifications/read-bulk", {
      method: "POST",
      body: JSON.stringify(ids), // array of integers
    });
  },

  deleteNotificationsBulk: async (ids) => {
    return await apiClient("/api/Iot/notifications/delete-bulk", {
      method: "POST",
      body: JSON.stringify(ids), // array of integers
    });
  },

  getGraphData: async (deviceId, period = "Daily") => {
    const params = { period };
    return await apiClient(`/api/Iot/dashboard/graph/${deviceId}`, {
      method: "GET",
    }, params);
  },

  getGraphAverage: async (category, period = "Daily") => {
    const params = { category, period };
    return await apiClient("/api/Iot/dashboard/graph-average", {
      method: "GET",
    }, params);
  },

  getGraphDataByDate: async (deviceId, date) => {
    const params = { date };
    return await apiClient(`/api/Iot/dashboard/graph-by-date/${deviceId}`, {
      method: "GET",
    }, params);
  },

  createLocation: async (gedung, lantai, ruangan) => {
    return await apiClient("/api/Iot/locations", {
      method: "POST",
      body: JSON.stringify({
        gedung,
        lantai,
        ruangan,
      }),
    });
  },

  createDevice: async (id, macAddress, name, category, limitMin, limitMax, locationId) => {
    return await apiClient("/api/Iot/devices", {
      method: "POST",
      body: JSON.stringify({
        id,
        macAddress,
        name,
        category,
        limitMin: limitMin ? parseFloat(limitMin) : null,
        limitMax: limitMax ? parseFloat(limitMax) : null,
        locationId: locationId ? parseInt(locationId, 10) : null,
      }),
    });
  },

  controlAc: async (topic, payload) => {
    const params = { topic, payload };
    return await apiClient("/api/Iot/devices/control-ac", {
      method: "POST",
    }, params);
  },

  deleteDevice: async (id) => {
    return await apiClient(`/api/Iot/devices/${id}`, {
      method: "DELETE",
    });
  },

  updateDevice: async (id, name, category, limitMin, limitMax) => {
    return await apiClient("/api/Iot/devices", {
      method: "PUT",
      body: JSON.stringify({ id, name, category, limitMin, limitMax }),
    });
  },

  // ── User Management ──────────────────────────────────────────────────────

  getUsers: async (keyword = "", roleId = "", status = "") => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (roleId)  params.roleId  = roleId;
    if (status)  params.status  = status;
    return await apiClient("/api/Iot/users", { method: "GET" }, params);
  },

  getUserDetail: async (username) => {
    return await apiClient(`/api/Iot/users/${encodeURIComponent(username)}`, {
      method: "GET",
    });
  },

  setUserStatus: async (username, status) => {
    return await apiClient(`/api/Iot/users/${encodeURIComponent(username)}/status`, {
      method: "PATCH",
      body: JSON.stringify(status),
    });
  },

  createUser: async (username, roleId, status = "Aktif") => {
    return await apiClient("/api/Iot/users", {
      method: "POST",
      body: JSON.stringify({ username, roleId, status }),
    });
  },

  updateUser: async (username, roleId, status = "Aktif") => {
    return await apiClient("/api/Iot/users", {
      method: "PUT",
      body: JSON.stringify({ username, roleId, status }),
    });
  },

  deleteUser: async (username) => {
    return await apiClient(`/api/Iot/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
  },

  getReportSummary: async (period = "today") => {
    return await apiClient(`/api/Iot/report?period=${period}`, {
      method: "GET",
    });
  },

  toggleDeviceActive: async (id, isActive) => {
    return await apiClient(`/api/Iot/devices/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isActive),
    });
  },
};
