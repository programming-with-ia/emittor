import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    entry: ["./src/index.ts"],
    dts: true,
    shims: true,
    skipNodeModulesBundle: true,
    minify: true,
    clean: true,
    sourcemap: true
})