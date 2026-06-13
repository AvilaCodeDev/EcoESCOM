import { Router } from "express";
import * as registroController from "./registro.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createRegistroSchema } from "./registro.schema";

export const registroRoutes: Router = Router();

registroRoutes.use(authenticate);

registroRoutes.get("/", registroController.listRegistros);
registroRoutes.post(
    "/",
    authorize(Roles.TRABAJADOR),
    validate(createRegistroSchema),
    registroController.createRegistro
);
