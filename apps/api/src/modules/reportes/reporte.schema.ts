import { z } from "zod";

export const reporteFilterSchema = z.object({
    desde: z.coerce.date().optional(),
    hasta: z.coerce.date().optional()
});

export type ReporteFilterInput = z.infer<typeof reporteFilterSchema>;
