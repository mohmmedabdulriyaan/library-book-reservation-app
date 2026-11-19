// One axios instance for the whole app.
// It adds the login token to every request automatically.
import axios from "axios";

// Backend address:
// - If VITE_API_URL is set in frontend/.env, use that.
// - While developing (npm run dev on port 5173, or npm run preview on 4173)
//   the backend is on the same computer, port 5000.
//   (So it works on the laptop AND on a phone on the same Wi-Fi.)
// - Otherwise the backend itself is serving this app (localhost:5000, the
//   desktop .exe or the deployed website), so use the same address + /api.
const { hostname, port, origin } = window.location;
const isViteServer = port === "5173" || port === "4173";
export const API_URL =
  import.meta.env.VITE_API_URL || (isViteServer ? `http://${hostname}:5000/api` : `${origin}/api`);

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns any axios error into a simple message for the user
export const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.request) {
    return "Cannot reach the server. Is the backend running?";
  }
  return error.message || "Something went wrong";
};

export default api;
