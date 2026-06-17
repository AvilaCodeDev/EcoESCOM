import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Card } from "../../../components/ui/Card";

describe("Card", () => {
    it("renders children", () => {
        render(<Card>Contenido</Card>);
        expect(screen.getByText("Contenido")).toBeInTheDocument();
    });

    it("fires onClick when clicked", () => {
        const handler = vi.fn();
        render(<Card onClick={handler}>Click</Card>);
        fireEvent.click(screen.getByText("Click"));
        expect(handler).toHaveBeenCalledOnce();
    });

    it("applies pointer cursor when onClick provided", () => {
        const { container } = render(<Card onClick={vi.fn()}>X</Card>);
        expect(container.firstElementChild).toHaveStyle({ cursor: "pointer" });
    });

    it("applies default cursor when no onClick", () => {
        const { container } = render(<Card>X</Card>);
        expect(container.firstElementChild).toHaveStyle({ cursor: "default" });
    });

    it("applies custom padding", () => {
        const { container } = render(<Card padding={8}>X</Card>);
        expect(container.firstElementChild).toHaveStyle({ padding: "8px" });
    });

    it("applies custom style", () => {
        const { container } = render(<Card style={{ opacity: 0.5 }}>X</Card>);
        expect((container.firstElementChild as HTMLElement).style.opacity).toBe("0.5");
    });
});
