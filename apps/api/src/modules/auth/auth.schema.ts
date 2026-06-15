import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "El correo no es válido" }),
    password: z.string().min(1, { message: "La contraseña es obligatoria" })
});

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, { message: "La contraseña actual es obligatoria" }),
    newPassword: z
        .string()
        .min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres" })
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;