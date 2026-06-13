import { z } from "zod";

export const createContenedorSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
    codigo: z.string().min(1, { message: "El código es obligatorio" }),
    idZona: z.number().int().positive(),
    idTipoResiduo: z.number().int().positive()
});

export const updateContenedorSchema = z.object({
    nombre: z.string().min(1).optional(),
    activo: z.boolean().optional()
});

export const contenedorIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export const zoneFilterSchema = z.object({
    zonaId: z.coerce.number().int().positive().optional()
});

export type CreateContenedorInput = z.infer<typeof createContenedorSchema>;
export type UpdateContenedorInput = z.infer<typeof updateContenedorSchema>;
