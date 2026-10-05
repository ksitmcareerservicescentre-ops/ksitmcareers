import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hashes a plaintext password using Node.js scrypt with a unique random salt.
 * Output format: scrypt:<salt_hex>:<derived_key_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash in constant time.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
      return false;
    }

    const salt = parts[1];
    const key = Buffer.from(parts[2], "hex");
    const derivedKey = (await scryptAsync(
      password,
      salt,
      key.length,
    )) as Buffer;

    return timingSafeEqual(key, derivedKey);
  } catch {
    return false;
  }
}
