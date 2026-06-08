import type { RequestHandler } from "express";
import * as authService from "./auth.service";

export const login: RequestHandler = async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
};

export const changePassword: RequestHandler = async (req, res) => {
    await authService.changePassword(req.user!.id, req.body);
    res.status(200).json({ message: "Contraseña actualizada correctamente" });
};