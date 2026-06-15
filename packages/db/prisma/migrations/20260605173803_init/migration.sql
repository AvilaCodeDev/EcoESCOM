-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'TRABAJADOR', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "TiposResiduos" AS ENUM ('Organico', 'Inorganico', 'Reciclable');

-- CreateTable
CREATE TABLE "Usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenia" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "rol" "Roles" NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Zonas" (
    "id_zona" SERIAL NOT NULL,
    "nombre_zona" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Zonas_pkey" PRIMARY KEY ("id_zona")
);

-- CreateTable
CREATE TABLE "Contenedores" (
    "id_contenedor" SERIAL NOT NULL,
    "nombre_contenedor" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo_residuo" "TiposResiduos" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_zona" INTEGER NOT NULL,

    CONSTRAINT "Contenedores_pkey" PRIMARY KEY ("id_contenedor")
);

-- CreateTable
CREATE TABLE "RegistrosVaciado" (
    "id_registro" SERIAL NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL,
    "id_contenedor" INTEGER NOT NULL,
    "id_operador" INTEGER NOT NULL,

    CONSTRAINT "RegistrosVaciado_pkey" PRIMARY KEY ("id_registro")
);

-- CreateTable
CREATE TABLE "Reportes" (
    "id_reporte" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_final" TIMESTAMP(3) NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "tiempo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "Reportes_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateTable
CREATE TABLE "Alertas" (
    "id_alerta" SERIAL NOT NULL,
    "tipo_residuo" "TiposResiduos" NOT NULL,
    "periodo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_notificacion" TIMESTAMP(3),
    "id_zona" INTEGER NOT NULL,

    CONSTRAINT "Alertas_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_correo_key" ON "Usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Contenedores_codigo_key" ON "Contenedores"("codigo");

-- AddForeignKey
ALTER TABLE "Contenedores" ADD CONSTRAINT "Contenedores_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "Zonas"("id_zona") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrosVaciado" ADD CONSTRAINT "RegistrosVaciado_id_contenedor_fkey" FOREIGN KEY ("id_contenedor") REFERENCES "Contenedores"("id_contenedor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrosVaciado" ADD CONSTRAINT "RegistrosVaciado_id_operador_fkey" FOREIGN KEY ("id_operador") REFERENCES "Usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reportes" ADD CONSTRAINT "Reportes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alertas" ADD CONSTRAINT "Alertas_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "Zonas"("id_zona") ON DELETE RESTRICT ON UPDATE CASCADE;
