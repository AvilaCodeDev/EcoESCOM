import { Router } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { loginSchema, changePasswordSchema } from "./auth.schema";

export const authRoutes: Router = Router();

authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.get("/profile", authenticate, authController.getProfile);
authRoutes.post(
    "/change-password",
    authenticate,
    validate(changePasswordSchema),
    authController.changePassword
);