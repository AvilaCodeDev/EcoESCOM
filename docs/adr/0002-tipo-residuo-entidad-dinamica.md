# ADR-0002: Tipo de Residuo como entidad dinámica, no enum fijo

**Estado:** Aceptado  
**Fecha:** 2026-06-13

## Contexto

El sistema maneja tres tipos de residuo base (Orgánico, Inorgánico, Reciclable). La opción obvia es modelarlos como un `enum` en Prisma/PostgreSQL. Sin embargo, el dominio requiere que un Administrador pueda definir tipos adicionales (ej. Electrónico, Peligroso) sin cambiar el código.

## Decisión

Modelar `TipoResiduo` como una tabla en base de datos, no como un enum. El sistema siembra los 3 tipos predeterminados en la migración inicial. El Administrador puede crear tipos adicionales desde la interfaz.

## Consecuencias

- El esquema de `Contenedores` referencia `tipoResiduoId` (FK) en lugar de un campo `enum`.
- Los reportes y filtros que agrupan por tipo de residuo deben operar sobre la entidad dinámica.
- La pantalla de gestión de zonas necesita una UI para definir tipos personalizados.
- Los 3 tipos predeterminados son datos de seed, no constantes en código — no se pueden eliminar (son referenciados por contenedores auto-creados al crear una zona).
