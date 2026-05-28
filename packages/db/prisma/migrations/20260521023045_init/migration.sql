/*
  Warnings:

  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'TRABAJADOR', 'SUPERADMIN');

-- DropTable
DROP TABLE "Usuario";

-- CreateTable
CREATE TABLE "Usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenia" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,
    "rol" "Roles" NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "Usuarios"("correo");
