import api from "../utils/axios"

const dashboardServices = {
    getDashboardData: async () => {
        const response = await api.get("/trade/getDashboard")
        return response.data
    },
    getIncomeTransactions: async (params = {}) => {
        const queryParams = {
            ...(params.type && { type: params.type }),
            ...(params.page && { page: params.page }),
            ...(params.limit && { limit: params.limit }),
        }
        const response = await api.get("/trade/getIncomeTransactions", { params: queryParams })
        return response.data
    },
    getDownlineStructure: async () => {
        const response = await api.get("/trade/getDownlineStructure")
        return response.data
    },
    getNotifications: async () => {
        const response = await api.get("/trade/getNotifications")
        return response.data
    },
    getSocialMediaLinks: async () => {
        const response = await api.get("/trade/getSocialLinks")
        return response.data
    },
    getUserStats: async () => {
        const response = await api.get("/trade/getUserStats")
        return response.data
    },
}

export default dashboardServices;