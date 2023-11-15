import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { cjsInterop } from "vite-plugin-cjs-interop";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env = { ...process.env, ...env };
  return defineConfig({
    plugins: [
      remix(),
      tsconfigPaths(),
      cjsInterop({ dependencies: ["react-spinners", "bcryptjs", "hash.js"] }),
    ],
    optimizeDeps: {
      exclude: [
        "@node-rs/crc32-linux-x64-musl",
        "@node-rs/crc32-linux-x64-gnu",
      ],
    },
  });
};
