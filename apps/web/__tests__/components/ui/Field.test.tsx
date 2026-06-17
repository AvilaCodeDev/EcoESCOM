import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "../../../components/ui/Field";

describe("Field", () => {
    it("renders children", () => {
        render(<Field><input /></Field>);
        expect(document.querySelector("input")).toBeInTheDocument();
    });

    it("renders label when provided", () => {
        render(<Field label="Correo"><input /></Field>);
        expect(screen.getByText("Correo")).toBeInTheDocument();
    });

    it("does not render label when not provided", () => {
        render(<Field><input /></Field>);
        expect(document.querySelector("label")).toBeNull();
    });

    it("renders error message when error prop provided", () => {
        render(<Field error="Campo requerido"><input /></Field>);
        expect(screen.getByText("Campo requerido")).toBeInTheDocument();
    });

    it("renders help text when no error", () => {
        render(<Field help="Usa tu correo institucional"><input /></Field>);
        expect(screen.getByText("Usa tu correo institucional")).toBeInTheDocument();
    });

    it("shows error instead of help when both provided", () => {
        render(<Field error="Error" help="Ayuda"><input /></Field>);
        expect(screen.getByText("Error")).toBeInTheDocument();
        expect(screen.queryByText("Ayuda")).toBeNull();
    });
});
