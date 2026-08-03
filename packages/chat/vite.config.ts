import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    watch: {
      // Doppler `--mount` keeps .dev.vars live; without this Vite hot-reloads
      // in a tight loop and floods the console with "server restart failed".
      ignored: ["**/.dev.vars"],
    },
  },
});
