import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/users/user.routes";
import { zoneRoutes } from "../modules/zones/zone.routes";

export const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/zones", zoneRoutes);