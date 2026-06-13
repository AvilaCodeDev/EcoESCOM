import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const updateTurnoSchema = z.object({
    hora_inicio: z.string().regex(timeRegex, "Formato debe ser HH:MM").optional(),
    hora_fin: z.string().regex(timeRegex, "Formato debe ser HH:MM").optional()
});

export const turnoIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type UpdateTurnoInput = z.infer<typeof updateTurnoSchema>;
