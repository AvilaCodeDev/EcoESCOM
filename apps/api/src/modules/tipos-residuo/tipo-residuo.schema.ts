import { z } from "zod";

export const createTipoResiduoSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio" })
});

export const tipoResiduoIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type CreateTipoResiduoInput = z.infer<typeof createTipoResiduoSchema>;
