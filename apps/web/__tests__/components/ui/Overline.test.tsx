import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Overline } from "../../../components/ui/Overline";

describe("Overline", () => {
    it("renders children text", () => {
        render(<Overline>Sección</Overline>);
        expect(screen.getByText("Sección")).toBeInTheDocument();
    });

    it("renders as a span element", () => {
        const { container } = render(<Overline>Sección</Overline>);
        expect(container.firstElementChild?.tagName).toBe("SPAN");
    });

    it("applies custom style", () => {
        const { container } = render(<Overline style={{ color: "red" }}>X</Overline>);
        expect((container.firstElementChild as HTMLElement).style.color).toBe("red");
    });
});
