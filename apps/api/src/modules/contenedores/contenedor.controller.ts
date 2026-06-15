import type { RequestHandler } from "express";
import * as contenedorService from "./contenedor.service";
import { contenedorIdSchema, zoneFilterSchema } from "./contenedor.schema";

export const listContenedores: RequestHandler = async (req, res) => {
    const { zonaId } = zoneFilterSchema.parse(req.query);
    const contenedores = await contenedorService.listContenedores(zonaId);
    res.status(200).json(contenedores);
};

export const getContenedor: RequestHandler = async (req, res) => {
    const { id } = contenedorIdSchema.parse(req.params);
    const contenedor = await contenedorService.getContenedor(id);
    res.status(200).json(contenedor);
};

export const createContenedor: RequestHandler = async (req, res) => {
    const contenedor = await contenedorService.createContenedor(req.body);
    res.status(201).json(contenedor);
};

export const updateContenedor: RequestHandler = async (req, res) => {
    const { id } = contenedorIdSchema.parse(req.params);
    const contenedor = await contenedorService.updateContenedor(id, req.body);
    res.status(200).json(contenedor);
};

export const deleteContenedor: RequestHandler = async (req, res) => {
    const { id } = contenedorIdSchema.parse(req.params);
    await contenedorService.deleteContenedor(id);
    res.status(200).json({ message: "Contenedor eliminado" });
};
