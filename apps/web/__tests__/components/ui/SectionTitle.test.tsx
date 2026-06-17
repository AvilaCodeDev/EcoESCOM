import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionTitle } from "../../../components/ui/SectionTitle";

describe("SectionTitle", () => {
    it("renders children in h3 element", () => {
        render(<SectionTitle>Mi sección</SectionTitle>);
        const h3 = screen.getByRole("heading", { level: 3 });
        expect(h3).toHaveTextContent("Mi sección");
    });

    it("renders action slot when provided", () => {
        render(<SectionTitle action={<button>Acción</button>}>Título</SectionTitle>);
        expect(screen.getByRole("button", { name: "Acción" })).toBeInTheDocument();
    });

    it("does not render action slot when not provided", () => {
        render(<SectionTitle>Título</SectionTitle>);
        expect(screen.queryByRole("button")).toBeNull();
    });

    it("applies custom style to container", () => {
        const { container } = render(<SectionTitle style={{ gap: "8px" }}>T</SectionTitle>);
        expect((container.firstElementChild as HTMLElement).style.gap).toBe("8px");
    });
});
