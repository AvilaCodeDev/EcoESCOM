import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../../../components/ui/Input";

describe("Input", () => {
    it("renders an input element", () => {
        render(<Input />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("fires onChange when user types", () => {
        const handler = vi.fn();
        render(<Input onChange={handler} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
        expect(handler).toHaveBeenCalledOnce();
    });

    it("is disabled when the disabled prop is set", () => {
        render(<Input disabled />);
        expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("renders leftAddon text when provided", () => {
        render(<Input leftAddon="@" />);
        expect(screen.getByText("@")).toBeInTheDocument();
    });

    it("renders rightAddon text when provided", () => {
        render(<Input rightAddon=".mx" />);
        expect(screen.getByText(".mx")).toBeInTheDocument();
    });
});
