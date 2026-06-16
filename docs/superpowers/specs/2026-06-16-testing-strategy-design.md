# Testing Strategy — EcoESCOM

**Date:** 2026-06-16  
**Scope:** Critical modules — API (unit + integration) and Web (component unit tests)  
**Test runner:** Vitest (both apps)

---

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Test runner | Vitest (both apps) | Already installed in API; consistent stack |
| Prisma in integration tests | `vi.mock` | No test DB required; faster CI |
| Web environment | jsdom | Sufficient for component logic; no layout/CSS assertions |
| Priority scope | Critical modules only | auth, jwt, hash, middlewares, Button, Input, LoginScreen |

---

## 1. API — Unit Tests

### Setup

- **`apps/api/vitest.config.ts`** — registers `setupFiles`, sets `globals: true`, excludes `node_modules`
- **`apps/api/src/__tests__/setup.ts`** — sets minimal `process.env` before any import (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=test`) so `env.ts` parses without error

### Test files

#### `src/__tests__/utils/jwt.test.ts`
Target: `src/utils/jwt.ts`

- `signToken` returns a non-empty string
- `verifyToken` decodes a token signed by `signToken` and returns correct `sub` and `role`
- `verifyToken` throws on a malformed token string
- `verifyToken` throws on a token signed with a different secret

#### `src/__tests__/utils/hash.test.ts`
Target: `src/utils/hash.ts`

- `hashPassword` returns a string different from the input
- `comparePassword` returns `true` when password matches its hash
- `comparePassword` returns `false` when password does not match

#### `src/__tests__/utils/password-generator.test.ts`
Target: `src/utils/password-generator.ts`

- Returns string of requested length (default 12)
- Every character belongs to the defined alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789`)
- Two consecutive calls return different values (probabilistic)

#### `src/__tests__/middlewares/auth.middleware.test.ts`
Target: `src/middlewares/auth.middleware.ts`

Mocks: none (uses `signToken` directly to produce valid tokens; mock `req`/`res`/`next` objects inline)

- No `Authorization` header → throws `AppError` 401
- Header present but does not start with `Bearer ` → throws `AppError` 401
- Header is `Bearer <invalid>` → throws `AppError` 401
- Header is `Bearer <valid token>` → populates `req.user` with `{ id, role }` and calls `next()`

#### `src/__tests__/middlewares/role.middleware.test.ts`
Target: `src/middlewares/role.middleware.ts`

- `req.user` is undefined → throws `AppError` 401
- `req.user.role` not in allowed roles → throws `AppError` 403
- `req.user.role` is in allowed roles → calls `next()`

#### `src/__tests__/middlewares/validate.middleware.test.ts`
Target: `src/middlewares/validate.middleware.ts`

- Valid body matching schema → `req.body` is set to parsed value, `next()` called
- Invalid body → `ZodError` thrown (caught by error middleware in production)

---

## 2. API — Integration Tests

### Setup

- Add `supertest` and `@types/supertest` as devDependencies in `apps/api`
- Same `vitest.config.ts` and setup file as unit tests
- Prisma mocked at module level with `vi.mock`

### Mock structure

```typescript
vi.mock("../../../config/prisma", () => ({
  prisma: {
    usuarios: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));
```

Each test calls `mockResolvedValueOnce` / `mockRejectedValueOnce` to control DB response.

### Test file: `src/__tests__/modules/auth/auth.integration.test.ts`

Imports: `supertest` agent wrapping `app` from `src/app.ts`

#### `POST /api/auth/login`

| Scenario | Mock returns | Expected |
|----------|-------------|----------|
| Valid credentials, active user | user record + matching hash | 200 + `{ token, user, mustChangePassword }` |
| Email not found | `null` | 401 `"Credenciales inválidas"` |
| User inactive (`activo: false`) | user with `activo: false` | 401 `"Credenciales inválidas"` |
| Wrong password | user with non-matching hash | 401 `"Credenciales inválidas"` |
| Missing body fields | — | 400 (Zod validation) |

#### `GET /api/auth/profile`

| Scenario | Setup | Expected |
|----------|-------|----------|
| No token | — | 401 |
| Valid token, user exists | mock returns user + turns | 200 + profile object |

#### `PATCH /api/auth/change-password`

| Scenario | Mock returns | Expected |
|----------|-------------|----------|
| Wrong current password | user with non-matching hash | 400 |
| Correct current password | user + `update` mock | 200 |

---

## 3. Web — Component Tests

### Setup

New devDependencies in `apps/web`:
```
vite  @vitejs/plugin-react  vitest
@testing-library/react  @testing-library/jest-dom  @testing-library/user-event  jsdom
```

- **`apps/web/vitest.config.ts`** — environment `jsdom`, `@vitejs/plugin-react` plugin, `setupFiles`
- **`apps/web/src/__tests__/setup.ts`** — imports `@testing-library/jest-dom`

### Test file: `src/__tests__/components/ui/Button.test.tsx`
Target: `components/ui/Button.tsx`

- Renders `children` text
- Click fires `onClick` handler
- When `disabled`, click does NOT fire handler
- When `disabled`, `opacity` style is `0.4`

### Test file: `src/__tests__/components/ui/Input.test.tsx`
Target: `components/ui/Input.tsx`

- Renders an `<input>` element
- `onChange` fires when user types
- When `disabled` prop, input is disabled

### Test file: `src/__tests__/components/screens/LoginScreen.test.tsx`
Target: `components/screens/LoginScreen.tsx`

Module-level mocks:
```typescript
vi.mock('next/image', () => ({ default: (p: any) => <img {...p} /> }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
vi.mock('../../lib/api', () => ({ api: { post: mockApiPost } }))
vi.mock('../../lib/auth-context', () => ({ useAuth: () => ({ login: mockLogin }) }))
```

| Scenario | Setup | Expected |
|----------|-------|----------|
| Renders | — | Email input, password input, submit button visible |
| Successful login | `api.post` resolves with token + user | `mockLogin` called; `mockPush` called with `'/dashboard'` |
| Login with `mustChangePassword` | `api.post` resolves with `mustChangePassword: true` | `mockPush` called with `'/dashboard/cambiar-contrasenia'` |
| API error | `api.post` rejects with `new Error('Credenciales inválidas')` | Error message shown in DOM |
| Loading state | `api.post` is pending | Button shows `'Entrando…'` and is disabled |

---

## File tree (new files only)

```
apps/api/
  vitest.config.ts
  src/__tests__/
    setup.ts
    utils/
      jwt.test.ts
      hash.test.ts
      password-generator.test.ts
    middlewares/
      auth.middleware.test.ts
      role.middleware.test.ts
      validate.middleware.test.ts
    modules/auth/
      auth.integration.test.ts

apps/web/
  vitest.config.ts
  src/__tests__/
    setup.ts
    components/
      ui/
        Button.test.tsx
        Input.test.tsx
      screens/
        LoginScreen.test.tsx
```

---

## Out of scope

- E2E tests (Playwright)
- Web app routing tests
- Non-critical modules (alertas, contenedores, registros, reportes, turnos, zones, users)
- CSS / visual regression
