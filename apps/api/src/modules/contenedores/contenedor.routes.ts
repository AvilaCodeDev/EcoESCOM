import { Router } from "express";
import * as contenedorController from "./contenedor.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createContenedorSchema, updateContenedorSchema } from "./contenedor.schema";

export const contenedorRoutes: Router = Router();

contenedorRoutes.use(authenticate);

contenedorRoutes.get("/", contenedorController.listContenedores);
contenedorRoutes.get("/:id", contenedorController.getContenedor);
contenedorRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createContenedorSchema),
    contenedorController.createContenedor
);
contenedorRoutes.patch(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(updateContenedorSchema),
    contenedorController.updateContenedor
);
contenedorRoutes.delete(
    "/:id",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    contenedorController.deleteContenedor
);
