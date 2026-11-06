import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Même alias que dans tsconfig.json : « @/ » désigne le dossier src.
      "@": path.resolve(__dirname, "src"),
      // Le paquet « server-only » refuse de se charger hors de Next.js : on le neutralise.
      "server-only": path.resolve(__dirname, "tests/vide.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
