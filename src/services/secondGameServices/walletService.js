import api2 from "../../utils/axios2";

const walletService = {
  // GET /wallet/balance -> { wallet, user }
  getWalletBalanceAndStats: async () => {
    const response = await api2.get("/wallet/balance");
    return response.data;
  },

  // GET /wallet/team-stats
  getTeamStats: async () => {
    const response = await api2.get("/wallet/team-stats");
    return response.data;
  },

  // GET /wallet/deposit-address?chain=BSC|POLYGON|ETH
  getDepositAddress: async (chain) => {
    const response = await api2.get("/wallet/deposit-address", {
      params: { chain },
    });
    return response.data;
  },

  // POST /wallet/withdraw
  // body: { toAddress, amount, chain, twoFactorToken? }
  withdrawFunds: async (body) => {
    const response = await api2.post("/wallet/withdraw", body, {
      skipAuth: true,
    });
    return response.data;
  },

  // GET /wallet/transactions
  // params: { type?, page, limit }
  getTransactions: async (params) => {
    const response = await api2.get("/wallet/transactions", { params });
    return response.data;
  },

  // GET /wallet/income-history
  // params: { type?, page, limit }
  getIncomeHistory: async (params) => {
    const response = await api2.get("/wallet/income-history", { params });
    return response.data;
  },

  // POST /wallet/verify-deposit
  // body: { txHash, chain }
  verifyDeposit: async (body) => {
    const response = await api2.post("/wallet/verify-deposit", body);
    return response.data;
  },

  // ---------- Capital Withdrawal (Earn Hub) ----------

  // GET /wallet/active-investments
  // Returns active investments with penalty info for capital withdrawal
  getActiveInvestments: async () => {
    const response = await api2.get("/wallet/active-investments");
    return response.data;
  },

  // POST /wallet/withdraw-capital
  // body: { toAddress, investmentId, chain, twoFactorToken }
  withdrawCapital: async (body) => {
    const response = await api2.post("/wallet/withdraw-capital", body, {
      skipAuth: true,
    });
    return response.data;
  },

  //today-income
  getTodayIncome: async () => {
    const response = await api2.get("/wallet/today-income");
    return response.data;
  },
  // GET /wallet/today-income
  getAllDailyIncome: async (params) => {
    const response = await api2.get("/wallet/all-daily-income", { params });
    return response.data;
  },
};

export default walletService;
