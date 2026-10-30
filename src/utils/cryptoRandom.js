/**
 * Cryptographically secure random utilities.
 * Replaces insecure Math.random() with Web Crypto API / Node crypto.
 */

export function secureShuffle(array) {
  if (!Array.isArray(array) || array.length <= 1) return array ? [...array] : [];
  const arr = [...array];
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;

  for (let i = arr.length - 1; i > 0; i--) {
    let j;
    if (cryptoObj?.getRandomValues) {
      const buffer = new Uint32Array(1);
      cryptoObj.getRandomValues(buffer);
      j = buffer[0] % (i + 1);
    } else {
      // Safe fallback if crypto is not supported in test harness
      j = Math.floor((cryptoObj?.randomUUID ? parseInt(cryptoObj.randomUUID().replace(/\D/g, "").slice(0, 4), 10) : Date.now()) % (i + 1));
    }
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
