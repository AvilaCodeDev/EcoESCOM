-- CreateEnum
CREATE TYPE "TiposResiduos" AS ENUM ('Organico', 'Inorganico', 'Reciclable');

-- CreateTable
CREATE TABLE "Contenedores" (
    "id_contenedor" SERIAL NOT NULL,
    "tipo_residuo" "TiposResiduos" NOT NULL,
    "id_zona" INTEGER NOT NULL,

    CONSTRAINT "Contenedores_pkey" PRIMARY KEY ("id_contenedor")
);

-- CreateTable
CREATE TABLE "Zonas" (
    "id_zona" SERIAL NOT NULL,
    "nombre_zona" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "Zonas_pkey" PRIMARY KEY ("id_zona")
);

-- AddForeignKey
ALTER TABLE "Contenedores" ADD CONSTRAINT "Contenedores_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "Zonas"("id_zona") ON DELETE RESTRICT ON UPDATE CASCADE;
