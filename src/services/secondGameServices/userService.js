import api2 from "../../utils/axios2";

const userService = {
  register: async (body) => {
    const response = await api2.post("/user/register", body);
    return response.data;
  },
  login: async (body) => {
    const response = await api2.post("/user/login", body);
    return response.data;
  },
  verifyEmail: async (body) => {
    const response = await api2.post("/user/verify-email", body);
    return response.data;
  },
  resendOtp: async (body) => {
    const response = await api2.post("/user/resend-otp", body);
    return response.data;
  },
  forgotPassword: async (body) => {
    const response = await api2.post("/user/forgot-password", body);
    return response.data;
  },
  resetPassword: async (body) => {
    const response = await api2.post("/user/reset-password", body);
    return response.data;
  },
  changePassword: async (body) => {
    const response = await api2.post("/user/change-password", body);
    return response.data;
  },
  getProfile: async () => {
    const response = await api2.get("/user/profile");
    return response.data;
  },
  setup2FA: async () => {
    const response = await api2.post("/user/setup-2fa");
    return response.data;
  },
  verify2FA: async (body) => {
    const response = await api2.post("/user/verify-2fa", body);
    return response.data;
  },
  disable2FA: async (body) => {
    const response = await api2.post("/user/disable-2fa", body);
    return response.data;
  },
  refreshToken: async (refreshToken) => {
    const response = await api2.post(
      "/user/refreshToken",
      { refreshToken },
      { headers: { "x-skip-auth": true } }
    );
    return response?.data;
  },
  // GET /wallet/team-stats
  downlineStructure: async () => {
    const response = await api2.get("/user/downline-structure");
    return response.data;
  },
  // GET /wallet/team-stats
  downlineStats: async () => {
    const response = await api2.get("/user/downline-stats");
    return response.data;
  },
  getUserTradeData: async ({ page = 1, limit = 20 } = {}) => {
    const limitClamped = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const pageNum = Math.max(Number(page) || 1, 1);
    const response = await api2.get("/user/trade-data", {
      params: { page: pageNum, limit: limitClamped },
    });
    return response.data;
  },
  //user/stats-summary
  getStatsSummary: async () => {
    const response = await api2.get("/user/stats-summary");
    return response.data;
  },
  //user/update-emai
  updateEmail: async (newEmail) => {
    const response = await api2.post("/user/update-email", { newEmail });
    return response.data;
  },
  updateName: async (fullName) => {
    const response = await api2.patch("/user/updateName", { fullName });
    return response.data;
  },
};

export default userService;
