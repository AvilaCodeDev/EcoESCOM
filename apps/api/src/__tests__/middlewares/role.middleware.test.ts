import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authorize } from "../../middlewares/role.middleware";
import { AppError } from "../../utils/app-error";

const mockRes = {} as Response;

function makeReq(user?: { id: number; role: string }): Request {
    return { user } as unknown as Request;
}

function getThrown(fn: () => void): unknown {
    try { fn(); } catch (e) { return e; }
}

describe("authorize middleware", () => {
    it("throws AppError 401 when req.user is undefined", () => {
        const handler = authorize("ADMIN");
        const req = makeReq(undefined);
        const err = getThrown(() => handler(req, mockRes, vi.fn() as NextFunction));
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).message).toBe("No autenticado");
        expect((err as AppError).statusCode).toBe(401);
    });

    it("throws AppError 403 when user role is not in the allowed list", () => {
        const handler = authorize("ADMIN");
        const req = makeReq({ id: 1, role: "TRABAJADOR" });
        const err = getThrown(() => handler(req, mockRes, vi.fn() as NextFunction));
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).message).toBe("No tienes permisos para realizar esta acción");
        expect((err as AppError).statusCode).toBe(403);
    });

    it("calls next() when user role is in the allowed list", () => {
        const handler = authorize("ADMIN", "SUPERADMIN");
        const req = makeReq({ id: 1, role: "SUPERADMIN" });
        const next = vi.fn() as NextFunction;
        handler(req, mockRes, next);
        expect(next).toHaveBeenCalledOnce();
    });

    it("calls next() when the only allowed role matches", () => {
        const handler = authorize("TRABAJADOR");
        const req = makeReq({ id: 2, role: "TRABAJADOR" });
        const next = vi.fn() as NextFunction;
        handler(req, mockRes, next);
        expect(next).toHaveBeenCalledOnce();
    });
});
