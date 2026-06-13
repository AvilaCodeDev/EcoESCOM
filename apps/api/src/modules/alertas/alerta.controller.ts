import type { RequestHandler } from "express";
import * as alertaService from "./alerta.service";

export const listAlertas: RequestHandler = async (_req, res) => {
    const alertas = await alertaService.listAlertas();
    res.status(200).json(alertas);
};

export const createAlerta: RequestHandler = async (req, res) => {
    const alerta = await alertaService.createAlerta(req.user!.id, req.body);
    res.status(201).json(alerta);
};
