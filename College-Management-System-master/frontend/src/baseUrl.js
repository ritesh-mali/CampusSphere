export const baseApiURL = () => {
  return process.env.REACT_APP_APILINK || "";
};

/** Socket.io connects to the API origin without the `/api` suffix. */
export const socketBaseURL = () => {
  const api = baseApiURL();
  if (!api) return "http://localhost:4000";
  return api.replace(/\/api\/?$/i, "") || "http://localhost:4000";
};
