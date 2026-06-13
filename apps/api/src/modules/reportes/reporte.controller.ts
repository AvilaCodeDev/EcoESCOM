import type { RequestHandler } from "express";
import * as reporteService from "./reporte.service";
import { reporteFilterSchema } from "./reporte.schema";

export const getReporte: RequestHandler = async (req, res) => {
    const filters = reporteFilterSchema.parse(req.query);
    const reporte = await reporteService.getReporte(filters);
    res.status(200).json(reporte);
};
