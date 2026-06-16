import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { signToken } from "../../utils/jwt";
import { AppError } from "../../utils/app-error";

const mockRes = {} as Response;

function makeReq(authHeader?: string): Request {
    return {
        headers: authHeader ? { authorization: authHeader } : {},
    } as unknown as Request;
}

describe("authenticate middleware", () => {
    it("throws AppError 401 when Authorization header is absent", () => {
        const req = makeReq();
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow("Token de autenticación no proporcionado");
    });

    it("throws AppError 401 when header does not start with 'Bearer '", () => {
        const req = makeReq("Basic dXNlcjpwYXNz");
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
    });

    it("throws AppError 401 when Bearer token is invalid", () => {
        const req = makeReq("Bearer not.a.valid.token");
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
    });

    it("populates req.user and calls next() when token is valid", () => {
        const token = signToken({ sub: 7, role: "ADMIN" });
        const req = makeReq(`Bearer ${token}`);
        const next = vi.fn() as NextFunction;
        authenticate(req, mockRes, next);
        expect((req as any).user).toEqual({ id: 7, role: "ADMIN" });
        expect(next).toHaveBeenCalledOnce();
    });
});
