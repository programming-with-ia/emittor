import { defineConfig, Options } from "tsup";

export default defineConfig((options) => {
  const isDev = !!options.watch;

  const common: Options = {
    entry: ["src/index.ts"],
    outDir: "dist",
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2022",
    splitting: false,
    skipNodeModulesBundle: true,
    minify: !isDev,
    format: ["esm", "cjs"],
    esbuildOptions(options) {
      options.legalComments = "none";
    },
  };

  if (isDev) {
    return {
      ...common,
      watch: true,
      // helpful for faster rebuilds
      minify: false,
      sourcemap: true,
    };
  }

  return {
    ...common,
    // production-specific overrides
    minify: true,
    sourcemap: false,
  };
});


// export default defineConfig({
//     preserveModules: true,  // Keeps the folder structure. not used with `splitting: true`
// });
