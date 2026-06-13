import { describe, it, expect } from "vitest";
import { resolveActiveUserIds, type TurnoWithUsers } from "../shared/active-shift.resolver";

const matutino: TurnoWithUsers = {
    hora_inicio: "07:00",
    hora_fin: "14:00",
    usuarios: [{ id_usuario: 1 }, { id_usuario: 2 }]
};

const vespertino: TurnoWithUsers = {
    hora_inicio: "14:00",
    hora_fin: "21:00",
    usuarios: [{ id_usuario: 3 }]
};

const bothShifts: TurnoWithUsers = {
    hora_inicio: "07:00",
    hora_fin: "14:00",
    usuarios: [{ id_usuario: 2 }, { id_usuario: 4 }]
};

describe("resolveActiveUserIds", () => {
    it("returns users from the active morning shift", () => {
        const result = resolveActiveUserIds([matutino, vespertino], "09:00");
        expect(result).toContain(1);
        expect(result).toContain(2);
        expect(result).not.toContain(3);
    });

    it("returns users from the active afternoon shift", () => {
        const result = resolveActiveUserIds([matutino, vespertino], "16:00");
        expect(result).toContain(3);
        expect(result).not.toContain(1);
    });

    it("returns empty array when no shift is active", () => {
        const result = resolveActiveUserIds([matutino, vespertino], "23:00");
        expect(result).toHaveLength(0);
    });

    it("deduplicates users who appear in multiple active turnos", () => {
        const result = resolveActiveUserIds([matutino, bothShifts], "09:00");
        const count2 = result.filter((id) => id === 2).length;
        expect(count2).toBe(1);
    });

    it("returns empty array when turnos list is empty", () => {
        const result = resolveActiveUserIds([], "09:00");
        expect(result).toHaveLength(0);
    });

    it("handles shift boundary — start time is inclusive", () => {
        const result = resolveActiveUserIds([matutino], "07:00");
        expect(result).toContain(1);
    });

    it("handles shift boundary — end time is inclusive", () => {
        const result = resolveActiveUserIds([matutino], "14:00");
        expect(result).toContain(1);
    });

    it("handles cross-midnight shift (e.g. 22:00–06:00)", () => {
        const nocturno: TurnoWithUsers = {
            hora_inicio: "22:00",
            hora_fin: "06:00",
            usuarios: [{ id_usuario: 99 }]
        };
        expect(resolveActiveUserIds([nocturno], "23:30")).toContain(99);
        expect(resolveActiveUserIds([nocturno], "03:00")).toContain(99);
        expect(resolveActiveUserIds([nocturno], "10:00")).not.toContain(99);
    });
});
