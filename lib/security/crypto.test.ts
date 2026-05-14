import { describe, it, expect, beforeAll } from "vitest";

// Set a test encryption key (32 bytes = 64 hex chars)
beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("crypto", () => {
  it("should round-trip encrypt and decrypt", async () => {
    // Dynamic import to pick up env var
    const { encrypt, decrypt } = await import("./crypto");

    const plaintext = "my-secret-token-12345";
    const ciphertext = encrypt(plaintext);

    expect(ciphertext).not.toBe(plaintext);
    expect(ciphertext.split(":")).toHaveLength(3);

    const decrypted = decrypt(ciphertext);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for same plaintext (random IV)", async () => {
    const { encrypt } = await import("./crypto");

    const plaintext = "same-input";
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);

    expect(c1).not.toBe(c2);
  });

  it("should fail on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("./crypto");

    const ciphertext = encrypt("test");
    const parts = ciphertext.split(":");
    // Tamper with the encrypted data
    parts[1] = parts[1].slice(0, -2) + "XX";
    const tampered = parts.join(":");

    expect(() => decrypt(tampered)).toThrow();
  });

  it("should fail on invalid format", async () => {
    const { decrypt } = await import("./crypto");

    expect(() => decrypt("not-valid-format")).toThrow("Invalid ciphertext format");
  });
});
