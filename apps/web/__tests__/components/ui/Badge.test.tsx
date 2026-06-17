import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../../../components/ui/Badge";

describe("Badge", () => {
    it("renders children text", () => {
        render(<Badge>Activo</Badge>);
        expect(screen.getByText("Activo")).toBeInTheDocument();
    });

    it("renders dot element when dot prop is set", () => {
        const { container } = render(<Badge dot>Activo</Badge>);
        const spans = container.querySelectorAll("span");
        expect(spans.length).toBeGreaterThanOrEqual(2);
    });

    it("does not render dot element when dot prop is absent", () => {
        const { container } = render(<Badge>Activo</Badge>);
        const innerSpans = container.querySelectorAll("span > span");
        expect(innerSpans.length).toBe(0);
    });

    it("applies mono font family when mono prop is set", () => {
        const { container } = render(<Badge mono>ABC</Badge>);
        const span = container.querySelector("span");
        expect(span?.style.fontFamily).toBe("var(--font-mono)");
    });

    it("applies sans font family by default", () => {
        const { container } = render(<Badge>ABC</Badge>);
        const span = container.querySelector("span");
        expect(span?.style.fontFamily).toBe("var(--font-sans)");
    });

    it("applies custom style", () => {
        const { container } = render(<Badge style={{ opacity: 0.5 }}>X</Badge>);
        const span = container.querySelector("span");
        expect(span?.style.opacity).toBe("0.5");
    });
});
