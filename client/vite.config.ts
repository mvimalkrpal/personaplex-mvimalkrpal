import { ProxyOptions, defineConfig, loadEnv } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const proxyConf: Record<string, string | ProxyOptions> = env.VITE_QUEUE_API_URL ? {
    "/api": {
      target: env.VITE_QUEUE_API_URL,
      changeOrigin: true,
    },
  } : {};
  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      // HTTPS disabled for local development
      // When deploying, ensure ngrok handles SSL
      proxy: {
        ...proxyConf,
      }
    },
    plugins: [
      topLevelAwait({
        promiseExportName: "__tla",
        promiseImportName: i => `__tla_${i}`,
      }),
    ],
  };
});
