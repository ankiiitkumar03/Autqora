import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const DUMMY_SALT = "autqora-login-check-salt-v1";

function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashAccountPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await derive(password, salt);
  return { salt, hash: derived.toString("hex") };
}

export async function verifyAccountPassword(password: string, salt: string | null, expectedHash: string | null) {
  const derived = await derive(password, salt ?? DUMMY_SALT);
  if (!salt || !expectedHash || !/^[0-9a-f]{128}$/i.test(expectedHash)) return false;
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === derived.length && timingSafeEqual(derived, expected);
}
