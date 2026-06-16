import { describe, expect, it } from "vitest";
import { generateSalt, hashPassword, verifyPassword } from "./crypto";

describe("generateSalt", () => {
  it("produces distinct values on each call", () => {
    const salts = new Set(Array.from({ length: 10 }, () => generateSalt()));
    expect(salts.size).toBe(10);
  });

  it("produces a hex string", () => {
    expect(generateSalt()).toMatch(/^[0-9a-f]+$/);
  });
});

describe("hashPassword", () => {
  it("is deterministic for the same password and salt", async () => {
    const salt = generateSalt();
    expect(await hashPassword("secret1", salt)).toBe(await hashPassword("secret1", salt));
  });

  it("differs across passwords for the same salt", async () => {
    const salt = generateSalt();
    expect(await hashPassword("secret1", salt)).not.toBe(await hashPassword("secret2", salt));
  });

  it("differs across salts for the same password", async () => {
    expect(await hashPassword("secret1", generateSalt())).not.toBe(await hashPassword("secret1", generateSalt()));
  });
});

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("secret1", salt);
    expect(await verifyPassword("secret1", salt, hash)).toBe(true);
  });

  it("returns false for an incorrect password", async () => {
    const salt = generateSalt();
    const hash = await hashPassword("secret1", salt);
    expect(await verifyPassword("wrongpass", salt, hash)).toBe(false);
  });
});
