import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateRegistroInput, RegistroFilterInput } from "./registro.schema";

const includeRelations = {
    contenedor: {
        include: {
            tipo_residuo: { select: { id_tipo: true, nombre: true } },
            zona: { select: { id_zona: true, nombre_zona: true } }
        }
    },
    operador: { select: { id_usuario: true, nombre: true } }
} as const;

const toPublic = (r: {
    id_registro: number;
    cantidad: { toNumber: () => number };
    fecha: Date;
    contenedor: {
        id_contenedor: number;
        nombre_contenedor: string;
        tipo_residuo: { id_tipo: number; nombre: string };
        zona: { id_zona: number; nombre_zona: string };
    };
    operador: { id_usuario: number; nombre: string };
}) => ({
    id: r.id_registro,
    cantidad: r.cantidad.toNumber(),
    fecha: r.fecha,
    contenedor: {
        id: r.contenedor.id_contenedor,
        nombre: r.contenedor.nombre_contenedor,
        tipoResiduo: { id: r.contenedor.tipo_residuo.id_tipo, nombre: r.contenedor.tipo_residuo.nombre },
        zona: { id: r.contenedor.zona.id_zona, nombre: r.contenedor.zona.nombre_zona }
    },
    operador: { id: r.operador.id_usuario, nombre: r.operador.nombre }
});

export const listRegistros = async (
    requesterId: number,
    requesterRole: string,
    filters: RegistroFilterInput
) => {
    const where: Record<string, unknown> = {};

    if (requesterRole === "TRABAJADOR") {
        where.id_operador = requesterId;
    }

    const contenedorFilter: Record<string, unknown> = {};
    if (filters.zonaId) contenedorFilter.id_zona = filters.zonaId;
    if (filters.tipoId) contenedorFilter.id_tipo_residuo = filters.tipoId;
    if (Object.keys(contenedorFilter).length) where.contenedor = contenedorFilter;
    if (filters.desde || filters.hasta) {
        where.fecha = {
            ...(filters.desde ? { gte: filters.desde } : {}),
            ...(filters.hasta ? { lte: filters.hasta } : {})
        };
    }

    const registros = await prisma.registrosVaciado.findMany({
        where,
        include: includeRelations,
        orderBy: { fecha: "desc" }
    });

    return registros.map(toPublic);
};

export const createRegistro = async (operadorId: number, input: CreateRegistroInput) => {
    const contenedor = await prisma.contenedores.findUnique({
        where: { id_contenedor: input.idContenedor }
    });
    if (!contenedor) throw new AppError("Contenedor no encontrado", 404);
    if (!contenedor.activo) throw new AppError("El contenedor está inactivo", 400);

    const registro = await prisma.registrosVaciado.create({
        data: {
            id_contenedor: input.idContenedor,
            id_operador: operadorId,
            cantidad: input.cantidad,
            fecha: input.fecha ?? new Date()
        },
        include: includeRelations
    });

    return toPublic(registro);
};
