import axios from "axios";
import { getDeviceToken } from "../utils/deviceToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach device token to outgoing requests
apiClient.interceptors.request.use((config) => {
  config.headers["x-device-token"] = getDeviceToken();
  return config;
});

export default apiClient;
