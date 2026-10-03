/** `device` sent with login and register (`DeviceReq` in the Go API). */
export type DeviceInfo = { os: 'WEB'; name: string; uid: string; version?: string };

const DEVICE_UID_KEY = 'device-uid-v1';

/** Stable random id for this browser. It is not a secret: it only tells the user's sessions apart. */
function deviceUid(): string {
  try {
    const saved = localStorage.getItem(DEVICE_UID_KEY);
    if (saved) return saved;
    const uid = crypto.randomUUID();
    localStorage.setItem(DEVICE_UID_KEY, uid);
    return uid;
  } catch {
    return crypto.randomUUID();
  }
}

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

/** e.g. "Chrome on macOS" — shown in the user's list of sessions. */
function deviceName(ua: string): string {
  const browser = BROWSERS.find(([re]) => re.test(ua))?.[1] ?? 'Browser';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Mac OS X/.test(ua)
        ? 'macOS'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : undefined;
  return os ? `${browser} on ${os}` : browser;
}

export function getDeviceInfo(): DeviceInfo {
  return { os: 'WEB', name: deviceName(navigator.userAgent), uid: deviceUid() };
}
