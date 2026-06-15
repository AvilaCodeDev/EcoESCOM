import { Router } from "express";
import * as tipoController from "./tipo-residuo.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createTipoResiduoSchema } from "./tipo-residuo.schema";

export const tipoResiduoRoutes: Router = Router();

tipoResiduoRoutes.use(authenticate);

tipoResiduoRoutes.get("/", tipoController.listTiposResiduo);
tipoResiduoRoutes.post(
    "/",
    authorize(Roles.ADMIN, Roles.SUPERADMIN),
    validate(createTipoResiduoSchema),
    tipoController.createTipoResiduo
);
