import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "../../../components/screens/LoginScreen";

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
        mockApiPost.mockReturnValue(new Promise(() => {}));

        render(<LoginScreen />);
        await userEvent.type(document.querySelector('input[type="email"]')!, "test@example.com");
        await userEvent.type(document.querySelector('input[type="password"]')!, "password123");
        await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled()
        );
    });
});
