import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
    console.log(`Server in port ${env.PORT}`);
});

const shutdown = () => {
    server.close(() => {
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);