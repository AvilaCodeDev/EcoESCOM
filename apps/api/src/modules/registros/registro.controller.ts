import type { RequestHandler } from "express";
import * as registroService from "./registro.service";
import { registroFilterSchema } from "./registro.schema";

export const listRegistros: RequestHandler = async (req, res) => {
    const filters = registroFilterSchema.parse(req.query);
    const registros = await registroService.listRegistros(
        req.user!.id,
        req.user!.role,
        filters
    );
    res.status(200).json(registros);
};

export const createRegistro: RequestHandler = async (req, res) => {
    const registro = await registroService.createRegistro(req.user!.id, req.body);
    res.status(201).json(registro);
};
