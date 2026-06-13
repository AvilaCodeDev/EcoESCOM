import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateZoneInput, UpdateZoneInput } from "./zone.schema";

const toPublicZone = (zone: {
    id_zona: number;
    nombre_zona: string;
    descripcion: string | null;
    activo: boolean;
}) => ({
    id: zone.id_zona,
    name: zone.nombre_zona,
    description: zone.descripcion,
    active: zone.activo
});

export const listZones = async () => {
    const zones = await prisma.zonas.findMany();
    return zones.map(toPublicZone);
};

export const getZone = async (id: number) => {
    const zone = await prisma.zonas.findUnique({ where: { id_zona: id } });

    if (!zone) {
        throw new AppError("Zona no encontrada", 404);
    }

    return toPublicZone(zone);
};

export const createZone = async (input: CreateZoneInput) => {
    const tiposPredeterminados = await prisma.tiposResiduo.findMany({
        where: { es_predeterminado: true }
    });

    const zone = await prisma.zonas.create({
        data: {
            nombre_zona: input.name,
            descripcion: input.description,
            activo: input.active ?? true,
            contenedores: {
                create: tiposPredeterminados.map((tipo, i) => ({
                    nombre_contenedor: `Contenedor ${tipo.nombre}`,
                    codigo: `Z-AUTO-${Date.now()}-${i}`,
                    activo: true,
                    id_tipo_residuo: tipo.id_tipo
                }))
            }
        }
    });

    return toPublicZone(zone);
};

export const updateZone = async (id: number, input: UpdateZoneInput) => {
    await getZone(id);

    const zone = await prisma.zonas.update({
        where: { id_zona: id },
        data: {
            nombre_zona: input.name,
            descripcion: input.description,
            activo: input.active
        }
    });

    return toPublicZone(zone);
};

export const deleteZone = async (id: number) => {
    await getZone(id);
    await prisma.zonas.delete({ where: { id_zona: id } });
};