const DEVICE_TOKEN_KEY = "imlaa_device_token";
const ACCESS_ID_KEY = "imlaa_access_id";

export function getDeviceToken() {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export function getStoredAccessId() {
  return localStorage.getItem(ACCESS_ID_KEY) || "";
}

export function setStoredAccessId(accessId) {
  if (accessId) {
    localStorage.setItem(ACCESS_ID_KEY, accessId);
  } else {
    localStorage.removeItem(ACCESS_ID_KEY);
  }
}
