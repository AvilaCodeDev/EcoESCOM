import { Router } from "express";
import * as turnoController from "./turno.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { updateTurnoSchema } from "./turno.schema";

export const turnoRoutes: Router = Router();

turnoRoutes.use(authenticate);

turnoRoutes.get("/", turnoController.listTurnos);
turnoRoutes.patch(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(updateTurnoSchema),
    turnoController.updateTurno
);
