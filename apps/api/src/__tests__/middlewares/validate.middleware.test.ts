import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.middleware";

const mockRes = {} as Response;

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

describe("validate middleware", () => {
    it("sets req.body to the parsed value and calls next() on valid input", () => {
        const req = { body: { email: "user@example.com", password: "abc" } } as Request;
        const next = vi.fn() as NextFunction;
        validate(schema)(req, mockRes, next);
        expect(req.body).toEqual({ email: "user@example.com", password: "abc" });
        expect(next).toHaveBeenCalledOnce();
    });

    it("strips unknown fields from req.body", () => {
        const req = {
            body: { email: "user@example.com", password: "abc", extra: "ignored" },
        } as Request;
        const next = vi.fn() as NextFunction;
        validate(schema)(req, mockRes, next);
        expect(req.body).not.toHaveProperty("extra");
    });

    it("throws ZodError when body is invalid", () => {
        const req = { body: { email: "not-an-email", password: "" } } as Request;
        expect(() => validate(schema)(req, mockRes, vi.fn() as NextFunction))
            .toThrow(z.ZodError);
    });

    it("throws ZodError when required fields are missing", () => {
        const req = { body: {} } as Request;
        expect(() => validate(schema)(req, mockRes, vi.fn() as NextFunction))
            .toThrow(z.ZodError);
    });
});
