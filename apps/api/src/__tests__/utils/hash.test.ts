import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../../utils/hash";

describe("hashPassword", () => {
    it("returns a string different from the input", async () => {
        const hash = await hashPassword("my-password");
        expect(typeof hash).toBe("string");
        expect(hash).not.toBe("my-password");
    });

    it("two hashes of the same password are different (bcrypt salts)", async () => {
        const a = await hashPassword("same-password");
        const b = await hashPassword("same-password");
        expect(a).not.toBe(b);
    });
});

describe("comparePassword", () => {
    it("returns true when the password matches its hash", async () => {
        const hash = await hashPassword("correct-password");
        expect(await comparePassword("correct-password", hash)).toBe(true);
    });

    it("returns false when the password does not match the hash", async () => {
        const hash = await hashPassword("correct-password");
        expect(await comparePassword("wrong-password", hash)).toBe(false);
    });
});
