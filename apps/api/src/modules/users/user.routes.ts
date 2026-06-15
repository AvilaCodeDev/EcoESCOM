import { Router } from "express";
import * as userController from "./user.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { Roles } from "../../config/prisma";
import { createUserSchema, updateUserSchema } from "./user.schema";

export const userRoutes: Router = Router();

userRoutes.use(authenticate, authorize(Roles.ADMIN, Roles.SUPERADMIN));

userRoutes.get("/", userController.listUsers);
userRoutes.get("/:id", userController.getUser);
userRoutes.post("/", validate(createUserSchema), userController.createUser);
userRoutes.patch("/:id", validate(updateUserSchema), userController.updateUser);
userRoutes.delete("/:id", userController.deleteUser);