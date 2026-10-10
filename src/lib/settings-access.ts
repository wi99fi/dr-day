// Convenience privacy lock only; account access remains enforced by cloud policies.
const CODE_DIGEST = "37f6d9c7335d7a61a44de3aef5d6c209d043713bcdcf8ec362fa31764e510bc6";

export async function matchesSettingsCode(code: string): Promise<boolean> {
  if (!/^\d{4}$/.test(code)) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return hex === CODE_DIGEST;
}