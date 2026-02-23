import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

function normalizeBase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }
  if (trimmed === "./") {
    return "./";
  }
  if (trimmed.endsWith("/")) {
    return trimmed;
  }
  return `${trimmed}/`;
}

export default defineConfig(() => {
  const envBase = process.env.OPENCLAW_CONTROL_UI_BASE_PATH?.trim();
  const base = envBase ? normalizeBase(envBase) : "./";
  return {
    base,
    publicDir: path.resolve(here, "public"),
    optimizeDeps: {
      include: ["lit/directives/repeat.js"],
    },
    build: {
      outDir: path.resolve(here, "../dist/control-ui"),
      emptyOutDir: true,
      sourcemap: true,
      // Raise the chunk-size warning threshold and split large vendor
      // dependencies into named manual chunks to avoid huge single bundles.
      chunkSizeWarningLimit: 1000, // KB
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("lit")) return "vendor_lit";
              if (id.includes("@noble") || id.includes("ed25519")) return "vendor_crypto";
              if (id.includes("marked")) return "vendor_marked";
              if (id.includes("dompurify")) return "vendor_dompurify";
              return "vendor";
            }

            // Split large internal UI areas so the main entry chunk stays smaller
            if (id.includes(path.join("ui", "src", "ui", "views"))) {
              if (id.includes("usage") || id.includes("usage-render")) return "views_usage";
              if (id.includes("nodes") || id.includes("nodes-exec")) return "views_nodes";
              if (id.includes("agents") || id.includes("agents-panels")) return "views_agents";
              if (
                id.includes("config-form") ||
                id.includes("config-form.render") ||
                id.includes("config-form.node")
              )
                return "views_config_form";
              if (id.includes("app-render") || id.includes("app-render.helpers"))
                return "views_render";
              if (id.includes("chat") || id.includes("chat.markdown")) return "views_chat";
              return "app_views";
            }
            if (id.includes(path.join("ui", "src", "ui", "components"))) return "app_components";
            if (id.includes(path.join("ui", "src", "i18n"))) return "app_i18n";
            if (id.includes(path.join("ui", "src", "ui"))) return "app_core";
          },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
  };
});
