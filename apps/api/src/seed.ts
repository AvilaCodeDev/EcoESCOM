import "dotenv/config";
import { prisma, Roles } from "./config/prisma";
import { hashPassword } from "./utils/hash";

const main = async () => {
    // SUPERADMIN
    const email = "superadmin@ecoescom.mx";
    const existing = await prisma.usuarios.findUnique({ where: { correo: email } });

    if (!existing) {
        const hashed = await hashPassword("SuperAdmin123");
        await prisma.usuarios.create({
            data: {
                nombre: "Super Administrador",
                correo: email,
                contrasenia: hashed,
                activo: true,
                rol: Roles.SUPERADMIN
            }
        });
        console.log(`SUPERADMIN creado. Correo: ${email} Contraseña: SuperAdmin123`);
    } else {
        console.log("El SUPERADMIN ya existe.");
    }

    // Tipos de residuo predeterminados
    const tiposPredeterminados = ["Orgánico", "Inorgánico", "Reciclable"];
    for (const nombre of tiposPredeterminados) {
        await prisma.tiposResiduo.upsert({
            where: { nombre },
            update: {},
            create: { nombre, es_predeterminado: true }
        });
    }
    console.log("Tipos de residuo predeterminados creados.");

    // Turnos
    const turnos = [
        { nombre: "Matutino", hora_inicio: "07:00", hora_fin: "14:00" },
        { nombre: "Vespertino", hora_inicio: "14:00", hora_fin: "21:00" }
    ];
    for (const turno of turnos) {
        await prisma.turnos.upsert({
            where: { nombre: turno.nombre },
            update: {},
            create: turno
        });
    }
    console.log("Turnos creados.");
};

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => {
        void prisma.$disconnect();
    });
