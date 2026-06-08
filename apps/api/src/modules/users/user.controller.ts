import type { RequestHandler } from "express";
import * as userService from "./user.service";
import { userIdSchema } from "./user.schema";

export const listUsers: RequestHandler = async (_req, res) => {
    const users = await userService.listUsers();
    res.status(200).json(users);
};

export const getUser: RequestHandler = async (req, res) => {
    const { id } = userIdSchema.parse(req.params);
    const user = await userService.getUser(id);
    res.status(200).json(user);
};

export const createUser: RequestHandler = async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json({
        message: "Usuario creado. Se enviaron las credenciales por correo.",
        user
    });
};

export const updateUser: RequestHandler = async (req, res) => {
    const { id } = userIdSchema.parse(req.params);
    const user = await userService.updateUser(id, req.body);
    res.status(200).json(user);
};

export const deleteUser: RequestHandler = async (req, res) => {
    const { id } = userIdSchema.parse(req.params);
    await userService.deleteUser(id);
    res.status(200).json({ message: "Usuario eliminado correctamente" });
};