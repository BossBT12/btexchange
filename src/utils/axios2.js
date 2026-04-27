import axios from "axios";
import Cookies from "js-cookie";
import { authRouters, publicRouters } from "../router/router.config";
import userService from "../services/secondGameServices/userService";

const api2 = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL2}/api`,
  timeout: 2800000,
  headers: {
    "Content-Type": "application/json",
  },
});

api2.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token2");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return error;
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api2.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status || 500;

    const publicRoutes = authRouters.map((route) => route.path);

    if (status === 401 && !originalRequest._retry && !publicRoutes.includes(window.location.pathname) && !originalRequest.skipAuth) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api2(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        Cookies.remove("token2");
        const refreshTokenOld = Cookies.get("refreshToken2");
        const data = await userService.refreshToken(refreshTokenOld);
        const { token: newToken, refreshToken: newRefreshToken } = data?.data || {};
        processQueue(null, newToken);
        if (newToken) {
          Cookies.set('token2', newToken);
        }
        if (newRefreshToken) {
          Cookies.set('refreshToken2', newRefreshToken);
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        isRefreshing = false;
        return api2(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        window.location.replace("/login");
        localStorage.clear();
        Cookies.remove("token2");
        Cookies.remove("refreshToken2");
        return Promise.reject(refreshError);
      }
    }

    if ([403, 500, 502].includes(status)) { }

    return Promise.reject(error?.response?.data || error);
  }
);

export default api2;
