import axiosWrapper from "../utils/AxiosWrapper";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
});

export const mockInterviewApi = {
  getRoles: () =>
    axiosWrapper.get("/mock-interview/roles", { headers: authHeader() }),

  getLatestResume: () =>
    axiosWrapper.get("/mock-interview/resume/latest", {
      headers: authHeader(),
    }),

  uploadResume: (file) => {
    const form = new FormData();
    form.append("resume", file);
    return axiosWrapper.post("/mock-interview/resume/upload", form, {
      headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
    });
  },

  startInterview: (payload) =>
    axiosWrapper.post("/mock-interview/start", payload, {
      headers: authHeader(),
    }),

  submitAnswer: (payload) =>
    axiosWrapper.post("/mock-interview/answer", payload, {
      headers: authHeader(),
    }),

  completeInterview: (payload) =>
    axiosWrapper.post("/mock-interview/complete", payload, {
      headers: authHeader(),
    }),

  getHistory: () =>
    axiosWrapper.get("/mock-interview/history", { headers: authHeader() }),

  getResult: (resultId) =>
    axiosWrapper.get(`/mock-interview/result/${resultId}`, {
      headers: authHeader(),
    }),

  downloadPdfUrl: (resultId) => {
    const base = axiosWrapper.defaults.baseURL || "";
    const token = localStorage.getItem("userToken");
    return `${base}/mock-interview/result/${resultId}/pdf?token=${encodeURIComponent(token || "")}`;
  },
};

export const mockInterviewAdminApi = {
  getAnalytics: () =>
    axiosWrapper.get("/mock-interview/admin/analytics", {
      headers: authHeader(),
    }),
  getUsers: () =>
    axiosWrapper.get("/mock-interview/admin/users", { headers: authHeader() }),
  getReports: () =>
    axiosWrapper.get("/mock-interview/admin/reports", {
      headers: authHeader(),
    }),
  getCategories: () =>
    axiosWrapper.get("/mock-interview/admin/categories", {
      headers: authHeader(),
    }),
};
