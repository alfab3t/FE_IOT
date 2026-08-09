import apiClient from "./apiClient";

export const iotService = {
  getDashboardLatest: async () => {
    return apiClient("/api/Iot/dashboard/latest", {
      method: "GET",
    });
  },

  getDashboardStats: async () => {
    return apiClient("/api/Iot/dashboard/stats", {
      method: "GET",
    });
  },

  getDeviceById: async (id) => {
    return apiClient(`/api/Iot/devices/${id}`, {
      method: "GET",
    });
  },

  setDeviceStatus: async (id, status) => {
    return apiClient(`/api/Iot/devices/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(status), // raw string status (e.g. "ON" / "OFF")
    });
  },

  controlDevice: async (id, status) => {
    return iotService.setDeviceStatus(id, status);
  },

  getDevices: async (searchKeyword = "", category = "", status = "") => {
    const params = { PageSize: 100 };
    if (searchKeyword) params.SearchKeyword = searchKeyword;
    if (category) params.Category = category;
    if (status) params.Status = status;

    return apiClient("/api/Iot/devices", {
      method: "GET",
    }, params);
  },

  getLocations: async (keyword = "", status = "") => {
    const params = {};
    if (keyword) params.Keyword = keyword;
    if (status) params.Status = status;

    return apiClient("/api/Iot/locations", {
      method: "GET",
    }, params);
  },

  getNotifications: async () => {
    return apiClient("/api/Iot/notifications", {
      method: "GET",
    });
  },

  markNotificationRead: async (id) => {
    return apiClient(`/api/Iot/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markNotificationsReadBulk: async (ids) => {
    return apiClient("/api/Iot/notifications/read-bulk", {
      method: "POST",
      body: JSON.stringify(ids), // array of integers
    });
  },

  deleteNotificationsBulk: async (ids) => {
    return apiClient("/api/Iot/notifications/delete-bulk", {
      method: "POST",
      body: JSON.stringify(ids), // array of integers
    });
  },

  getGraphAverage: async (category, period = "Daily", startDate = null, endDate = null) => {
    const normCategory = category === "Kelembapan" ? "Kelembaban" : category;
    const params = { category: normCategory, period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient("/api/Iot/dashboard/graph-average", { method: "GET" }, params);
  },

  getGraphData: async (deviceId, period = "Daily", startDate = null, endDate = null) => {
    const params = { period };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient(`/api/Iot/dashboard/graph/${deviceId}`, { method: "GET" }, params);
  },

  getDashboardGraph: async (deviceId, period = "Daily", startDate = null, endDate = null) => {
    return iotService.getGraphData(deviceId, period, startDate, endDate);
  },

  getGraphDataByDate: async (deviceId, date) => {
    const params = { date };
    return apiClient(`/api/Iot/dashboard/graph-by-date/${deviceId}`, {
      method: "GET",
    }, params);
  },

  createLocation: async (gedung, lantai, ruangan) => {
    return apiClient("/api/Iot/locations", {
      method: "POST",
      body: JSON.stringify({
        gedung,
        lantai,
        ruangan,
      }),
    });
  },

  createDevice: async (id, macAddress, name, category, limitMin, limitMax, locationId) => {
    return apiClient("/api/Iot/devices", {
      method: "POST",
      body: JSON.stringify({
        id,
        macAddress,
        name,
        category,
        limitMin: limitMin ? Number.parseFloat(limitMin) : null,
        limitMax: limitMax ? Number.parseFloat(limitMax) : null,
        locationId: locationId ? Number.parseInt(locationId, 10) : null,
      }),
    });
  },

  controlAc: async (topic, payload) => {
    const params = { topic, payload };
    return apiClient("/api/Iot/devices/control-ac", {
      method: "POST",
    }, params);
  },

  deleteDevice: async (id) => {
    return apiClient(`/api/Iot/devices/${id}`, {
      method: "DELETE",
    });
  },

  updateDevice: async (id, name, category, limitMin, limitMax) => {
    return apiClient("/api/Iot/devices", {
      method: "PUT",
      body: JSON.stringify({ id, name, category, limitMin, limitMax }),
    });
  },

  setDeviceLocation: async (id, locationId) => {
    return apiClient(`/api/Iot/devices/${encodeURIComponent(id)}/location`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Number(locationId)),
    });
  },

  // ── User Management ──────────────────────────────────────────────────────

  getUsers: async (keyword = "", roleId = "", status = "") => {
    const params = {};
    if (keyword) params.keyword = keyword;
    if (roleId)  params.roleId  = roleId;
    if (status)  params.status  = status;
    return apiClient("/api/Iot/users", { method: "GET" }, params);
  },

  getUserDetail: async (username) => {
    return apiClient(`/api/Iot/users/${encodeURIComponent(username)}`, {
      method: "GET",
    });
  },

  setUserStatus: async (username, status) => {
    return apiClient(`/api/Iot/users/${encodeURIComponent(username)}/status`, {
      method: "PATCH",
      body: JSON.stringify(status),
    });
  },

  createUser: async (username, roleId, status = "Aktif", email = null, password = null, photo = null) => {
    return apiClient("/api/Iot/users", {
      method: "POST",
      body: JSON.stringify({ username, roleId, status, email, password, photo }),
    });
  },

  updateUser: async (username, roleId, status = "Aktif", email = null, password = null, photo = null) => {
    return apiClient("/api/Iot/users", {
      method: "PUT",
      body: JSON.stringify({ username, roleId, status, email, password, photo }), // ✅ tambah photo
    });
  },

  deleteUser: async (username) => {
    return apiClient(`/api/Iot/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
  },

  getReportSummary: async (period = "today") => {
    return apiClient(`/api/Iot/report?period=${period}`, {
      method: "GET",
    });
  },

  toggleDeviceActive: async (id, isActive) => {
    return apiClient(`/api/Iot/devices/${encodeURIComponent(id)}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isActive),
    });
  },

  // ── AC Settings ──────────────────────────────────────────────────────────
  getAcSettings: async (deviceId) => {
    return apiClient(`/api/Iot/devices/${encodeURIComponent(deviceId)}/ac-settings`, {
      method: "GET",
    });
  },

  saveAcSettings: async (deviceId, temperature, mode, fanSpeed, swingMode) => {
    return apiClient(`/api/Iot/devices/${encodeURIComponent(deviceId)}/ac-settings`, {
      method: "POST",
      body: JSON.stringify({ temperature, mode, fanSpeed, swingMode }),
    });
  },
};
