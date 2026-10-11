import type { ScryptOptions } from "node:crypto";
import { scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// ponytail: verifies hashes produced by the old nuxt-auth-utils (Adonis scrypt)
// setup, so existing users keep their passwords after the Better Auth migration.
// Format: $scrypt$n=16384,r=8,p=1$<salt-b64>$<hash-b64>
const PHC = /^\$scrypt\$n=(\d+),r=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/;

// promisify's types only expose scrypt's 3-arg overload.
const scrypt = promisify(nodeScrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
) => Promise<Buffer>;

export async function verifyLegacyPassword(
  phc: string,
  password: string
): Promise<boolean> {
  const match = PHC.exec(phc);
  if (!match) {
    return false;
  }
  const [, n, r, p, salt, expected] = match;
  const cost = Number(n);
  const blockSize = Number(r);
  const derived = await scrypt(
    password.normalize("NFKC"),
    Buffer.from(salt!, "base64"),
    64,
    {
      N: cost,
      r: blockSize,
      p: Number(p),
      maxmem: 128 * cost * blockSize * 2,
    }
  );

  const expectedBytes = Buffer.from(expected!, "base64");
  return (
    derived.length === expectedBytes.length &&
    timingSafeEqual(derived, expectedBytes)
  );
}
