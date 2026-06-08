import { prisma } from "../../config/prisma";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";
import { AppError } from "../../utils/app-error";
import type { LoginInput, ChangePasswordInput } from "./auth.schema";

export const login = async (input: LoginInput) => {
    const user = await prisma.usuarios.findUnique({
        where: { correo: input.email }
    });

    if (!user || !user.activo) {
        throw new AppError("Credenciales inválidas", 401);
    }

    const isValid = await comparePassword(input.password, user.contrasenia);

    if (!isValid) {
        throw new AppError("Credenciales inválidas", 401);
    }

    const token = signToken({ sub: user.id_usuario, role: user.rol });

    return {
        token,
        user: {
            id: user.id_usuario,
            name: user.nombre,
            email: user.correo,
            role: user.rol
        }
    };
};

export const changePassword = async (
    userId: number,
    input: ChangePasswordInput
) => {
    const user = await prisma.usuarios.findUnique({
        where: { id_usuario: userId }
    });

    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }

    const isValid = await comparePassword(input.currentPassword, user.contrasenia);

    if (!isValid) {
        throw new AppError("La contraseña actual es incorrecta", 400);
    }

    const hashed = await hashPassword(input.newPassword);

    await prisma.usuarios.update({
        where: { id_usuario: userId },
        data: { contrasenia: hashed }
    });
};