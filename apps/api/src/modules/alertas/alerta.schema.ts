import { z } from "zod";

export const createAlertaSchema = z.object({
    idZona: z.number().int().positive(),
    idTipoResiduo: z.number().int().positive()
});

export type CreateAlertaInput = z.infer<typeof createAlertaSchema>;
