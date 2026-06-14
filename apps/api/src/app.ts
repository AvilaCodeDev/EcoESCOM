import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { router } from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

export const app: Express = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Servidor en funcionamiento" });
});

app.use("/api", router);

app.use(errorHandler);