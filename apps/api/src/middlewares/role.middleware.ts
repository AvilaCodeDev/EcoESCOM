import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error";
import { Roles } from "../config/prisma";

export const authorize = (...roles: Roles[]): RequestHandler => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new AppError("No autenticado", 401);
        }

        if (!roles.includes(req.user.role as Roles)) {
            throw new AppError("No tienes permisos para realizar esta acción", 403);
        }

        next();
    };
};