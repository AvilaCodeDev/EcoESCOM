import { z } from "zod";
import { Roles } from "../../config/prisma";

export const createUserSchema = z.object({
    name: z.string().min(1, { message: "El nombre es obligatorio" }),
    email: z.string().email({ message: "El correo no es válido" }),
    role: z.nativeEnum(Roles, { message: "El rol no es válido" }),
    turnIds: z.array(z.number().int().positive()).optional()
});

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(Roles).optional(),
    active: z.boolean().optional(),
    turnIds: z.array(z.number().int().positive()).optional()
});

export const userIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
