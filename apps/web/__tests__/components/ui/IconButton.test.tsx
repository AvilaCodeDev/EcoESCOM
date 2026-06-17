import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IconButton } from "../../../components/ui/IconButton";

describe("IconButton", () => {
    it("renders a button element", () => {
        render(<IconButton icon="check" />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("fires onClick when clicked", () => {
        const handler = vi.fn();
        render(<IconButton icon="check" onClick={handler} />);
        fireEvent.click(screen.getByRole("button"));
        expect(handler).toHaveBeenCalledOnce();
    });

    it("renders title attribute when provided", () => {
        render(<IconButton icon="check" title="Confirmar" />);
        expect(screen.getByTitle("Confirmar")).toBeInTheDocument();
    });

    it("applies custom size", () => {
        render(<IconButton icon="check" size={48} />);
        const btn = screen.getByRole("button");
        expect(btn).toHaveStyle({ width: "48px", height: "48px" });
    });

    it("changes background on mouse enter", () => {
        render(<IconButton icon="check" />);
        const btn = screen.getByRole("button");
        fireEvent.mouseEnter(btn);
        expect(btn.style.background).toBe("var(--neutral-100)");
    });

    it("restores background on mouse leave", () => {
        render(<IconButton icon="check" />);
        const btn = screen.getByRole("button");
        fireEvent.mouseEnter(btn);
        fireEvent.mouseLeave(btn);
        expect(btn.style.background).toBe("var(--neutral-0)");
    });
});
