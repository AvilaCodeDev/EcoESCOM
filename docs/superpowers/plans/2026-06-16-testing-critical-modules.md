# Testing Critical Modules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit and integration tests for the critical modules of both apps — API (auth, jwt, hash, middlewares) and Web (Button, Input, LoginScreen).

**Architecture:** API uses Vitest (already installed) with a setup file to inject env vars. Prisma is mocked via `vi.mock` in integration tests. Web gets a fresh Vitest + jsdom setup with `@testing-library/react`. All tests target existing implementations — no new production code is written.

**Tech Stack:** Vitest, supertest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @vitejs/plugin-react

---

## File Map

### API (new files only)

```
apps/api/
  vitest.config.ts                                     ← Vitest config with setupFiles
  src/__tests__/
    setup.ts                                           ← Injects process.env before modules load
    utils/
      jwt.test.ts
      hash.test.ts
      password-generator.test.ts
    middlewares/
      auth.middleware.test.ts
      role.middleware.test.ts
      validate.middleware.test.ts
    modules/auth/
      auth.integration.test.ts                        ← supertest + vi.mock(prisma)
```

### Web (new files only)

```
apps/web/
  vitest.config.ts                                     ← jsdom env + @vitejs/plugin-react
  __tests__/
    setup.ts                                           ← imports @testing-library/jest-dom
    components/
      ui/
        Button.test.tsx
        Input.test.tsx
      screens/
        LoginScreen.test.tsx
```

---

## Task 1: API — vitest config + env setup

**Files:**
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/__tests__/setup.ts`

- [ ] **Step 1: Create vitest config**

`apps/api/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ["./src/__tests__/setup.ts"],
    },
});
```

- [ ] **Step 2: Create env setup file**

`apps/api/src/__tests__/setup.ts`:
```typescript
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
process.env.JWT_SECRET = "test-secret-key-at-least-32-chars-long";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
process.env.PORT = "4000";
```

- [ ] **Step 3: Verify Vitest runs with no errors**

```bash
cd apps/api && pnpm test:run
```

Expected: "No test files found" (not an env parse error). If `env.ts` throws, the setup.ts values are insufficient — add the missing key to setup.ts.

- [ ] **Step 4: Commit**

```bash
git add apps/api/vitest.config.ts apps/api/src/__tests__/setup.ts
git commit -m "test(api): add vitest config and env setup for tests"
```

---

## Task 2: JWT utils tests

**Files:**
- Create: `apps/api/src/__tests__/utils/jwt.test.ts`

- [ ] **Step 1: Create test file**

`apps/api/src/__tests__/utils/jwt.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signToken, verifyToken } from "../../utils/jwt";

describe("signToken", () => {
    it("returns a non-empty string", () => {
        const token = signToken({ sub: 1, role: "ADMIN" });
        expect(typeof token).toBe("string");
        expect(token.length).toBeGreaterThan(0);
    });

    it("produces a JWT with three dot-separated parts", () => {
        const token = signToken({ sub: 1, role: "ADMIN" });
        expect(token.split(".")).toHaveLength(3);
    });
});

describe("verifyToken", () => {
    it("decodes sub and role from a token signed by signToken", () => {
        const token = signToken({ sub: 42, role: "TRABAJADOR" });
        const payload = verifyToken(token);
        expect(payload.sub).toBe(42);
        expect(payload.role).toBe("TRABAJADOR");
    });

    it("throws on a malformed token string", () => {
        expect(() => verifyToken("not.a.token")).toThrow();
    });

    it("throws on a token signed with a different secret", () => {
        const badToken = jwt.sign({ sub: 1, role: "ADMIN" }, "wrong-secret");
        expect(() => verifyToken(badToken)).toThrow();
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/utils/jwt.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/__tests__/utils/jwt.test.ts
git commit -m "test(api): unit tests for jwt signToken and verifyToken"
```

---

## Task 3: Hash utils tests

**Files:**
- Create: `apps/api/src/__tests__/utils/hash.test.ts`

- [ ] **Step 1: Create test file**

`apps/api/src/__tests__/utils/hash.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../../utils/hash";

describe("hashPassword", () => {
    it("returns a string different from the input", async () => {
        const hash = await hashPassword("my-password");
        expect(typeof hash).toBe("string");
        expect(hash).not.toBe("my-password");
    });

    it("two hashes of the same password are different (bcrypt salts)", async () => {
        const a = await hashPassword("same-password");
        const b = await hashPassword("same-password");
        expect(a).not.toBe(b);
    });
});

describe("comparePassword", () => {
    it("returns true when the password matches its hash", async () => {
        const hash = await hashPassword("correct-password");
        expect(await comparePassword("correct-password", hash)).toBe(true);
    });

    it("returns false when the password does not match the hash", async () => {
        const hash = await hashPassword("correct-password");
        expect(await comparePassword("wrong-password", hash)).toBe(false);
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/utils/hash.test.ts
```

Expected: 4 tests pass. Note: bcrypt is slow — each test may take ~100ms. This is expected.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/__tests__/utils/hash.test.ts
git commit -m "test(api): unit tests for hashPassword and comparePassword"
```

---

## Task 4: Password generator tests

**Files:**
- Create: `apps/api/src/__tests__/utils/password-generator.test.ts`

- [ ] **Step 1: Create test file**

`apps/api/src/__tests__/utils/password-generator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { generatePassword } from "../../utils/password-generator";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

describe("generatePassword", () => {
    it("returns a string of the default length (12)", () => {
        expect(generatePassword()).toHaveLength(12);
    });

    it("returns a string of the requested length", () => {
        expect(generatePassword(20)).toHaveLength(20);
    });

    it("every character belongs to the defined alphabet", () => {
        const pwd = generatePassword(100);
        for (const char of pwd) {
            expect(ALPHABET).toContain(char);
        }
    });

    it("two consecutive calls return different values", () => {
        expect(generatePassword()).not.toBe(generatePassword());
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/utils/password-generator.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/__tests__/utils/password-generator.test.ts
git commit -m "test(api): unit tests for generatePassword"
```

---

## Task 5: Auth middleware tests

**Files:**
- Create: `apps/api/src/__tests__/middlewares/auth.middleware.test.ts`

- [ ] **Step 1: Create test file**

`apps/api/src/__tests__/middlewares/auth.middleware.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { signToken } from "../../utils/jwt";
import { AppError } from "../../utils/app-error";

const mockRes = {} as Response;

function makeReq(authHeader?: string): Request {
    return {
        headers: authHeader ? { authorization: authHeader } : {},
    } as unknown as Request;
}

describe("authenticate middleware", () => {
    it("throws AppError 401 when Authorization header is absent", () => {
        const req = makeReq();
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow("Token de autenticación no proporcionado");
    });

    it("throws AppError 401 when header does not start with 'Bearer '", () => {
        const req = makeReq("Basic dXNlcjpwYXNz");
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
    });

    it("throws AppError 401 when Bearer token is invalid", () => {
        const req = makeReq("Bearer not.a.valid.token");
        expect(() => authenticate(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
    });

    it("populates req.user and calls next() when token is valid", () => {
        const token = signToken({ sub: 7, role: "ADMIN" });
        const req = makeReq(`Bearer ${token}`);
        const next = vi.fn() as NextFunction;
        authenticate(req, mockRes, next);
        expect((req as any).user).toEqual({ id: 7, role: "ADMIN" });
        expect(next).toHaveBeenCalledOnce();
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/middlewares/auth.middleware.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/__tests__/middlewares/auth.middleware.test.ts
git commit -m "test(api): unit tests for authenticate middleware"
```

---

## Task 6: Role middleware tests

**Files:**
- Create: `apps/api/src/__tests__/middlewares/role.middleware.test.ts`

- [ ] **Step 1: Create test file**

`apps/api/src/__tests__/middlewares/role.middleware.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { authorize } from "../../middlewares/role.middleware";
import { AppError } from "../../utils/app-error";

const mockRes = {} as Response;

function makeReq(user?: { id: number; role: string }): Request {
    return { user } as unknown as Request;
}

describe("authorize middleware", () => {
    it("throws AppError 401 when req.user is undefined", () => {
        const handler = authorize("ADMIN");
        const req = makeReq(undefined);
        expect(() => handler(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
        expect(() => handler(req, mockRes, vi.fn() as NextFunction))
            .toThrow("No autenticado");
    });

    it("throws AppError 403 when user role is not in the allowed list", () => {
        const handler = authorize("ADMIN");
        const req = makeReq({ id: 1, role: "TRABAJADOR" });
        expect(() => handler(req, mockRes, vi.fn() as NextFunction))
            .toThrow(AppError);
        expect(() => handler(req, mockRes, vi.fn() as NextFunction))
            .toThrow("No tienes permisos");
    });

    it("calls next() when user role is in the allowed list", () => {
        const handler = authorize("ADMIN", "SUPERADMIN");
        const req = makeReq({ id: 1, role: "SUPERADMIN" });
        const next = vi.fn() as NextFunction;
        handler(req, mockRes, next);
        expect(next).toHaveBeenCalledOnce();
    });

    it("calls next() when the only allowed role matches", () => {
        const handler = authorize("TRABAJADOR");
        const req = makeReq({ id: 2, role: "TRABAJADOR" });
        const next = vi.fn() as NextFunction;
        handler(req, mockRes, next);
        expect(next).toHaveBeenCalledOnce();
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/middlewares/role.middleware.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/__tests__/middlewares/role.middleware.test.ts
git commit -m "test(api): unit tests for authorize middleware"
```

---

## Task 7: Validate middleware tests

**Files:**
- Create: `apps/api/src/__tests__/middlewares/validate.middleware.test.ts`

- [ ] **Step 1: Create test file**

`apps/api/src/__tests__/middlewares/validate.middleware.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.middleware";

const mockRes = {} as Response;

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

describe("validate middleware", () => {
    it("sets req.body to the parsed value and calls next() on valid input", () => {
        const req = { body: { email: "user@example.com", password: "abc" } } as Request;
        const next = vi.fn() as NextFunction;
        validate(schema)(req, mockRes, next);
        expect(req.body).toEqual({ email: "user@example.com", password: "abc" });
        expect(next).toHaveBeenCalledOnce();
    });

    it("strips unknown fields from req.body", () => {
        const req = {
            body: { email: "user@example.com", password: "abc", extra: "ignored" },
        } as Request;
        const next = vi.fn() as NextFunction;
        validate(schema)(req, mockRes, next);
        expect(req.body).not.toHaveProperty("extra");
    });

    it("throws ZodError when body is invalid", () => {
        const req = { body: { email: "not-an-email", password: "" } } as Request;
        expect(() => validate(schema)(req, mockRes, vi.fn() as NextFunction))
            .toThrow(z.ZodError);
    });

    it("throws ZodError when required fields are missing", () => {
        const req = { body: {} } as Request;
        expect(() => validate(schema)(req, mockRes, vi.fn() as NextFunction))
            .toThrow(z.ZodError);
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/middlewares/validate.middleware.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/__tests__/middlewares/validate.middleware.test.ts
git commit -m "test(api): unit tests for validate middleware"
```

---

## Task 8: Auth integration tests (supertest + mocked Prisma)

**Files:**
- Modify: `apps/api/package.json` (add supertest devDependencies)
- Create: `apps/api/src/__tests__/modules/auth/auth.integration.test.ts`

- [ ] **Step 1: Install supertest**

```bash
cd apps/api && pnpm add -D supertest @types/supertest
```

Expected: `package.json` updated, no errors.

- [ ] **Step 2: Create integration test file**

`apps/api/src/__tests__/modules/auth/auth.integration.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app";
import { hashPassword } from "../../../utils/hash";
import { signToken } from "../../../utils/jwt";

vi.mock("../../../config/prisma", () => ({
    prisma: {
        usuarios: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Regular import — vi.mock is hoisted before imports, so this gets the mocked module
import { prisma } from "../../../config/prisma";

let validHash: string;
let validToken: string;

beforeAll(async () => {
    validHash = await hashPassword("correct-password");
    validToken = signToken({ sub: 1, role: "ADMIN" });
});

beforeEach(() => {
    vi.clearAllMocks();
});

const activeUser = () => ({
    id_usuario: 1,
    nombre: "Test User",
    correo: "test@example.com",
    contrasenia: validHash,
    activo: true,
    rol: "ADMIN",
    debe_cambiar_contrasenia: false,
});

describe("POST /api/auth/login", () => {
    it("returns 200 with token and user on valid credentials", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(activeUser());

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "correct-password" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user.email).toBe("test@example.com");
        expect(res.body).toHaveProperty("mustChangePassword", false);
    });

    it("returns 401 when email is not found", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(null);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "any-password" });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Credenciales inválidas");
    });

    it("returns 401 when user is inactive", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ...activeUser(), activo: false });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "correct-password" });

        expect(res.status).toBe(401);
    });

    it("returns 401 when password is wrong", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(activeUser());

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "wrong-password" });

        expect(res.status).toBe(401);
    });

    it("returns 400 when body fails Zod validation", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "not-an-email" });

        expect(res.status).toBe(400);
    });
});

describe("GET /api/auth/profile", () => {
    it("returns 401 when no token is provided", async () => {
        const res = await request(app).get("/api/auth/profile");
        expect(res.status).toBe(401);
    });

    it("returns 200 with profile data when token is valid", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                id_usuario: 1,
                nombre: "Test User",
                correo: "test@example.com",
                activo: true,
                rol: "ADMIN",
                fecha_creacion: new Date(),
                ultima_actualizacion: new Date(),
                turnos: [],
            });

        const res = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe("test@example.com");
        expect(res.body).toHaveProperty("turns");
    });
});

describe("POST /api/auth/change-password", () => {
    it("returns 400 when current password is wrong", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(activeUser());

        const res = await request(app)
            .post("/api/auth/change-password")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ currentPassword: "wrong-password", newPassword: "new-password-123" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("La contraseña actual es incorrecta");
    });

    it("returns 200 when current password is correct", async () => {
        (prisma.usuarios.findUnique as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(activeUser());
        (prisma.usuarios.update as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({});

        const res = await request(app)
            .post("/api/auth/change-password")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ currentPassword: "correct-password", newPassword: "new-password-123" });

        expect(res.status).toBe(200);
    });
});
```

- [ ] **Step 3: Run and verify all pass**

```bash
cd apps/api && pnpm test:run src/__tests__/modules/auth/auth.integration.test.ts
```

Expected: 9 tests pass. Note: the `import { prisma }` statement at the top of the file gets the mocked version because `vi.mock` is hoisted before all imports by Vitest's transformer.

- [ ] **Step 4: Run full API test suite**

```bash
cd apps/api && pnpm test:run
```

Expected: all tests pass (the existing `active-shift.resolver.test.ts` plus all new files).

- [ ] **Step 5: Commit**

```bash
git add apps/api/package.json apps/api/src/__tests__/modules/auth/auth.integration.test.ts
git commit -m "test(api): auth integration tests with supertest and mocked Prisma"
```

---

## Task 9: Web — install test dependencies + vitest config

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/__tests__/setup.ts`

- [ ] **Step 1: Install web test dependencies**

```bash
cd apps/web && pnpm add -D vitest @vitejs/plugin-react vite @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: `package.json` devDependencies updated with all 7 packages.

- [ ] **Step 2: Add test script to web package.json**

In `apps/web/package.json`, add two scripts:
```json
{
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --max-warnings 0",
    "check-types": "next typegen && tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 3: Create vitest config**

`apps/web/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./__tests__/setup.ts"],
    },
});
```

- [ ] **Step 4: Create setup file**

`apps/web/__tests__/setup.ts`:
```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Verify setup runs without errors**

```bash
cd apps/web && pnpm test:run
```

Expected: "No test files found" — no errors about missing modules.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/__tests__/setup.ts
git commit -m "test(web): add vitest + testing-library setup"
```

---

## Task 10: Button component tests

**Files:**
- Create: `apps/web/__tests__/components/ui/Button.test.tsx`

- [ ] **Step 1: Create test file**

`apps/web/__tests__/components/ui/Button.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../../../components/ui/Button";

describe("Button", () => {
    it("renders children text", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("fires onClick handler when clicked", () => {
        const handler = vi.fn();
        render(<Button onClick={handler}>Click me</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handler).toHaveBeenCalledOnce();
    });

    it("does not fire onClick when disabled", () => {
        const handler = vi.fn();
        render(<Button onClick={handler} disabled>Click me</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handler).not.toHaveBeenCalled();
    });

    it("applies opacity 0.4 when disabled", () => {
        render(<Button disabled>Click me</Button>);
        const btn = screen.getByRole("button");
        expect(btn).toHaveStyle({ opacity: "0.4" });
    });

    it("renders with type='submit' when specified", () => {
        render(<Button type="submit">Submit</Button>);
        expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/web && pnpm test:run __tests__/components/ui/Button.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/__tests__/components/ui/Button.test.tsx
git commit -m "test(web): unit tests for Button component"
```

---

## Task 11: Input component tests

**Files:**
- Create: `apps/web/__tests__/components/ui/Input.test.tsx`

- [ ] **Step 1: Create test file**

`apps/web/__tests__/components/ui/Input.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../../../components/ui/Input";

describe("Input", () => {
    it("renders an input element", () => {
        render(<Input />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("fires onChange when user types", () => {
        const handler = vi.fn();
        render(<Input onChange={handler} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
        expect(handler).toHaveBeenCalledOnce();
    });

    it("is disabled when the disabled prop is set", () => {
        render(<Input disabled />);
        expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("renders leftAddon text when provided", () => {
        render(<Input leftAddon="@" />);
        expect(screen.getByText("@")).toBeInTheDocument();
    });

    it("renders rightAddon text when provided", () => {
        render(<Input rightAddon=".mx" />);
        expect(screen.getByText(".mx")).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/web && pnpm test:run __tests__/components/ui/Input.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/__tests__/components/ui/Input.test.tsx
git commit -m "test(web): unit tests for Input component"
```

---

## Task 12: LoginScreen integration tests

**Files:**
- Create: `apps/web/__tests__/components/screens/LoginScreen.test.tsx`

- [ ] **Step 1: Create test file**

`apps/web/__tests__/components/screens/LoginScreen.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "../../../components/screens/LoginScreen";

// vi.hoisted ensures these are defined before vi.mock factories run
const { mockPush, mockLogin, mockApiPost } = vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockLogin: vi.fn(),
    mockApiPost: vi.fn(),
}));

vi.mock("next/image", () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

vi.mock("../../../lib/api", () => ({
    api: { post: mockApiPost },
}));

vi.mock("../../../lib/auth-context", () => ({
    useAuth: () => ({ login: mockLogin }),
}));

beforeEach(() => {
    mockPush.mockReset();
    mockLogin.mockReset();
    mockApiPost.mockReset();
});

describe("LoginScreen", () => {
    it("renders the email input, password input, and submit button", () => {
        render(<LoginScreen />);
        expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
        expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    });

    it("calls api.post, login, and router.push('/dashboard') on successful login", async () => {
        mockApiPost.mockResolvedValueOnce({
            token: "fake-token",
            mustChangePassword: false,
            user: { id: 1, name: "Test", email: "test@example.com", role: "ADMIN" },
        });

        render(<LoginScreen />);
        await userEvent.type(document.querySelector('input[type="email"]')!, "test@example.com");
        await userEvent.type(document.querySelector('input[type="password"]')!, "password123");
        await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects to /dashboard/cambiar-contrasenia when mustChangePassword is true", async () => {
        mockApiPost.mockResolvedValueOnce({
            token: "fake-token",
            mustChangePassword: true,
            user: { id: 1, name: "Test", email: "test@example.com", role: "ADMIN" },
        });

        render(<LoginScreen />);
        await userEvent.type(document.querySelector('input[type="email"]')!, "test@example.com");
        await userEvent.type(document.querySelector('input[type="password"]')!, "password123");
        await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() =>
            expect(mockPush).toHaveBeenCalledWith("/dashboard/cambiar-contrasenia")
        );
    });

    it("shows error message when api.post rejects", async () => {
        mockApiPost.mockRejectedValueOnce(new Error("Credenciales inválidas"));

        render(<LoginScreen />);
        await userEvent.type(document.querySelector('input[type="email"]')!, "test@example.com");
        await userEvent.type(document.querySelector('input[type="password"]')!, "wrong");
        await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() =>
            expect(screen.getByText("Credenciales inválidas")).toBeInTheDocument()
        );
    });

    it("shows 'Entrando…' and disables button while request is pending", async () => {
        mockApiPost.mockReturnValue(new Promise(() => {})); // never resolves

        render(<LoginScreen />);
        await userEvent.type(document.querySelector('input[type="email"]')!, "test@example.com");
        await userEvent.type(document.querySelector('input[type="password"]')!, "password123");
        await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled()
        );
    });
});
```

- [ ] **Step 2: Run and verify all pass**

```bash
cd apps/web && pnpm test:run __tests__/components/screens/LoginScreen.test.tsx
```

Expected: 5 tests pass. If `next/image` import causes issues, verify the mock factory signature matches what `LoginScreen.tsx` uses: `import Image from 'next/image'` → mock exports `{ default: fn }`. ✓

- [ ] **Step 3: Run full web test suite**

```bash
cd apps/web && pnpm test:run
```

Expected: 15 tests pass across Button, Input, LoginScreen.

- [ ] **Step 4: Commit**

```bash
git add apps/web/__tests__/components/screens/LoginScreen.test.tsx
git commit -m "test(web): LoginScreen integration tests with mocked api, router, and auth context"
```

---

## Task 13: Final verification

- [ ] **Step 1: Run all API tests**

```bash
cd apps/api && pnpm test:run
```

Expected: ≥25 tests pass, 0 failures.

- [ ] **Step 2: Run all web tests**

```bash
cd apps/web && pnpm test:run
```

Expected: 15 tests pass, 0 failures.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -p
git commit -m "test: fix any issues from final verification"
```
