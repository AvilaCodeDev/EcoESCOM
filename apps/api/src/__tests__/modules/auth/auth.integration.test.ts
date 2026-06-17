import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../../app";
import { hashPassword } from "../../../utils/hash";
import { signToken } from "../../../utils/jwt";

const { mockFindUnique, mockUpdate } = vi.hoisted(() => ({
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
}));

vi.mock("../../../config/prisma", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../config/prisma")>();
    return {
        ...actual,
        prisma: {
            ...actual.prisma,
            usuarios: {
                findUnique: mockFindUnique,
                update: mockUpdate,
            },
        },
    };
});

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
        mockFindUnique.mockResolvedValueOnce(activeUser());

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "correct-password" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user.email).toBe("test@example.com");
        expect(res.body).toHaveProperty("mustChangePassword", false);
    });

    it("returns 401 when email is not found", async () => {
        mockFindUnique.mockResolvedValueOnce(null);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "any-password" });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Credenciales inválidas");
    });

    it("returns 401 when user is inactive", async () => {
        mockFindUnique.mockResolvedValueOnce({ ...activeUser(), activo: false });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "correct-password" });

        expect(res.status).toBe(401);
    });

    it("returns 401 when password is wrong", async () => {
        mockFindUnique.mockResolvedValueOnce(activeUser());

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
        mockFindUnique.mockResolvedValueOnce({
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
        mockFindUnique.mockResolvedValueOnce(activeUser());

        const res = await request(app)
            .post("/api/auth/change-password")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ currentPassword: "wrong-password", newPassword: "new-password-123" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("La contraseña actual es incorrecta");
    });

    it("returns 200 when current password is correct", async () => {
        mockFindUnique.mockResolvedValueOnce(activeUser());
        mockUpdate.mockResolvedValueOnce({});

        const res = await request(app)
            .post("/api/auth/change-password")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ currentPassword: "correct-password", newPassword: "new-password-123" });

        expect(res.status).toBe(200);
    });
});
