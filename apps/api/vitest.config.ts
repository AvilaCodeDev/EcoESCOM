import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ["./src/__tests__/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.ts"],
            exclude: [
                "src/seed.ts",
                "src/server.ts",
                "src/**/*.d.ts",
                "src/__tests__/**",
            ],
        },
    },
});
