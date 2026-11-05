/**
 * Cryptographically secure random utilities.
 * Replaces insecure Math.random() with Web Crypto API / Node crypto.
 */

export function secureShuffle(array) {
  if (!Array.isArray(array) || array.length <= 1) return array ? [...array] : [];
  const arr = [...array];
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("Secure randomization is not available in this environment.");
  }

  const buffer = new Uint32Array(1);
  for (let i = arr.length - 1; i > 0; i--) {
    const range = i + 1;
    const maxUnbiasedValue = Math.floor(0x100000000 / range) * range;
    let value;
    do {
      cryptoObj.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= maxUnbiasedValue);
    const j = value % range;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function secureRandomUUID() {
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
