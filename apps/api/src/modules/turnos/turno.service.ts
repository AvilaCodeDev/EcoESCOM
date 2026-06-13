import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { UpdateTurnoInput } from "./turno.schema";

const toPublic = (t: { id_turno: number; nombre: string; hora_inicio: string; hora_fin: string }) => ({
    id: t.id_turno,
    nombre: t.nombre,
    horaInicio: t.hora_inicio,
    horaFin: t.hora_fin
});

export const listTurnos = async () => {
    const turnos = await prisma.turnos.findMany({ orderBy: { id_turno: "asc" } });
    return turnos.map(toPublic);
};

export const updateTurno = async (id: number, input: UpdateTurnoInput) => {
    const existing = await prisma.turnos.findUnique({ where: { id_turno: id } });
    if (!existing) {
        throw new AppError("Turno no encontrado", 404);
    }
    const turno = await prisma.turnos.update({
        where: { id_turno: id },
        data: {
            hora_inicio: input.hora_inicio,
            hora_fin: input.hora_fin
        }
    });
    return toPublic(turno);
};
