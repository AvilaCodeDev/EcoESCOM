import { Router } from "express";
import * as reporteController from "./reporte.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";

export const reporteRoutes: Router = Router();

reporteRoutes.use(authenticate, authorize(Roles.ADMIN, Roles.SUPERADMIN));

reporteRoutes.get("/", reporteController.getReporte);
