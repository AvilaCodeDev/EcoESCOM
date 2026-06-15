# Backend API Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the six missing Express API modules (tipos-residuo, contenedores, turnos, registros, alertas, reportes) plus the Active Shift Resolver, update the zone service to auto-create containers, extend users with shift assignment, run the domain schema migration, and update the seed.

**Architecture:** Each module follows the existing pattern: `module.schema.ts` (Zod) → `module.service.ts` (Prisma) → `module.controller.ts` (RequestHandler) → `module.routes.ts` (Router). The Active Shift Resolver is a pure function in `src/shared/` with no DB dependency, making it unit-testable in isolation. All new routers are registered in `src/routes/index.ts`.

**Tech Stack:** Express 5, Prisma ORM, Zod, TypeScript, Vitest (new — no test runner existed before)

---

## File Map

### Create
- `apps/api/src/shared/active-shift.resolver.ts`
- `apps/api/src/__tests__/active-shift.resolver.test.ts`
- `apps/api/src/modules/tipos-residuo/tipo-residuo.schema.ts`
- `apps/api/src/modules/tipos-residuo/tipo-residuo.service.ts`
- `apps/api/src/modules/tipos-residuo/tipo-residuo.controller.ts`
- `apps/api/src/modules/tipos-residuo/tipo-residuo.routes.ts`
- `apps/api/src/modules/turnos/turno.schema.ts`
- `apps/api/src/modules/turnos/turno.service.ts`
- `apps/api/src/modules/turnos/turno.controller.ts`
- `apps/api/src/modules/turnos/turno.routes.ts`
- `apps/api/src/modules/contenedores/contenedor.schema.ts`
- `apps/api/src/modules/contenedores/contenedor.service.ts`
- `apps/api/src/modules/contenedores/contenedor.controller.ts`
- `apps/api/src/modules/contenedores/contenedor.routes.ts`
- `apps/api/src/modules/registros/registro.schema.ts`
- `apps/api/src/modules/registros/registro.service.ts`
- `apps/api/src/modules/registros/registro.controller.ts`
- `apps/api/src/modules/registros/registro.routes.ts`
- `apps/api/src/modules/alertas/alerta.schema.ts`
- `apps/api/src/modules/alertas/alerta.service.ts`
- `apps/api/src/modules/alertas/alerta.controller.ts`
- `apps/api/src/modules/alertas/alerta.routes.ts`
- `apps/api/src/modules/reportes/reporte.schema.ts`
- `apps/api/src/modules/reportes/reporte.service.ts`
- `apps/api/src/modules/reportes/reporte.controller.ts`
- `apps/api/src/modules/reportes/reporte.routes.ts`

### Modify
- `packages/db/src/index.ts` — remove `TiposResiduos` enum export (it no longer exists as enum after migration)
- `apps/api/src/seed.ts` — add TiposResiduo defaults + Turnos defaults
- `apps/api/src/modules/zones/zone.service.ts` — auto-create 3 containers on `createZone`
- `apps/api/src/modules/users/user.schema.ts` — add optional `turnIds: number[]`
- `apps/api/src/modules/users/user.service.ts` — handle turn assignment on create/update, include turns in list/get
- `apps/api/src/routes/index.ts` — register all new routers
- `apps/api/package.json` — add vitest dev dependency + test scripts

---

## Task 1: Run schema migration

The Prisma schema was already updated (ADR-0001, ADR-0002). This task applies it to the database and fixes the broken enum export.

**Files:**
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Apply migration**

Run from the monorepo root:
```bash
cd C:/Users/ocram/Documents/ESCOM/6to/Ingenieria_de_Software/proyecto/ecoescom
npx prisma migrate dev --schema packages/db/prisma/schema.prisma --name domain_corrections
```

Expected output: `Your database is now in sync with your schema.`

If it warns about data loss (e.g. dropping `TiposResiduos` enum or `reportes` table), type `y` to confirm — this is a development database with no production data.

- [ ] **Step 2: Regenerate Prisma client**

```bash
npx prisma generate --schema packages/db/prisma/schema.prisma
```

Expected: `Generated Prisma Client`

- [ ] **Step 3: Fix broken enum export in packages/db/src/index.ts**

The `TiposResiduos` enum no longer exists after migration. Replace the file content:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL");
}

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
export { Roles } from "../generated/prisma/enums";
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/api && pnpm check-types
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations packages/db/src/index.ts packages/db/generated
git commit -m "feat: apply domain schema migration (drop estado, add turnos, tipos-residuo as table)"
```

---

## Task 2: Setup Vitest

No test runner existed in `apps/api`. This task installs Vitest and creates the first test.

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install Vitest**

```bash
cd apps/api && pnpm add -D vitest
```

- [ ] **Step 2: Add test scripts to apps/api/package.json**

In the `"scripts"` object, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 3: Create __tests__ directory**

```bash
mkdir -p apps/api/src/__tests__
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore: add vitest to api package"
```

---

## Task 3: Active Shift Resolver (TDD)

Pure function — no DB import. Input: array of turnos with their users, plus current time string `"HH:MM"`. Output: deduplicated array of user IDs whose shift covers the current time.

**Files:**
- Create: `apps/api/src/shared/active-shift.resolver.ts`
- Create: `apps/api/src/__tests__/active-shift.resolver.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/__tests__/active-shift.resolver.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveActiveUserIds, type TurnoWithUsers } from "../shared/active-shift.resolver";

const matutino: TurnoWithUsers = {
    hora_inicio: "07:00",
    hora_fin: "14:00",
    usuarios: [{ id_usuario: 1 }, { id_usuario: 2 }]
};

const vespertino: TurnoWithUsers = {
    hora_inicio: "14:00",
    hora_fin: "21:00",
    usuarios: [{ id_usuario: 3 }]
};

const bothShifts: TurnoWithUsers = {
    hora_inicio: "07:00",
    hora_fin: "14:00",
    usuarios: [{ id_usuario: 2 }, { id_usuario: 4 }]
};

describe("resolveActiveUserIds", () => {
    it("returns users from the active morning shift", () => {
        const result = resolveActiveUserIds([matutino, vespertino], "09:00");
        expect(result).toContain(1);
        expect(result).toContain(2);
        expect(result).not.toContain(3);
    });

    it("returns users from the active afternoon shift", () => {
        const result = resolveActiveUserIds([matutino, vespertino], "16:00");
        expect(result).toContain(3);
        expect(result).not.toContain(1);
    });

    it("returns empty array when no shift is active", () => {
        const result = resolveActiveUserIds([matutino, vespertino], "23:00");
        expect(result).toHaveLength(0);
    });

    it("deduplicates users who appear in multiple active turnos", () => {
        const result = resolveActiveUserIds([matutino, bothShifts], "09:00");
        const count2 = result.filter((id) => id === 2).length;
        expect(count2).toBe(1);
    });

    it("returns empty array when turnos list is empty", () => {
        const result = resolveActiveUserIds([], "09:00");
        expect(result).toHaveLength(0);
    });

    it("handles shift boundary — start time is inclusive", () => {
        const result = resolveActiveUserIds([matutino], "07:00");
        expect(result).toContain(1);
    });

    it("handles shift boundary — end time is inclusive", () => {
        const result = resolveActiveUserIds([matutino], "14:00");
        expect(result).toContain(1);
    });

    it("handles cross-midnight shift (e.g. 22:00–06:00)", () => {
        const nocturno: TurnoWithUsers = {
            hora_inicio: "22:00",
            hora_fin: "06:00",
            usuarios: [{ id_usuario: 99 }]
        };
        expect(resolveActiveUserIds([nocturno], "23:30")).toContain(99);
        expect(resolveActiveUserIds([nocturno], "03:00")).toContain(99);
        expect(resolveActiveUserIds([nocturno], "10:00")).not.toContain(99);
    });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
cd apps/api && pnpm test:run
```

Expected: multiple failures with "Cannot find module '../shared/active-shift.resolver'"

- [ ] **Step 3: Create the resolver**

Create `apps/api/src/shared/active-shift.resolver.ts`:

```ts
export type TurnoWithUsers = {
    hora_inicio: string;
    hora_fin: string;
    usuarios: Array<{ id_usuario: number }>;
};

export function resolveActiveUserIds(turnos: TurnoWithUsers[], currentTime: string): number[] {
    const activeIds = new Set<number>();

    for (const turno of turnos) {
        if (isTimeInRange(currentTime, turno.hora_inicio, turno.hora_fin)) {
            for (const u of turno.usuarios) {
                activeIds.add(u.id_usuario);
            }
        }
    }

    return Array.from(activeIds);
}

function isTimeInRange(current: string, start: string, end: string): boolean {
    if (end < start) {
        // crosses midnight: active if current >= start OR current <= end
        return current >= start || current <= end;
    }
    return current >= start && current <= end;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/api && pnpm test:run
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/shared/active-shift.resolver.ts apps/api/src/__tests__/active-shift.resolver.test.ts
git commit -m "feat: add Active Shift Resolver with unit tests"
```

---

## Task 4: Update seed

Add the 3 default waste types and 2 default shifts so the database is usable after a fresh migration.

**Files:**
- Modify: `apps/api/src/seed.ts`

- [ ] **Step 1: Replace seed.ts with updated version**

```ts
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
```

- [ ] **Step 2: Run seed**

```bash
cd apps/api && npx tsx src/seed.ts
```

Expected output:
```
El SUPERADMIN ya existe.
Tipos de residuo predeterminados creados.
Turnos creados.
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/seed.ts
git commit -m "feat: seed default waste types and shifts"
```

---

## Task 5: TiposResiduo module

GET list + POST create. Only ADMIN/SUPERADMIN can create. All authenticated users can list.

**Files:**
- Create: `apps/api/src/modules/tipos-residuo/tipo-residuo.schema.ts`
- Create: `apps/api/src/modules/tipos-residuo/tipo-residuo.service.ts`
- Create: `apps/api/src/modules/tipos-residuo/tipo-residuo.controller.ts`
- Create: `apps/api/src/modules/tipos-residuo/tipo-residuo.routes.ts`

- [ ] **Step 1: Create tipo-residuo.schema.ts**

```ts
import { z } from "zod";

export const createTipoResiduoSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio" })
});

export const tipoResiduoIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type CreateTipoResiduoInput = z.infer<typeof createTipoResiduoSchema>;
```

- [ ] **Step 2: Create tipo-residuo.service.ts**

```ts
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateTipoResiduoInput } from "./tipo-residuo.schema";

const toPublic = (t: { id_tipo: number; nombre: string; es_predeterminado: boolean }) => ({
    id: t.id_tipo,
    nombre: t.nombre,
    esPredeterminado: t.es_predeterminado
});

export const listTiposResiduo = async () => {
    const tipos = await prisma.tiposResiduo.findMany({ orderBy: { id_tipo: "asc" } });
    return tipos.map(toPublic);
};

export const createTipoResiduo = async (input: CreateTipoResiduoInput) => {
    const existing = await prisma.tiposResiduo.findUnique({ where: { nombre: input.nombre } });
    if (existing) {
        throw new AppError("Ya existe un tipo de residuo con ese nombre", 409);
    }
    const tipo = await prisma.tiposResiduo.create({
        data: { nombre: input.nombre, es_predeterminado: false }
    });
    return toPublic(tipo);
};
```

- [ ] **Step 3: Create tipo-residuo.controller.ts**

```ts
import type { RequestHandler } from "express";
import * as tipoService from "./tipo-residuo.service";
import { tipoResiduoIdSchema } from "./tipo-residuo.schema";

export const listTiposResiduo: RequestHandler = async (_req, res) => {
    const tipos = await tipoService.listTiposResiduo();
    res.status(200).json(tipos);
};

export const createTipoResiduo: RequestHandler = async (req, res) => {
    const tipo = await tipoService.createTipoResiduo(req.body);
    res.status(201).json(tipo);
};
```

- [ ] **Step 4: Create tipo-residuo.routes.ts**

```ts
import { Router } from "express";
import * as tipoController from "./tipo-residuo.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createTipoResiduoSchema } from "./tipo-residuo.schema";

export const tipoResiduoRoutes: Router = Router();

tipoResiduoRoutes.use(authenticate);

tipoResiduoRoutes.get("/", tipoController.listTiposResiduo);
tipoResiduoRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createTipoResiduoSchema),
    tipoController.createTipoResiduo
);
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd apps/api && pnpm check-types
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/tipos-residuo
git commit -m "feat: add TiposResiduo module (list + create)"
```

---

## Task 6: Turnos module

GET list (returns turns with hour config) + PATCH to update hours. Only ADMIN/SUPERADMIN can update.

**Files:**
- Create: `apps/api/src/modules/turnos/turno.schema.ts`
- Create: `apps/api/src/modules/turnos/turno.service.ts`
- Create: `apps/api/src/modules/turnos/turno.controller.ts`
- Create: `apps/api/src/modules/turnos/turno.routes.ts`

- [ ] **Step 1: Create turno.schema.ts**

```ts
import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

export const updateTurnoSchema = z.object({
    hora_inicio: z.string().regex(timeRegex, "Formato debe ser HH:MM").optional(),
    hora_fin: z.string().regex(timeRegex, "Formato debe ser HH:MM").optional()
});

export const turnoIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type UpdateTurnoInput = z.infer<typeof updateTurnoSchema>;
```

- [ ] **Step 2: Create turno.service.ts**

```ts
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { UpdateTurnoInput } from "./turno.schema";

const toPublic = (t: { id_turno: number; nombre: string; hora_inicio: string; hora_fin: string }) => ({
    id: t.id_turno,
    nombre: t.nombre,
    horaInicio: t.hora_inicio,
    horaFin: t.hora_fin
});

export const listTurnos = async () => {
    const turnos = await prisma.turnos.findMany({ orderBy: { id_turno: "asc" } });
    return turnos.map(toPublic);
};

export const updateTurno = async (id: number, input: UpdateTurnoInput) => {
    const existing = await prisma.turnos.findUnique({ where: { id_turno: id } });
    if (!existing) {
        throw new AppError("Turno no encontrado", 404);
    }
    const turno = await prisma.turnos.update({
        where: { id_turno: id },
        data: {
            hora_inicio: input.hora_inicio,
            hora_fin: input.hora_fin
        }
    });
    return toPublic(turno);
};
```

- [ ] **Step 3: Create turno.controller.ts**

```ts
import type { RequestHandler } from "express";
import * as turnoService from "./turno.service";
import { turnoIdSchema } from "./turno.schema";

export const listTurnos: RequestHandler = async (_req, res) => {
    const turnos = await turnoService.listTurnos();
    res.status(200).json(turnos);
};

export const updateTurno: RequestHandler = async (req, res) => {
    const { id } = turnoIdSchema.parse(req.params);
    const turno = await turnoService.updateTurno(id, req.body);
    res.status(200).json(turno);
};
```

- [ ] **Step 4: Create turno.routes.ts**

```ts
import { Router } from "express";
import * as turnoController from "./turno.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { updateTurnoSchema } from "./turno.schema";

export const turnoRoutes: Router = Router();

turnoRoutes.use(authenticate);

turnoRoutes.get("/", turnoController.listTurnos);
turnoRoutes.patch(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(updateTurnoSchema),
    turnoController.updateTurno
);
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/turnos
git commit -m "feat: add Turnos module (list + update hours)"
```

---

## Task 7: Extend Users module with shift assignment

Users can be assigned to one or both shifts on create or update. The list/get response includes the user's turns.

**Files:**
- Modify: `apps/api/src/modules/users/user.schema.ts`
- Modify: `apps/api/src/modules/users/user.service.ts`

- [ ] **Step 1: Update user.schema.ts**

Replace the file content:

```ts
import { z } from "zod";
import { Roles } from "../../config/prisma";

export const createUserSchema = z.object({
    name: z.string().min(1, { message: "El nombre es obligatorio" }),
    email: z.string().email({ message: "El correo no es válido" }),
    role: z.nativeEnum(Roles, { message: "El rol no es válido" }),
    turnIds: z.array(z.number().int().positive()).optional()
});

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(Roles).optional(),
    active: z.boolean().optional(),
    turnIds: z.array(z.number().int().positive()).optional()
});

export const userIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

- [ ] **Step 2: Update user.service.ts**

Replace the file content:

```ts
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../utils/hash";
import { generatePassword } from "../../utils/password-generator";
import { sendMail } from "../../config/mailer";
import { AppError } from "../../utils/app-error";
import type { CreateUserInput, UpdateUserInput } from "./user.schema";

const userWithTurns = {
    id_usuario: true,
    nombre: true,
    correo: true,
    activo: true,
    rol: true,
    fecha_creacion: true,
    ultima_actualizacion: true,
    turnos: {
        select: {
            turno: {
                select: { id_turno: true, nombre: true }
            }
        }
    }
} as const;

const toPublicUser = (user: {
    id_usuario: number;
    nombre: string;
    correo: string;
    activo: boolean;
    rol: string;
    fecha_creacion: Date;
    ultima_actualizacion: Date;
    turnos: Array<{ turno: { id_turno: number; nombre: string } }>;
}) => ({
    id: user.id_usuario,
    name: user.nombre,
    email: user.correo,
    active: user.activo,
    role: user.rol,
    createdAt: user.fecha_creacion,
    updatedAt: user.ultima_actualizacion,
    turns: user.turnos.map((t) => ({ id: t.turno.id_turno, nombre: t.turno.nombre }))
});

export const listUsers = async () => {
    const users = await prisma.usuarios.findMany({ select: userWithTurns });
    return users.map(toPublicUser);
};

export const getUser = async (id: number) => {
    const user = await prisma.usuarios.findUnique({
        where: { id_usuario: id },
        select: userWithTurns
    });
    if (!user) throw new AppError("Usuario no encontrado", 404);
    return toPublicUser(user);
};

export const createUser = async (input: CreateUserInput) => {
    const existing = await prisma.usuarios.findUnique({ where: { correo: input.email } });
    if (existing) throw new AppError("El correo ya está registrado", 409);

    const generatedPassword = generatePassword();
    const hashed = await hashPassword(generatedPassword);

    const user = await prisma.usuarios.create({
        data: {
            nombre: input.name,
            correo: input.email,
            contrasenia: hashed,
            activo: true,
            rol: input.role,
            turnos: input.turnIds
                ? { create: input.turnIds.map((id_turno) => ({ id_turno })) }
                : undefined
        },
        select: userWithTurns
    });

    await sendMail({
        to: input.email,
        subject: "Tus credenciales de acceso a EcoESCOM",
        text: `Hola ${input.name}, se creó tu cuenta. Usuario: ${input.email}. Contraseña temporal: ${generatedPassword}. Por seguridad, cámbiala al iniciar sesión.`
    });

    return toPublicUser(user);
};

export const updateUser = async (id: number, input: UpdateUserInput) => {
    await getUser(id);

    if (input.email) {
        const existing = await prisma.usuarios.findUnique({ where: { correo: input.email } });
        if (existing && existing.id_usuario !== id) {
            throw new AppError("El correo ya está registrado", 409);
        }
    }

    if (input.turnIds !== undefined) {
        await prisma.usuariosTurnos.deleteMany({ where: { id_usuario: id } });
        if (input.turnIds.length > 0) {
            await prisma.usuariosTurnos.createMany({
                data: input.turnIds.map((id_turno) => ({ id_usuario: id, id_turno }))
            });
        }
    }

    const user = await prisma.usuarios.update({
        where: { id_usuario: id },
        data: {
            nombre: input.name,
            correo: input.email,
            rol: input.role,
            activo: input.active
        },
        select: userWithTurns
    });

    return toPublicUser(user);
};

export const deleteUser = async (id: number) => {
    await getUser(id);
    await prisma.usuarios.delete({ where: { id_usuario: id } });
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/api && pnpm check-types
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/users/user.schema.ts apps/api/src/modules/users/user.service.ts
git commit -m "feat: extend users with shift assignment (turnIds)"
```

---

## Task 8: Update Zones service — auto-create containers

When a zone is created, the service queries the 3 default `TiposResiduo` and creates one `Contenedores` record for each.

**Files:**
- Modify: `apps/api/src/modules/zones/zone.service.ts`

- [ ] **Step 1: Update createZone in zone.service.ts**

Replace only the `createZone` function (keep the rest of the file unchanged):

```ts
export const createZone = async (input: CreateZoneInput) => {
    const tiposPredeterminados = await prisma.tiposResiduo.findMany({
        where: { es_predeterminado: true }
    });

    const zone = await prisma.zonas.create({
        data: {
            nombre_zona: input.name,
            descripcion: input.description,
            activo: input.active ?? true,
            contenedores: {
                create: tiposPredeterminados.map((tipo, i) => ({
                    nombre_contenedor: `Contenedor ${tipo.nombre}`,
                    codigo: `Z-AUTO-${Date.now()}-${i}`,
                    activo: true,
                    id_tipo_residuo: tipo.id_tipo
                }))
            }
        }
    });

    return toPublicZone(zone);
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/api && pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/zones/zone.service.ts
git commit -m "feat: auto-create 3 default containers when creating a zone"
```

---

## Task 9: Contenedores module

GET list by zone, POST add custom container, PATCH toggle active, DELETE.

**Files:**
- Create: `apps/api/src/modules/contenedores/contenedor.schema.ts`
- Create: `apps/api/src/modules/contenedores/contenedor.service.ts`
- Create: `apps/api/src/modules/contenedores/contenedor.controller.ts`
- Create: `apps/api/src/modules/contenedores/contenedor.routes.ts`

- [ ] **Step 1: Create contenedor.schema.ts**

```ts
import { z } from "zod";

export const createContenedorSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
    codigo: z.string().min(1, { message: "El código es obligatorio" }),
    idZona: z.number().int().positive(),
    idTipoResiduo: z.number().int().positive()
});

export const updateContenedorSchema = z.object({
    nombre: z.string().min(1).optional(),
    activo: z.boolean().optional()
});

export const contenedorIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export const zoneFilterSchema = z.object({
    zonaId: z.coerce.number().int().positive().optional()
});

export type CreateContenedorInput = z.infer<typeof createContenedorSchema>;
export type UpdateContenedorInput = z.infer<typeof updateContenedorSchema>;
```

- [ ] **Step 2: Create contenedor.service.ts**

```ts
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateContenedorInput, UpdateContenedorInput } from "./contenedor.schema";

const toPublic = (c: {
    id_contenedor: number;
    nombre_contenedor: string;
    codigo: string;
    activo: boolean;
    id_zona: number;
    tipo_residuo: { id_tipo: number; nombre: string };
}) => ({
    id: c.id_contenedor,
    nombre: c.nombre_contenedor,
    codigo: c.codigo,
    activo: c.activo,
    idZona: c.id_zona,
    tipoResiduo: { id: c.tipo_residuo.id_tipo, nombre: c.tipo_residuo.nombre }
});

const includeRelations = { tipo_residuo: true } as const;

export const listContenedores = async (zonaId?: number) => {
    const contenedores = await prisma.contenedores.findMany({
        where: zonaId ? { id_zona: zonaId } : undefined,
        include: includeRelations,
        orderBy: { id_contenedor: "asc" }
    });
    return contenedores.map(toPublic);
};

export const getContenedor = async (id: number) => {
    const c = await prisma.contenedores.findUnique({
        where: { id_contenedor: id },
        include: includeRelations
    });
    if (!c) throw new AppError("Contenedor no encontrado", 404);
    return toPublic(c);
};

export const createContenedor = async (input: CreateContenedorInput) => {
    const existing = await prisma.contenedores.findUnique({ where: { codigo: input.codigo } });
    if (existing) throw new AppError("Ya existe un contenedor con ese código", 409);

    const c = await prisma.contenedores.create({
        data: {
            nombre_contenedor: input.nombre,
            codigo: input.codigo,
            activo: true,
            id_zona: input.idZona,
            id_tipo_residuo: input.idTipoResiduo
        },
        include: includeRelations
    });
    return toPublic(c);
};

export const updateContenedor = async (id: number, input: UpdateContenedorInput) => {
    await getContenedor(id);
    const c = await prisma.contenedores.update({
        where: { id_contenedor: id },
        data: {
            nombre_contenedor: input.nombre,
            activo: input.activo
        },
        include: includeRelations
    });
    return toPublic(c);
};

export const deleteContenedor = async (id: number) => {
    await getContenedor(id);
    await prisma.contenedores.delete({ where: { id_contenedor: id } });
};
```

- [ ] **Step 3: Create contenedor.controller.ts**

```ts
import type { RequestHandler } from "express";
import * as contenedorService from "./contenedor.service";
import { contenedorIdSchema, zoneFilterSchema } from "./contenedor.schema";

export const listContenedores: RequestHandler = async (req, res) => {
    const { zonaId } = zoneFilterSchema.parse(req.query);
    const contenedores = await contenedorService.listContenedores(zonaId);
    res.status(200).json(contenedores);
};

export const getContenedor: RequestHandler = async (req, res) => {
    const { id } = contenedorIdSchema.parse(req.params);
    const contenedor = await contenedorService.getContenedor(id);
    res.status(200).json(contenedor);
};

export const createContenedor: RequestHandler = async (req, res) => {
    const contenedor = await contenedorService.createContenedor(req.body);
    res.status(201).json(contenedor);
};

export const updateContenedor: RequestHandler = async (req, res) => {
    const { id } = contenedorIdSchema.parse(req.params);
    const contenedor = await contenedorService.updateContenedor(id, req.body);
    res.status(200).json(contenedor);
};

export const deleteContenedor: RequestHandler = async (req, res) => {
    const { id } = contenedorIdSchema.parse(req.params);
    await contenedorService.deleteContenedor(id);
    res.status(200).json({ message: "Contenedor eliminado" });
};
```

- [ ] **Step 4: Create contenedor.routes.ts**

```ts
import { Router } from "express";
import * as contenedorController from "./contenedor.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createContenedorSchema, updateContenedorSchema } from "./contenedor.schema";

export const contenedorRoutes: Router = Router();

contenedorRoutes.use(authenticate);

contenedorRoutes.get("/", contenedorController.listContenedores);
contenedorRoutes.get("/:id", contenedorController.getContenedor);
contenedorRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createContenedorSchema),
    contenedorController.createContenedor
);
contenedorRoutes.patch(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(updateContenedorSchema),
    contenedorController.updateContenedor
);
contenedorRoutes.delete(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    contenedorController.deleteContenedor
);
```

- [ ] **Step 5: Verify TypeScript + commit**

```bash
cd apps/api && pnpm check-types
git add apps/api/src/modules/contenedores
git commit -m "feat: add Contenedores module"
```

---

## Task 10: RegistrosVaciado module

POST create (TRABAJADOR only, with optional fecha override) + GET list (self for TRABAJADOR, all with filters for ADMIN/SUPERADMIN).

**Files:**
- Create: `apps/api/src/modules/registros/registro.schema.ts`
- Create: `apps/api/src/modules/registros/registro.service.ts`
- Create: `apps/api/src/modules/registros/registro.controller.ts`
- Create: `apps/api/src/modules/registros/registro.routes.ts`

- [ ] **Step 1: Create registro.schema.ts**

```ts
import { z } from "zod";

export const createRegistroSchema = z.object({
    idContenedor: z.number().int().positive(),
    cantidad: z.number().positive({ message: "La cantidad debe ser positiva" }),
    fecha: z.coerce.date().optional()
});

export const registroIdSchema = z.object({
    id: z.coerce.number().int().positive()
});

export const registroFilterSchema = z.object({
    zonaId: z.coerce.number().int().positive().optional(),
    tipoId: z.coerce.number().int().positive().optional(),
    desde: z.coerce.date().optional(),
    hasta: z.coerce.date().optional()
});

export type CreateRegistroInput = z.infer<typeof createRegistroSchema>;
export type RegistroFilterInput = z.infer<typeof registroFilterSchema>;
```

- [ ] **Step 2: Create registro.service.ts**

```ts
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateRegistroInput, RegistroFilterInput } from "./registro.schema";

const includeRelations = {
    contenedor: {
        include: {
            tipo_residuo: { select: { id_tipo: true, nombre: true } },
            zona: { select: { id_zona: true, nombre_zona: true } }
        }
    },
    operador: { select: { id_usuario: true, nombre: true } }
} as const;

const toPublic = (r: {
    id_registro: number;
    cantidad: { toNumber: () => number };
    fecha: Date;
    contenedor: {
        id_contenedor: number;
        nombre_contenedor: string;
        tipo_residuo: { id_tipo: number; nombre: string };
        zona: { id_zona: number; nombre_zona: string };
    };
    operador: { id_usuario: number; nombre: string };
}) => ({
    id: r.id_registro,
    cantidad: r.cantidad.toNumber(),
    fecha: r.fecha,
    contenedor: {
        id: r.contenedor.id_contenedor,
        nombre: r.contenedor.nombre_contenedor,
        tipoResiduo: r.contenedor.tipo_residuo,
        zona: { id: r.contenedor.zona.id_zona, nombre: r.contenedor.zona.nombre_zona }
    },
    operador: { id: r.operador.id_usuario, nombre: r.operador.nombre }
});

export const listRegistros = async (
    requesterId: number,
    requesterRole: string,
    filters: RegistroFilterInput
) => {
    const where: Record<string, unknown> = {};

    if (requesterRole === "TRABAJADOR") {
        where.id_operador = requesterId;
    }

    if (filters.zonaId) {
        where.contenedor = { id_zona: filters.zonaId };
    }
    if (filters.tipoId) {
        where.contenedor = { ...((where.contenedor as object) ?? {}), id_tipo_residuo: filters.tipoId };
    }
    if (filters.desde || filters.hasta) {
        where.fecha = {
            ...(filters.desde ? { gte: filters.desde } : {}),
            ...(filters.hasta ? { lte: filters.hasta } : {})
        };
    }

    const registros = await prisma.registrosVaciado.findMany({
        where,
        include: includeRelations,
        orderBy: { fecha: "desc" }
    });

    return registros.map(toPublic);
};

export const createRegistro = async (operadorId: number, input: CreateRegistroInput) => {
    const contenedor = await prisma.contenedores.findUnique({
        where: { id_contenedor: input.idContenedor }
    });
    if (!contenedor) throw new AppError("Contenedor no encontrado", 404);
    if (!contenedor.activo) throw new AppError("El contenedor está inactivo", 400);

    const registro = await prisma.registrosVaciado.create({
        data: {
            id_contenedor: input.idContenedor,
            id_operador: operadorId,
            cantidad: input.cantidad,
            fecha: input.fecha ?? new Date()
        },
        include: includeRelations
    });

    return toPublic(registro);
};
```

- [ ] **Step 3: Create registro.controller.ts**

```ts
import type { RequestHandler } from "express";
import * as registroService from "./registro.service";
import { registroIdSchema, registroFilterSchema } from "./registro.schema";

export const listRegistros: RequestHandler = async (req, res) => {
    const filters = registroFilterSchema.parse(req.query);
    const registros = await registroService.listRegistros(
        req.user!.id,
        req.user!.role,
        filters
    );
    res.status(200).json(registros);
};

export const createRegistro: RequestHandler = async (req, res) => {
    const registro = await registroService.createRegistro(req.user!.id, req.body);
    res.status(201).json(registro);
};
```

- [ ] **Step 4: Create registro.routes.ts**

```ts
import { Router } from "express";
import * as registroController from "./registro.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createRegistroSchema } from "./registro.schema";

export const registroRoutes: Router = Router();

registroRoutes.use(authenticate);

registroRoutes.get("/", registroController.listRegistros);
registroRoutes.post(
    "/",
    authorize(Roles.TRABAJADOR),
    validate(createRegistroSchema),
    registroController.createRegistro
);
```

- [ ] **Step 5: Verify TypeScript + commit**

```bash
cd apps/api && pnpm check-types
git add apps/api/src/modules/registros
git commit -m "feat: add RegistrosVaciado module (create + list with filters)"
```

---

## Task 11: Alertas module

POST create (ADMIN only, uses Active Shift Resolver to identify recipients) + GET list for current user.

**Files:**
- Create: `apps/api/src/modules/alertas/alerta.schema.ts`
- Create: `apps/api/src/modules/alertas/alerta.service.ts`
- Create: `apps/api/src/modules/alertas/alerta.controller.ts`
- Create: `apps/api/src/modules/alertas/alerta.routes.ts`

- [ ] **Step 1: Create alerta.schema.ts**

```ts
import { z } from "zod";

export const createAlertaSchema = z.object({
    idZona: z.number().int().positive(),
    idTipoResiduo: z.number().int().positive()
});

export type CreateAlertaInput = z.infer<typeof createAlertaSchema>;
```

- [ ] **Step 2: Create alerta.service.ts**

```ts
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { resolveActiveUserIds } from "../../shared/active-shift.resolver";
import type { CreateAlertaInput } from "./alerta.schema";

const includeRelations = {
    zona: { select: { id_zona: true, nombre_zona: true } },
    tipo_residuo: { select: { id_tipo: true, nombre: true } },
    creador: { select: { id_usuario: true, nombre: true } }
} as const;

const toPublic = (a: {
    id_alerta: number;
    fecha_creacion: Date;
    zona: { id_zona: number; nombre_zona: string };
    tipo_residuo: { id_tipo: number; nombre: string };
    creador: { id_usuario: number; nombre: string };
}) => ({
    id: a.id_alerta,
    fechaCreacion: a.fecha_creacion,
    zona: { id: a.zona.id_zona, nombre: a.zona.nombre_zona },
    tipoResiduo: { id: a.tipo_residuo.id_tipo, nombre: a.tipo_residuo.nombre },
    creador: { id: a.creador.id_usuario, nombre: a.creador.nombre },
    mensaje: `Contenedor de residuos ${a.tipo_residuo.nombre} en ${a.zona.nombre_zona} requiere vaciado.`
});

export const listAlertas = async (userId: number, role: string) => {
    const alertas = await prisma.alertas.findMany({
        include: includeRelations,
        orderBy: { fecha_creacion: "desc" }
    });
    return alertas.map(toPublic);
};

export const createAlerta = async (creadorId: number, input: CreateAlertaInput) => {
    const zona = await prisma.zonas.findUnique({ where: { id_zona: input.idZona } });
    if (!zona) throw new AppError("Zona no encontrada", 404);

    const tipo = await prisma.tiposResiduo.findUnique({ where: { id_tipo: input.idTipoResiduo } });
    if (!tipo) throw new AppError("Tipo de residuo no encontrado", 404);

    const alerta = await prisma.alertas.create({
        data: {
            id_zona: input.idZona,
            id_tipo_residuo: input.idTipoResiduo,
            id_creador: creadorId
        },
        include: includeRelations
    });

    // Determine who receives the alert (workers on active shift)
    const turnos = await prisma.turnos.findMany({
        include: { usuarios: { select: { id_usuario: true } } }
    });
    const currentTime = new Date().toTimeString().slice(0, 5);
    const recipientIds = resolveActiveUserIds(turnos, currentTime);

    // recipientIds is available for real-time delivery (WebSocket / push notification)
    // Currently logged for observability; delivery layer is out of scope for this plan.
    console.log(`Alerta ${alerta.id_alerta} — destinatarios activos: [${recipientIds.join(", ")}]`);

    return toPublic(alerta);
};
```

- [ ] **Step 3: Create alerta.controller.ts**

```ts
import type { RequestHandler } from "express";
import * as alertaService from "./alerta.service";

export const listAlertas: RequestHandler = async (req, res) => {
    const alertas = await alertaService.listAlertas(req.user!.id, req.user!.role);
    res.status(200).json(alertas);
};

export const createAlerta: RequestHandler = async (req, res) => {
    const alerta = await alertaService.createAlerta(req.user!.id, req.body);
    res.status(201).json(alerta);
};
```

- [ ] **Step 4: Create alerta.routes.ts**

```ts
import { Router } from "express";
import * as alertaController from "./alerta.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createAlertaSchema } from "./alerta.schema";

export const alertaRoutes: Router = Router();

alertaRoutes.use(authenticate);

alertaRoutes.get("/", alertaController.listAlertas);
alertaRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createAlertaSchema),
    alertaController.createAlerta
);
```

- [ ] **Step 5: Verify TypeScript + commit**

```bash
cd apps/api && pnpm check-types
git add apps/api/src/modules/alertas apps/api/src/shared
git commit -m "feat: add Alertas module with Active Shift Resolver integration"
```

---

## Task 12: Reportes aggregation

GET endpoint that returns kg totals grouped by tipo, by zona, and a time series. Accepts `desde` and `hasta` query params.

**Files:**
- Create: `apps/api/src/modules/reportes/reporte.schema.ts`
- Create: `apps/api/src/modules/reportes/reporte.service.ts`
- Create: `apps/api/src/modules/reportes/reporte.controller.ts`
- Create: `apps/api/src/modules/reportes/reporte.routes.ts`

- [ ] **Step 1: Create reporte.schema.ts**

```ts
import { z } from "zod";

export const reporteFilterSchema = z.object({
    desde: z.coerce.date().optional(),
    hasta: z.coerce.date().optional()
});

export type ReporteFilterInput = z.infer<typeof reporteFilterSchema>;
```

- [ ] **Step 2: Create reporte.service.ts**

```ts
import { prisma } from "../../config/prisma";
import type { ReporteFilterInput } from "./reporte.schema";

export const getReporte = async (filters: ReporteFilterInput) => {
    const dateFilter = {
        ...(filters.desde ? { gte: filters.desde } : {}),
        ...(filters.hasta ? { lte: filters.hasta } : {})
    };
    const where = Object.keys(dateFilter).length > 0 ? { fecha: dateFilter } : {};

    // All records in range with their container's tipo and zona
    const registros = await prisma.registrosVaciado.findMany({
        where,
        include: {
            contenedor: {
                include: {
                    tipo_residuo: { select: { nombre: true } },
                    zona: { select: { nombre_zona: true } }
                }
            }
        },
        orderBy: { fecha: "asc" }
    });

    // Total kg
    const totalKg = registros.reduce((sum, r) => sum + r.cantidad.toNumber(), 0);

    // By tipo
    const byTipoMap = new Map<string, number>();
    for (const r of registros) {
        const nombre = r.contenedor.tipo_residuo.nombre;
        byTipoMap.set(nombre, (byTipoMap.get(nombre) ?? 0) + r.cantidad.toNumber());
    }
    const byTipo = Array.from(byTipoMap.entries()).map(([nombre, totalKg]) => ({ nombre, totalKg }));

    // By zona
    const byZonaMap = new Map<string, number>();
    for (const r of registros) {
        const nombre = r.contenedor.zona.nombre_zona;
        byZonaMap.set(nombre, (byZonaMap.get(nombre) ?? 0) + r.cantidad.toNumber());
    }
    const byZona = Array.from(byZonaMap.entries()).map(([nombre, totalKg]) => ({ nombre, totalKg }));

    // Daily time series
    const serieMap = new Map<string, number>();
    for (const r of registros) {
        const day = r.fecha.toISOString().slice(0, 10); // "YYYY-MM-DD"
        serieMap.set(day, (serieMap.get(day) ?? 0) + r.cantidad.toNumber());
    }
    const serie = Array.from(serieMap.entries()).map(([fecha, totalKg]) => ({ fecha, totalKg }));

    return { totalKg, byTipo, byZona, serie };
};
```

- [ ] **Step 3: Create reporte.controller.ts**

```ts
import type { RequestHandler } from "express";
import * as reporteService from "./reporte.service";
import { reporteFilterSchema } from "./reporte.schema";

export const getReporte: RequestHandler = async (req, res) => {
    const filters = reporteFilterSchema.parse(req.query);
    const reporte = await reporteService.getReporte(filters);
    res.status(200).json(reporte);
};
```

- [ ] **Step 4: Create reporte.routes.ts**

```ts
import { Router } from "express";
import * as reporteController from "./reporte.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";

export const reporteRoutes: Router = Router();

reporteRoutes.use(authenticate, authorize(Roles.ADMIN, Roles.SUPERADMIN));

reporteRoutes.get("/", reporteController.getReporte);
```

- [ ] **Step 5: Verify TypeScript + commit**

```bash
cd apps/api && pnpm check-types
git add apps/api/src/modules/reportes
git commit -m "feat: add Reportes aggregation endpoint"
```

---

## Task 13: Wire all routes

Register every new router in the central routes index.

**Files:**
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Update routes/index.ts**

Replace the file content:

```ts
import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/users/user.routes";
import { zoneRoutes } from "../modules/zones/zone.routes";
import { tipoResiduoRoutes } from "../modules/tipos-residuo/tipo-residuo.routes";
import { turnoRoutes } from "../modules/turnos/turno.routes";
import { contenedorRoutes } from "../modules/contenedores/contenedor.routes";
import { registroRoutes } from "../modules/registros/registro.routes";
import { alertaRoutes } from "../modules/alertas/alerta.routes";
import { reporteRoutes } from "../modules/reportes/reporte.routes";

export const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/zones", zoneRoutes);
router.use("/tipos-residuo", tipoResiduoRoutes);
router.use("/turnos", turnoRoutes);
router.use("/contenedores", contenedorRoutes);
router.use("/registros", registroRoutes);
router.use("/alertas", alertaRoutes);
router.use("/reportes", reporteRoutes);
```

- [ ] **Step 2: Final TypeScript check**

```bash
cd apps/api && pnpm check-types
```

Expected: no errors.

- [ ] **Step 3: Smoke test — start the server and hit /health**

```bash
cd apps/api && pnpm dev
```

In another terminal:
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","message":"Servidor en funcionamiento"}`

- [ ] **Step 4: Final commit**

```bash
git add apps/api/src/routes/index.ts
git commit -m "feat: register all new API modules in routes index"
```

---

## Self-Review

### Spec coverage check

| PRD requirement | Covered in task |
|---|---|
| TiposResiduo as dynamic entity (ADR-0002) | Tasks 1, 4, 5 |
| Turnos Matutino/Vespertino, configurable hours | Tasks 4, 6 |
| Worker-shift M:M assignment | Task 7 |
| Zone creation auto-creates 3 containers | Task 8 |
| Container list with zona + tipo for picker | Task 9 |
| RegistroVaciado: create with optional fecha | Task 10 |
| RegistroVaciado: list filtered by zona/tipo/fecha | Task 10 |
| TRABAJADOR sees only own records | Task 10 (listRegistros role check) |
| Alertas: admin creates, text auto-generated | Task 11 |
| Active Shift Resolver: determine recipients | Tasks 3, 11 |
| Reportes: totalKg by tipo, by zona, time series | Task 12 |
| Reportes: filter by date range | Task 12 |
| Migration: drop estado, add Turnos, TiposResiduo | Task 1 |
| Seed: default tipos + turnos | Task 4 |
| Unit tests for Active Shift Resolver | Task 3 |

### Not covered in this plan (separate plans)
- Frontend-API connection (Plan 3)
- Frontend corrections: remove ValidacionScreen, fix RegistroScreen, fix HistorialScreen (Plan 2)
- Real-time alert delivery (WebSocket) — out of scope per PRD
- PDF export — frontend concern (Plan 3)
