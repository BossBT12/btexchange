import api from "../utils/axios";

const withdrawalService = {
  withdrawWinnings: async (payload) => {
    const response = await api.post("/trade/withdrawWinnings", payload);
    return response.data;
  },

  withdrawWorkingIncome: async (payload) => {
    const response = await api.post("/trade/withdrawWorkingIncome", payload);
    return response.data;
  },

  getWithdrawalHistory: async () => {
    const response = await api.get("/trade/getWithdrawalHistory");
    return response.data;
  },

  getTransactionHistory: async (params = {}) => {
    const response = await api.get("/trade/getTransactionHistory", { params });
    return response.data;
  },
  getWithdrawStatus: async () => {
    const res = await api.get('trade/withdraw/status')
    return res.data;
  }
};

export default withdrawalService;

