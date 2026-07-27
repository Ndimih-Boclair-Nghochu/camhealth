import axios from "axios";

/** Base URL of the CamHealth API. Configurable so the same app can point at a
 *  local on-site server or the cloud. Defaults to a local dev backend. */
export const API_BASE =
  localStorage.getItem("camhealth.apiBase") || "http://127.0.0.1:8000/api";

const ACCESS = "camhealth.access";
const REFRESH = "camhealth.refresh";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem(REFRESH);
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
          localStorage.setItem(ACCESS, data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function login(username: string, password: string) {
  const { data } = await axios.post(`${API_BASE}/auth/token/`, { username, password });
  localStorage.setItem(ACCESS, data.access);
  localStorage.setItem(REFRESH, data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

export const money = (v: string | number) =>
  new Intl.NumberFormat("fr-CM").format(Number(v)) + " FCFA";
