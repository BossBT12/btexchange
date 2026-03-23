import api from "../utils/axios";

const tradingService = {
  getLiveTrades: async () => {
    const response = await api.get("/trade/getLiveTrades");
    return response.data;
  },
  getPrices: async () => {
    const response = await api.get("/trade/getPrices");
    return response.data;
  },
  placeSelfTrade: async (body) => {
    const response = await api.post("/trade/placeSelfTrade", body);
    return response.data;
  },
  getTradeHistory: async (params = {}) => {
    const response = await api.get("/trade/getTradeHistory", { params });
    return response.data;
  },
  addFavoritePair: async (pair) => {
    const response = await api.post("/trade/pairs/favorites", { pair });
    return response.data;
  },
  removeFavoritePair: async (pair) => {
    const response = await api.delete(`/trade/pairs/favorites/${encodeURIComponent(pair)}`);
    return response.data;
  },
  getFavoritePairs: async () => {
    const response = await api.get("/trade/pairs/favorites");
    return response.data;
  },
  getTradeData: async () => {
    const params = {
      page: 1,
      limit: 10,
    };
    const response = await api.get("/trade/getTradeData", { params });
    return response.data;
  },
  getBetConfig: async () => {
    const response = await api.get("/trade/getBetConfig");
    return response.data;
  },
};

export default tradingService;
