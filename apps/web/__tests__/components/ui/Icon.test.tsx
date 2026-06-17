import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Icon } from "../../../components/ui/Icon";

describe("Icon", () => {
    it("renders an SVG for a known icon name", () => {
        const { container: c } = render(<Icon name="check" />);
        expect(c.querySelector("svg")).toBeInTheDocument();
    });

    it("renders nothing for an unknown icon name", () => {
        const { container: c } = render(<Icon name="nonexistent-icon-xyz" />);
        expect(c.firstElementChild).toBeNull();
    });

    it("passes size prop to icon", () => {
        const { container: c } = render(<Icon name="check" size={24} />);
        const svg = c.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });
});
