export type TurnoWithUsers = {
    hora_inicio: string;
    hora_fin: string;
    usuarios: Array<{ id_usuario: number }>;
};

export function resolveActiveUserIds(turnos: TurnoWithUsers[], currentTime: string): number[] {
    const activeIds = new Set<number>();

    for (const turno of turnos) {
        if (isTimeInRange(currentTime, turno.hora_inicio, turno.hora_fin)) {
            for (const u of turno.usuarios) {
                activeIds.add(u.id_usuario);
            }
        }
    }

    return Array.from(activeIds);
}

function isTimeInRange(current: string, start: string, end: string): boolean {
    if (end < start) {
        // crosses midnight: active if current >= start OR current <= end
        return current >= start || current <= end;
    }
    return current >= start && current <= end;
}
