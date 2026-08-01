import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const ORIGIN_KEY = "camhealth.origin";
const ACCESS = "camhealth.access";
const REFRESH = "camhealth.refresh";

export const DEFAULT_ORIGIN = "http://192.168.2.122:8000";

export async function getOrigin() {
  return (await AsyncStorage.getItem(ORIGIN_KEY)) || DEFAULT_ORIGIN;
}
export async function setOrigin(value: string) {
  await AsyncStorage.setItem(ORIGIN_KEY, value.replace(/\/+$/, ""));
}
export async function getApiBase() {
  return `${await getOrigin()}/api`;
}

export const api = axios.create({ timeout: 15000 });

api.interceptors.request.use(async (config) => {
  config.baseURL = await getApiBase();
  const token = await AsyncStorage.getItem(ACCESS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const refresh = await AsyncStorage.getItem(REFRESH);
      if (refresh) {
        try {
          const base = await getApiBase();
          const { data } = await axios.post(`${base}/auth/token/refresh/`, { refresh });
          await AsyncStorage.setItem(ACCESS, data.access);
          return api(original);
        } catch {
          await logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function login(username: string, password: string) {
  const base = await getApiBase();
  const { data } = await axios.post(`${base}/auth/token/`, { username, password });
  await AsyncStorage.multiSet([[ACCESS, data.access], [REFRESH, data.refresh]]);
  return data;
}

export interface RegisterPayload {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export async function register(payload: RegisterPayload) {
  const base = await getApiBase();
  const { data } = await axios.post(`${base}/auth/register/`, payload);
  await AsyncStorage.multiSet([[ACCESS, data.access], [REFRESH, data.refresh]]);
  return data;
}

export interface ActivatePayload {
  matricule: string;
  password: string;
  username?: string;
}

export async function activate(payload: ActivatePayload) {
  const base = await getApiBase();
  const { data } = await axios.post(`${base}/auth/activate/`, payload);
  await AsyncStorage.multiSet([[ACCESS, data.access], [REFRESH, data.refresh]]);
  return data;
}

export async function logout() {
  await AsyncStorage.multiRemove([ACCESS, REFRESH]);
}

export async function hasToken() {
  return !!(await AsyncStorage.getItem(ACCESS));
}

export const money = (v: string | number) =>
  new Intl.NumberFormat("fr-CM").format(Number(v)) + " FCFA";
