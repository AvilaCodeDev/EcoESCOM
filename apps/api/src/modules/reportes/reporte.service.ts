import { prisma } from "../../config/prisma";
import type { ReporteFilterInput } from "./reporte.schema";

export const getReporte = async (filters: ReporteFilterInput) => {
    const dateFilter = {
        ...(filters.desde ? { gte: filters.desde } : {}),
        ...(filters.hasta ? { lte: filters.hasta } : {})
    };
    const where = Object.keys(dateFilter).length > 0 ? { fecha: dateFilter } : {};

    const registros = await prisma.registrosVaciado.findMany({
        where,
        include: {
            contenedor: {
                include: {
                    tipo_residuo: { select: { nombre: true } },
                    zona: { select: { nombre_zona: true } }
                }
            }
        },
        orderBy: { fecha: "asc" }
    });

    const totalKg = registros.reduce((sum, r) => sum + r.cantidad.toNumber(), 0);

    const byTipoMap = new Map<string, number>();
    for (const r of registros) {
        const nombre = r.contenedor.tipo_residuo.nombre;
        byTipoMap.set(nombre, (byTipoMap.get(nombre) ?? 0) + r.cantidad.toNumber());
    }
    const byTipo = Array.from(byTipoMap.entries()).map(([nombre, totalKg]) => ({ nombre, totalKg }));

    const byZonaMap = new Map<string, number>();
    for (const r of registros) {
        const nombre = r.contenedor.zona.nombre_zona;
        byZonaMap.set(nombre, (byZonaMap.get(nombre) ?? 0) + r.cantidad.toNumber());
    }
    const byZona = Array.from(byZonaMap.entries()).map(([nombre, totalKg]) => ({ nombre, totalKg }));

    const serieMap = new Map<string, number>();
    for (const r of registros) {
        const day = r.fecha.toISOString().slice(0, 10);
        serieMap.set(day, (serieMap.get(day) ?? 0) + r.cantidad.toNumber());
    }
    const serie = Array.from(serieMap.entries()).map(([fecha, totalKg]) => ({ fecha, totalKg }));

    return { totalKg, byTipo, byZona, serie };
};
