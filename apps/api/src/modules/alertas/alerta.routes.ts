import { Router } from "express";
import * as alertaController from "./alerta.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createAlertaSchema } from "./alerta.schema";

export const alertaRoutes: Router = Router();

alertaRoutes.use(authenticate);

alertaRoutes.get("/", alertaController.listAlertas);
alertaRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createAlertaSchema),
    alertaController.createAlerta
);
