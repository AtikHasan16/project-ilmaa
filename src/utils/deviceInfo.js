// Utility to detect client browser, operating system, and hardware platform
export function getDeviceInfo() {
  if (typeof window === "undefined" || !navigator) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      platform: "Desktop",
      userAgent: "",
      language: "en-US",
      screenResolution: "Standard",
    };
  }

  const ua = navigator.userAgent;

  // Detect Operating System
  let os = "Unknown OS";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10 / 11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/i.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Mac OS X 10[._](\d+)/i.test(ua) || /Macintosh/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Detect Browser
  let browser = "Web Browser";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browser = "Google Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";

  // Device Form Factor
  const isMobile = /Mobi|Android/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  const platform = isTablet ? "Tablet Device" : isMobile ? "Mobile Device" : "Desktop Workstation";

  // Screen resolution
  const screenResolution = `${window.screen?.width || 0} × ${window.screen?.height || 0} (${window.devicePixelRatio || 1}x DPR)`;

  return {
    browser,
    os,
    platform,
    screenResolution,
    language: navigator.language || "en-US",
    online: navigator.onLine !== false,
  };
}
