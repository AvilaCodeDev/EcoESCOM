import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Divider } from "../../../components/ui/Divider";

describe("Divider", () => {
    it("renders a div element", () => {
        const { container } = render(<Divider />);
        expect(container.firstElementChild?.tagName).toBe("DIV");
    });

    it("has full width", () => {
        const { container } = render(<Divider />);
        expect(container.firstElementChild).toHaveStyle({ width: "100%" });
    });

    it("applies custom style", () => {
        const { container } = render(<Divider style={{ margin: "8px 0" }} />);
        expect((container.firstElementChild as HTMLElement).style.margin).toBe("8px 0px");
    });
});
