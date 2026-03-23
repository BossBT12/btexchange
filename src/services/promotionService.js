import api from "../utils/axios";

const BASE = "/trade/promotion";

/**
 * Normalize API response: handle both { data } and direct response.
 * Throw with message if success === false.
 */
const handleResponse = (response) => {
  const body = response?.data;
  if (body && body.success === false) {
    const msg = body.message || body.error || "Request failed";
    const err = new Error(msg);
    err.response = response;
    throw err;
  }
  return body?.data ?? body;
};

const promotionService = {
  getDashboard: async () => {
    const response = await api.get(`${BASE}/dashboard`);
    return handleResponse(response);
  },

  getSubordinates: async (params = {}) => {
    const {
      type = "all",
      level,
      page = 1,
      limit = 20,
      fromDate,
      toDate,
      date,
      search,
    } = params;
    const query = new URLSearchParams({ type, page, limit });
    if (type === "team" && level != null) query.set("level", level);
    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (date) query.set("date", date);
    if (search) query.set("search", search);
    const response = await api.get(`${BASE}/subordinates?${query.toString()}`);
    return handleResponse(response);
  },

  getCommissionDetail: async (params = {}) => {
    const { type = "all", fromDate, toDate, page = 1, limit = 20 } = params;
    const query = new URLSearchParams({ page, limit });
    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);
    if (type) query.set("type", type)
    const response = await api.get(`${BASE}/commission-detail?${query.toString()}`);
    return handleResponse(response);
  },

  getQrCodeBlob: async () => {
    const response = await api.get(`${BASE}/qr-code`, {
      responseType: "blob",
    });
    if (response?.data instanceof Blob) return response.data;
    throw new Error("Invalid QR code response");
  },

  getQrCodeBase64: async () => {
    const response = await api.get(`${BASE}/qr-code/base64`);
    return handleResponse(response);
  },

  getRebateRatio: async () => {
    const response = await api.get(`${BASE}/rebate-ratio`);
    return handleResponse(response);
  },

  getPartnerRewards: async () => {
    const response = await api.get(`${BASE}/partner-rewards`);
    return handleResponse(response);
  },

  getInvitation: async () => {
    const response = await api.get(`${BASE}/invitation`);
    return handleResponse(response);
  },

  getInvitationRules: async () => {
    const response = await api.get(`${BASE}/invitation-rules`);
    return handleResponse(response);
  },
  // promotion/summary
  getSummary: async () => {
    const response = await api.get(`${BASE}/summary`);
    return handleResponse(response);
  },

};

export default promotionService;
