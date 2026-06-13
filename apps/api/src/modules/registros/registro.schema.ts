import { z } from "zod";

export const createRegistroSchema = z.object({
    idContenedor: z.number().int().positive(),
    cantidad: z.number().positive({ message: "La cantidad debe ser positiva" }),
    fecha: z.coerce.date().optional()
});

export const registroIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export const registroFilterSchema = z.object({
    zonaId: z.coerce.number().int().positive().optional(),
    tipoId: z.coerce.number().int().positive().optional(),
    desde: z.coerce.date().optional(),
    hasta: z.coerce.date().optional()
});

export type CreateRegistroInput = z.infer<typeof createRegistroSchema>;
export type RegistroFilterInput = z.infer<typeof registroFilterSchema>;
