import { z } from "zod";

export const createZoneSchema = z.object({
    name: z.string().min(1, { message: "El nombre de la zona es obligatorio" }),
    description: z.string().optional(),
    active: z.boolean().optional()
});

export const updateZoneSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    active: z.boolean().optional()
});

export const zoneIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;