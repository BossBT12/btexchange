import axios from "axios";
import Cookies from "js-cookie";
import { authRouters } from "../router/router.config";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 2800000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.skipAuth === true) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Authorization");
      } else {
        delete config.headers.Authorization;
      }
      return config;
    }
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AUTH_PAGE_PATHS = new Set(authRouters.map((r) => r.path));

const shouldSkipRefresh = (config) =>
  !config || config._retry === true || config.skipAuth === true;

const clearAuthAndRedirect = () => {
  localStorage.clear();
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  window.location.replace("/login");
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (status !== 401) {
      return Promise.reject(error?.response?.data ?? error);
    }

    const onAuthPage = AUTH_PAGE_PATHS.has(window.location.pathname);
    if (onAuthPage || shouldSkipRefresh(originalRequest)) {
      return Promise.reject(error?.response?.data ?? error);
    }

    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error?.response?.data ?? error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post(
        "/trade/refreshToken",
        { refreshToken },
        { skipAuth: true }
      );
      const newToken = data?.data?.token ?? null;
      const newRefreshToken = data?.data?.refreshToken ?? null;

      if (newToken) Cookies.set("token", newToken);
      if (newRefreshToken) Cookies.set("refreshToken", newRefreshToken);

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError?.response?.data ?? refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
