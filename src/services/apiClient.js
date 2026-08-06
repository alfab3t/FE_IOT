import { BASE_URL } from "./config";

let jwtToken = null;

export const setAuthToken = (token) => {
  jwtToken = token;
};

export const getAuthToken = () => {
  return jwtToken;
};

const apiClient = async (endpoint, options = {}, params = null) => {
  let url = `${BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  // Append query params for GET requests
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    url = `${url}?${query}`;
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (jwtToken) {
    headers["Authorization"] = `Bearer ${jwtToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401 || response.status === 403) {
      return { error: true, status: response.status, message: "Sesi kedaluwarsa. Silakan login kembali." };
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { message: errorText || "Terjadi kesalahan server" };
      }
      return { error: true, status: response.status, ...errorJson };
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  } catch (err) {
    return {
      error: true,
      message: err.message || "Terjadi kesalahan koneksi jaringan",
    };
  }
};

export default apiClient;
