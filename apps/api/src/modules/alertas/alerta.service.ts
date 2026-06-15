import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { resolveActiveUserIds } from "../../shared/active-shift.resolver";
import type { CreateAlertaInput } from "./alerta.schema";

const includeRelations = {
    zona: { select: { id_zona: true, nombre_zona: true } },
    tipo_residuo: { select: { id_tipo: true, nombre: true } },
    creador: { select: { id_usuario: true, nombre: true } }
} as const;

const toPublic = (a: {
    id_alerta: number;
    fecha_creacion: Date;
    zona: { id_zona: number; nombre_zona: string };
    tipo_residuo: { id_tipo: number; nombre: string };
    creador: { id_usuario: number; nombre: string };
}) => ({
    id: a.id_alerta,
    fechaCreacion: a.fecha_creacion,
    zona: { id: a.zona.id_zona, nombre: a.zona.nombre_zona },
    tipoResiduo: { id: a.tipo_residuo.id_tipo, nombre: a.tipo_residuo.nombre },
    creador: { id: a.creador.id_usuario, nombre: a.creador.nombre },
    mensaje: `Contenedor de residuos ${a.tipo_residuo.nombre} en ${a.zona.nombre_zona} requiere vaciado.`
});

export const listAlertas = async () => {
    const alertas = await prisma.alertas.findMany({
        include: includeRelations,
        orderBy: { fecha_creacion: "desc" }
    });
    return alertas.map(toPublic);
};

export const createAlerta = async (creadorId: number, input: CreateAlertaInput) => {
    const zona = await prisma.zonas.findUnique({ where: { id_zona: input.idZona } });
    if (!zona) throw new AppError("Zona no encontrada", 404);

    const tipo = await prisma.tiposResiduo.findUnique({ where: { id_tipo: input.idTipoResiduo } });
    if (!tipo) throw new AppError("Tipo de residuo no encontrado", 404);

    const alerta = await prisma.alertas.create({
        data: {
            id_zona: input.idZona,
            id_tipo_residuo: input.idTipoResiduo,
            id_creador: creadorId
        },
        include: includeRelations
    });

    // Determine active shift recipients
    const turnos = await prisma.turnos.findMany({
        include: { usuarios: { select: { id_usuario: true } } }
    });
    const currentTime = new Date().toTimeString().slice(0, 5);
    const recipientIds = resolveActiveUserIds(turnos, currentTime);

    console.log(`Alerta ${alerta.id_alerta} — destinatarios activos: [${recipientIds.join(", ")}]`);

    return toPublic(alerta);
};
