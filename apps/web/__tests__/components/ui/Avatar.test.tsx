import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "../../../components/ui/Avatar";

describe("Avatar", () => {
    it("renders initials from name", () => {
        render(<Avatar name="Juan Pérez" />);
        expect(screen.getByText("JP")).toBeInTheDocument();
    });

    it("renders first two initials only", () => {
        render(<Avatar name="Ana María García" />);
        expect(screen.getByText("AM")).toBeInTheDocument();
    });

    it("renders '?' when no name provided", () => {
        render(<Avatar />);
        expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("does not render text when src provided", () => {
        const { container } = render(<Avatar src="avatar.png" name="Juan" />);
        expect(container.firstElementChild?.textContent).toBe("");
    });

    it("applies custom size", () => {
        const { container } = render(<Avatar name="J" size={48} />);
        expect(container.firstElementChild).toHaveStyle({ width: "48px", height: "48px" });
    });
});
