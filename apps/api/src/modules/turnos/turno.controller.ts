import type { RequestHandler } from "express";
import * as turnoService from "./turno.service";
import { turnoIdSchema } from "./turno.schema";

export const listTurnos: RequestHandler = async (_req, res) => {
    const turnos = await turnoService.listTurnos();
    res.status(200).json(turnos);
};

export const updateTurno: RequestHandler = async (req, res) => {
    const { id } = turnoIdSchema.parse(req.params);
    const turno = await turnoService.updateTurno(id, req.body);
    res.status(200).json(turno);
};
