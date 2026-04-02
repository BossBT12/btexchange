import api from "../utils/axios";

const authService = {
  register: async (body) => {
    const response = await api.post("/api/onboard/onboardUser", body);
    return response.data;
  },
  login: async (body) => {
    const response = await api.post("/trade/login", body);
    return response.data;
  },
  verifyOtp: async (body) => {
    const response = await api.post("/trade/verifyOTP", body);
    return response.data;
  },
  resendOtp: async (body) => {
    const response = await api.post("/trade/resendOTP", body);
    return response.data;
  },
  forgotPassword: async (body) => {
    const response = await api.post("/trade/forgotPassword", body);
    return response.data;
  },
  verifyForgotPasswordOtp: async (body) => {
    const response = await api.post("/trade/verifyForgotPasswordOTP", body);
    return response.data;
  },
  resetPassword: async (body) => {
    const response = await api.post("/trade/resetPassword", body);
    return response.data;
  },
  changePassword: async (body) => {
    const response = await api.post("/trade/changePassword", body);
    return response.data;
  },
  refreshToken: async (refreshToken) => {
    const response = await api.post(
      "/trade/refreshToken",
      { refreshToken },
      { skipAuth: true }
    );
    return response?.data;
  },
  getUser: async () => {
    const response = await api.get("/trade/getUser");
    return response.data;
  },
  // 2FA (Google Authenticator)
  setup2FA: async () => {
    const response = await api.post("/trade/setup2FA");
    return response.data;
  },
  verifyAndEnable2FA: async (body) => {
    const response = await api.post("/trade/verifyAndEnable2FA", body);
    return response.data;
  },
  disable2FA: async (body) => {
    const response = await api.post("/trade/disable2FA", body);
    return response.data;
  },
  // changeEmail/request-otp
  requestOtpForChangeEmail: async () => {
    const response = await api.post("/trade/changeEmail/request-otp");
    return response.data;
  },
  // changeEmail/confirm
  confirmChangeEmail: async (body) => {
    const response = await api.post("/trade/changeEmail/confirm", body);
    return response.data;
  },
};

export default authService;
