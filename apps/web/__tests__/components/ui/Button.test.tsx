import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../../../components/ui/Button";

describe("Button", () => {
    it("renders children text", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("fires onClick handler when clicked", () => {
        const handler = vi.fn();
        render(<Button onClick={handler}>Click me</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handler).toHaveBeenCalledOnce();
    });

    it("does not fire onClick when disabled", () => {
        const handler = vi.fn();
        render(<Button onClick={handler} disabled>Click me</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handler).not.toHaveBeenCalled();
    });

    it("applies opacity 0.4 when disabled", () => {
        render(<Button disabled>Click me</Button>);
        const btn = screen.getByRole("button");
        expect(btn).toHaveStyle({ opacity: "0.4" });
    });

    it("renders with type='submit' when specified", () => {
        render(<Button type="submit">Submit</Button>);
        expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
});
