import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateContenedorInput, UpdateContenedorInput } from "./contenedor.schema";

const toPublic = (c: {
    id_contenedor: number;
    nombre_contenedor: string;
    codigo: string;
    activo: boolean;
    id_zona: number;
    tipo_residuo: { id_tipo: number; nombre: string };
}) => ({
    id: c.id_contenedor,
    nombre: c.nombre_contenedor,
    codigo: c.codigo,
    activo: c.activo,
    idZona: c.id_zona,
    tipoResiduo: { id: c.tipo_residuo.id_tipo, nombre: c.tipo_residuo.nombre }
});

const includeRelations = { tipo_residuo: true } as const;

export const listContenedores = async (zonaId?: number) => {
    const contenedores = await prisma.contenedores.findMany({
        where: zonaId ? { id_zona: zonaId } : undefined,
        include: includeRelations,
        orderBy: { id_contenedor: "asc" }
    });
    return contenedores.map(toPublic);
};

export const getContenedor = async (id: number) => {
    const c = await prisma.contenedores.findUnique({
        where: { id_contenedor: id },
        include: includeRelations
    });
    if (!c) throw new AppError("Contenedor no encontrado", 404);
    return toPublic(c);
};

export const createContenedor = async (input: CreateContenedorInput) => {
    const existing = await prisma.contenedores.findUnique({ where: { codigo: input.codigo } });
    if (existing) throw new AppError("Ya existe un contenedor con ese código", 409);

    const zona = await prisma.zonas.findUnique({ where: { id_zona: input.idZona } });
    if (!zona) throw new AppError("Zona no encontrada", 404);

    const tipo = await prisma.tiposResiduo.findUnique({ where: { id_tipo: input.idTipoResiduo } });
    if (!tipo) throw new AppError("Tipo de residuo no encontrado", 404);

    const c = await prisma.contenedores.create({
        data: {
            nombre_contenedor: input.nombre,
            codigo: input.codigo,
            activo: true,
            id_zona: input.idZona,
            id_tipo_residuo: input.idTipoResiduo
        },
        include: includeRelations
    });
    return toPublic(c);
};

export const updateContenedor = async (id: number, input: UpdateContenedorInput) => {
    await getContenedor(id);
    const c = await prisma.contenedores.update({
        where: { id_contenedor: id },
        data: {
            nombre_contenedor: input.nombre,
            activo: input.activo
        },
        include: includeRelations
    });
    return toPublic(c);
};

export const deleteContenedor = async (id: number) => {
    await getContenedor(id);
    await prisma.contenedores.delete({ where: { id_contenedor: id } });
};
