import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  target: "es2018",
  minify: true,
  dts: true,
  outExtensions: () => ({
    dts: ".d.ts",
  }),
  clean: true,
  treeshake: true,
});
