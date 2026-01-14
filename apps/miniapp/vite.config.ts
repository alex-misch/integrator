import { defineConfig, Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import svgr from 'vite-plugin-svgr';
import i18nextLoader from 'vite-plugin-i18next-loader';

const base64Loader: Plugin = {
  name: 'base64-loader',
  transform(_, id: string) {
    const [path, query] = id.split('?');
    if (query != 'base64') return null;

    const data = readFileSync(path);
    const base64 = data.toString('base64');

    return `export default '${base64}';`;
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    base64Loader,
    react(),
    svgr({ svgrOptions: { exportType: 'default' } }),
    tsconfigPaths(),
    i18nextLoader({
      paths: ['./src/locales'],
      namespaceResolution: 'basename',
    }),
  ],
  publicDir: './public',
  server: {
    // Exposes your dev server and makes it accessible for the devices in the same network.
    host: true,
    port: +process.env.VITE_PORT,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('node_modules') ? 'vendor' : undefined,
      },
    },
  },
});
