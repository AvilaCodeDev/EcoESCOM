import { describe, it, expect } from "vitest";
import { generatePassword } from "../../utils/password-generator";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

describe("generatePassword", () => {
    it("returns a string of the default length (12)", () => {
        expect(generatePassword()).toHaveLength(12);
    });

    it("returns a string of the requested length", () => {
        expect(generatePassword(20)).toHaveLength(20);
    });

    it("every character belongs to the defined alphabet", () => {
        const pwd = generatePassword(100);
        for (const char of pwd) {
            expect(ALPHABET).toContain(char);
        }
    });

    it("two consecutive calls return different values", () => {
        expect(generatePassword()).not.toBe(generatePassword());
    });
});
