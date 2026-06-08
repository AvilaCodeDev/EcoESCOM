import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("1d"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default("EcoESCOM <no-reply@ecoescom.mx>")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error("Variables de entorno inválidas o faltantes");
}

export const env = parsed.data;