import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, api } from "../../lib/api";

const mockFetch = vi.fn();

beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

function okResponse(body: unknown) {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
    } as Response);
}

function errorResponse(status: number, body: unknown) {
    return Promise.resolve({
        ok: false,
        status,
        json: () => Promise.resolve(body),
    } as Response);
}

describe("ApiError", () => {
    it("has correct status and message", () => {
        const err = new ApiError(404, "No encontrado");
        expect(err.status).toBe(404);
        expect(err.message).toBe("No encontrado");
        expect(err.name).toBe("ApiError");
    });

    it("is an instance of Error", () => {
        expect(new ApiError(500, "Error")).toBeInstanceOf(Error);
    });
});

describe("api.get", () => {
    it("calls fetch with GET method and returns data", async () => {
        mockFetch.mockReturnValueOnce(okResponse({ id: 1 }));
        const result = await api.get("/users");
        expect(mockFetch).toHaveBeenCalledOnce();
        expect(result).toEqual({ id: 1 });
    });

    it("throws ApiError on non-ok response", async () => {
        mockFetch.mockReturnValueOnce(errorResponse(401, { message: "No autorizado" }));
        await expect(api.get("/users")).rejects.toBeInstanceOf(ApiError);
    });

    it("uses message from error body", async () => {
        mockFetch.mockReturnValueOnce(errorResponse(403, { message: "Prohibido" }));
        await expect(api.get("/secret")).rejects.toMatchObject({ message: "Prohibido", status: 403 });
    });

    it("falls back to HTTP status message when body has no message", async () => {
        mockFetch.mockReturnValueOnce(errorResponse(500, {}));
        await expect(api.get("/fail")).rejects.toMatchObject({ message: "HTTP 500" });
    });
});

describe("api.post", () => {
    it("calls fetch with POST and JSON body", async () => {
        mockFetch.mockReturnValueOnce(okResponse({ token: "abc" }));
        await api.post("/auth/login", { email: "a@b.com", password: "pw" });
        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe("POST");
        expect(init.body).toBe(JSON.stringify({ email: "a@b.com", password: "pw" }));
    });
});

describe("api.patch", () => {
    it("calls fetch with PATCH and JSON body", async () => {
        mockFetch.mockReturnValueOnce(okResponse({}));
        await api.patch("/users/1", { name: "Nuevo" });
        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe("PATCH");
    });
});

describe("api.delete", () => {
    it("calls fetch with DELETE method", async () => {
        mockFetch.mockReturnValueOnce(okResponse({}));
        await api.delete("/users/1");
        const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe("DELETE");
    });
});
