// User scanner preferences (stored locally)
const KEY = "cybersmart.prefs";

export type ScanPrefs = {
  useVirusTotal: boolean;
  useGemini: boolean;
};

const DEFAULTS: ScanPrefs = { useVirusTotal: true, useGemini: true };

export function getPrefs(): ScanPrefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return DEFAULTS; }
}
export function setPrefs(p: ScanPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
}
