const ARGON2_OPTIONS = {
  algorithm: "argon2id" as const,
  memoryCost: 19456,
  timeCost: 2,
};

export async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  return Bun.password.verify(plain, storedHash);
}
