import apiClient from "./apiClient";

export const iotService = {
  getDashboardLatest: async () => {
    return await apiClient("/api/Iot/dashboard/latest", {
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
};
