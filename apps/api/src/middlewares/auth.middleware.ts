import type { RequestHandler } from "express";
import { verifyToken, type TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/app-error";

export const authenticate: RequestHandler = (req, _res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        throw new AppError("Token de autenticación no proporcionado", 401);
    }

    const token = header.slice(7);
    let payload: TokenPayload;

    try {
        payload = verifyToken(token);
    } catch {
        throw new AppError("Token inválido o expirado", 401);
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
};