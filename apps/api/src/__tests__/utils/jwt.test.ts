import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signToken, verifyToken } from "../../utils/jwt";

describe("signToken", () => {
    it("returns a non-empty string", () => {
        const token = signToken({ sub: 1, role: "ADMIN" });
        expect(typeof token).toBe("string");
        expect(token.length).toBeGreaterThan(0);
    });

    it("produces a JWT with three dot-separated parts", () => {
        const token = signToken({ sub: 1, role: "ADMIN" });
        expect(token.split(".")).toHaveLength(3);
    });
});

describe("verifyToken", () => {
    it("decodes sub and role from a token signed by signToken", () => {
        const token = signToken({ sub: 42, role: "TRABAJADOR" });
        const payload = verifyToken(token);
        expect(payload.sub).toBe(42);
        expect(payload.role).toBe("TRABAJADOR");
    });

    it("throws on a malformed token string", () => {
        expect(() => verifyToken("not.a.token")).toThrow();
    });

    it("throws on a token signed with a different secret", () => {
        const badToken = jwt.sign({ sub: 1, role: "ADMIN" }, "wrong-secret");
        expect(() => verifyToken(badToken)).toThrow();
    });
});
