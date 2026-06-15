import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/users/user.routes";
import { zoneRoutes } from "../modules/zones/zone.routes";
import { tipoResiduoRoutes } from "../modules/tipos-residuo/tipo-residuo.routes";
import { turnoRoutes } from "../modules/turnos/turno.routes";
import { contenedorRoutes } from "../modules/contenedores/contenedor.routes";
import { registroRoutes } from "../modules/registros/registro.routes";
import { alertaRoutes } from "../modules/alertas/alerta.routes";
import { reporteRoutes } from "../modules/reportes/reporte.routes";

export const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/zones", zoneRoutes);
router.use("/tipos-residuo", tipoResiduoRoutes);
router.use("/turnos", turnoRoutes);
router.use("/contenedores", contenedorRoutes);
router.use("/registros", registroRoutes);
router.use("/alertas", alertaRoutes);
router.use("/reportes", reporteRoutes);
