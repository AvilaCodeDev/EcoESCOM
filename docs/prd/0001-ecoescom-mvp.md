# PRD-0001: EcoESCOM MVP — Conexión backend + lógica de dominio

**Estado:** Ready for implementation  
**Fecha:** 2026-06-13  
**Contexto de dominio:** CONTEXT.md + ADR-0001 + ADR-0002

---

## Problem Statement

El personal de limpieza de la escuela no tiene manera de registrar los vaciados de contenedores de residuos de forma digital. Los directivos tampoco tienen visibilidad sobre cuántos kilogramos de cada tipo de residuo se generan por zona ni a lo largo del tiempo. Los datos que sí existen viven en papel o no se capturan.

El sistema tiene una UI completa diseñada y una API parcialmente implementada, pero ninguna pantalla del frontend está conectada a datos reales — todo funciona con fixtures estáticos. Las pantallas que existen también reflejan un diseño de dominio anterior que ha sido corregido (campo `estado`, flujo de validación, selector de tipo en registro).

---

## Solution

Conectar el frontend con el backend real a través de la API Express existente, completar los módulos de API que faltan, y alinear las pantallas del frontend con el dominio actual:

- El **trabajador** inicia sesión, ve sus notificaciones y registra vaciados seleccionando un contenedor de una lista.
- El **administrador** ve reportes agregados, crea alertas, gestiona usuarios, zonas y tipos de residuo, y configura los turnos.
- El **superadmin** tiene acceso completo para operaciones técnicas.

---

## User Stories

### Autenticación

1. Como trabajador, quiero iniciar sesión con mi correo y contraseña, para acceder a mis funciones dentro del sistema.
2. Como administrador, quiero iniciar sesión con mi correo y contraseña, para acceder a las funciones de gestión.
3. Como usuario autenticado, quiero que mi sesión persista al recargar la página, para no tener que volver a iniciar sesión constantemente.
4. Como usuario autenticado, quiero poder cerrar sesión, para proteger mi cuenta.
5. Como usuario no autenticado, quiero ser redirigido al login al intentar acceder a cualquier ruta del dashboard, para que el sistema esté protegido.
6. Como administrador, quiero poder cambiar mi contraseña desde mi perfil, para mantener mi cuenta segura.

### Registro de vaciado (Trabajador)

7. Como trabajador, quiero ver una lista de contenedores disponibles al registrar un vaciado, para seleccionar el contenedor correcto que acabé de vaciar.
8. Como trabajador, quiero que la lista de contenedores muestre la zona y el tipo de residuo de cada uno, para identificarlos fácilmente.
9. Como trabajador, quiero ingresar la cantidad en kilogramos del residuo retirado, para capturar el dato principal del vaciado.
10. Como trabajador, quiero que la fecha y hora del vaciado se rellene automáticamente con el momento actual, para agilizar el registro.
11. Como trabajador, quiero poder modificar la fecha y hora del vaciado antes de guardar, para corregir registros que olvidé capturar en el momento.
12. Como trabajador, quiero recibir confirmación visual al guardar un registro exitosamente, para saber que el dato quedó guardado.
13. Como trabajador, quiero ver el historial de mis propios registros de vaciado, para revisar lo que he capturado.

### Alertas y notificaciones (Trabajador)

14. Como trabajador, quiero ver una bandeja de notificaciones dentro del sistema, para saber cuándo un contenedor requiere vaciado.
15. Como trabajador, quiero que las alertas solo lleguen cuando estoy en mi turno activo, para no recibir notificaciones fuera de mis horas de trabajo.
16. Como trabajador, quiero ver qué zona y qué tipo de residuo requiere atención en cada alerta, para saber a dónde ir.

### Alertas (Administrador)

17. Como administrador, quiero crear una alerta seleccionando una zona y un tipo de residuo, para notificar al personal de limpieza que un contenedor requiere vaciado.
18. Como administrador, quiero que el texto de la notificación se genere automáticamente a partir de la zona y tipo que seleccioné, para no tener que escribir texto libre.
19. Como administrador, quiero que la alerta llegue únicamente a los trabajadores con turno activo en ese momento, para que el mensaje sea relevante.

### Reportes (Administrador)

20. Como administrador, quiero ver el total de kilogramos recolectados por tipo de residuo en un período, para entender la distribución de residuos.
21. Como administrador, quiero ver el total de kilogramos recolectados por zona en un período, para identificar las áreas con mayor generación de residuos.
22. Como administrador, quiero ver una gráfica de tendencia de vaciados a lo largo del tiempo, para detectar patrones de generación.
23. Como administrador, quiero filtrar los reportes por rango de fechas, para analizar períodos específicos.
24. Como administrador, quiero exportar el reporte actual como PDF, para compartirlo con otros directivos sin acceso al sistema.

### Gestión de usuarios (Administrador)

25. Como administrador, quiero ver la lista de todos los usuarios registrados en el sistema, para tener visibilidad del equipo.
26. Como administrador, quiero crear nuevos usuarios asignándoles nombre, correo, rol y turno(s), para incorporar nuevo personal.
27. Como administrador, quiero activar o desactivar usuarios, para controlar el acceso sin eliminar el historial.
28. Como administrador, quiero asignar uno o ambos turnos a un trabajador, para determinar en qué momentos recibe alertas.

### Gestión de zonas y contenedores (Administrador)

29. Como administrador, quiero crear una zona con nombre y descripción, para registrar un nuevo espacio físico de la escuela.
30. Como administrador, quiero que al crear una zona el sistema cree automáticamente 3 contenedores (Orgánico, Inorgánico, Reciclable), para no tener que crearlos manualmente.
31. Como administrador, quiero agregar contenedores adicionales a una zona con un tipo de residuo personalizado, para registrar contenedores especiales (ej. Electrónico).
32. Como administrador, quiero activar o desactivar zonas y contenedores, para reflejar cambios físicos en la escuela sin perder historial.

### Tipos de residuo (Administrador)

33. Como administrador, quiero ver los tipos de residuo existentes, para saber con cuáles trabaja el sistema.
34. Como administrador, quiero crear nuevos tipos de residuo con un nombre, para ampliar las categorías más allá de los 3 predeterminados.

### Turnos (Administrador)

35. Como administrador, quiero configurar la hora de inicio y fin del turno matutino, para que el sistema sepa cuándo está activo ese turno.
36. Como administrador, quiero configurar la hora de inicio y fin del turno vespertino, para que el sistema sepa cuándo está activo ese turno.

### Perfil y configuración (Usuario)

37. Como usuario autenticado, quiero ver mis datos de perfil (nombre, correo, rol, turno), para verificar la información de mi cuenta.
38. Como usuario autenticado, quiero poder cambiar mi contraseña desde la pantalla de perfil, para mantener mi cuenta segura.

---

## Implementation Decisions

### Arquitectura general

- **Backend:** Express.js existente en `apps/api/`. Cada dominio tiene su propio módulo (router, service, controller).
- **Frontend:** Next.js App Router en `apps/web/`. Las pantallas llaman a la API Express via `fetch` con el JWT almacenado en `localStorage` o cookie httpOnly.
- **Auth en frontend:** Contexto React global (`AuthContext`) que provee el usuario actual, rol y token. Middleware de Next.js protege rutas del dashboard redirigiendo al login si no hay sesión.
- **Auth en backend:** JWT existente. El token incluye `id_usuario`, `rol`. Middleware de rol ya implementado.

### Módulos de API a crear (Express)

Los módulos existentes son `auth` y `users` y `zones`. Faltan:

| Módulo | Rutas principales |
|--------|------------------|
| `contenedores` | GET lista (por zona), POST crear, PATCH, DELETE |
| `tipos-residuo` | GET lista, POST crear |
| `registros` | POST crear, GET lista (filtros: zona, tipo, fecha) |
| `alertas` | POST crear, GET lista (para trabajador autenticado) |
| `turnos` | GET lista, PATCH actualizar horas |
| `reportes` | GET agregaciones (kg por zona, por tipo, por período) |

### Módulo: Active Shift Resolver

Lógica de negocio crítica y reutilizable: dado el tiempo actual, determinar qué turno(s) están activos y qué usuarios pertenecen a ellos.

- Input: hora actual (HH:MM)
- Output: array de `id_usuario` cuyos turnos cubren esa hora
- Usado por: creación de Alertas (para saber a quién notificar)
- Interfaz simple y testeable de forma aislada

```
function getActiveUserIds(currentTime: string): Promise<number[]>
```

### Módulo: Auto-creación de contenedores

Al crear una Zona, el servicio de zonas llama internamente a la creación de 3 contenedores con los tipos predeterminados (`es_predeterminado = true`). Esta lógica vive en el servicio de zonas, no en el controlador.

### Módulo: Generación de texto de alerta

Texto auto-generado: `"Contenedor de residuos {tipo} en {zona} requiere vaciado."`. Lógica en el servicio de alertas, sin entrada de texto libre del admin.

### Schema (Prisma — ya aplicado)

- `TiposResiduo` — tabla dinámica (no enum). Seed: Orgánico, Inorgánico, Reciclable con `es_predeterminado = true`.
- `Turnos` — `nombre` (único), `hora_inicio: String`, `hora_fin: String` en formato `"HH:MM"`.
- `UsuariosTurnos` — join table M:M entre Usuarios y Turnos.
- `RegistrosVaciado` — sin campo `estado`. `fecha` con `@default(now())`, editable por el trabajador.
- `Alertas` — campos: `id_zona`, `id_tipo_residuo`, `id_creador`, `fecha_creacion`. Sin `periodo`, `activo`, `ultima_notificacion`.
- Modelo `Reportes` eliminado.

### Seed de datos iniciales

El seed (`apps/api/src/seed.ts`) debe ampliarse para crear:
- 3 `TiposResiduo` predeterminados: Orgánico, Inorgánico, Reciclable
- 2 `Turnos`: Matutino (07:00–14:00), Vespertino (14:00–21:00) — horas de ejemplo, configurables después

### Pantallas del frontend a corregir o eliminar

| Pantalla | Acción |
|----------|--------|
| `ValidacionScreen` | Eliminar — flujo de validación no existe en el dominio |
| `RegistroScreen` | Quitar selector de tipo de residuo — el tipo viene del contenedor seleccionado |
| `HistorialScreen` | Quitar badges pendiente/validado/rechazado — campo `estado` eliminado |
| `/dashboard/validacion` | Redirigir o eliminar la ruta |

### Exportación PDF

Generada en el frontend con una librería client-side (ej. `html2canvas` + `jsPDF`) que captura el componente de reporte. No se persiste en base de datos.

### Rol y visibilidad en sidebar

- `TRABAJADOR`: ve Inicio, Registro, Historial, Notificaciones, Perfil
- `ADMIN`: ve todo lo anterior + Reportes, Usuarios, Ubicaciones, Configuración
- `SUPERADMIN`: mismo acceso que ADMIN

---

## Testing Decisions

Un buen test verifica comportamiento observable desde fuera del módulo, no detalles de implementación. No se mockea la base de datos en tests de integración (ver ADR-0001 — lección del proyecto).

### Módulos a testear

**Active Shift Resolver** — tests unitarios:
- Hora dentro del rango matutino → retorna trabajadores del matutino
- Hora fuera de ambos rangos → retorna array vacío
- Hora en solapamiento (trabajador en ambos turnos) → retorna el usuario una sola vez
- Turnos con medianoche (si aplica)

**Creación de Registro de Vaciado** — tests de integración contra DB de test:
- Crear registro con fecha explícita guarda la fecha enviada (no `now()`)
- Crear registro sin fecha guarda timestamp cercano a `now()`
- Registro creado es inmutable — un segundo intento de PATCH retorna 405

**Auto-creación de contenedores** — test de integración:
- Crear Zona → base de datos contiene exactamente 3 contenedores para esa zona con tipos predeterminados

**Creación de Alerta** — test de integración:
- Admin crea alerta en hora de turno matutino → alerta registrada, recipientes = trabajadores del matutino
- Admin crea alerta fuera de turnos → alerta registrada, sin error (entrega a nadie)

---

## Out of Scope

- Integración con sensores IoT o dispositivos físicos
- Notificaciones push (email, SMS, push nativo) — solo notificación interna en sistema
- Flujo de aprobación de registros (eliminado en ADR-0001)
- Historial de auditoría por registro
- Recuperación de contraseña por correo
- Soporte multi-escuela o multi-institución
- App móvil nativa
- Gestión de residuos peligrosos con regulación especial
- Almacenamiento de PDFs generados en base de datos

---

## Further Notes

- La ruta `/dashboard/validacion` existe en el frontend y debe ser eliminada o redirigida; dejarla activa es confuso para el admin.
- `hora_inicio` y `hora_fin` en `Turnos` se guardan como `String "HH:MM"`. La comparación para determinar turno activo debe manejar el caso en que el turno vespertino cruce medianoche (actualmente no aplica, pero el resolver debe ser robusto).
- Los fixtures en `apps/web/lib/fixtures.ts` deben retirarse conforme se conecten las pantallas a datos reales; no eliminarlos todos de golpe para no romper pantallas aún no conectadas.
- El campo `activo: Boolean` en `Zonas`, `Contenedores` y `Usuarios` implementa soft-delete; el historial de registros asociado siempre se conserva.
