# EcoESCOM — Glosario de dominio

## Roles de usuario

El sistema tiene tres roles:

- **TRABAJADOR** — Personal de limpieza. Crea **Registros de Vaciado**. Recibe **Alertas** cuando su turno está activo. No accede a reportes ni gestión de usuarios.
- **ADMIN** — Directivos de la escuela. Crean **Alertas**, consultan **Reportes** y tienen acceso de lectura a los datos del sistema para toma de decisiones. Gestionan usuarios y zonas.
- **SUPERADMIN** — Personal de sistemas/TI. Acceso técnico completo. No es un rol operativo del dominio.

## Tipo de Residuo

Categoría de residuo asignada a un **Contenedor Central**. Los tres tipos predeterminados del sistema son **Orgánico**, **Inorgánico** y **Reciclable**. Un **Administrador** puede definir tipos adicionales (ej. Electrónico, Peligroso).

El tipo de residuo es una entidad dinámica gestionada por el sistema — no un enum fijo en código.

## Contenedor Central

Punto de acopio físico dentro de una **Zona**. Al crear una zona, el sistema genera automáticamente 3 contenedores centrales, uno por cada **Tipo de Residuo** predeterminado. El admin puede agregar contenedores adicionales con tipos personalizados.

El tipo de residuo es un atributo fijo del contenedor, no del registro. Al crear un **Registro de Vaciado**, el trabajador selecciona el contenedor de una lista (que muestra zona + tipo de residuo). El sistema deriva el tipo de residuo del contenedor seleccionado.

## Turno

Período de trabajo con nombre fijo: **Matutino** o **Vespertino**. Solo existen estos dos turnos. Cada turno tiene hora de inicio y hora de fin configurables por el **Administrador** (no hardcodeadas). Un **Trabajador** puede pertenecer a uno o ambos turnos (relación muchos a muchos). El sistema determina el turno activo en un momento dado comparando la hora actual con los rangos configurados, y las **Alertas** se entregan únicamente a los trabajadores cuyo turno está activo en ese instante.

**Modelo ausente en el esquema actual — pendiente de agregar.**

## Alerta

Notificación interna creada manualmente por un **Administrador** cuando detecta que un contenedor está lleno. El admin selecciona zona y tipo de residuo; el sistema genera el texto de la notificación automáticamente. Se entrega a todos los trabajadores con turno activo en ese momento.

Campos del modelo: zona (FK), tipo de residuo (FK o derivado del contenedor), timestamp de creación, referencia al admin que la creó.

El campo `periodo` del modelo original no tiene propósito en este flujo y debe eliminarse.

## Zona

Área física delimitada de la escuela (ej. Edificio 2, Patio central, Cafetería). La crea un **Administrador** dentro del sistema. Agrupa los contenedores centrales de ese espacio. Unidad mínima de análisis geográfico para reportes.

## Registro de Vaciado

Evento que captura el vaciado de un **Contenedor Central**. Registra:
- Fecha y hora del vaciado
- Cantidad de residuo retirado (en **kilogramos**)
- Tipo de residuo (Orgánico, Inorgánico, Reciclable) — derivado del contenedor, no capturado de nuevo en el registro

La fecha y hora del vaciado se inicializan con el timestamp actual, pero el trabajador puede modificarlas antes de guardar. Un registro corresponde a un único vaciado de un único contenedor central. No es una estimación de llenado ni una ronda agregada por zona.

Los registros son **inmutables** al guardarse — no hay flujo de aprobación ni estado evolutivo. El campo `estado` del modelo original fue eliminado.

## Reporte

Visualización agregada de datos de **Registros de Vaciado**, consultable por un **Administrador** dentro del sistema (gráficas, tablas por zona, tipo, período). No es un archivo almacenado — es una vista calculada en tiempo de ejecución.

Existe la posibilidad de exportar el reporte como PDF generado bajo demanda. El PDF no se persiste en base de datos; es un artefacto temporal de descarga.

El modelo `Reportes` con campos `ruta_archivo`, `formato`, `tipo` no corresponde a este flujo y debe ser eliminado o rediseñado.
