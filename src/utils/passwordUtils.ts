export function generatePassword(
  length: number,
  includeNumbers: boolean,
  includeSymbols: boolean
): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

  let pool = chars;
  if (includeNumbers) pool += nums;
  if (includeSymbols) pool += syms;

  const poolSize = pool.length;
  const maxUnbiased = Math.floor(0x100000000 / poolSize) * poolSize;

  let password = "";
  let generated = 0;
  while (generated < length) {
    const batch = new Uint32Array(Math.max(length - generated, 8));
    window.crypto.getRandomValues(batch);
    for (const value of batch) {
      if (value < maxUnbiased) {
        password += pool[value % poolSize];
        generated++;
        if (generated >= length) break;
      }
    }
  }

  return password;
}

export function getPasswordStrength(password: string): { score: number; labelKey: string } {
  if (!password) return { score: 0, labelKey: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = [
    "vault_screen.strength_very_weak",
    "vault_screen.strength_weak",
    "vault_screen.strength_fair",
    "vault_screen.strength_strong",
    "vault_screen.strength_very_strong",
  ];
  return { score, labelKey: labels[Math.min(score, 4)] };
}
