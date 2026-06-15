import type { RequestHandler } from "express";
import * as tipoService from "./tipo-residuo.service";

export const listTiposResiduo: RequestHandler = async (_req, res) => {
    const tipos = await tipoService.listTiposResiduo();
    res.status(200).json(tipos);
};

export const createTipoResiduo: RequestHandler = async (req, res) => {
    const tipo = await tipoService.createTipoResiduo(req.body);
    res.status(201).json(tipo);
};
