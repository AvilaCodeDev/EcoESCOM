import { prisma } from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import { generatePassword } from "../../utils/password-generator";
import { sendMail } from "../../config/mailer";
import { AppError } from "../../utils/app-error";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

const publicUser = {
    id_usuario: true,
    nombre: true,
    correo: true,
    activo: true,
    rol: true,
    fecha_creacion: true,
    ultima_actualizacion: true
};

const toPublicUser = (user: {
    id_usuario: number;
    nombre: string;
    correo: string;
    activo: boolean;
    rol: string;
    fecha_creacion: Date;
    ultima_actualizacion: Date;
}) => ({
    id: user.id_usuario,
    name: user.nombre,
    email: user.correo,
    active: user.activo,
    role: user.rol,
    createdAt: user.fecha_creacion,
    updatedAt: user.ultima_actualizacion
});

export const listUsers = async () => {
    const users = await prisma.usuarios.findMany({ select: publicUser });
    return users.map(toPublicUser);
};

export const getUser = async (id: number) => {
    const user = await prisma.usuarios.findUnique({
        where: { id_usuario: id },
        select: publicUser
    });

    if (!user) {
        throw new AppError("Usuario no encontrado", 404);
    }

    return toPublicUser(user);
};

export const createUser = async (input: CreateUserInput) => {
    const existing = await prisma.usuarios.findUnique({
        where: { correo: input.email }
    });

    if (existing) {
        throw new AppError("El correo ya está registrado", 409);
    }

    const generatedPassword = generatePassword();
    const hashed = await hashPassword(generatedPassword);

    const user = await prisma.usuarios.create({
        data: {
            nombre: input.name,
            correo: input.email,
            contrasenia: hashed,
            activo: true,
            rol: input.role
        },
        select: publicUser
    });

    await sendMail({
        to: input.email,
        subject: "Tus credenciales de acceso a EcoESCOM",
        text: `Hola ${input.name}, se creó tu cuenta. Usuario: ${input.email}. Contraseña temporal: ${generatedPassword}. Por seguridad, cámbiala al iniciar sesión.`
    });

    return toPublicUser(user);
};

export const updateUser = async (id: number, input: UpdateUserInput) => {
    await getUser(id);

    if (input.email) {
        const existing = await prisma.usuarios.findUnique({
            where: { correo: input.email }
        });

        if (existing && existing.id_usuario !== id) {
            throw new AppError("El correo ya está registrado", 409);
        }
    }

    const user = await prisma.usuarios.update({
        where: { id_usuario: id },
        data: {
            nombre: input.name,
            correo: input.email,
            rol: input.role,
            activo: input.active
        },
        select: publicUser
    });

    return toPublicUser(user);
};

export const deleteUser = async (id: number) => {
    await getUser(id);
    await prisma.usuarios.delete({ where: { id_usuario: id } });
};