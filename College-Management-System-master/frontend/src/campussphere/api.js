import axiosWrapper from "../utils/AxiosWrapper";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
});

export async function analyzeResumePdf(file) {
  const fd = new FormData();
  fd.append("resume", file);
  return axiosWrapper.post("/campussphere/resume/analyze", fd, {
    headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
  });
}

export async function fetchPlacementCompanies() {
  return axiosWrapper.get("/campussphere/placement/companies", {
    headers: authHeader(),
  });
}

export async function fetchPlacementQuestions(companyId, section, limit = 10) {
  return axiosWrapper.get(
    `/campussphere/placement/companies/${companyId}/questions/${section}?limit=${limit}`,
    { headers: authHeader() }
  );
}

export async function submitPlacementQuiz(companyId, body) {
  return axiosWrapper.post(
    `/campussphere/placement/companies/${companyId}/submit`,
    body,
    { headers: authHeader() }
  );
}

export async function fetchMyPlacementAttempts() {
  return axiosWrapper.get("/campussphere/placement/my-attempts", {
    headers: authHeader(),
  });
}

export async function fetchEvents() {
  return axiosWrapper.get("/campussphere/events", { headers: authHeader() });
}

export async function fetchEvent(id) {
  return axiosWrapper.get(`/campussphere/events/${id}`, {
    headers: authHeader(),
  });
}

export async function registerForEvent(id) {
  return axiosWrapper.post(
    `/campussphere/events/${id}/register`,
    {},
    { headers: authHeader() }
  );
}

export async function createEvent(body) {
  return axiosWrapper.post("/campussphere/events", body, {
    headers: authHeader(),
  });
}

export async function updateEvent(id, body) {
  return axiosWrapper.patch(`/campussphere/events/${id}`, body, {
    headers: authHeader(),
  });
}

export async function fetchEventRegistrations(id) {
  return axiosWrapper.get(`/campussphere/events/${id}/registrations`, {
    headers: authHeader(),
  });
}

export async function fetchNotifications() {
  return axiosWrapper.get("/campussphere/notifications", {
    headers: authHeader(),
  });
}

export async function markNotificationRead(id) {
  return axiosWrapper.patch(`/campussphere/notifications/${id}/read`, null, {
    headers: authHeader(),
  });
}

export async function markAllNotificationsRead() {
  return axiosWrapper.post(
    "/campussphere/notifications/read-all",
    {},
    { headers: authHeader() }
  );
}

export async function getNotificationPrefs() {
  return axiosWrapper.get("/campussphere/notifications/prefs", {
    headers: authHeader(),
  });
}

export async function setNotificationPrefs(emailEnabled) {
  return axiosWrapper.post(
    "/campussphere/notifications/prefs",
    { emailEnabled },
    { headers: authHeader() }
  );
}

export async function adminSaveCompany(body) {
  return axiosWrapper.post("/campussphere/placement/admin/companies", body, {
    headers: authHeader(),
  });
}

export async function adminSaveQuestion(body) {
  return axiosWrapper.post("/campussphere/placement/admin/questions", body, {
    headers: authHeader(),
  });
}

export async function adminListQuestions(companyId) {
  const q = companyId ? `?company_id=${companyId}` : "";
  return axiosWrapper.get(`/campussphere/placement/admin/questions${q}`, {
    headers: authHeader(),
  });
}
