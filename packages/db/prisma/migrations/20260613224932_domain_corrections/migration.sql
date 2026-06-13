/*
  Warnings:

  - You are about to drop the column `activo` on the `Alertas` table. All the data in the column will be lost.
  - You are about to drop the column `periodo` on the `Alertas` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_residuo` on the `Alertas` table. All the data in the column will be lost.
  - You are about to drop the column `ultima_notificacion` on the `Alertas` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_residuo` on the `Contenedores` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `RegistrosVaciado` table. All the data in the column will be lost.
  - You are about to drop the `Reportes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id_creador` to the `Alertas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipo_residuo` to the `Alertas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipo_residuo` to the `Contenedores` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reportes" DROP CONSTRAINT "Reportes_id_usuario_fkey";

-- AlterTable
ALTER TABLE "Alertas" DROP COLUMN "activo",
DROP COLUMN "periodo",
DROP COLUMN "tipo_residuo",
DROP COLUMN "ultima_notificacion",
ADD COLUMN     "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_creador" INTEGER NOT NULL,
ADD COLUMN     "id_tipo_residuo" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Contenedores" DROP COLUMN "tipo_residuo",
ADD COLUMN     "id_tipo_residuo" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RegistrosVaciado" DROP COLUMN "estado";

-- DropTable
DROP TABLE "Reportes";

-- DropEnum
DROP TYPE "TiposResiduos";

-- CreateTable
CREATE TABLE "TiposResiduo" (
    "id_tipo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "es_predeterminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TiposResiduo_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "Turnos" (
    "id_turno" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,

    CONSTRAINT "Turnos_pkey" PRIMARY KEY ("id_turno")
);

-- CreateTable
CREATE TABLE "UsuariosTurnos" (
    "id_usuario" INTEGER NOT NULL,
    "id_turno" INTEGER NOT NULL,

    CONSTRAINT "UsuariosTurnos_pkey" PRIMARY KEY ("id_usuario","id_turno")
);

-- CreateIndex
CREATE UNIQUE INDEX "TiposResiduo_nombre_key" ON "TiposResiduo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Turnos_nombre_key" ON "Turnos"("nombre");

-- AddForeignKey
ALTER TABLE "UsuariosTurnos" ADD CONSTRAINT "UsuariosTurnos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuariosTurnos" ADD CONSTRAINT "UsuariosTurnos_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "Turnos"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contenedores" ADD CONSTRAINT "Contenedores_id_tipo_residuo_fkey" FOREIGN KEY ("id_tipo_residuo") REFERENCES "TiposResiduo"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alertas" ADD CONSTRAINT "Alertas_id_tipo_residuo_fkey" FOREIGN KEY ("id_tipo_residuo") REFERENCES "TiposResiduo"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alertas" ADD CONSTRAINT "Alertas_id_creador_fkey" FOREIGN KEY ("id_creador") REFERENCES "Usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
