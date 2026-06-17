import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./__tests__/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
            exclude: [
                "**/*.d.ts",
                "__tests__/**",
            ],
        },
    },
});
