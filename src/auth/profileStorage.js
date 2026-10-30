const CACHE_PROFILE_KEY = "imlaa_user_profile";

export function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(CACHE_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (!userId || parsed.id === userId)) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function setCachedProfile(profileData) {
  try {
    if (profileData) {
      localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(profileData));
    } else {
      localStorage.removeItem(CACHE_PROFILE_KEY);
    }
  } catch {
    return;
  }
}
