# ADR-0001: Eliminar el campo `estado` de `RegistrosVaciado`

**Estado:** Aceptado  
**Fecha:** 2026-06-13

## Contexto

`RegistrosVaciado.estado` era un `String` libre en el esquema original. Su presencia implica un flujo de aprobación (pendiente → validado/rechazado), pero el dominio real no tiene ese flujo: los registros se crean por personal de limpieza y son válidos desde el momento en que se guardan. No hay coordinador que apruebe cada registro individualmente.

## Decisión

Eliminar el campo `estado` de `RegistrosVaciado` y de cualquier lógica de negocio asociada.

## Consecuencias

- La pantalla de "Validación" del prototipo de UI queda fuera del alcance del sistema.
- Los badges `pendiente/validado/rechazado` del historial no tienen significado y se eliminan.
- La migración de DB debe hacer `DROP COLUMN estado` en `registros_vaciado`.
- Si en el futuro se necesita auditoría de registros, se modela como un evento separado (ej. `AuditoriaRegistro`), no como un estado en el mismo modelo.
