import api from "../utils/axios";

const depositService = {
  getDepositAddress: async (chain) => {
    const response = await api.get(`/trade/getDepositAddress?chain=${chain}`);
    return response.data;
  },

  getAllDepositAddresses: async () => {
    const response = await api.get("/trade/getAllDepositAddresses");
    return response.data;
  },

  getDepositHistory: async (params = {}) => {
    const response = await api.get("/trade/getDepositHistory", { params });
    return response.data;
  },
  processDepositManually: async (body) => {
    const response = await api.post("/trade/processDepositManually", body);
    return response.data;
  },
};

export default depositService;
