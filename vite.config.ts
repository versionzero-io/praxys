import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true, // Bundle all types into one file
      outDir: 'dist',    // Output directly to dist directory
      include: ['src/**/*.ts', 'src/**/*.d.ts'],
      exclude: ['**/*.test.ts', 'tests/**'],
      insertTypesEntry: true, // Ensure the types entry is inserted
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Praxys',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
