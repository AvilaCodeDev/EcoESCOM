import type { RequestHandler } from "express";
import * as zoneService from "./zone.service";
import { zoneIdSchema } from "./zone.schema";

export const listZones: RequestHandler = async (_req, res) => {
    const zones = await zoneService.listZones();
    res.status(200).json(zones);
};

export const getZone: RequestHandler = async (req, res) => {
    const { id } = zoneIdSchema.parse(req.params);
    const zone = await zoneService.getZone(id);
    res.status(200).json(zone);
};

export const createZone: RequestHandler = async (req, res) => {
    const zone = await zoneService.createZone(req.body);
    res.status(201).json(zone);
};

export const updateZone: RequestHandler = async (req, res) => {
    const { id } = zoneIdSchema.parse(req.params);
    const zone = await zoneService.updateZone(id, req.body);
    res.status(200).json(zone);
};

export const deleteZone: RequestHandler = async (req, res) => {
    const { id } = zoneIdSchema.parse(req.params);
    await zoneService.deleteZone(id);
    res.status(200).json({ message: "Zona eliminada correctamente" });
};