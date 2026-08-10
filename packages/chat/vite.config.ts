import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      // Which Wrangler config to build against. Unset = wrangler.toml (the
      // vendor-neutral one); WorkOS's internal deploy pipeline sets this to
      // an overlaid internal config.
      //
      // This has to be chosen at BUILD time, not deploy time: the build bakes
      // the resolved config into build/server/wrangler.json and writes
      // .wrangler/deploy/config.json, which `wrangler deploy` then follows —
      // so `wrangler deploy --config wrangler.internal.toml` does not merely
      // get ignored, it fails outright (it bypasses the redirect and tries to
      // bundle workers/app.ts, whose virtual react-router server build only
      // exists inside vite). Verified.
      configPath: process.env.WRANGLER_CONFIG_PATH,
    }),
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
