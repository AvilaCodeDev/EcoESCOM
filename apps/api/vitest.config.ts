import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ["./src/__tests__/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: [
                "src/utils/**/*.ts",
                "src/middlewares/**/*.ts",
                "src/modules/auth/auth.service.ts",
            ],
            exclude: [
                "src/**/*.d.ts",
                "src/__tests__/**",
            ],
        },
    },
});
