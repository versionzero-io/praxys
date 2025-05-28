import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true, // Resolve types from dependencies
    entry: 'src/index.ts', // Explicitly set the entry point for declarations
  },
  splitting: false,  // Don't split output files
  sourcemap: true,
  clean: true,      // Clean output directory before build
  minify: false,    // Don't minify output
  outDir: 'dist',
  target: 'es2020',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    }
  },
  onSuccess: 'echo Build completed successfully!'
}); 