import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import svgr from 'vite-plugin-svgr';
import i18nextLoader from 'vite-plugin-i18next-loader';
var base64Loader = {
    name: 'base64-loader',
    transform: function (_, id) {
        var _a = id.split('?'), path = _a[0], query = _a[1];
        if (query != 'base64')
            return null;
        var data = readFileSync(path);
        var base64 = data.toString('base64');
        return "export default '".concat(base64, "';");
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
                manualChunks: function (id) {
                    return id.includes('node_modules') ? 'vendor' : undefined;
                },
            },
        },
    },
});
