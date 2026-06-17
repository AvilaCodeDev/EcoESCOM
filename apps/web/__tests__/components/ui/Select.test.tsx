import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select } from "../../../components/ui/Select";

const OPTIONS = [
    { value: "a", label: "Opción A" },
    { value: "b", label: "Opción B" },
];

describe("Select", () => {
    it("renders all options", () => {
        render(<Select options={OPTIONS} />);
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Opción A")).toBeInTheDocument();
        expect(screen.getByText("Opción B")).toBeInTheDocument();
    });

    it("fires onChange when selection changes", () => {
        const handler = vi.fn();
        render(<Select options={OPTIONS} onChange={handler} />);
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
        expect(handler).toHaveBeenCalledOnce();
    });

    it("renders with controlled value", () => {
        render(<Select options={OPTIONS} value="a" onChange={vi.fn()} />);
        expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("a");
    });

    it("applies focus border on focus", () => {
        render(<Select options={OPTIONS} />);
        const select = screen.getByRole("combobox");
        fireEvent.focus(select);
        expect(select.style.border).toContain("var(--primary-500)");
    });

    it("restores border on blur", () => {
        render(<Select options={OPTIONS} />);
        const select = screen.getByRole("combobox");
        fireEvent.focus(select);
        fireEvent.blur(select);
        expect(select.style.border).toContain("var(--border-1)");
    });
});
