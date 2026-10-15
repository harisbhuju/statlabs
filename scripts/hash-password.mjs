// Usage: npm run hash-password -- "your-password"
// Prints a value for ADMIN_PASSWORD_HASH (scrypt, "<salt-hex>:<hash-hex>").
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}
const salt = randomBytes(16);
console.log(`${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`);
