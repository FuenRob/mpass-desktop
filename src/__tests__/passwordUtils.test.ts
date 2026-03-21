import { describe, it, expect, vi, beforeEach } from "vitest";
import { generatePassword, getPasswordStrength } from "../utils/passwordUtils";

describe("getPasswordStrength", () => {
  it("returns score 0 for empty password", () => {
    const { score, labelKey } = getPasswordStrength("");
    expect(score).toBe(0);
    expect(labelKey).toBe("");
  });

  it("returns score 1 for a short lowercase-only password of 8+ chars", () => {
    const { score } = getPasswordStrength("abcdefgh");
    expect(score).toBe(1);
  });

  it("returns score 2 for a long lowercase-only password of 12+ chars", () => {
    const { score } = getPasswordStrength("abcdefghijkl");
    expect(score).toBe(2);
  });

  it("increases score for uppercase letters", () => {
    const { score } = getPasswordStrength("Abcdefgh");
    expect(score).toBe(2);
  });

  it("increases score for digits", () => {
    const { score } = getPasswordStrength("abcdefg1");
    expect(score).toBe(2);
  });

  it("increases score for symbols", () => {
    const { score } = getPasswordStrength("abcdefg!");
    expect(score).toBe(2);
  });

  it("returns max score 5 for strong password", () => {
    const { score, labelKey } = getPasswordStrength("MyP@ssw0rd!!xyz");
    expect(score).toBe(5);
    expect(labelKey).toBe("vault_screen.strength_very_strong");
  });

  it("returns correct label keys", () => {
    expect(getPasswordStrength("a").labelKey).toBe("vault_screen.strength_very_weak");
    expect(getPasswordStrength("abcdefgh").labelKey).toBe("vault_screen.strength_weak");
    expect(getPasswordStrength("Abcdefgh").labelKey).toBe("vault_screen.strength_fair");
    expect(getPasswordStrength("Abcdefg1").labelKey).toBe("vault_screen.strength_strong");
  });
});

describe("generatePassword", () => {
  beforeEach(() => {
    const mockGetRandomValues = vi.fn((array: Uint32Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 0xffffffff);
      }
      return array;
    });
    vi.stubGlobal("crypto", { getRandomValues: mockGetRandomValues });
  });

  it("generates password of specified length", () => {
    const pw = generatePassword(16, true, true);
    expect(pw.length).toBe(16);
  });

  it("generates password of different lengths", () => {
    expect(generatePassword(8, true, true).length).toBe(8);
    expect(generatePassword(32, true, true).length).toBe(32);
    expect(generatePassword(64, true, true).length).toBe(64);
  });

  it("excludes numbers when disabled", () => {
    const pw = generatePassword(100, false, false);
    expect(pw).toMatch(/^[a-zA-Z]+$/);
  });

  it("includes numbers when enabled", () => {
    const pw = generatePassword(100, true, false);
    expect(pw).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it("includes symbols when enabled", () => {
    const pw = generatePassword(100, false, true);
    expect(pw).toMatch(/^[a-zA-Z!@#$%^&*()_+~`|}{[\]:;?><,.\/\-=]+$/);
  });
});
