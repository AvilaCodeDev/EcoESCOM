import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateTipoResiduoInput } from "./tipo-residuo.schema";

const toPublic = (t: { id_tipo: number; nombre: string; es_predeterminado: boolean }) => ({
    id: t.id_tipo,
    nombre: t.nombre,
    esPredeterminado: t.es_predeterminado
});

export const listTiposResiduo = async () => {
    const tipos = await prisma.tiposResiduo.findMany({ orderBy: { id_tipo: "asc" } });
    return tipos.map(toPublic);
};

export const createTipoResiduo = async (input: CreateTipoResiduoInput) => {
    const existing = await prisma.tiposResiduo.findUnique({ where: { nombre: input.nombre } });
    if (existing) {
        throw new AppError("Ya existe un tipo de residuo con ese nombre", 409);
    }
    const tipo = await prisma.tiposResiduo.create({
        data: { nombre: input.nombre, es_predeterminado: false }
    });
    return toPublic(tipo);
};
