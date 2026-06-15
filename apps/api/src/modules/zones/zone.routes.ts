import { Router } from "express";
import * as zoneController from "./zone.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createZoneSchema, updateZoneSchema } from "./zone.schema";

export const zoneRoutes: Router = Router();

zoneRoutes.use(authenticate);

zoneRoutes.get("/", zoneController.listZones);
zoneRoutes.get("/:id", zoneController.getZone);
zoneRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createZoneSchema),
    zoneController.createZone
);
zoneRoutes.patch(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(updateZoneSchema),
    zoneController.updateZone
);
zoneRoutes.delete(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    zoneController.deleteZone
);