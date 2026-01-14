import path from 'node:path';
import url from 'node:url';

const workspaceRoot = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  '..',
  '..',
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: '/admin',
  outputFileTracingRoot: workspaceRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  redirects: () => {
    return [
      {
        source: '/',
        destination: '/auth/login',
        permanent: false,
      },
    ];
  },
  experimental: {
    // Prefer loading of ES Modules over CommonJS
    // @link {https://nextjs.org/blog/next-11-1#es-modules-support|Blog 11.1.0}
    // @link {https://github.com/vercel/next.js/discussions/27876|Discussion}
    esmExternals: true,
    // Experimental monorepo support
    // @link {https://github.com/vercel/next.js/pull/22867|Original PR}
    // @link {https://github.com/vercel/next.js/discussions/26420|Discussion}
    externalDir: true,
  },
};

export default nextConfig;
