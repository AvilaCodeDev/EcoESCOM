import "dotenv/config";
import { prisma, Roles } from "./config/prisma";
import { hashPassword } from "./utils/hash";

const main = async () => {
    const email = "superadmin@ecoescom.mx";
    const existing = await prisma.usuarios.findUnique({ where: { correo: email } });

    if (existing) {
        console.log("El SUPERADMIN ya existe.");
        return;
    }

    const password = "SuperAdmin123";
    const hashed = await hashPassword(password);

    await prisma.usuarios.create({
        data: {
            nombre: "Super Administrador",
            correo: email,
            contrasenia: hashed,
            activo: true,
            rol: Roles.SUPERADMIN
        }
    });

    console.log(`SUPERADMIN creado. Correo: ${email} Contraseña: ${password}`);
};

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => {
        void prisma.$disconnect();
    });