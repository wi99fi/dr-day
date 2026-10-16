// Usage: node scripts/generate-vapid.mjs
// Prints a VAPID key pair for Web Push. Keep the private key secret.
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const pub = publicKey.export({ format: "jwk" });
const prv = privateKey.export({ format: "jwk" });
const b64 = (s) => s;
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]);
console.log("VITE_VAPID_PUBLIC_KEY=" + raw.toString("base64url"));
console.log("VAPID_PUBLIC_KEY=" + raw.toString("base64url"));
console.log("VAPID_PRIVATE_KEY=" + b64(prv.d));
console.log("VAPID_SUBJECT=mailto:you@example.com");
console.log("REMINDER_CRON_SECRET=" + Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(32))).toString("hex"));
